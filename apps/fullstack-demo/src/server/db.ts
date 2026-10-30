/**
 * 示例的数据库（只在服务端）：node:sqlite 的内存库，启动时建表、放几条数据。
 * 按租户隔离交给 easy-query 的 tenant 拦截器：读、改、删自动带上当前请求的租户，插入自动补上；
 * 写入在提交后经 tableChanges 报出表名，浏览器里的缓存按表名失效（server/invalidation.ts）
 */
import { DatabaseSync } from 'node:sqlite';
import { col, createDb, defineSchema, entity, tenant } from '@zerodep-dev/easy-query-ts';
import { tableChanges } from '@zerodep-dev/easy-query-ts-cache';
import { sqlite } from '@zerodep-dev/easy-query-ts-sqlite';
import { useContext } from './context.ts';
import { bus } from './invalidation.ts';

/** 当前请求的租户；没登录的请求碰到按租户隔离的表时报错，而不是查出所有租户的数据 */
function currentTenant(): string {
  const { tenant: current } = useContext();
  if (!current) throw new Error('没登录：按租户隔离的数据要先登录');
  return current;
}

export const Todo = entity('t_todo', {
  id: col.bigint().primaryKey().generated(),
  // 插入时不用写：取当前请求的租户（查询、改、删的条件由下面的 tenant 拦截器加）
  tenantId: col.string().$default(() => currentTenant()),
  title: col.string(),
  done: col.boolean(),
});

export const schema = defineSchema({ Todo });

export const db = createDb({
  schema,
  adapter: sqlite(new DatabaseSync(':memory:')),
  interceptors: [tenant('tenantId', () => currentTenant()), tableChanges(bus)],
});

await db.createTables();
await db
  .insert(Todo)
  .values([
    { tenantId: 'acme', title: '整理采购台账', done: false },
    { tenantId: 'acme', title: '核对三月发票', done: true },
    { tenantId: 'globex', title: '准备季度汇报', done: false },
  ])
  // 写明了 tenantId：拦截器不补值，启动时不在请求里也没关系
  .execute();
