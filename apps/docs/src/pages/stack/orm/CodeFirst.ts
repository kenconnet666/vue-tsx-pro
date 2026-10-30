/** ORM：建表与读库结构（官方 code-first、plugin/table2entity） */
import { ormChapter } from './OrmChapter';

export default ormChapter({
  meta: {
    title: 'ORM 建表与同步',
    description: '按实体建表、对比库结构生成迁移计划、同步；由已有的表生成实体（eqts pull）。',
  },
  official: 'code-first/*、plugin/table2entity',
  sections: [
    {
      id: 'create',
      title: '建表',
      text: '列的类型、可空、默认值、注释、索引、外键都写在实体上，`createTables` 建库里还没有的表（已有的不动）。各方言的类型映射见各自的方言页。',
      code: `const Post = entity(
  't_post',
  {
    id: col.bigint().primaryKey().generated(),
    title: col.string(200).comment('标题'),
    amount: col.decimal(12, 2),
    userId: col.bigint(),
  },
  { comment: '帖子', indexes: [{ columns: ['userId', 'id'], name: 'ix_post_user' }] },
);
await db.createTables();                 // 建缺的表，连同注释、索引、外键
console.log(db.createTableSql(Post));    // 只看 SQL`,
    },
    {
      id: 'sync',
      title: '对比与同步',
      code: `const plan = await db.planSync();   // { statements, differences }：建缺的表、加缺的列与索引、改名（renamedFrom）
console.log(plan.differences);       // 不会自动改的差异：类型、可空性变化等，留给人决定
await db.syncTables();               // 执行 plan.statements（能放进事务的库在事务里执行）`,
      items: [
        "列改名写 `renamedFrom('old_name')`，同步时是改名而不是删了再加。",
        '分表的实体按规则建出全部表（按时间的建到 `to` 为止）。',
      ],
    },
    {
      id: 'pull',
      title: '由表生成实体',
      text: '已有的库（例如从 Java 迁过来的表）不用手写一遍实体：`eqts pull --adapter ./db-adapter.ts --out src/schema.ts` 读库结构，生成 `entity()` 与带导航的 `defineSchema`；生成的实体与库再 `planSync` 一次是空计划。认不得的类型用 `.dbType(…)` 原样保留。',
    },
    {
      id: 'generated',
      title: '生成列与索引的写法',
      text: '`generatedAs(sql, { stored })` 是库算出来的列（写入时不能给值）；索引可以写 `using`（PG 的 GIN 等）、`where`（部分索引）、`expressions`（表达式索引，MySQL 的多值索引也靠它），方言不支持的写法建表时报错。',
      code: `total: col.int().generatedAs('qty * price'),
// 实体选项
indexes: [
  { columns: ['attrs'], using: 'gin', name: 't_line_attrs_gin' },
  { expressions: ['lower(sku)'], name: 't_line_lower_sku_idx' },
],`,
    },
    {
      id: 'migrate',
      title: '迁移历史',
      text: '生产环境用迁移代替 syncTables：`eqts migrate generate` 对开发库算 planSync 写成迁移文件（可以手改），`eqts migrate up` 或 `db.migrate(migrations)` 按顺序执行还没执行过的，记进历史表；已经执行过的迁移被改了直接报错。',
      code: `export default defineMigration({
  id: '20261030083000_add_orders',
  up: ['CREATE TABLE "t_order" (…)'],
});
await db.migrate([m1, m2]); // 返回这次执行的 id`,
    },
    {
      id: 'snapshots',
      title: 'SQL 快照',
      text: '把关心的查询声明成快照，`eqts snapshot` 不连库按每个方言渲染成 `.sql` 文本提交进仓库，评审时看 SQL 的差异；CI 里加 `--check`，快照没更新就失败。方言不支持的写法写成一行 error，同样进差异。',
      code: `export default defineSnapshots({
  schema,
  dialects: { pg: new PostgresDialect(), mysql80: new MySqlDialect({ version: '8.0.18' }) },
  queries: { adults: (db) => db.queryable(User).where((u) => u.age.ge(18)) },
});
// eqts snapshot src/queries.snap.ts --out sql-snapshots [--check]`,
    },
  ],
});
