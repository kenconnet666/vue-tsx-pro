// 待办上的动作：放回收件箱、委托与交回、前加签、后加签、并加签、自定义动作
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { FlowError, type Actor, type FlowEngine, type WorkItemOperation } from '../src/index.ts';
import { createTestEngine } from '../src/testing.ts';

const processOf = (name: string): ProcessDefinition =>
  JSON.parse(
    readFileSync(new URL(`../../spec/scenarios/processes/${name}.json`, import.meta.url), 'utf8'),
  ) as ProcessDefinition;

const alice: Actor = { id: '1001' };
const carol: Actor = { id: '1003', roles: ['1'] };
const dave: Actor = { id: '1005', roles: ['1'] };
const helper: Actor = { id: '2001' };
const second: Actor = { id: '2002' };

const resultOf = (name: string, end: string) =>
  (processOf(name).nodes.find((n) => n.id === end) as { result?: string }).result ?? null;

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof FlowError, String(error));
    assert.equal(error.code, code, error.message);
    return true;
  });
}

/** 采购（金额小）：财务收件箱里的一份待办，carol 认领了 */
async function claimedReview(options: { operations?: readonly WorkItemOperation[] } = {}) {
  const { engine } = await createTestEngine(options);
  await engine.publish(processOf('purchase'));
  const started = await engine.run(
    { type: 'start', process: 'purchase', variables: { title: '椅子', amount: '800' } },
    alice,
  );
  const item = started.workItems[0]!;
  await engine.run({ type: 'claim', workItem: item.id }, carol);
  return { engine, item, instance: started.instance.id };
}

const operate = (
  engine: FlowEngine,
  workItem: number,
  operation: string,
  actor: Actor,
  input: Record<string, unknown> = {},
) => engine.run({ type: 'operate', workItem, operation, input }, actor);

const todoIds = async (engine: FlowEngine, actor: Actor) =>
  (await engine.query.todo(actor)).map((t) => t.id);

