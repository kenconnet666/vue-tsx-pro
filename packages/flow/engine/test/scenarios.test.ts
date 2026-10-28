// spec/scenarios 的适配器（ROADMAP 14.5）：Java 版验证过的场景按新接口跑。场景里的命令都支持时才跑，
// 否则列出缺的命令（第一版不做的能力，见 docs/decisions/0001 第 2 节）；期望只比写出来、这一版产出的字段
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createPool, type Pool } from 'mysql2/promise';
import pg from 'pg';
import { afterAll, describe, it } from 'vitest';
import type { Adapter } from '@zerodep-dev/easy-query-ts';
import { mysql } from '@zerodep-dev/easy-query-ts-mysql';
import { postgres } from '@zerodep-dev/easy-query-ts-pg';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import {
  FlowCandidate,
  FlowError,
  FlowWorkItem,
  type Actor,
  type FlowCommand,
  type FlowEngine,
  type RunResult,
} from '../src/index.ts';
import { createTestEngine, type TestClock } from '../src/testing.ts';

const DIR = new URL('../../spec/scenarios/', import.meta.url);

interface Step {
  id?: string;
  as?: string;
  command: string;
  args?: Record<string, any>;
  expect?: Record<string, any>;
}
interface Scenario {
  name: string;
  processes?: string[];
  clock?: string;
  actors: Record<string, { id: number; name: string; roles?: number[]; departments?: number[] }>;
  steps: Step[];
}

/** 这一版支持的命令 */
const SUPPORTED = new Set([
  'start',
  'claim',
  'complete',
  'withdraw',
  'terminate',
  'transfer',
  'signal',
  'runJobs',
  'todo',
  'done',
  'started',
  'instance',
  'workItem',
  'suspend',
  'resume',
  'remind',
  'comment',
  'cc',
  'ccList',
  'readCc',
  'incidents',
  'retryJob',
  'skipJob',
  'reassign',
  'jump',
]);

/** Java 版的错误代号 → 这里的 */
const ERROR_CODES: Record<string, string> = {
  'flow.not-candidate': 'forbidden',
  'flow.forbidden': 'forbidden',
  'flow.already-claimed': 'already-handled',
  'flow.work-item-not-open': 'already-handled',
  'flow.instance-not-active': 'instance-not-active',
  'flow.not-found': 'not-found',
  'flow.guard-rejected': 'guard-rejected',
  'flow.definition-invalid': 'invalid-definition',
  'flow.validation-failed': 'invalid-input',
  'flow.extension-failed': 'extension-failed',
};

/** 整个不跑的场景：用到第一版不做的能力（docs/decisions/0001 第 2 节） */
const SKIPPED: Record<string, string> = {
  'custom-node.json': '自定义节点类型与自定义会签规则第一版不做',
  'purchase-form-rules.json': '按字段清单校验表单在表单模块里做（ROADMAP 14.8）',
  'call-process.json': '调用流程的 forEach 与异步第一版不做（单个同步调用见 engine.test.ts）',
};

/** 只跑到某一步的场景：后面的步骤用到第一版不做的能力 */
const PARTIAL: Record<string, { readonly before: string; readonly reason: string }> = {
  'countersign.json': { before: 'votes', reason: '票签（votes、权重）第一版不做' },
};

/** 这一版产出、能比的期望 */
const COMPARED = new Set([
  'instance',
  'workItems',
  'events',
  'error',
  'ran',
  'rows',
  'total',
  'results',
  'timeline',
  'workItem',
  'claimable',
  'completable',
  'read',
  'revived',
]);

const files = readdirSync(DIR)
  .filter((name) => name.endsWith('.json'))
  .sort();

