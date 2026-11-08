# 服务端部署

流程引擎（`@zerodep-dev/flow-ts-engine`）跑在服务端，库是 PostgreSQL（14 以上；CI 用 17，测试与浏览器演示用 PGlite）。
页面只经客户端（`flow-ts-engine/client`）调用，身份由服务端的端点按会话定。接法的完整例子在文档站 Flow 页的“服务端接入”。

## 1. 表

引擎的表（`flow_*`）与组织目录的表（`org_*`，用组织目录时）由 easy-query 的实体定义：

- 开发、演示：`await directory.createTables(); await engine.createTables();`——只建缺的表，**不补列**。
- 生产：用 easy-query 的迁移。`engine.db.createTablesSql()` 给出建表语句，`eqts migrate generate` 按实体与库的差异生成迁移，
  `db.migrate(migrations)` 按顺序执行没执行过的（每条连同历史记录一个事务）。引擎升级加了表、列时照此生成一条迁移。

这一版新加的：`flow_notification`（通知）、`flow_proxy`（代理）、`flow_work_item.proxy_for`（列）。

## 2. 引擎与端点

```ts
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = postgres(pool);
const directory = createOrgDirectory({ adapter, isAdmin: (e) => e.roles.includes('admin') });
const engine = createFlowEngine({
  adapter,
  org: directory.org,
  extensions: { resolvers: directory.resolvers, actions }, // 自动节点的动作
  modules: { '@app/erp': { load: () => import('./erp'), types: erpTypes } }, // 流程代码能 import 的宿主模块
  transform, // 流程工程的 .ts 怎么编（flow-ts-studio）
  checkTypes, // 发布前的类型检查（flow-ts-studio/typecheck）
  notifications: { deliver: (n) => sendMail(n) }, // 外部投递；不给时只有站内信箱
  admins: ['1'], // 解析不出处理人时交给谁
});
const endpoint = flowEndpoint<Request>(engine, { actor: (request) => actorOfSession(request) });
export const handleFlow = flowHttpHandler(endpoint); // Web 标准的 Request / Response
```

- 宿主模块的 `types` 是给类型检查与工作室编辑器的声明（`declare module '@app/erp' { … }`）；流程代码在宿主里直接执行，
  只有管理员能发布（信任模型见 decisions/0002）。
- 守卫、动作在推进的事务里执行：读业务数据用自己的连接池即可；PGlite 只有一条连接，那里要读内存快照（同组织目录）。

## 3. 作业

时限、提醒、异步动作、调用流程、没送出去的通知都是作业。定时调用 `engine.jobs.runDue()`（几秒到一分钟一次）：
多个进程同时调用时靠 `FOR UPDATE SKIP LOCKED` 各抢各的，租约过期的可以再抢，不会重复执行。失败的作业进异常，
管理员在页面上重试或跳过（`engine.retryJob`、`skipJob` 命令）。

## 4. 多实例：广播

推进、作业、发布、启停随提交 `NOTIFY` 频道 `FLOW_CHANNEL`；组织目录改了发 `ORG_CHANNEL`（decisions/0010 第 2 节）。每个进程：

```ts
await listen(pool, FLOW_CHANNEL, () => hub.publish(['flow'])); // 推给自己的页面（kit 的失效推送）
await listen(pool, ORG_CHANNEL, () => void directory.refresh()); // 别的进程改了组织：刷新本进程的快照
endpoint.onChange(() => hub.publish(['flow'])); // 本进程不经引擎的写（已读、草稿）
```

`listen` 占一条专用连接，断了不会自动重连：连接池报错时重新 `listen`。负载只是提示，收到后按各自的权限重新查询。

## 5. 组织

有 HR 系统时定时 `directory.sync(从 HR 拉的数据)`（整份替换，一个事务）；管理页的零星修改用 `saveEmployee` 等。
引擎读的是组织目录的内存快照：经目录改的会自动刷新并广播，绕过目录直接改表要调 `refresh()`。
