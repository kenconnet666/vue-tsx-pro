/**
 * 前端缓存的失效推送（只在服务端）：写入经 tableChanges 发进消息通道，通道上的消息由 hub 经 SSE 推给连着本实例的浏览器。
 * 示例是单实例，通道用进程内的 memoryTransport；多实例部署换成 pgTransport(pool) 或 redisTransport，别的不用改
 */
import { createBus, memoryTransport } from '@zerodep-dev/easy-query-ts-cache';
import { createInvalidationHub } from '@zerodep-dev/vue-tsx-pro-kit/server';

export const bus = createBus(memoryTransport());
export const hub = createInvalidationHub();

await bus.subscribe(
  (message) => hub.publish(message.tables),
  () => hub.reset(),
);