/** 实库：EQTS_MYSQL_URLS、EQTS_PG_URLS（逗号分隔，同 easy-query 的实库套件）；MySQL 用单独的 flow_test 库 */
const urlsOf = (name: string) =>
  (process.env[name] ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
const pools: { end(): Promise<void> }[] = [];
afterAll(async () => {
  for (const pool of pools) await pool.end();
});

/** 跑场景的库：SQLite 内存库，加上设了环境变量的实库 */
const targets: { name: string; adapter: () => Promise<Adapter | undefined> }[] = [
  { name: 'sqlite', adapter: async () => undefined },
  ...urlsOf('EQTS_MYSQL_URLS').map((url) => {
    let pool: Pool | undefined;
    return {
      name: `mysql ${new URL(url).port}`,
      adapter: async () => {
        if (!pool) {
          const bootstrap = createPool({ uri: url, connectionLimit: 1 });
          await bootstrap.query('CREATE DATABASE IF NOT EXISTS flow_test');
          await bootstrap.end();
          pool = createPool({ uri: url, database: 'flow_test', connectionLimit: 5, timezone: 'Z' });
          pools.push(pool);
        }
        return mysql(pool);
      },
    };
  }),
  ...urlsOf('EQTS_PG_URLS').map((url) => {
    let pool: pg.Pool | undefined;
    return {
      name: `pg ${new URL(url).port}`,
      adapter: async () => {
        if (!pool) {
          pool = new pg.Pool({ connectionString: url, max: 5 });
          pools.push(pool);
        }
        return postgres(pool);
      },
    };
  }),
];

for (const target of targets)
  describe(`spec/scenarios（${target.name}）`, () => {
    for (const file of files) {
      const scenario = JSON.parse(readFileSync(new URL(file, DIR), 'utf8')) as Scenario;
      const missing = [
        ...new Set(scenario.steps.map((s) => s.command).filter((c) => !SUPPORTED.has(c))),
      ];
      const skipped = SKIPPED[file];
      if (skipped) {
        it.skip(`${file}：${skipped}`, () => {});
        continue;
      }
      if (missing.length > 0) {
        it.skip(`${file}：缺 ${missing.join('、')}`, () => {});
        continue;
      }
      const partial = PARTIAL[file];
      if (partial) {
        const cut = scenario.steps.findIndex((step) => step.id === partial.before);
        scenario.steps = scenario.steps.slice(0, cut);
      }
      const note = partial ? `（只跑到 #${partial.before} 之前：${partial.reason}）` : '';
      // 实库每个场景要删表、建表，比内存库慢得多
      it(
        `${file}：${scenario.name}${note}`,
        async () => runScenario(scenario, await target.adapter()),
        target.name === 'sqlite' ? 5_000 : 60_000,
      );
    }
  });

/** 场景里注册的命令拦截器：意见是“拦下”的处理拦下；留言里的“敏感词”换掉；业务编号 rollback-after 的发起做完再拦 */
function scenarioInterceptor() {
  const blocked = (field: string, code: string) =>
    new FlowError('invalid-input', `${field} ${code}`, { field, code });
  return {
    before: (command: FlowCommand) => {
      if (command.type === 'complete' && command.comment === '拦下')
        throw blocked('comment', 'blocked');
      if (command.type === 'comment')
        return { ...command, text: command.text.replaceAll('敏感词', '***') };
      return undefined;
    },
    after: (command: FlowCommand) => {
      if (command.type === 'start' && command.businessKey === 'rollback-after') {
        throw blocked('businessKey', 'rolled-back');
      }
    },
  };
}

/** 场景里注册的扩展（packages/flow/spec/scenarios/README.md 末尾） */
function testExtensions() {
  const failures = new Map<string, number>();
  return {
    resolvers: { manager: () => ['1004'] },
    guards: {
      budget: (context: { read(field: string): unknown }) =>
        Number(context.read('form.amount') ?? 0) > 100000 ? '超出预算' : (true as const),
    },
    actions: {
      classify: (context: { args: Record<string, unknown>; read(field: string): unknown }) => {
        const raw = context.args['amount'];
        const amount = Number(isRefArg(raw) ? context.read(raw.ref) : raw);
        const level = amount >= 10000 ? 'big' : 'small';
        return { outcome: level, variables: { level } };
      },
      archive: (context: { args: Record<string, unknown>; instance: { id: number } }) => {
        const key = String(
          (context.args['key'] as string | number | undefined) ?? context.instance.id,
        );
        const failed = failures.get(key) ?? 0;
        if (failed < Number(context.args['failures'] ?? 0)) {
          failures.set(key, failed + 1);
          throw new Error('archive failed');
        }
      },
      explode: () => {
        throw new Error('ERP 不可用');
      },
    },
  };
}

const isRefArg = (value: unknown): value is { ref: string } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { ref?: unknown }).ref === 'string';

