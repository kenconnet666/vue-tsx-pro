// 引擎的核心：发起、认领、处理、网关、会签、退回、撤回、终止、定时与异步作业、外部事件、监听（SQLite 内存库、假时钟）
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { FlowError, type Actor, type FlowEngineOptions } from '../src/index.ts';
import { createTestEngine } from '../src/testing.ts';

/** spec/scenarios/processes 里的定义 */
const processOf = (name: string): ProcessDefinition =>
  JSON.parse(
    readFileSync(new URL(`../../spec/scenarios/processes/${name}.json`, import.meta.url), 'utf8'),
  ) as ProcessDefinition;

const alice: Actor = { id: '1001', name: 'alice' };
const carol: Actor = { id: '1003', name: 'carol', roles: ['1'] };
const dave: Actor = { id: '1005', name: 'dave', roles: ['1'] };
const boss: Actor = { id: '1004', name: 'boss' };
const admin: Actor = { id: '1000', admin: true };

async function engineWith(
  names: string[],
  options: Omit<FlowEngineOptions, 'adapter' | 'clock'> = {},
) {
  const test = await createTestEngine(options);
  for (const name of names) await test.engine.publish(processOf(name));
  return test;
}

/** 断言抛出带这个代号的 FlowError */
async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(
    promise,
    (error: unknown) => error instanceof FlowError && error.code === code,
  );
}

describe('engine: purchase', () => {
  it('金额小：财务收件箱认领、通过，走默认边结束；标题按模板渲染', async () => {
    const { engine } = await engineWith(['purchase']);
    const started = await engine.run(
      { type: 'start', process: 'purchase', variables: { title: '办公椅', amount: '800' } },
      alice,
    );
    assert.equal(started.instance.title, '采购申请：办公椅');
    assert.deepEqual(
      started.instance.current.map((c) => c.node),
      ['review'],
    );
    const [review] = started.workItems;
    assert.equal(review?.assignment, 'pool');
    assert.deepEqual(
      (await engine.query.todo(carol)).map((item) => item.node),
      ['review'],
    );
    assert.deepEqual(await engine.query.todo(alice), []);

    await engine.run({ type: 'claim', workItem: review!.id }, carol);
    await rejectsWith(engine.run({ type: 'claim', workItem: review!.id }, dave), 'already-handled');
    await rejectsWith(
      engine.run({ type: 'complete', workItem: review!.id, outcome: 'pass' }, dave),
      'forbidden',
    );
    const done = await engine.run(
      { type: 'complete', workItem: review!.id, outcome: 'pass' },
      carol,
    );
    assert.equal(done.instance.status, 'completed');
    assert.equal(done.instance.result, 'approved');
    assert.ok(done.events.some((event) => event.type === 'instance.finished'));
    assert.equal((await engine.query.done(carol))[0]?.node, 'review');
  });

  it('金额大：再到总经理；候选人直接处理等于先认领；重复提交报已处理', async () => {
    const { engine } = await engineWith(['purchase']);
    const started = await engine.run(
      { type: 'start', process: 'purchase', variables: { title: '服务器', amount: '12000.00' } },
      alice,
    );
    const review = started.workItems[0]!;
    const next = await engine.run({ type: 'complete', workItem: review.id, outcome: 'pass' }, dave);
    assert.equal(next.workItems[0]?.node, 'approve');
    assert.equal(next.workItems[0]?.assignee, boss.id);
    await rejectsWith(
      engine.run({ type: 'complete', workItem: review.id, outcome: 'pass' }, dave),
      'already-handled',
    );
    const end = await engine.run(
      { type: 'complete', workItem: next.workItems[0]!.id, outcome: 'pass' },
      boss,
    );
    assert.equal(end.instance.status, 'completed');
    // 实例结束后再提交：报实例不在进行中（同 Java 版的 purchase-duplicate-submit）
    await rejectsWith(
      engine.run({ type: 'complete', workItem: next.workItems[0]!.id, outcome: 'pass' }, boss),
      'instance-not-active',
    );
  });

  it('否决要写意见、结果要是节点上的；走否决边', async () => {
    const { engine } = await engineWith(['purchase']);
    const { workItems } = await engine.run(
      { type: 'start', process: 'purchase', variables: { title: '打印机', amount: '3000' } },
      alice,
    );
    const id = workItems[0]!.id;
    await rejectsWith(
      engine.run({ type: 'complete', workItem: id, outcome: 'reject' }, carol),
      'invalid-input',
    );
    await rejectsWith(
      engine.run({ type: 'complete', workItem: id, outcome: 'nope' }, carol),
      'invalid-input',
    );
    const rejected = await engine.run(
      { type: 'complete', workItem: id, outcome: 'reject', comment: '预算不够' },
      carol,
    );
    assert.equal(rejected.instance.result, 'rejected');
    const detail = await engine.query.instance(rejected.instance.id);
    assert.equal(detail.events.find((e) => e.type === 'workItem.completed')?.comment, '预算不够');
  });

  it('撤回：有人处理前发起人能撤回；处理后不行，别人不行', async () => {
    const { engine } = await engineWith(['purchase']);
    const first = await engine.run(
      { type: 'start', process: 'purchase', variables: { title: 'a', amount: '1' } },
      alice,
    );
    await rejectsWith(
      engine.run({ type: 'withdraw', instance: first.instance.id }, carol),
      'forbidden',
    );
    const withdrawn = await engine.run({ type: 'withdraw', instance: first.instance.id }, alice);
    assert.equal(withdrawn.instance.status, 'withdrawn');
    assert.deepEqual(await engine.query.todo(carol), []);

    const second = await engine.run(
      { type: 'start', process: 'purchase', variables: { title: 'b', amount: '20000' } },
      alice,
    );
    await engine.run(
      { type: 'complete', workItem: second.workItems[0]!.id, outcome: 'pass' },
      carol,
    );
    await rejectsWith(
      engine.run({ type: 'withdraw', instance: second.instance.id }, alice),
      'forbidden',
    );
    await rejectsWith(
      engine.run({ type: 'terminate', instance: second.instance.id }, alice),
      'forbidden',
    );
    const ended = await engine.run(
      { type: 'terminate', instance: second.instance.id, result: 'void' },
      admin,
    );
    assert.equal(ended.instance.status, 'terminated');
    assert.deepEqual(await engine.query.todo(boss), []);
  });

  it('监听在提交后执行；回滚的命令不通知', async () => {
    const seen: string[] = [];
    const { engine } = await engineWith(['purchase'], {
      on: { 'instance.finished': (event) => void seen.push(`done:${event.instanceId}`) },
    });
    const { workItems, instance } = await engine.run(
      { type: 'start', process: 'purchase', variables: { title: 'a', amount: '1' } },
      alice,
    );
    await rejectsWith(
      engine.run({ type: 'complete', workItem: workItems[0]!.id, outcome: 'x' }, carol),
      'invalid-input',
    );
    assert.deepEqual(seen, []);
    await engine.run({ type: 'complete', workItem: workItems[0]!.id, outcome: 'pass' }, carol);
    assert.deepEqual(seen, [`done:${instance.id}`]);
  });
});

