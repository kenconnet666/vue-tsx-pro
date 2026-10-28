// spec/scenarios 的适配器（ROADMAP 14.5）：Java 版验证过的场景按新接口跑。场景里的命令都支持时才跑，
// 否则列出缺的命令（第一版不做的能力，见 docs/decisions/0001 第 2 节）；期望只比写出来、这一版产出的字段
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
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
  'flow.extension-failed': 'invalid-definition',
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
]);

const files = readdirSync(DIR)
  .filter((name) => name.endsWith('.json'))
  .sort();

describe('spec/scenarios', () => {
  for (const file of files) {
    const scenario = JSON.parse(readFileSync(new URL(file, DIR), 'utf8')) as Scenario;
    const missing = [
      ...new Set(scenario.steps.map((s) => s.command).filter((c) => !SUPPORTED.has(c))),
    ];
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
    it(`${file}：${scenario.name}${note}`, () => runScenario(scenario));
  }
});

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
        throw new Error('boom');
      },
    },
  };
}

const isRefArg = (value: unknown): value is { ref: string } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { ref?: unknown }).ref === 'string';

async function runScenario(scenario: Scenario): Promise<void> {
  const actors = new Map<string, Actor>();
  const people = new Map<string, string[]>();
  for (const [name, a] of Object.entries(scenario.actors ?? {})) {
    const actor: Actor = {
      id: String(a.id),
      name: a.name,
      roles: (a.roles ?? []).map(String),
      departments: (a.departments ?? []).map(String),
      admin: a.id === 1000,
    };
    actors.set(name, actor);
    for (const role of actor.roles ?? [])
      people.set(`role:${role}`, [...(people.get(`role:${role}`) ?? []), actor.id]);
    for (const dept of actor.departments ?? [])
      people.set(`department:${dept}`, [...(people.get(`department:${dept}`) ?? []), actor.id]);
  }
  const { engine, clock } = await createTestEngine({
    ...(scenario.clock ? { start: scenario.clock } : {}),
    admins: ['1000'],
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
      const result = await engine.run(
        {
          type: 'signal',
          event: args['event'],
          ...(args['instance'] !== undefined ? { instance: Number(args['instance']) } : {}),
          ...(args['businessKey'] !== undefined ? { businessKey: args['businessKey'] } : {}),
          ...(args['outcome'] !== undefined ? { outcome: args['outcome'] } : {}),
          ...(args['data'] !== undefined ? { data: args['data'] } : {}),
        },
        actor,
      );
      return { results: [await shape(engine, result)] };
    }
    case 'runJobs': {
      clock.set(args['at']);
      return { ran: await engine.jobs.runDue() };
    }
    case 'todo':
    case 'done': {
      const rows = await engine.query[command](actor);
      return {
        total: rows.length,
        rows: rows.map((row) => ({ ...row, assigneeId: row.assignee })),
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
  const definitionNodes = new Map<string, string>();
  return {
    instance: {
      ...result.instance,
      current: result.instance.current.map((node) => ({
        node,
        name: definitionNodes.get(node) ?? null,
      })),
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

/** `workItems[0]` → 那个待办的编号；`instance` → 实例编号 */
function readPath(base: unknown, path: string): unknown {
  const object = base as Record<string, any>;
  if (path === 'instance') return object['instanceId'];
  const match = /^(\w+)\[(\d+)\]$/.exec(path);
  if (match) return object[match[1]!]?.[Number(match[2])]?.id;
  return object[path];
}

/**
 * 只比写出来的字段；列表一样长；null 表示为空；编号、小数按文字比。
 * 期望是文字、实际是事件时比事件的种类；显示用的名字（userName、…Name）这一版的引擎不存，不比
 */
function compare(expected: unknown, actual: unknown, where: string): void {
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
      if (key.endsWith('Name')) continue;
      compare(value, (actual as Record<string, unknown>)[key], `${where}.${key}`);
    }
    return;
  }
  assert.equal(String(actual as string), String(expected as string), where);
}
