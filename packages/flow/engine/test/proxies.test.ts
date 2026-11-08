// 代理（docs/decisions/0010 第 3 节）：不在的这段时间、这些流程，新到手上的待办交给代理人并记下本该是谁的；
// 代理人也设了代理时顺着找、绕回来就停；收件箱的候选加上代理人；只能设自己的（管理员除外）；撤销、过期后不再代理
import assert from 'node:assert/strict';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { describe, it } from 'vitest';
import type { Actor } from '../src/index.ts';
import { createTestEngine } from '../src/testing/testing.ts';

const alice: Actor = { id: '1001' };
const bob: Actor = { id: '1002' };
const carol: Actor = { id: '1003' };
const dave: Actor = { id: '1004' };
const admin: Actor = { id: '9', admin: true };

/** 提交 → bob 审核 → bob、carol 的收件箱复核 → 结束 */
const definition: ProcessDefinition = {
  key: 'proxy',
  name: '代理',
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'review',
      type: 'task',
      name: '审核',
      assignees: [{ user: '1002' }],
      outcomes: [{ key: 'ok', label: '同意' }],
    },
    {
      id: 'check',
      type: 'task',
      name: '复核',
      assignees: [{ user: '1002' }, { user: '1003' }],
      outcomes: [{ key: 'ok', label: '通过' }],
    },
    { id: 'end', type: 'end', name: '结束', result: 'approved' },
  ],
  edges: [
    { id: 'e1', from: 'start', to: 'review' },
    { id: 'e2', from: 'review', to: 'check', outcome: 'ok' },
    { id: 'e3', from: 'check', to: 'end', outcome: 'ok' },
  ],
};

async function setup() {
  const test = await createTestEngine({});
  await test.engine.publish(definition);
  return test;
}

describe('代理', () => {
  it('新到的待办交给代理人、记下本该是谁的；收件箱加上代理人；到达通知发给代理人', async () => {
    const { engine } = await setup();
    await engine.proxies.save(bob, { agent: '1004', note: '休年假' });
    const started = await engine.run({ type: 'start', process: 'proxy' }, alice);
    const [review] = started.workItems;
    assert.deepEqual([review?.assignee, review?.proxyFor], ['1004', '1002']);
    assert.equal((await engine.query.todo(bob)).length, 0);
    assert.equal((await engine.query.todo(dave)).length, 1);
    assert.equal((await engine.notifications.list(dave))[0]?.event, 'arrived');

    // 收件箱：bob 的代理人 dave 也是候选，bob、carol 照样能认领
    const next = await engine.run({ type: 'complete', workItem: review!.id, outcome: 'ok' }, dave);
    assert.equal(next.workItems[0]?.assignment, 'pool');
    for (const who of [bob, carol, dave])
      assert.equal((await engine.query.todo(who)).length, 1, `${who.id} 能认领`);
  });

  it('只代理写了的流程、这段时间；撤销后不再代理；代理人的代理顺着找，绕回来就停', async () => {
    const { engine, clock } = await setup();
    const other = await engine.proxies.save(bob, { agent: '1004', processKeys: ['leave'] });
    let started = await engine.run({ type: 'start', process: 'proxy' }, alice);
    assert.equal(started.workItems[0]?.assignee, '1002', '别的流程的代理不管这个');
    await engine.proxies.cancel(bob, other.id);

    const soon = await engine.proxies.save(bob, {
      agent: '1004',
      startsAt: new Date(clock.now().getTime() + 3_600_000),
      endsAt: new Date(clock.now().getTime() + 5 * 3_600_000),
    });
    started = await engine.run({ type: 'start', process: 'proxy' }, alice);
    assert.equal(started.workItems[0]?.assignee, '1002', '还没开始');
    clock.advance({ hours: 2 });
    started = await engine.run({ type: 'start', process: 'proxy' }, alice);
    assert.equal(started.workItems[0]?.assignee, '1004');
    clock.advance({ hours: 4 });
    started = await engine.run({ type: 'start', process: 'proxy' }, alice);
    assert.equal(started.workItems[0]?.assignee, '1002', '过期了');
    assert.deepEqual(
      (await engine.proxies.list(bob)).mine.map((p) => p.id).includes(soon.id),
      false,
      '过期的不再列出',
    );

    // bob → dave → carol：落到 carol；carol → bob 绕回来：停在 carol
    await engine.proxies.save(bob, { agent: '1004' });
    await engine.proxies.save(dave, { agent: '1003' });
    await engine.proxies.save(carol, { agent: '1002' });
    started = await engine.run({ type: 'start', process: 'proxy' }, alice);
    assert.deepEqual(
      [started.workItems[0]?.assignee, started.workItems[0]?.proxyFor],
      ['1003', '1002'],
    );
  });

  it('只能设自己的、管理员可以替别人设；不能代理给自己；结束要晚于开始；列出我设的与交给我的', async () => {
    const { engine } = await setup();
    await assert.rejects(engine.proxies.save(alice, { principal: '1002', agent: '1004' }), {
      code: 'forbidden',
    });
    await assert.rejects(engine.proxies.save(bob, { agent: '1002' }), { code: 'invalid-input' });
    await assert.rejects(
      engine.proxies.save(bob, { agent: '1004', endsAt: new Date(2000, 0, 1) }),
      { code: 'invalid-input' },
    );
    const saved = await engine.proxies.save(admin, { principal: '1002', agent: '1004' });
    assert.deepEqual([saved.principal, saved.active], ['1002', true]);
    assert.equal((await engine.proxies.list(bob)).mine.length, 1);
    assert.equal((await engine.proxies.list(dave)).forMe.length, 1);
    await assert.rejects(engine.proxies.cancel(alice, saved.id), { code: 'forbidden' });
    assert.equal(await engine.proxies.cancel(bob, saved.id), true);
    assert.equal((await engine.proxies.list(dave)).forMe.length, 0);
  });
});
