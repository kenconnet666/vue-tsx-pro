// 通知（docs/decisions/0010）：按流转记录生成，与推进同一个事务；站内信箱的列表、未读、已读；外部投递失败的到点重试
import assert from 'node:assert/strict';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { describe, it } from 'vitest';
import type { Actor, NotificationView } from '../src/index.ts';
import { createTestEngine } from '../src/testing/testing.ts';

const alice: Actor = { id: '1001', name: 'alice' };
const bob: Actor = { id: '1002', name: 'bob' };
const carol: Actor = { id: '1003', name: 'carol', roles: ['1'] };

/** 提交 → bob 审核（4 小时时限，到期前 1 小时提醒）→ 角色 1 的收件箱复核（能退回）→ 结束 */
const definition: ProcessDefinition = {
  key: 'notice',
  name: '通知',
  title: '申请：{reason}',
  settings: { notify: { cc: false } },
  variables: [{ name: 'reason', type: 'text', label: '事由' }],
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'review',
      type: 'task',
      name: '审核',
      assignees: [{ user: '1002' }],
      due: { hours: 4 },
      reminders: [{ before: { hours: 1 } }],
      notify: { arrived: { template: '请审核：{reason}' } },
      outcomes: [{ key: 'ok', label: '同意' }],
    },
    {
      id: 'check',
      type: 'task',
      name: '复核',
      assignees: [{ role: '1' }],
      outcomes: [
        { key: 'ok', label: '通过' },
        { key: 'back', label: '退回', kind: 'return' },
      ],
    },
    { id: 'end', type: 'end', name: '结束', result: 'approved' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'review' },
    { id: 'e2', from: 'review', to: 'check', outcome: 'ok' },
    { id: 'e3', from: 'check', to: 'end', outcome: 'ok' },
    { id: 'e4', from: 'check', to: 'review', outcome: 'back', kind: 'return' },
  ],
};

const kinds = (rows: readonly NotificationView[]) => rows.map((n) => n.event);

async function setup(deliver?: (n: NotificationView) => void) {
  const test = await createTestEngine({
    org: { members: (source) => ('role' in source && source.role === '1' ? ['1003', '1004'] : []) },
    ...(deliver ? { notifications: { deliver } } : {}),
  });
  await test.engine.publish(definition);
  return test;
}

describe('通知', () => {
  it('到达、退回、催办、到期前提醒、超时、结束；收件箱的发给能认领的人；配了模板的带文字', async () => {
    const { engine, clock } = await setup();
    const started = await engine.run(
      { type: 'start', process: 'notice', variables: { reason: '买书' } },
      alice,
    );
    const [arrived] = await engine.notifications.list(bob);
    assert.equal(arrived?.event, 'arrived');
    assert.equal(arrived?.title, '申请：买书');
    assert.equal(arrived?.nodeName, '审核');
    assert.equal(arrived?.message, '请审核：买书');
    assert.equal(await engine.notifications.unread(alice), 0, '发起人自己不收到达');

    // 发起人催办：bob 收到 reminded，sender 是 alice
    await engine.run({ type: 'remind', instance: started.instance.id }, alice);
    const [reminded] = await engine.notifications.list(bob);
    assert.deepEqual([reminded?.event, reminded?.sender], ['reminded', '1001']);

    // 到期前 1 小时的提醒、超时：作业跑出来
    clock.advance({ hours: 3, minutes: 5 });
    await engine.jobs.runDue();
    clock.advance({ hours: 1 });
    await engine.jobs.runDue();
    assert.deepEqual(kinds(await engine.notifications.list(bob)).slice(0, 2), [
      'overdue',
      'dueSoon',
    ]);

    // bob 同意 → 复核进角色 1 的收件箱：1003、1004 都收到
    const [review] = await engine.query.todo(bob);
    await engine.run({ type: 'complete', workItem: review!.id, outcome: 'ok' }, bob);
    assert.deepEqual(kinds(await engine.notifications.list({ id: '1004' })), ['arrived']);
    // carol 退回：bob 收到 returned
    const [check] = await engine.query.todo(carol);
    await engine.run({ type: 'complete', workItem: check!.id, outcome: 'back' }, carol);
    assert.equal((await engine.notifications.list(bob))[0]?.event, 'returned');

    // 再走一遍到结束：发起人收到 finished
    const [again] = await engine.query.todo(bob);
    await engine.run({ type: 'complete', workItem: again!.id, outcome: 'ok' }, bob);
    const [check2] = await engine.query.todo(carol);
    await engine.run({ type: 'complete', workItem: check2!.id, outcome: 'ok' }, carol);
    const [finished] = await engine.notifications.list(alice);
    assert.deepEqual([finished?.event, finished?.sender], ['finished', '1003']);
  });

  it('流程里关掉的（cc: false）不发；已读、未读', async () => {
    const { engine } = await setup();
    const started = await engine.run(
      { type: 'start', process: 'notice', variables: { reason: '买书' } },
      alice,
    );
    await engine.run({ type: 'cc', instance: started.instance.id, users: ['1009'] }, alice);
    assert.deepEqual(await engine.notifications.list({ id: '1009' }), []);

    await engine.run({ type: 'remind', instance: started.instance.id }, alice);
    assert.equal(await engine.notifications.unread(bob), 2);
    const [latest] = await engine.notifications.list(bob);
    assert.equal(await engine.notifications.read(bob, [latest!.id]), 1);
    assert.equal(await engine.notifications.unread(bob), 1);
    // 别人的标不了
    assert.equal(await engine.notifications.read(alice, [latest!.id]), 0);
    assert.equal(await engine.notifications.read(bob), 1);
    assert.equal((await engine.notifications.list(bob, { unreadOnly: true })).length, 0);
  });

  it('外部投递：提交后送；失败的留在发件箱，到点作业再试', async () => {
    const delivered: string[] = [];
    let failing = true;
    const { engine } = await setup((n) => {
      if (failing) throw new Error('邮件服务没起来');
      delivered.push(`${n.recipient}:${n.event}`);
    });
    await engine.run({ type: 'start', process: 'notice', variables: { reason: '买书' } }, alice);
    // 提交后的投递在 afterCommit 里跑：等它一下
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(delivered, []);
    failing = false;
    await engine.jobs.runDue();
    assert.deepEqual(delivered, ['1002:arrived']);
    await engine.jobs.runDue();
    assert.deepEqual(delivered, ['1002:arrived'], '送到了的不再送');
  });
});