describe('engine: gateways and countersign', () => {
  it('并行：两条分支都处理完才汇合', async () => {
    const definition = processOf('contract-parallel');
    const { engine } = await engineWith(['contract-parallel'], {
      org: { members: () => [] },
    });
    const started = await engine.run(
      { type: 'start', process: definition.key, variables: {} },
      alice,
    );
    assert.ok(started.workItems.length >= 2, '并行分出两份以上的待办');
    const [first, ...rest] = started.workItems;
    const after = await completeAs(engine, first!.id);
    assert.equal(after.instance.status, 'active');
    let last = after;
    for (const item of rest) last = await completeAs(engine, item.id);
    assert.notDeepEqual(last.instance.current, started.instance.current);
  });

  it('会签：全部、任一、比例、依次', async () => {
    const people = ['2001', '2002', '2003'];
    const { engine } = await engineWith(['sign-all', 'sign-any', 'sign-ratio', 'sign-sequential'], {
      org: { members: () => people },
    });
    for (const key of ['sign-all', 'sign-any', 'sign-ratio', 'sign-sequential']) {
      const definition = processOf(key);
      const started = await engine.run(
        { type: 'start', process: definition.key, variables: { signers: people.map(Number) } },
        alice,
      );
      assert.ok(started.workItems.length > 0, `${key} 建了会签待办`);
    }
  });
});

