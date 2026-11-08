/**
 * 广播的频道（PG 的 NOTIFY，docs/decisions/0010 第 2 节）：引擎在推进、发布的事务里发，随提交发出、回滚就不发。
 * 多实例部署时各进程收听它们，别的进程的改动也能推给自己的页面、刷新自己的组织快照：
 *
 *   import { listen } from '@zerodep-dev/easy-query-ts-pg';          // PGlite 用 easy-query-ts-pg/pglite 的 listen
 *   await listen(pool, FLOW_CHANNEL, () => endpoint.changed());
 *   await listen(pool, ORG_CHANNEL, () => directory.refresh());
 */

/** 流程的数据变了（推进、作业、发布、启停）：负载是 JSON，推进时带着实例编号 `{ "instance": 12 }` */
export const FLOW_CHANNEL = 'flow_changed';

/** 组织变了（组织目录的 sync、save*、removeDepartment） */
export const ORG_CHANNEL = 'flow_org_changed';
