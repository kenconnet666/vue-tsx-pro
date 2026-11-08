// 引擎的核心：发起、认领、处理、网关、会签、退回、撤回、终止、定时与异步作业、外部事件、监听（PGlite、假时钟）
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import {
  FlowError,
  FlowInstance,
  FlowWorkItem,
  type Actor,
  type FlowEngineOptions,
} from '../src/index.ts';
import { createTestEngine } from '../src/testing/testing.ts';

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

describe('engine: 待办详情与催办', () => {
  const legal: Actor = { id: '1006', roles: ['3'] };

  /** 发起 return-choose，起草、复核处理完，停在法务与财务（并行） */
  async function atLegal(definition = processOf('return-choose')) {
    const test = await createTestEngine();
    await test.engine.publish(definition);
    const started = await test.engine.run({ type: 'start', process: 'return-choose' }, alice);
    await completeAs(test.engine, started.workItems[0]!.id);
    const review = (await test.engine.query.todo(carol))[0]!;
    await test.engine.run({ type: 'complete', workItem: review.id, outcome: 'pass' }, carol);
    const item = (await test.engine.query.todo(legal))[0]!;
    return { ...test, instance: started.instance.id, item };
  }

  it('结果里有“退回到运行时选”时给出能选的节点：上游走到过的人工节点', async () => {
    const { engine, item } = await atLegal();
    const targetsOf = async (actor: typeof legal) =>
      (await engine.query.workItem(item.id, actor)).outcomes.flatMap((o) => o.targets);
    const targets = await targetsOf(legal);
    assert.deepEqual(targets.map((t) => t.node).sort(), ['draft', 'review']);
    assert.equal(
      targets.find((t) => t.node === 'review')?.nodeName,
      processOf('return-choose').nodes.find((n) => n.id === 'review')!.name,
    );
    // 不是候选人：不给
    assert.deepEqual(await targetsOf(alice), []);
  });

  it('能做的动作：收件箱里没认领的能认领、转办，认领后能转办、委托、加签、放回；节点关掉了转办时不给', async () => {
    const { engine, item } = await atLegal();
    const names = async (e: typeof engine, id: number) =>
      (await e.query.workItem(id, legal)).operations.map((o) => o.name);
    assert.deepEqual(await names(engine, item.id), ['claim', 'transfer', 'saveDraft']);
    await engine.run({ type: 'claim', workItem: item.id }, legal);
    assert.deepEqual(await names(engine, item.id), [
      'release',
      'transfer',
      'delegate',
      'addSign',
      'saveDraft',
    ]);
    const transfer = (await engine.query.workItem(item.id, legal)).operations.find(
      (o) => o.name === 'transfer',
    );
    assert.deepEqual(
      transfer?.fields.map((f) => [f.name, f.type, f.required ?? false]),
      [
        ['to', 'user', true],
        ['comment', 'textarea', false],
      ],
    );
    const closed = processOf('return-choose');
    const locked = {
      ...closed,
      nodes: closed.nodes.map((n) => (n.id === 'legal' ? { ...n, allow: { transfer: false } } : n)),
    } as ProcessDefinition;
    const again = await atLegal(locked);
    await again.engine.run({ type: 'claim', workItem: again.item.id }, legal);
    assert.ok(!(await names(again.engine, again.item.id)).includes('transfer'));
  });

  it('催办：环节关掉了催办（allow.remind: false）时点名催它报错，催全部时跳过它', async () => {
    const definition = processOf('return-choose');
    const quiet = {
      ...definition,
      nodes: definition.nodes.map((n) =>
        n.id === 'legal' ? { ...n, allow: { remind: false } } : n,
      ),
    } as ProcessDefinition;
    const { engine, instance, item } = await atLegal(quiet);
    await rejectsWith(
      engine.run({ type: 'remind', instance, workItem: item.id }, alice),
      'forbidden',
    );
    const result = await engine.run({ type: 'remind', instance }, alice);
    const reminded = result.events.filter((e) => e.type === 'workItem.reminded').map((e) => e.node);
    assert.deepEqual(reminded, ['finance']);
  });
});

