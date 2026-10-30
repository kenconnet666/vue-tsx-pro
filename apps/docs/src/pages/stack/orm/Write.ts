/** ORM：写入、保存、事务与拦截器（官方 ability/insert、update、delete、batch、savable、adv） */
import { ormChapter } from './OrmChapter';

export default ormChapter({
  meta: {
    title: 'ORM 写入与保存',
    description:
      '插入、upsert、更新、删除、批量；聚合保存一棵对象树；事务、行锁、拦截器、乐观锁、逻辑删除与加密列。',
  },
  official: 'ability/insert、update、delete、batch、savable/*、adv/*、framework/behavior',
  sections: [
    {
      id: 'insert',
      title: '插入与 upsert',
      code: `const id = await db.insert(User).values({ name: 'alice', createdAt: new Date() }).returnId(); // 自增主键
await db.insert(User).values(rows).execute();          // 多行：按方言的参数上限自动分块
await db
  .insert(User)
  .values(row)
  .onConflict((u) => u.email)
  .merge((u) => [u.name, u.age])                        // MySQL ON DUPLICATE KEY、PG ON CONFLICT、SQL Server / Oracle / Db2 MERGE
  .execute();`,
    },
    {
      id: 'update',
      title: '更新与删除',
      code: `await db
  .update(Order)
  .set((o) => ({ state: 'paid', total: o.total.plus(fee) }))
  .where((o) => [o.id.eq(id), o.user.vip.eq(true)])    // 经导航的条件按方言写成 UPDATE … JOIN / FROM / EXISTS
  .expectRows(1)                                        // 改到的不是 1 行就抛错（事务里整个回滚）
  .execute();
await db.delete(Post).where((p) => p.createdAt.lt(cutoff)).execute(); // 没有条件要写 all()，防误删整表`,
      items: [
        '`changes(before, after)` 只更新变了的列；`batch` 按主键更新一批实体，按写入的列组合成少量语句。',
        '插入 / 更新的列策略（只写非 null 列等）、`insertOnly()` 列、插入与更新时的默认值都声明在列上。',
      ],
    },
    {
      id: 'save',
      title: '聚合保存',
      text: '`db.save` 保存一棵对象树：新增、按差异修改、脱钩。不需要追踪上下文：在事务里先按父键查出现有的子项再比较；保存哪些导航由带类型的 include 树决定（官方 savable/*）。',
      code: `await db.save(User, form, {
  include: {
    posts: { removed: 'delete', include: { comments: true } }, // 不在列表里的帖子删掉，评论跟着保存
    roles: true,                                                // 多对多：只维护中间表
    company: true,                                              // 多对一：先存公司，再设外键
  },
});`,
    },
    {
      id: 'tx',
      title: '事务与行锁',
      code: `await db.transaction(async (tx) => {
  if (!(await tx.lock(Account, id))) throw new NotFound(id);   // SELECT … FOR UPDATE，锁到事务结束
  await tx.update(Account).set((a) => ({ balance: a.balance.minus(amount) })).where((a) => a.id.eq(id)).execute();
  tx.afterCommit(() => notify(id));                            // 提交之后才执行
}, { isolation: 'repeatable read' });`,
      items: [
        '嵌套事务用保存点；`forUpdateSkipLocked` / `forUpdateNoWait` 按方言渲染（没有的库报错）。',
        'ClickHouse、Doris、TDengine 没有能回滚的事务：`transaction()` 里依次执行，文档里写明。',
      ],
    },
    {
      id: 'interceptors',
      title: '拦截器、乐观锁、逻辑删除、加密列',
      items: [
        '拦截器：租户隔离、更新时间、审计（`afterWrite` 的事件带插入的行、更新的值；声明 `before` 时带上改之前的行）。开关 `{ use, skip }` 在语句、Db、导航、join 上都能用，名字写错编译期报错。',
        '乐观锁：版本列 `version()`，更新、删除都带版本条件；`ignoreVersion()` 跳过。',
        '逻辑删除：`softDelete()` 列，删除变成更新、查询自动过滤；`noInterceptor(\x27softDelete\x27)` 看全部。',
        '加密列：`encrypted(aesEncryption({ key }))`（`easy-query-ts-crypto` 的 AES / SM4，与 Java 版分段加密兼容），`like` 照常可用。',
      ],
    },
  ],
});
