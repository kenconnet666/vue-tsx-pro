// 客户端与端点：页面不带身份，端点按 actor 回调定是谁；值经 json-wire 来回（日期还原）；引擎的错误带着代号还原；
// 改数据的方法成功后通知；消息端口的传输（MessageChannel）跑通同样的往返
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { templates } from '@zerodep-dev/flow-ts-model';
import {
  createFlowClient,
  flowEndpoint,
  FlowError,
  flowHttpHandler,
  httpTransport,
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

  it('经 HTTP：身份按请求头（会话）定，错误带代号与 HTTP 状态；不是调用的请求直接拒绝', async () => {
    const { engine } = await createTestEngine();
    await engine.publish(templates.leave());
    const users: Record<string, Actor> = { alice, bob };
    const endpoint = flowEndpoint<Request>(engine, {
      actor: (request) => {
        const user = users[request.headers.get('x-user') ?? ''];
        if (!user) throw new FlowError('forbidden', '没有登录');
        return user;
      },
    });
    const handle = flowHttpHandler(endpoint);
    const statuses: number[] = [];
    // 不起真的服务器：fetch 直接交给处理函数，请求、响应照样是 Web 标准的对象
    const send = async (url: RequestInfo | URL, init?: RequestInit) => {
      const response = await handle(new Request(url, init));
      statuses.push(response.status);
      return response;
    };
    const as = (user: string) =>
      createFlowClient(
        httpTransport('http://flow.test/api/flow', { fetch: send, headers: { 'x-user': user } }),
      );
    await as('alice').run({
      type: 'start',
      process: 'leave',
      variables: { days: 2, reason: '探亲' },
    });
    const [item] = await as('bob').todo();
    assert.ok(item?.createdAt instanceof Date);
    await as('bob').run({ type: 'complete', workItem: item.id, outcome: 'approve' });
    await assert.rejects(
      as('nobody').todo(),
      (error) => error instanceof FlowError && error.code === 'forbidden',
    );
    assert.deepEqual(statuses, [200, 200, 200, 403]);
    assert.equal((await handle(new Request('http://flow.test/api/flow'))).status, 405);
    const bad = await handle(
      new Request('http://flow.test/api/flow', { method: 'POST', body: '{"method":1}' }),
    );
    assert.equal(bad.status, 400);
  });

  it('工作室：发布、版本、启停只给管理员；停用后不能发起，启用后最新一版能发起', async () => {
    const { client, as } = await setup();
    const forbidden = (error: unknown) => error instanceof FlowError && error.code === 'forbidden';
    await assert.rejects(client.versions.catalog(), forbidden);
    await assert.rejects(client.publish(templates.leave()), forbidden);
    as({ id: '1000', admin: true });
    assert.deepEqual(await client.publish(templates.leave(), '改了说明'), {
      key: 'leave',
      version: 2,
    });
    const [entry] = await client.versions.catalog();
    assert.equal(entry?.key, 'leave');
    assert.equal(entry?.versions, 2);
    assert.equal(entry?.note, '改了说明');
    assert.ok(entry?.publishedAt instanceof Date);
    await client.versions.setEnabled('leave', false);
    assert.deepEqual(await client.processes(), []);
    assert.equal((await client.versions.catalog())[0]?.startable, false);
    await client.versions.setEnabled('leave', true);
    assert.deepEqual(
      (await client.versions.list('leave')).map((v) => [v.version, v.enabled]),
      [
        [2, true],
        [1, false],
      ],
    );
    assert.equal((await client.versions.rollback('leave', 1)).version, 3);
    assert.ok('process.json' in (await client.versions.project('leave')).files);
  });

  it('接口层的权限：别人的单看不到，全部异常与重试只给管理员', async () => {
    const { client, as } = await setup();
    const forbidden = (error: unknown) => error instanceof FlowError && error.code === 'forbidden';
    const { instance } = await client.run({
      type: 'start',
      process: 'leave',
      variables: { days: 1, reason: '病假' },
    });
    as({ id: '1009', name: '路人' });
    await assert.rejects(client.instance(instance.id), forbidden);
    await assert.rejects(client.incidents(instance.id), forbidden);
    await assert.rejects(client.incidents(), forbidden);
    await assert.rejects(client.retryJob(1), forbidden);
    as({ id: '1000', admin: true });
    assert.deepEqual(await client.incidents(), []);
    assert.equal((await client.instance(instance.id)).instance.id, instance.id);
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

  it('定义存进库再取出来，单据字段的先后不变（jsonb 会按键重排）', async () => {
    const { engine } = await createTestEngine();
    const manifest = {
      kind: { label: '类型', type: 'text' },
      days: { label: '天数', type: 'number' },
      to: { label: '结束', type: 'date' },
      reason: { label: '事由', type: 'text' },
    } as const;
    await engine.publish({
      ...templates.leave(),
      key: 'ordered',
      form: { key: 'ordered', manifest },
    });
    const definition = (await engine.query.processes()).find((p) => p.key === 'ordered')!;
    assert.deepEqual(Object.keys(definition.form!.manifest!), ['kind', 'days', 'to', 'reason']);
  });
});
