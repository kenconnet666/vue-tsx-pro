/** ORM：查询（官方 ability/select、sub-query、native-sql、performance） */
import { ormChapter } from './OrmChapter';

export default ormChapter({
  meta: {
    title: 'ORM 查询',
    description: '条件、排序、分页、分组、联合、CASE、窗口、子查询、CTE、原生 SQL 与深分页。',
  },
  official: 'ability/select/*、ability/where、sub-query/*、native-sql、performance/deep-page',
  sections: [
    {
      id: 'where',
      title: '条件、排序、分页',
      code: `db.queryable(User)
  .where((u) => [
    u.name.startsWith(keyword),                   // keyword 为 undefined 时这条被忽略
    or(u.age.lt(18), u.age.isNull()),
    u.id.in(db.queryable(Order).select((o) => o.userId)),  // IN 子查询
  ])
  .orderBy((u) => [u.age.desc(), u.id])
  .offset(20)
  .limit(10)
  .toList();`,
    },
    {
      id: 'group',
      title: '分组、聚合、HAVING、ROLLUP',
      code: `db.queryable(Post)
  .groupBy((p) => ({ userId: p.userId }))
  .having((g) => g.count().gt(1))
  .select((g) => ({
    userId: g.key.userId,
    total: g.sum((p) => p.amount),
    titles: g.joining((p) => p.title, { separator: '、' }),
  }))
  .toList();`,
      items: [
        '`rollup()` / `cube()` 按方言渲染（MySQL 是 `WITH ROLLUP`）。',
        '`union` / `unionAll` 的各成员形状由类型检查。',
      ],
    },
    {
      id: 'window',
      title: 'CASE 与窗口函数',
      code: `db.queryable(Post).select((p) => ({
  level: caseWhen(p.amount.ge('100'), 'high').when(p.amount.ge('10'), 'mid').else('low'),
  rank: win.rowNumber((w) => w.partitionBy(p.userId).orderBy(p.amount.desc())),
  running: win.sum(p.amount, (w) => w.partitionBy(p.userId).orderBy(p.id)),
}));`,
    },
    {
      id: 'subquery',
      title: '子查询、派生表、CTE、递归',
      items: [
        'select 里的相关子查询；一对多导航上的 `any` / `none` / `count` 是隐式子查询；`asTable()` 把一条查询当成表 join（派生表的列带类型）。',
        '`descendantsOf` / `ancestorsOf` 走递归 CTE，`toTree` 拼成树。子查询里的 `WITH` 在 SQL Server、Oracle、Db2 上自动提到语句开头。',
        '派生表条件穿透：外层的条件推进子查询（有窗口、分组时不推）。',
      ],
    },
    {
      id: 'native',
      title: '原生 SQL 与片段',
      code: `const rows = await db.sql<{ id: number }>\`SELECT id FROM t_user WHERE name = \${name}\`; // 值都绑定成参数
await db.sql.execute\`TRUNCATE TABLE \${db.sql.ident('t_log')}\`;
db.queryable(User).where((u) => sql<boolean>\`\${u.name} REGEXP \${pattern}\`);`,
    },
    {
      id: 'deep-page',
      title: '深分页',
      text: '`reversePageAfter(n)`：偏移超过总数的一半时倒序取再翻回来（官方 performance/deep-page）。',
    },
  ],
});