async function runScenario(scenario: Scenario, adapter?: Adapter): Promise<void> {
  const actors = new Map<string, Actor>();
  const people = new Map<string, string[]>();
  for (const [name, a] of Object.entries(scenario.actors ?? {})) {
    const actor: Actor = {
      id: String(a.id),
      name: a.name,
      roles: (a.roles ?? []).map(String),
      departments: (a.departments ?? []).map(String),
      admin: a.id === 1000 || name === 'admin',
    };
    actors.set(name, actor);
    for (const role of actor.roles ?? [])
      people.set(`role:${role}`, [...(people.get(`role:${role}`) ?? []), actor.id]);
    for (const dept of actor.departments ?? [])
      people.set(`department:${dept}`, [...(people.get(`department:${dept}`) ?? []), actor.id]);
  }
  const { engine, clock } = await createTestEngine({
    ...(adapter ? { adapter } : {}),
    ...(scenario.clock ? { start: scenario.clock } : {}),
    admins: ['1000'],
    intercept: scenarioInterceptor(),
    extensions: testExtensions() as never,
    org: {
      members: (source) =>
        'role' in source
          ? (people.get(`role:${source.role}`) ?? [])
          : 'department' in source
            ? (people.get(`department:${source.department}`) ?? [])
            : [],
    },
  });
  for (const path of scenario.processes ?? []) {
    await engine.publish(JSON.parse(readFileSync(new URL(path, DIR), 'utf8')) as ProcessDefinition);
  }
  const results = new Map<string, unknown>();
  let previous: unknown;
  for (const [index, step] of scenario.steps.entries()) {
    const where = `第 ${index + 1} 步（${step.command}${step.id ? ` #${step.id}` : ''}）`;
    const args = resolveRefs(step.args ?? {}, results, previous) as Record<string, any>;
    const actor = step.as ? actors.get(step.as)! : { id: '0' };
    let actual: Record<string, unknown>;
    try {
      actual = await runStep(engine, clock, step.command, args, actor);
    } catch (error) {
      if (!step.expect?.['error'])
        throw new Error(`${where}出错：${String(error)}`, { cause: error });
      const expected = ERROR_CODES[step.expect['error'].code] ?? step.expect['error'].code;
      assert.ok(error instanceof FlowError, `${where}：期望 ${expected}，实际 ${String(error)}`);
      assert.equal(error.code, expected, `${where}：错误代号（${error.message}）`);
      previous = undefined;
      continue;
    }
    if (step.expect?.['error'])
      assert.fail(`${where}：期望出错 ${step.expect['error'].code}，实际成功`);
    for (const [key, value] of Object.entries(step.expect ?? {})) {
      if (!COMPARED.has(key)) continue;
      compare(value, actual[key], `${where} ${key}`);
    }
    if (step.id) results.set(step.id, actual);
    previous = actual;
  }
}