describe('engine: 环节的表单权限', () => {
  // 采购：经理能改金额（必填）、看不到备注，物品只读
  const access: ProcessDefinition = {
    key: 'access',
    name: '采购',
    variables: [
      { name: 'item', type: 'text', label: '物品' },
      { name: 'amount', type: 'number', label: '金额' },
      { name: 'note', type: 'text', label: '备注' },
    ],
    nodes: [
      { id: 'start', type: 'start', name: '提交' },
      {
        id: 'manager',
        type: 'task',
        name: '经理审批',
        assignees: [{ role: '1' }],
        form: { fields: { amount: 'required', note: 'hidden' } },
        outcomes: [{ key: 'approve', label: '同意' }],
      },
      { id: 'end', type: 'end', name: '结束' },
    ],
    edges: [
      { id: 'a', from: 'start', to: 'manager' },
      { id: 'b', from: 'manager', to: 'end', outcome: 'approve' },
    ],
  };

  async function atManager(variables: Record<string, unknown>) {
    const test = await createTestEngine();
    await test.engine.publish(access);
    const started = await test.engine.run({ type: 'start', process: 'access', variables }, alice);
    return { ...test, item: started.workItems[0]!, instance: started.instance.id };
  }

  it('待办详情按权限列字段：隐藏的不列，能改的与必填的标出来；不是候选人时只读', async () => {
    const { engine, item } = await atManager({ item: '服务器', amount: 80000, note: '加急' });
    const fields = (await engine.query.workItem(item.id, carol)).fields;
    assert.deepEqual(
      fields.map((f) => [f.name, f.editable, f.required, f.value]),
      [
        ['item', false, false, '服务器'],
        ['amount', true, true, 80000],
      ],
    );
    assert.ok((await engine.query.workItem(item.id, alice)).fields.every((f) => !f.editable));
  });

  it('处理时只收能改的字段：只读的改了也不算；必填的空着报 invalid-input', async () => {
    const { engine, item, instance } = await atManager({ item: '服务器', note: '加急' });
    await rejectsWith(
      engine.run({ type: 'complete', workItem: item.id, outcome: 'approve' }, carol),
      'invalid-input',
    );
    await engine.run(
      {
        type: 'complete',
        workItem: item.id,
        outcome: 'approve',
        variables: { amount: 72000, item: '改了的物品', note: '改了的备注' },
      },
      carol,
    );
    const { variables } = (await engine.query.instance(instance)).instance;
    assert.deepEqual([variables.item, variables.amount, variables.note], ['服务器', 72000, '加急']);
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

describe('engine: PostgreSQL', () => {
  it('收件箱的候选存成标记数组，查待办按标记取交集', async () => {
    const { engine } = await engineWith(['purchase']);
    const started = await engine.run(
      { type: 'start', process: 'purchase', variables: { title: '显示器', amount: '900' } },
      alice,
    );
    const row = await engine.db.queryable(FlowWorkItem).findOrThrow(started.workItems[0]!.id);
    assert.deepEqual(row.candidates, ['role:1']);
    assert.equal((await engine.query.todo({ id: '2001', roles: ['2', '1'] })).length, 1);
    assert.equal((await engine.query.todo({ id: '2001', roles: ['2'] })).length, 0);
  });

  it('两个进程同时做到期作业：SKIP LOCKED 各抢各的，每个作业只做一次', async () => {
    let calls = 0;
    const { engine } = await engineWith(['erp-sync'], {
      extensions: {
        actions: {
          explode: () => {
            calls++;
          },
        },
      },
    });
    for (let i = 0; i < 6; i++) await engine.run({ type: 'start', process: 'erp-sync' }, alice);
    const ran = await Promise.all([
      engine.jobs.runDue({ worker: 'a', limit: 4 }),
      engine.jobs.runDue({ worker: 'b', limit: 4 }),
    ]);
    assert.equal(ran[0] + ran[1], 6);
    assert.equal(calls, 6);
    assert.equal(await engine.jobs.runDue(), 0);
    const statuses = await engine.db
      .queryable(FlowInstance)
      .select((i) => ({ status: i.status }))
      .toList();
    assert.ok(statuses.every((row) => row.status === 'completed'));
  });
});
