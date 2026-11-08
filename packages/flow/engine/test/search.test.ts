// 查单据（query.search）、实例详情的可见范围（我发起的、我经手的、全部给管理员）与能做的动作
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { describe, it } from 'vitest';
import { FlowError, type Actor } from '../src/index.ts';
import { createTestEngine } from '../src/testing/testing.ts';

const purchase = JSON.parse(
  readFileSync(new URL('../../spec/scenarios/processes/purchase.json', import.meta.url), 'utf8'),
) as ProcessDefinition;

const alice: Actor = { id: '1001', name: 'alice' };
/** 财务（角色 1）：采购的复核在财务的收件箱里 */
const carol: Actor = { id: '1003', name: 'carol', roles: ['1'] };
const bob: Actor = { id: '1002', name: 'bob' };
const admin: Actor = { id: '1000', admin: true };

async function setup() {
  const { engine } = await createTestEngine();
  await engine.publish(purchase);
  const start = async (title: string, by = alice) =>
    (
      await engine.run(
        { type: 'start', process: 'purchase', variables: { title, amount: '800' } },
        by,
      )
    ).instance.id;
  const chair = await start('办公椅');
  const desk = await start('升降桌');
  const own = await start('显示器', bob);
  return { engine, chair, desk, own };
}

describe('query.search', () => {
  it('范围：发起的、收件箱里能认领的算经手；别人的看不到；全部只给管理员', async () => {
    const { engine, chair, desk, own } = await setup();
    const ids = async (actor: Actor, scope?: 'started' | 'involved' | 'all') =>
      (await engine.query.search(actor, scope ? { scope } : {})).rows.map((row) => row.id);
    assert.deepEqual(await ids(alice), [desk, chair]);
    assert.deepEqual(await ids(carol), [own, desk, chair]);
    assert.deepEqual(await ids(bob, 'started'), [own]);
    assert.deepEqual(await ids(admin, 'all'), [own, desk, chair]);
    await assert.rejects(
      engine.query.search(alice, { scope: 'all' }),
      (error: unknown) => error instanceof FlowError && error.code === 'forbidden',
    );
  });

  it('文字、状态、分页', async () => {
    const { engine, chair, desk } = await setup();
    const found = await engine.query.search(alice, { text: '椅' });
    assert.deepEqual(
      found.rows.map((row) => row.id),
      [chair],
    );
    const [review] = (await engine.query.todo(carol)).filter((item) => item.instanceId === desk);
    await engine.run({ type: 'complete', workItem: review!.id, outcome: 'pass' }, carol);
    const completed = await engine.query.search(alice, { status: ['completed'] });
    assert.deepEqual(
      completed.rows.map((row) => row.id),
      [desk],
    );
    const page = await engine.query.search(admin, { scope: 'all', page: 2, size: 2 });
    assert.equal(page.total, 3);
    assert.deepEqual(
      page.rows.map((row) => row.id),
      [chair],
    );
  });

  it('实例详情：经手的人与管理员能看，别人是 forbidden；处理过的人在处理之后仍能看', async () => {
    const { engine, chair } = await setup();
    assert.equal((await engine.query.instance(chair, alice)).instance.id, chair);
    assert.equal((await engine.query.instance(chair, admin)).instance.id, chair);
    await assert.rejects(
      engine.query.instance(chair, bob),
      (error: unknown) => error instanceof FlowError && error.code === 'forbidden',
    );
    const [review] = (await engine.query.todo(carol)).filter((item) => item.instanceId === chair);
    await engine.run({ type: 'complete', workItem: review!.id, outcome: 'pass' }, carol);
    assert.equal((await engine.query.instance(chair, carol)).instance.id, chair);
  });

  it('actions：发起人能撤回、催办，管理员能干预；有人处理过就不能撤回', async () => {
    const { engine, chair } = await setup();
    assert.deepEqual((await engine.query.instance(chair, alice)).actions, {
      withdraw: true,
      remind: true,
      manage: false,
    });
    assert.deepEqual((await engine.query.instance(chair, admin)).actions, {
      withdraw: false,
      remind: true,
      manage: true,
    });
    const [review] = (await engine.query.todo(carol)).filter((item) => item.instanceId === chair);
    await engine.run({ type: 'complete', workItem: review!.id, outcome: 'pass' }, carol);
    assert.deepEqual((await engine.query.instance(chair, alice)).actions, {
      withdraw: false,
      remind: false,
      manage: false,
    });
  });

  it('待办的 quickOutcome：同意类、不要求写意见的结果；已办里为空', async () => {
    const { engine, chair } = await setup();
    const [review] = (await engine.query.todo(carol)).filter((item) => item.instanceId === chair);
    assert.equal(review?.quickOutcome, 'pass');
    await engine.run({ type: 'complete', workItem: review!.id, outcome: 'pass' }, carol);
    const [done] = await engine.query.done(carol);
    assert.equal(done?.quickOutcome, null);
  });
});