/** 执行一步，结果换成场景里的形状 */
async function runStep(
  engine: FlowEngine,
  clock: TestClock,
  command: string,
  args: Record<string, any>,
  actor: Actor,
): Promise<Record<string, unknown>> {
  const variables = { ...args['variables'], ...args['form'] };
  const run = async (c: FlowCommand) => shape(engine, await engine.run(c, actor));
  switch (command) {
    case 'start':
      return run({
        type: 'start',
        process: args['key'],
        variables,
        ...(args['businessKey'] ? { businessKey: args['businessKey'] } : {}),
        ...(args['title'] ? { title: args['title'] } : {}),
      });
    case 'claim':
      return run({ type: 'claim', workItem: Number(args['workItem']) });
    case 'complete':
      return run({
        type: 'complete',
        workItem: Number(args['workItem']),
        outcome: args['outcome'],
        ...(args['comment'] !== undefined ? { comment: args['comment'] } : {}),
        ...(Object.keys(variables).length ? { variables } : {}),
        ...(args['returnTarget'] ? { returnTo: args['returnTarget'] } : {}),
      });
    case 'withdraw':
      return run({ type: 'withdraw', instance: Number(args['instance']), comment: args['reason'] });
    case 'terminate':
      return run({
        type: 'terminate',
        instance: Number(args['instance']),
        comment: args['reason'],
      });
    case 'transfer':
      return run({
        type: 'transfer',
        workItem: Number(args['workItem']),
        to: String(args['user']),
      });
    case 'signal': {
      const results = await engine.signal(
        {
          event: args['event'],
          ...(args['instance'] !== undefined ? { instance: Number(args['instance']) } : {}),
          ...(args['businessKey'] !== undefined ? { businessKey: args['businessKey'] } : {}),
          ...(args['outcome'] !== undefined ? { outcome: args['outcome'] } : {}),
          ...(args['data'] !== undefined ? { data: args['data'] } : {}),
        },
        actor,
      );
      return { results: await Promise.all(results.map((result) => shape(engine, result))) };
    }
    case 'runJobs': {
      clock.set(args['at']);
      return { ran: await engine.jobs.runDue() };
    }
    case 'suspend':
    case 'resume':
      return run({ type: command, instance: Number(args['instance']), comment: args['reason'] });
    case 'remind':
      return run({
        type: 'remind',
        instance: Number(args['instance']),
        ...(args['workItem'] !== undefined ? { workItem: Number(args['workItem']) } : {}),
        message: args['message'],
      });
    case 'comment':
      return run({ type: 'comment', instance: Number(args['instance']), text: args['text'] });
    case 'cc':
      return run({
        type: 'cc',
        instance: Number(args['instance']),
        users: (args['users'] as unknown[]).map((user) => String(user as number)),
        message: args['message'],
      });
    case 'incidents': {
      const rows = await engine.query.incidents(
        args['instance'] !== undefined ? Number(args['instance']) : undefined,
      );
      return { total: rows.length, rows };
    }
    case 'retryJob':
      return { revived: await engine.retryJob(Number(args['job']), actor) };
    case 'skipJob':
      return run({
        type: 'skipJob',
        job: Number(args['job']),
        ...(args['outcome'] !== undefined ? { outcome: args['outcome'] } : {}),
        ...(args['reason'] !== undefined ? { reason: args['reason'] } : {}),
      });
    case 'reassign':
      return run({
        type: 'reassign',
        workItem: Number(args['workItem']),
        to: String(args['user']),
      });
    case 'jump':
      return run({ type: 'jump', instance: Number(args['instance']), node: args['node'] });
    case 'readCc':
      return { read: await engine.readCc(Number(args['instance']), actor) };
    case 'ccList': {
      const rows = await engine.query.cc(actor);
      return {
        total: rows.length,
        rows: rows.map((row) => ({
          ...row,
          recipientId: row.recipient,
          fromUserId: row.sender,
          instance: { id: row.instanceId, title: row.title, status: row.status },
        })),
      };
    }
    case 'started': {
      const rows = await engine.query.started(actor);
      return { total: rows.length, rows };
    }
    case 'instance': {
      const detail = await engine.query.instance(Number(args['instance']));
      const current = detail.current;
      const items = await engine.db
        .queryable(FlowWorkItem)
        .where((w) => w.instanceId.eq(detail.instance.id))
        .orderBy((w) => w.id)
        .toList();
      return {
        instance: { ...detail.instance, current },
        workItems: items.map(javaItem),
        timeline: detail.events.map((event) => ({ ...event, actorId: event.actor })),
      };
    }
    case 'workItem': {
      const detail = await engine.query.workItem(Number(args['workItem']), actor);
      return {
        workItem: javaItem(detail.workItem),
        instance: detail.instance,
        claimable: detail.claimable,
        completable: detail.completable,
      };
    }
    case 'todo':
    case 'done': {
      const rows = await engine.query[command](actor);
      return {
        total: rows.length,
        rows: rows.map((row) => ({
          ...row,
          assigneeId: row.assignee,
          instance: { id: row.instanceId, title: row.title, summary: row.summary },
        })),
      };
    }
    default:
      throw new Error(`不支持 ${command}`);
  }
}

