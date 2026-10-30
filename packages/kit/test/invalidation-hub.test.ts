// 失效推送的服务端：合并同一轮的标签、推给所有连接、重连补发与 reset、断开后不再推
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { createInvalidationHub } from '../src/invalidation-hub.ts';

/** 连上一个浏览器：返回读到的文字（攒着）与断开的函数 */
function connect(hub: ReturnType<typeof createInvalidationHub>, lastEventId?: string) {
  const abort = new AbortController();
  const headers = lastEventId ? { 'last-event-id': lastEventId } : undefined;
  const response = hub.connect(
    new Request('http://x/_invalidation', { headers, signal: abort.signal }),
  );
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let text = '';
  void (async () => {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      text += value;
    }
  })();
  return { response, read: () => text, close: () => abort.abort() };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
/** 读到的事件（不含注释）：[编号, 事件名, 数据] */
const events = (text: string) =>
  text
    .split('\n\n')
    .filter((block) => block.startsWith('id:'))
    .map((block) => {
      const field = (name: string) => block.match(new RegExp(`^${name}: ?(.*)$`, 'm'))?.[1];
      return [field('id'), field('event') ?? 'message', field('data')];
    });

describe('createInvalidationHub', () => {
  it('同一轮事件循环里 publish 的标签合成一条，推给所有连接；断开的不再收', async () => {
    const hub = createInvalidationHub();
    const a = connect(hub);
    const b = connect(hub);
    assert.equal(a.response.headers.get('content-type'), 'text/event-stream');
    await tick();
    hub.publish(['t_todo']);
    hub.publish(['t_todo', 't_user']);
    hub.publish([]);
    await tick();
    b.close();
    hub.publish(['t_city']);
    await tick();
    assert.deepEqual(
      events(a.read()).map(([, name, data]) => [name, data]),
      [
        ['message', '["t_todo","t_user"]'],
        ['message', '["t_city"]'],
      ],
    );
    assert.equal(events(b.read()).length, 1);
    a.close();
  });

  it('重连带上最后的编号：补发错过的；编号太旧或是别的启动的发 reset', async () => {
    const hub = createInvalidationHub({ history: 2 });
    const first = connect(hub);
    await tick();
    for (const tag of ['a', 'b', 'c', 'd']) {
      hub.publish([tag]);
      await tick();
    }
    first.close();
    const ids = events(first.read()).map(([id]) => id!);
    // 只保留最后两条（c、d）。收到过 b：补发 c、d
    const resumed = connect(hub, ids[1]);
    await tick();
    assert.deepEqual(
      events(resumed.read()).map(([, , data]) => data),
      ['["c"]', '["d"]'],
    );
    // 只收到过 a：b 已经不在保留范围里了
    const stale = connect(hub, ids[0]);
    // 服务端重启过（启动标记不同）
    const restarted = connect(hub, 'old-3');
    await tick();
    assert.deepEqual(
      events(stale.read()).map(([, name]) => name),
      ['reset'],
    );
    assert.deepEqual(
      events(restarted.read()).map(([, name]) => name),
      ['reset'],
    );
    for (const client of [resumed, stale, restarted]) client.close();
  });

  it('reset()：连着的收到 reset；之前的编号作废，重连时也是 reset', async () => {
    const hub = createInvalidationHub();
    const live = connect(hub);
    await tick();
    hub.publish(['a']);
    await tick();
    const [before] = events(live.read()).map(([id]) => id!);
    hub.reset();
    await tick();
    assert.deepEqual(
      events(live.read()).map(([, name]) => name),
      ['message', 'reset'],
    );
    const again = connect(hub, before);
    await tick();
    assert.deepEqual(
      events(again.read()).map(([, name]) => name),
      ['reset'],
    );
    for (const client of [live, again]) client.close();
  });
});
