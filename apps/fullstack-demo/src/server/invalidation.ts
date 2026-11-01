/**
 * 前端缓存的失效推送（只在服务端）：写入提交后报出改了的表，hub 经 SSE 推给连着本实例的浏览器。
 * 示例是单实例；多实例部署时把表名经自己的消息通道发给所有实例，各实例收到后调 hub.publish，通道断过时调 hub.reset
 */
import type { Interceptor } from '@zerodep-dev/easy-query-ts';
import { createInvalidationHub } from '@zerodep-dev/vue-tsx-pro-kit/server';

declare module '@zerodep-dev/easy-query-ts' {
  interface InterceptorNames {
    /** 写入后报出改了的表 */
    tableChanges: true;
  }
}

export const hub = createInvalidationHub();

/** 经 ORM 的每次写入在提交之后报出表名；回滚的不报 */
export const tableChanges: Interceptor = {
  name: 'tableChanges',
  afterWrite(event) {
    event.afterCommit(() => hub.publish([event.entity.table]));
  },
};