/** 引擎的结果 → 场景里的形状（Java 版的字段名） */
async function shape(engine: FlowEngine, result: RunResult): Promise<Record<string, unknown>> {
  const ids = result.workItems.map((item) => item.id);
  const rows = ids.length ? await engine.db.queryable(FlowWorkItem).whereKeys(ids).toList() : [];
  const candidates = ids.length
    ? await engine.db
        .queryable(FlowCandidate)
        .where((c) => c.workItemId.in(ids))
        .toList()
    : [];
  return {
    instance: {
      ...result.instance,
      parentInstanceId: null,
    },
    workItems: rows.map((row) => {
      const inbox = candidates.find((c) => c.workItemId === row.id && c.kind !== 'user');
      return {
        ...row,
        assigneeId: row.assignee,
        inboxKind: inbox?.kind ?? null,
        inboxId: inbox?.value ?? null,
      };
    }),
    events: result.events.map((event) => ({ ...event, actorId: event.actor })),
    instanceId: result.instance.id,
  };
}

/** 待办行 → 场景里的字段名 */
function javaItem(row: Record<string, any>) {
  return { ...row, assigneeId: row['assignee'] };
}

/** 参数里的引用：`$start.workItems[0]`、`$start.instance`、`$.`（上一步） */
function resolveRefs(value: unknown, results: Map<string, unknown>, previous: unknown): unknown {
  if (typeof value === 'string' && value.startsWith('$')) {
    const match = /^\$([^.[]*)\.?(.*)$/.exec(value)!;
    const base = match[1] === '' ? previous : results.get(match[1]!);
    if (match[2] === '' || match[2] === undefined) return base;
    return readPath(base, match[2]);
  }
  if (Array.isArray(value)) return value.map((item) => resolveRefs(item, results, previous));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveRefs(v, results, previous)]),
    );
  }
  return value;
}

/** `workItems[0]` → 那个待办的编号；`instance` → 实例编号；其余按路径一段段取（`rows[0].jobId`、`timeline[3].data.jobId`） */
function readPath(base: unknown, path: string): unknown {
  const object = base as Record<string, any>;
  if (path === 'instance') return object['instanceId'];
  const only = /^(workItems)\[(\d+)\]$/.exec(path);
  if (only) return object[only[1]!]?.[Number(only[2])]?.id;
  let current: any = object;
  for (const part of path.split('.')) {
    const match = /^(\w+)(?:\[(\d+)\])?$/.exec(part);
    if (!match) return undefined;
    current = current?.[match[1]!];
    if (match[2] !== undefined) current = current?.[Number(match[2])];
  }
  return current;
}

/**
 * 只比写出来的字段；列表一样长；null 表示为空；编号、小数按文字比。
 * 期望是文字、实际是事件时比事件的种类；显示用的名字（userName、…Name）这一版的引擎不存，不比
 */
function compare(expected: unknown, actual: unknown, where: string): void {
  if (actual instanceof Date) actual = actual.toISOString().replace('.000Z', 'Z');
  if (typeof expected === 'string' && actual && typeof actual === 'object' && 'type' in actual) {
    assert.equal((actual as { type: string }).type, expected, where);
    return;
  }
  if (expected === null) {
    assert.ok(
      actual === null || actual === undefined,
      `${where}：期望为空，实际 ${JSON.stringify(actual)}`,
    );
    return;
  }
  if (Array.isArray(expected)) {
    const list = Array.isArray(actual) ? actual : [];
    const view = list.map((a) =>
      a && typeof a === 'object' && 'type' in a ? (a as { type: string }).type : a,
    );
    assert.equal(list.length, expected.length, `${where}：长度（实际 ${JSON.stringify(view)}）`);
    expected.forEach((item, i) => compare(item, list[i], `${where}[${i}]`));
    return;
  }
  if (typeof expected === 'object') {
    assert.ok(
      actual && typeof actual === 'object',
      `${where}：期望对象，实际 ${JSON.stringify(actual)}`,
    );
    for (const [key, value] of Object.entries(expected as Record<string, unknown>)) {
      if (/Names?$/.test(key)) continue;
      compare(value, (actual as Record<string, unknown>)[key], `${where}.${key}`);
    }
    return;
  }
  assert.equal(String(actual as string), String(expected as string), where);
}