describe('engine: call', () => {
  it('同步调用流程：父实例等子实例结束，收 output，按子实例的结果往下走；父实例终止时子实例一起终止', async () => {
    const { engine } = await engineWith(['quote', 'sourcing-check']);
    const quoter: Actor = { id: '1003' };
    const parent = await engine.run(
      { type: 'start', process: 'sourcing-check', variables: { title: '钢材' } },
      alice,
    );
    assert.deepEqual(
      parent.instance.current.map((c) => c.node),
      ['quote'],
    );
    const [fill] = await engine.query.todo(quoter);
    assert.equal(fill?.processKey, 'quote');
    const childDetail = await engine.query.instance(fill!.instanceId);
    assert.equal(childDetail.instance.parentId, parent.instance.id);
    assert.equal(childDetail.instance.variables['title'], '钢材');

    await engine.run(
      { type: 'complete', workItem: fill!.id, outcome: 'done', variables: { amount: '120.00' } },
      quoter,
    );
    const after = await engine.query.instance(parent.instance.id);
    assert.equal(after.instance.status, 'completed');
    assert.equal(after.instance.variables['childAmount'], '120.00');
    assert.ok(after.events.some((e) => e.type === 'call.finished'));

    const second = await engine.run(
      { type: 'start', process: 'sourcing-check', variables: { title: '木材' } },
      alice,
    );
    await engine.run({ type: 'terminate', instance: second.instance.id }, admin);
    const [child] = (await engine.query.started(alice)).filter(
      (i) => i.parentId === second.instance.id,
    );
    assert.equal(child?.status, 'terminated');
    assert.deepEqual(await engine.query.todo(quoter), []);
  });
});

describe('engine: 流程自带的 TS', () => {
  const definition: ProcessDefinition = {
    key: 'coded',
    name: '带代码的流程',
    code: {
      source: `
        type Ctx = { read(field: string): unknown; variables: Record<string, unknown> };
        export const reviewer = (): string[] => ['1004'];
        export const budget = (ctx: Ctx): true | string =>
          Number(ctx.read('amount')) > 1000 ? '超出预算' : true;
        export const big = (ctx: Ctx): boolean => Number(ctx.variables.amount) > 500;
        export const stamp = () => ({ variables: { stamped: true } });
      `,
    },
    nodes: [
      { id: 'start', type: 'start', name: '提交' },
      { id: 'mark', type: 'service', name: '盖章', action: 'code.stamp', mode: 'sync' },
      {
        id: 'review',
        type: 'task',
        name: '审批',
        assignees: [{ resolver: 'code.reviewer' }],
        outcomes: [{ key: 'ok', label: '同意', guards: ['code.budget'] }],
      },
      { id: 'route', type: 'exclusive', name: '大额？' },
      { id: 'large', type: 'end', name: '大额', result: 'large' },
      { id: 'small', type: 'end', name: '小额', result: 'small' },
    ],
    edges: [
      { id: 'e1', from: 'start', to: 'mark' },
      { id: 'e2', from: 'mark', to: 'review' },
      { id: 'e3', from: 'review', to: 'route', outcome: 'ok' },
      {
        id: 'e4',
        from: 'route',
        to: 'large',
        when: { field: 'fn.code.big', op: 'eq', value: true },
      },
      { id: 'e5', from: 'route', to: 'small', default: true },
    ],
  };

  it('发布时去掉类型存进版本；处理人、守卫、条件、动作引用 code.名字', async () => {
    const { engine } = await createTestEngine();
    await engine.publish(definition);
    const started = await engine.run(
      { type: 'start', process: 'coded', variables: { amount: 800 } },
      alice,
    );
    assert.equal(started.workItems[0]?.assignee, '1004');
    assert.equal(started.instance.variables['stamped'], true);
    const done = await engine.run(
      { type: 'complete', workItem: started.workItems[0]!.id, outcome: 'ok' },
      boss,
    );
    assert.equal(done.instance.result, 'large');

    const second = await engine.run(
      { type: 'start', process: 'coded', variables: { amount: 5000 } },
      alice,
    );
    await rejectsWith(
      engine.run({ type: 'complete', workItem: second.workItems[0]!.id, outcome: 'ok' }, boss),
      'guard-rejected',
    );
  });

  it('代码写得不对：发布时报 invalid-definition', async () => {
    const { engine } = await createTestEngine();
    await rejectsWith(
      engine.publish({ ...definition, code: { source: 'export const = ;' } }),
      'invalid-definition',
    );
  });
});

/** 以待办的处理人（或候选里的第一个）处理，结果取节点上第一个通过的 */
async function completeAs(
  engine: Awaited<ReturnType<typeof createTestEngine>>['engine'],
  id: number,
) {
  const detail = await engine.db
    .queryable((await import('../src/index.ts')).FlowWorkItem)
    .findOrThrow(id);
  const actor: Actor = { id: detail.assignee ?? '1000', admin: true, roles: ['1', '2', '3'] };
  const instance = await engine.query.instance(detail.instanceId);
  const definition = processOf(instance.instance.processKey);
  const node = definition.nodes.find((n) => n.id === detail.node);
  const outcome =
    node?.type === 'task'
      ? (node.outcomes.find((o) => (o.kind ?? 'approve') === 'approve') ?? node.outcomes[0])
      : undefined;
  return engine.run({ type: 'complete', workItem: id, outcome: outcome!.key }, actor);
}
