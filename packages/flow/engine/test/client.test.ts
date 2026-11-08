// 客户端与端点：页面不带身份，端点按 actor 回调定是谁；值经 json-wire 来回（日期还原）；引擎的错误带着代号还原；
// 改数据的方法成功后通知；消息端口的传输（MessageChannel）跑通同样的往返
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { templates } from '@zerodep-dev/flow-ts-model';
import {
  createFlowClient,
  flowEndpoint,
  FlowError,
  portTransport,
  servePort,
  type Actor,
} from '../src/index.ts';
import { createTestEngine } from '../src/testing/testing.ts';

const alice: Actor = { id: '1001', name: '林小满' };
const bob: Actor = { id: '1002', name: '周启航', roles: ['1'] };

async function setup() {
  const { engine } = await createTestEngine();
  await engine.publish(templates.leave());
  let current = alice;
  const endpoint = flowEndpoint(engine, { actor: () => current });
  const client = createFlowClient({ call: (request) => endpoint.handle(request) });
  return { engine, endpoint, client, as: (actor: Actor) => (current = actor) };
}

describe('客户端与端点', () => {
  it('不带身份：发起、待办、处理都按端点给的 actor；日期还原成 Date', async () => {
    const { client, as } = await setup();
    const started = await client.run({
      type: 'start',
      process: 'leave',
      variables: { days: 2, reason: '探亲' },
    });
    assert.equal(started.instance.status, 'active');
    assert.deepEqual(await client.todo(), [], '发起人没有待办');
    as(bob);
    const [item] = await client.todo();
    assert.ok(item);
    assert.ok(item.createdAt instanceof Date);
    const detail = await client.workItem(item.id);
    assert.ok(detail.completable);
    await client.run({ type: 'complete', workItem: item.id, outcome: 'approve' });
    assert.deepEqual(await client.todo(), []);
  });

  it('引擎的错误带着代号还原；没有的方法报 invalid-input', async () => {
    const { client, as } = await setup();
    await client.run({ type: 'start', process: 'leave', variables: { days: 1, reason: '病假' } });
    as(bob);
    const [item] = await client.todo();
    await client.run({ type: 'complete', workItem: item!.id, outcome: 'approve' });
    await assert.rejects(
      client.run({ type: 'complete', workItem: item!.id, outcome: 'approve' }),
      // 请假批完了实例就结束了：再处理报实例不在进行中
      (error) => error instanceof FlowError && error.code === 'instance-not-active',
    );
    const { endpoint } = await setup();
    const response = await endpoint.handle({ method: 'dropTables', args: '[]' });
    assert.equal(response.ok, false);
    assert.equal(!response.ok && response.error.code, 'invalid-input');
  });

  it('改数据的方法成功后通知，查询不通知', async () => {
    const { endpoint, client } = await setup();
    let changes = 0;
    endpoint.onChange(() => changes++);
    await client.todo();
    assert.equal(changes, 0);
    await client.run({ type: 'start', process: 'leave', variables: { days: 1, reason: '事假' } });
    assert.equal(changes, 1);
  });

  it('消息端口：调用与“数据变了”都经端口', async () => {
    const { engine } = await createTestEngine();
    await engine.publish(templates.leave());
    const channel = new MessageChannel();
    const stop = servePort(channel.port1, flowEndpoint(engine, { actor: () => alice }));
    const client = createFlowClient(portTransport(channel.port2));
    let changed = false;
    client.onChange(() => (changed = true));
    const processes = await client.processes();
    assert.ok(processes.some((p) => p.key === 'leave'));
    await client.run({ type: 'start', process: 'leave', variables: { days: 3, reason: '年假' } });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.ok(changed);
    stop();
    channel.port1.close();
    channel.port2.close();
  });
});
