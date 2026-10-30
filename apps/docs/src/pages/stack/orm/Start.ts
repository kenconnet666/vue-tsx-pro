/** ORM：快速开始（官方 quick-start、startup、what-is-easy-query） */
import { ormChapter } from './OrmChapter';

export default ormChapter({
  meta: {
    title: 'ORM 快速开始',
    description: '安装、定义实体与关系、建 Db、第一条查询；连库时自动读服务器版本选写法。',
  },
  official: 'quick-start、startup/step1–5、what-is-easy-query、feature-map',
  sections: [
    {
      id: 'install',
      title: '安装',
      text: '核心包 `@zerodep-dev/easy-query-ts` 不依赖任何驱动；按数据库再装一个方言包和它的驱动（驱动是 peer 依赖，版本由项目自己定）。',
      code: `pnpm add @zerodep-dev/easy-query-ts @zerodep-dev/easy-query-ts-mysql mysql2
# PostgreSQL：-pg + pg；SQL Server：-mssql + mssql；Oracle：-oracle + oracledb；SQLite：-sqlite（node:sqlite）`,
      file: 'shell',
    },
    {
      id: 'entities',
      title: '实体与关系',
      text: '实体就是列的声明（对应官方的 `@Table` / `@Column` 注解），关系写在 `defineSchema` 的第二个参数里。不需要 APT、代理类或 DTO 生成：查询结果的类型由 `select` 的形状推出。',
      code: `import { col, createDb, defineSchema, entity } from '@zerodep-dev/easy-query-ts';

export const User = entity('t_user', {
  id: col.bigint().primaryKey().generated(),
  name: col.string(50).comment('姓名'),
  age: col.int().nullable(),
  companyId: col.bigint().nullable(),
  createdAt: col.datetime(),
});
export const Company = entity('t_company', { id: col.bigint().primaryKey().generated(), name: col.string() });

export const schema = defineSchema(
  { User, Company },
  {
    User: (r) => ({ company: r.one('Company', { from: 'companyId', to: 'id' }) }),
    Company: (r) => ({ users: r.many('User', { from: 'id', to: 'companyId' }) }),
  },
);`,
      file: 'schema.ts',
    },
    {
      id: 'brand',
      title: '带品牌的主键与外键',
      text: '`col.bigint().brand<\x27UserId\x27>()` 让值类型带上品牌：UserId 与 OrderId 不能混传，关系的 from / to 品牌对不上在定义处就报错。品牌只在类型里，运行时就是原来的值。',
      code: `const Order = entity('t_order', {
  id: col.bigint().primaryKey().generated().brand<'OrderId'>(),
  customerId: col.bigint().brand<'CustomerId'>(),
});
db.queryable(Order).where((o) => o.customerId.eq(orderId)); // 类型错误：OrderId 不是 CustomerId`,
    },
    {
      id: 'modules',
      title: '按模块组合 schema',
      text: '大项目按模块各写一份 `defineSchema`，模块之间互不 import：`mergeSchemas` 在入口合成一份，跨模块的关系写在第二个参数里；`db.mount` 在运行时给已有的 Db 再挂一组，共用连接与事务。实体键或导航重名在调用处就报类型错误，错误里写出是哪个。',
      code: `export const schema = mergeSchemas([accounts, content], {
  Post: (r) => ({ author: r.one('User', { from: 'userId', to: 'id' }) }),
  User: (r) => ({
    posts: r.many('Post', { from: 'id', to: 'userId' }),
    comments: r.path('Comment', ['posts', 'comments']), // 直达关系可以经过别的模块的导航
  }),
});

// 插件、按需加载的模块：挂到已有的 Db 上，事务里的 tx 也能挂
const all = db.mount(billing, { Invoice: (r) => ({ customer: r.one('User', { from: 'userId', to: 'id' }) }) });`,
      file: 'app/db.ts',
    },
    {
      id: 'db',
      title: '建 Db：一套代码部署到不同版本',
      text: '`mysql.detect` / `mssql.detect` / `oracle.detect` 连上库读出服务器版本再建 adapter：同一份代码部署到 MySQL 8.0.18 还是 8.4、SQL Server 2012 还是 2022，都自动选对写法；只在旧写法被弃用、旧版本没有该能力（渲染时报出最低版本）、新旧语义差别大时才按版本分支。',
      code: `import { createPool } from 'mysql2/promise';
import { mysql } from '@zerodep-dev/easy-query-ts-mysql';

export const db = createDb({
  schema,
  adapter: await mysql.detect(createPool({ uri: process.env.DATABASE_URL, timezone: 'Z' })),
  log: (s) => logger.debug(s.sql, s.params),
});`,
      file: 'db.ts',
    },
    {
      id: 'first-query',
      title: '第一条查询',
      code: `const adults = await db
  .queryable(User)
  .where((u) => [u.age.ge(18), u.company.name.like('acme')]) // 经导航就是隐式 join
  .orderBy((u) => u.createdAt.desc())
  .select((u) => ({ id: u.id, name: u.name, company: u.company.name }))
  .toPage(1, 20);
// adults: { rows: { id: number; name: string; company: string | null }[]; total: number }`,
      file: '查询',
      items: [
        '条件写在 lambda 里，数组就是 AND；`undefined` 的条件被忽略（官方的条件短路）。',
        '`toList`、`single`、`find` / `findOrThrow`、`count`、`any`、`toPage`、`stream` 是终结方法。',
        '与官方的逐条对照见仓库 `packages/easy-query/docs/parity-docs.md`（文档页）与 `parity-tests.md`（单元测试）。',
      ],
    },
  ],
});