describe('待办上的动作', () => {
  it('放回收件箱：认领的人放回去（不是我的），别的候选人又能认领，他自己不再是候选', async () => {
    const { engine, item } = await claimedReview();
    assert.deepEqual(await todoIds(engine, dave), []);
    await operate(engine, item.id, 'release', carol, { comment: '不是我的' });
    assert.deepEqual(await todoIds(engine, dave), [item.id]);
    assert.deepEqual(await todoIds(engine, carol), []);
    await rejectsWith(engine.run({ type: 'claim', workItem: item.id }, carol), 'forbidden');
    await engine.run({ type: 'claim', workItem: item.id }, dave);
    await rejectsWith(operate(engine, item.id, 'release', carol), 'forbidden');
  });

  it('委托：自己那份先等，受托人办完（选的结果记作意见）回到自己，再由自己处理', async () => {
    const { engine, item, instance } = await claimedReview();
    await operate(engine, item.id, 'delegate', carol, { to: helper.id, comment: '帮忙核一下价格' });
    assert.deepEqual(await todoIds(engine, carol), []);
    await rejectsWith(
      engine.run({ type: 'complete', workItem: item.id, outcome: 'pass' }, carol),
      'already-handled',
    );
    const [delegated] = await engine.query.todo(helper);
    assert.equal(delegated?.node, 'review');
    await engine.run(
      { type: 'complete', workItem: delegated!.id, outcome: 'pass', comment: '价格合理' },
      helper,
    );
    assert.deepEqual(await todoIds(engine, carol), [item.id]);
    const done = await engine.run({ type: 'complete', workItem: item.id, outcome: 'pass' }, carol);
    assert.equal(done.instance.status, 'completed');
    const events = (await engine.query.instance(instance)).events.map((e) => e.type);
    assert.ok(events.includes('workItem.delegated') && events.includes('workItem.resumed'));
  });

  it('前加签：加签的人都办完才回到原来的处理人', async () => {
    const { engine, item } = await claimedReview();
    await operate(engine, item.id, 'addSign', carol, {
      mode: 'before',
      users: [helper.id, second.id],
    });
    assert.deepEqual(await todoIds(engine, carol), []);
    const [first] = await engine.query.todo(helper);
    const signer = await engine.query.workItem(first!.id, helper);
    assert.deepEqual(
      signer.outcomes.map((o) => o.key),
      ['pass', 'reject'],
    );
    // 加签的人能转办自己那份，不能再加签、委托
    assert.deepEqual(
      signer.operations.map((o) => o.name),
      ['transfer'],
    );
    await engine.run({ type: 'complete', workItem: first!.id, outcome: 'pass' }, helper);
    assert.deepEqual(await todoIds(engine, carol), []);
    const [other] = await engine.query.todo(second);
    await engine.run({ type: 'complete', workItem: other!.id, outcome: 'pass' }, second);
    assert.deepEqual(await todoIds(engine, carol), [item.id]);
    const done = await engine.run({ type: 'complete', workItem: item.id, outcome: 'pass' }, carol);
    assert.equal(done.instance.status, 'completed');
  });

  it('后加签：原来的人选了结果先挂着，加签的人办完才生效；加签的人否决就按否决走', async () => {
    const { engine, item } = await claimedReview();
    await operate(engine, item.id, 'addSign', carol, { mode: 'after', users: [helper.id] });
    const held = await engine.run({ type: 'complete', workItem: item.id, outcome: 'pass' }, carol);
    assert.equal(held.instance.status, 'active');
    const [signer] = await engine.query.todo(helper);
    const done = await engine.run(
      { type: 'complete', workItem: signer!.id, outcome: 'reject', comment: '价格偏高' },
      helper,
    );
    assert.equal(done.instance.status, 'completed');
    assert.equal(done.instance.result, resultOf('purchase', 'rejected'));
  });

  it('并加签：只在会签节点上，加进会签组，一起算完成规则', async () => {
    const { engine } = await createTestEngine();
    await engine.publish(processOf('sign-all'));
    const started = await engine.run({ type: 'start', process: 'sign-all' }, alice);
    const mine = started.workItems.find((w) => w.assignee === alice.id)!;
    const modes = (await engine.query.workItem(mine.id, alice)).operations
      .find((o) => o.name === 'addSign')
      ?.fields.find((f) => f.name === 'mode')
      ?.options?.map((o) => o.value);
    assert.deepEqual(modes, ['before', 'after', 'parallel']);
    await operate(engine, mine.id, 'addSign', alice, { mode: 'parallel', users: [helper.id] });
    for (const item of started.workItems) {
      await engine.run(
        { type: 'complete', workItem: item.id, outcome: 'agree' },
        { id: item.assignee! },
      );
    }
    const [extra] = await engine.query.todo(helper);
    assert.ok(extra, '加签的人有一份待办');
    const done = await engine.run(
      { type: 'complete', workItem: extra.id, outcome: 'agree' },
      helper,
    );
    assert.equal(done.instance.status, 'completed');
  });

  it('撤回这一步：办完后下一步还没人动时能撤回，重新回到自己；下一步有人办了就不行', async () => {
    const { engine } = await createTestEngine();
    await engine.publish(processOf('purchase'));
    const start = () =>
      engine.run(
        { type: 'start', process: 'purchase', variables: { title: '服务器', amount: '20000' } },
        alice,
      );
    const passed = async () => {
      const { workItems } = await start();
      await engine.run({ type: 'claim', workItem: workItems[0]!.id }, carol);
      await engine.run({ type: 'complete', workItem: workItems[0]!.id, outcome: 'pass' }, carol);
      return workItems[0]!.id;
    };
    const boss: Actor = { id: '1004' };
    const review = await passed();
    const names = async () =>
      (await engine.query.workItem(review, carol)).operations.map((o) => o.name);
    assert.deepEqual(await names(), ['withdrawStep']);
    await rejectsWith(operate(engine, review, 'withdrawStep', dave), 'forbidden');
    await operate(engine, review, 'withdrawStep', carol, { comment: '金额填错了' });
    assert.deepEqual(await todoIds(engine, boss), []);
    // 原来那份重新打开（同一个编号）
    assert.deepEqual(await todoIds(engine, carol), [review]);
    assert.ok(!(await names()).includes('withdrawStep'));

    const other = await passed();
    const [approve] = await engine.query.todo(boss);
    await engine.run({ type: 'complete', workItem: approve!.id, outcome: 'pass' }, boss);
    assert.deepEqual(
      (await engine.query.workItem(other, carol)).operations.map((o) => o.name),
      [],
    );
  });

  it('自定义动作：选项里加的出现在待办详情里，按 available 判断，run 里能记事件', async () => {
    const flag: WorkItemOperation<{ reason?: string }> = {
      name: 'flag',
      label: '标记为加急',
      fields: () => [{ name: 'reason', label: '原因', type: 'text', required: true }],
      available: ({ item, actor }) => item.assignee === actor.id,
      run: async ({ exec, item }, input) => {
        exec.addEvent('workItem.flagged', {
          workItemId: item.id,
          node: item.node,
          data: { reason: input.reason ?? null },
        });
      },
    };
    const { engine, item, instance } = await claimedReview({
      operations: [flag as unknown as WorkItemOperation],
    });
    const names = (await engine.query.workItem(item.id, carol)).operations.map((o) => o.name);
    assert.ok(names.includes('flag'));
    await operate(engine, item.id, 'flag', carol, { reason: '月底前要' });
    await rejectsWith(operate(engine, item.id, 'flag', dave), 'forbidden');
    const flagged = (await engine.query.instance(instance)).events.find(
      (e) => e.type === 'workItem.flagged',
    );
    assert.deepEqual(flagged?.data, { reason: '月底前要' });
  });
});
