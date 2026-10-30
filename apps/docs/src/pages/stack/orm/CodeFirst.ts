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
  ],
});
