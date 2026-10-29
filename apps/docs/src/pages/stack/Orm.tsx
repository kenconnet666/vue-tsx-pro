/**
 * 全栈：ORM（@zerodep-dev/easy-query-ts）。实体与导航、lambda 里写条件、隐式子查询、对象树结果、DTO、树，与组件库的表格对接
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeBlock, H2, List, ListItem, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../site/DocPage';

const meta = {
  title: 'ORM easy-query TS',
  description:
    'easy-query 的 TS 版：实体与导航、lambda 里写条件、隐式 join 与子查询、对象树结果，结果类型全由 TS 推导；SQLite、MySQL、PostgreSQL、SAP HANA。',
};

const entities = `import { col, createDb, defineSchema, entity } from '@zerodep-dev/easy-query-ts';
import { mysql } from '@zerodep-dev/easy-query-ts-mysql';

const User = entity('t_user', {
  id: col.bigint().primaryKey().generated(),
  name: col.string(),
  companyId: col.bigint().nullable(),
});
const Company = entity('t_company', { id: col.bigint().primaryKey().generated(), name: col.string() });

const schema = defineSchema(
  { User, Company },
  {
    User: (r) => ({ company: r.one('Company', { from: 'companyId', to: 'id' }) }),
    Company: (r) => ({ users: r.many('User', { from: 'id', to: 'companyId' }) }),
  },
);
export const db = createDb({ schema, adapter: mysql(pool) });`;

const queries = `// 隐式子查询：有名字以 a 开头的员工的公司；对象树结果，类型自动推出
const rows = await db
  .queryable(Company)
  .where((c) => c.users.any((u) => u.name.startsWith('a')))
  .select((c) => ({
    name: c.name,
    users: c.users.orderBy((u) => u.id).toList((u) => ({ id: u.id, name: u.name })),
  }))
  .toList();
// rows: { name: string; users: { id: number; name: string }[] }[]

// 按主键：find / findOrThrow；隐式 join：u.company.name
const card = await db.queryable(User).select((u) => ({ id: u.id, company: u.company.name })).findOrThrow(1);`;

const table = `// 组件库的 QueryTable / useTableQuery 发来的请求（页码、排序、筛选条件树）直接交给 table()
// 能筛选、排序的只有 select 里的列（白名单）
export const loaders = defineLoaders({
  '/users': ({ query }) =>
    db
      .queryable(User)
      .select((u) => ({ id: u.id, name: u.name, company: u.company.name }))
      .table(parseTableRequest(query)),
});`;

const writes = `await db.transaction(async (tx) => {
  if (!(await tx.lock(Account, id))) throw new NotFound(id);   // 锁住这一行到事务结束
  await tx
    .update(Order)
    .set({ state: 'paid' })
    .where((o) => [o.id.eq(orderId), o.state.eq('open')])
    .expectRows(1, () => new AlreadyPaid(orderId))            // 改到的不是 1 行：抛错、整个回滚
    .execute();
  tx.afterCommit(() => mailer.send(orderId));                  // 提交之后才发
});`;

const advanced = `// 值对象：几列合成一个嵌套对象，库里是 address_city 这样的列
const Shop = entity('t_shop', {
  id: col.int().primaryKey().generated(),
  address: embed({ city: col.string(), street: col.string().nullable() }),
});

// 直达关系：经角色到菜单，用法同一对多；经几条路径到达同一个菜单只算一次
User: (r) => ({ menus: r.path('Menu', ['roles', 'menus']) }),

db.queryable(User).select((u) => ({
  name: u.name,
  menus: u.menus.toList((m) => m.title),
  // 分组 join：子表分组一次再 LEFT JOIN，代替每行一个子查询
  posts: u.posts.groupJoin().count(),
  // 按键填充：不用声明关系，查询可以来自另一个库
  badges: badgeDb.queryable(Badge).select((b) => b.label).fillMany((b) => b.userName, u.name),
}));

// 右连接：此前各表的列在类型上变成可空
db.queryable(User).rightJoin(Company, (u, c) => c.id.eq(u.companyId));

// 列值在库里转换：读写都包一层库函数，like、排序照常可用
phone: col.string().sqlConvert({
  read: (c) => sql<string>\`AES_DECRYPT(\${c}, \${key})\`,
  write: (v) => sql<string>\`AES_ENCRYPT(\${v}, \${key})\`,
}),

// 换 schema：归档库、按租户分库
const archived = db.inSchema('archive_2025');`;

export default _component(() => () => (
  <DocPage meta={meta}>
    <H2 id="entities" size="xl" anchor>
      实体与导航
    </H2>
    <Paragraph>
      实体是列的声明，导航（一对一、一对多、多对多）写在 <Code>defineSchema</Code>{' '}
      的第二个参数里。不需要代码生成：查询结果的类型从 <Code>select</Code> 的形状推出来。
    </Paragraph>
    <CodeBlock title="db.ts" code={entities} lang="ts" />
    <H2 id="queries" size="xl" anchor>
      条件、隐式 join 与子查询、对象树
    </H2>
    <Paragraph>
      条件写在 lambda 里，经导航就是隐式 join（一对一）或隐式子查询（一对多的 <Code>any</Code>、
      <Code>none</Code>、<Code>count</Code>）。<Code>toList</Code> 写在 <Code>select</Code>{' '}
      里得到对象树：子列表一条 SQL 取回再拼装。
    </Paragraph>
    <CodeBlock title="查询" code={queries} lang="ts" />
    <H2 id="table" size="xl" anchor>
      接表格：分页、排序、筛选
    </H2>
    <Paragraph>
      组件库的 <Code>QueryTable</Code> 发来的请求（页码、排序、条件树、区间）由{' '}
      <Code>parseTableRequest</Code> 解析、
      <Code>table()</Code> 执行，只认登记过的列，别的字段名进不来。
    </Paragraph>
    <CodeBlock title="loaders.ts" code={table} lang="ts" />
    <H2 id="writes" size="xl" anchor>
      写入与事务
    </H2>
    <CodeBlock title="事务" code={writes} lang="ts" />
    <List>
      <ListItem>
        <Code>lock</Code>：有行锁的库是 <Code>SELECT … FOR UPDATE</Code>，SQLite
        写成把主键写回自己的 UPDATE。
      </ListItem>
      <ListItem>
        <Code>afterCommit</Code> / <Code>afterRollback</Code>：保存点里登记的跟着保存点走。
      </ListItem>
      <ListItem>
        拦截器：<Code>tenant</Code>（按租户隔离）、<Code>touch</Code>
        （更新时间）、逻辑删除、乐观锁的版本列。
      </ListItem>
    </List>
    <H2 id="advanced" size="xl" anchor>
      值对象、直达关系、分组 join、按键填充
    </H2>
    <Paragraph>
      Java 版里靠注解和插件做的几件事，在 TS 版里都写在定义或查询里，结果类型照样自动推出。
    </Paragraph>
    <CodeBlock title="进阶" code={advanced} lang="ts" />
    <List>
      <ListItem>
        <Code>embed</Code> 对应 <Code>@ValueObject</Code>，<Code>r.path</Code> /{' '}
        <Code>r.pathOne</Code> 对应 <Code>directMapping</Code>，<Code>groupJoin()</Code> 对应{' '}
        <Code>subQueryToGroupJoin</Code>，<Code>fillMany</Code> / <Code>fillOne</Code> 同名。
      </ListItem>
      <ListItem>
        <Code>sqlConvert</Code> 对应 <Code>ColumnValueSQLConverter</Code>，<Code>inSchema</Code>{' '}
        对应 <Code>asSchema</Code>。
      </ListItem>
    </List>
    <H2 id="dialects" size="xl" anchor>
      方言
    </H2>
    <Paragraph>
      <Code>@zerodep-dev/easy-query-ts-sqlite</Code>（node:sqlite）、<Code>-mysql</Code>（8.0.18
      起）、<Code>-pg</Code>（12 起）、
      <Code>-hana</Code>（HANA 2.0）。方言专属的函数用静态入口按列包装（
      <Code>MySQL.json(u.attrs)</Code>），用错方言在写的时候就报错。与 Java 版的对照见仓库里的{' '}
      <Code>packages/easy-query/docs/parity.md</Code>。
    </Paragraph>
  </DocPage>
));
