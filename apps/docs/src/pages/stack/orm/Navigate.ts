/** ORM：导航、对象树与 DTO（官方 navigate、include、dto-query、prop） */
import { ormChapter } from './OrmChapter';

export default ormChapter({
  meta: {
    title: 'ORM 导航与 DTO',
    description:
      '一对一、一对多、多对多与任意条件的关系；隐式 join 与子查询、对象树、视图、筛选排序、计算属性。',
  },
  official:
    'navigate/*、include/*、dto-query/*、prop/*、performance/implicit-join、other/flat-element',
  sections: [
    {
      id: 'relations',
      title: '关系',
      code: `defineSchema({ User, Company, Role, UserRole, Post }, {
  User: (r) => ({
    company: r.one('Company', { from: 'companyId', to: 'id' }, { required: true }), // required：inner join、类型不可空
    posts: r.many('Post', { from: 'id', to: 'userId' }),
    roles: r.manyToMany('Role', { through: 'UserRole', throughFrom: 'userId', throughTo: 'roleId' }),
    menus: r.path('Menu', ['roles', 'menus']),                  // 直达关系（官方 directMapping）
  }),
  Post: (r) => ({
    tags: r.manyOn('Tag', (p, t) => t.name.inCsv(p.tagNames)), // 任意条件（逗号分隔列、路径左匹配）
  }),
});`,
    },
    {
      id: 'implicit',
      title: '隐式 join 与隐式子查询',
      items: [
        '多对一、一对一的导航在条件、排序、select 里就是 join：`u.company.name`。',
        '一对多、多对多的导航上 `any` / `none` / `all` / `count` / `sum` 是子查询；`groupJoin()` 改成分组后 LEFT JOIN，代替逐行子查询。',
        '官方 flatElement：select 里 `u.roles.toList((r) => r.name)` 得到数组，where 里 `u.roles.any((r) => …)` 是"任一"。',
      ],
    },
    {
      id: 'trees',
      title: '对象树（include）',
      text: '`toList` 写在 `select` 里得到嵌套列表：每层一条 SQL 取回再拼装，可以带条件、排序、每个父行的 limit；关联键为空串时不查子项。',
      code: `db.queryable(Company).select((c) => ({
  name: c.name,
  users: c.users.where((u) => u.age.ge(18)).orderBy((u) => u.id).limit(3).toList((u) => ({
    name: u.name,
    roles: u.roles.toList((r) => r.name),
  })),
}));`,
    },
    {
      id: 'dto',
      title: 'DTO、视图与计算属性',
      items: [
        '结果形状就是 DTO 的类型，不需要生成 VO 类；常用的形状写成视图（`defineView`）复用，导航在视图里自动带出（官方 selectAutoInclude）。',
        '计算属性：`defineComputed(schema, \x27User\x27, { fullName: (u) => u.first.concat(u.last) })` 声明数据库里算的属性（跨表、CASE、拼接），select / where / orderBy / `table()` 都能用（官方 prop/*）。',
        "`filterBy(input, { name: 'like', age: 'range' })` 与 `sortBy`：规则的键与值类型由实体推出；`table(request)` 接表格请求，只认 `filterable` / `sortable` 白名单（官方 dto-query）。",
      ],
    },
  ],
});
