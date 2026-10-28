# 0001 纯 TS 流程引擎的设计

- 状态：已定（2026-10-29，无人值守按 ROADMAP“自主执行的规矩”定下；有分歧的点记进 ROADMAP 的“待决”）
- 输入：`flow`（Java 版，只读）的决定文档 0001–0008、`spec/` 的用例、TS 模型包；本仓库 FULLSTACK.md §7

## 1. 定位

审批流程引擎，比 `flow` 的 Java 版更简洁、更容易接入、自由度更高。只有一个后端（TS，跑在 Nitro 或任何 Node 服务里），
持久层直接用本仓库的 easy-query TS，前端用本仓库的组件库。

照搬 Java 版验证过、与语言无关的部分：

- 模型是图（节点 + 连线，BPMN 子集），定义发布后不可变，实例按发起时的版本走完；
- 一次命令一个事务，第一条语句锁住实例行，并发会签不会卡死；提交待办用带状态条件的更新，改到 0 行就是“已被处理”；
- 定时、超时、提醒、异步的自动节点都进一张作业表，用带条件的 UPDATE 抢占（不用 `SKIP LOCKED`）；
- `spec/` 里语言无关的用例（条件、选边、值、定义校验、权限、差异、场景）当验收。

变简单的地方：

| Java 版                                      | 这里                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| 门面 83 个方法 + 31 个命令类                 | 命令是可辨识联合，只有一个入口 `engine.run(command, actor)`             |
| 23 个扩展接口 + 9 个数据类                   | 一个 `extensions` 选项对象，值是函数，参数用 Standard Schema（zod）声明 |
| 模型 Java、TS 各写一遍，清单（manifest）对齐 | 一份 TS 模型包，前后端共用                                              |
| 存储接口 + 手写存储层                        | easy-query 的实体与查询，结果类型自动推导                               |
| 表单后端代码运行时编译（javax.tools）        | 表单的校验与计算就是 TS 函数（zod schema 两端共用）                     |
| 两个后端同一份语义的场景对齐                 | 只有一个后端；场景用例写一个适配器按新接口跑                            |

## 2. 能力分级（第一版做核心与常用）

| 分级 | 内容                                                                                                                                                                                                                                     | 第一版                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 核心 | 发布与校验（草稿、版本）；发起、认领、处理（通过、驳回、退回、终止）、撤回；人工节点、排他 / 并行 / 包容网关、结束（含终止结束）；处理人解析；待办、已办、实例详情与流转记录                                                             | 做                     |
| 常用 | 会签（全部、任一、比例、依次）；转办、改派、跳转；退回到指定节点、退回后直接回到退回者；抄送；催办；时限、超时（标记、自动处理）、提醒；自动节点（同步、异步可重试）；调用流程（同步）；定时等待；等待外部事件；管理员终止、改派；工作日 | 做                     |
| 边角 | 委派（代理处理再交回）、加签与减签、票签权重与 `votes`、提级、调用流程的 `forEach` 与异步、撤回这一步、发件箱、归档、统计、休假代理、自定义节点类型                                                                                      | 不做，真实应用要了再加 |

不做的在定义里写了，发布时校验报“这一版不支持”，不静默忽略。

## 3. 定义格式

### 3.1 数据：沿用 Java 版的图

`ProcessDefinition` 的字段与 Java 版的模型包相同（节点、连线、泳道、变量、设置、布局），设计器与代码读写同一份 JSON。
去掉的：`schema` 之外的格式迁移、清单（manifest）。第一版不支持的节点字段见第 2 节。

### 3.2 写法：`defineProcess` 推导类型

```ts
export const purchase = defineProcess({
  key: 'purchase',
  name: '采购申请',
  variables: z.object({ amount: z.number(), supplier: z.string() }),
  nodes: [
    { id: 'start', type: 'start', name: '发起' },
    { id: 'manager', type: 'task', name: '部门经理', assignees: [{ resolver: 'deptLeader' }],
      outcomes: [{ key: 'approve', label: '同意' }, { key: 'reject', label: '驳回', kind: 'reject' }] },
    { id: 'end', type: 'end', name: '结束' },
  ],
  edges: [ … ],
});
```

- `const` 类型参数推出节点标识、每个人工节点的结果、变量的类型：`engine.run({ type: 'complete', item, outcome: 'aprove' })`
  在拿到带类型的流程时（`engine.process(purchase)`）写错是编译错误。
- `variables` 是 Standard Schema（zod）：发起与改变量时运行时校验；存库时转成 JSON Schema 无关的简单声明（设计器读）。
- 从库里、设计器来的定义一律按 `validateProcess` 在运行时校验，类型只帮写代码的人。

### 3.3 逻辑：条件树、按名字引用扩展、流程自带的 TS

三层，从简单到自由：

1. **条件树**（`{ field, op, value }` 与 all / any / not，同组件库的 `ConditionBuilder`）：业务人员在设计器里配；
2. **按名字引用接入方注册的扩展**（`resolver`、`guards`、`action`、`fn.名字`）：接入方在代码里注册，名字靠声明合并有补全；
3. **流程自带的 TS 模块**（`code` 字段，第 14.8 步做）：受信任的管理员在设计器里写 TS，发布时编译成 JS 与定义一起存（按版本不可变），
   引擎在宿主进程里直接执行（已定的决定第 7 条：不做沙箱）。模块导出的函数与注册的扩展同名同形，定义里写 `code.名字` 引用。

## 4. 表（easy-query 实体）

| 表                | 作用                                                        |
| ----------------- | ----------------------------------------------------------- |
| `flow_definition` | 已发布的版本，一行一个版本，定义整份存 JSON                 |
| `flow_draft`      | 草稿，可以反复改，发布时变成一个版本                        |
| `flow_instance`   | 实例：状态、当前节点、流程变量（JSON）、`rev`（锁实例行用） |
| `flow_work_item`  | 待办，单表加状态（open、done、canceled）                    |
| `flow_candidate`  | 谁能认领（候选人、候选组）                                  |
| `flow_event`      | 流转记录，只追加                                            |
| `flow_job`        | 作业：定时、时限、提醒、异步自动节点、无人认领兜底          |
| `flow_cc`         | 抄送与已读                                                  |

主键自增，时间 UTC，JSON 列接 Standard Schema。租户用 easy-query 的 `tenant` 拦截器（接入方给 `tenantId` 时）。
工作日历第一版是一个选项（默认周一到周五），不建表。

## 5. 接口

```ts
const engine = createFlowEngine({
  db, // easy-query 的 Db（实体由引擎提供：flowSchema 合进接入方的 schema）
  org, // 组织：用户、角色、部门到人，部门负责人
  extensions: { resolvers, guards, actions, functions },
  calendar, // 工作日，可选
  clock, // 时钟，测试用假时钟
  on: { 'item.arrived': notify }, // 监听：提交后执行
});

await engine.run({ type: 'start', process: 'purchase', variables: { amount: 120 } }, actor);
await engine.run({ type: 'complete', item, outcome: 'approve', comment: '同意' }, actor);
await engine.query.todo(actor, { page: 1 });
await engine.jobs.runDue({ limit: 20 }); // Nitro 的定时任务或接入方自己定时调用
```

- **一个入口**：命令是 `{ type, … }` 的可辨识联合；拦截（`before`）、权限、审计、HTTP 路由都只对一个入口。
- **六类扩展点**：谁来处理（`resolvers`、`org`）、能不能过（`guards`、`before`）、自动做什么（`actions`）、算一个值（`functions`）、
  发生了什么（`on`，事务内或提交后）、怎么显示（查询的摘要列）。
- **事务**：每个命令 `db.transaction`，第一条语句锁实例行（easy-query 补 `lock`，见第 6 节）；监听默认在提交后执行（easy-query 补 `afterCommit`）。
- **错误**：`FlowError`，带代号（`not-found`、`already-handled`、`forbidden`、`invalid-definition`、`invalid-input`……），HTTP 适配器按代号给状态码。

## 6. easy-query 要补的（14.3）

| 能力                                   | 用在哪                           |
| -------------------------------------- | -------------------------------- |
| `tx.afterCommit(fn)` / `afterRollback` | 提交后的监听、通知               |
| 锁住一行：`tx.lock(Entity, id)`        | 每个命令先锁实例行，按方言选写法 |
| 受影响行数的断言 `expectRows`          | 提交待办、抢作业的带条件更新     |

## 7. 包与目录

| 包                            | 目录                   | 内容                                                                                               |
| ----------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/flow-ts-model`  | `packages/flow/model`  | 定义的类型与 `defineProcess`、条件、值、图索引、选边、校验、表单权限、差异；两端通用，零运行时依赖 |
| `@zerodep-dev/flow-ts-engine` | `packages/flow/engine` | 引擎、实体、作业、模拟器与 `createTestEngine()`；依赖 model 与 easy-query                          |
| `@zerodep-dev/flow-ts-ui`     | `packages/flow/ui`     | 流程图、设计器、审批面板；依赖 model 与组件库（14.8）                                              |

npm 上 `@zerodep-dev/flow-model`、`flow-ui` 是 `flow` 仓库的包，这里加 `-ts`（同 easy-query 的命名）。
分层：model 不依赖 vue 与 easy-query；engine 不依赖 vue；ui 不依赖 easy-query 与 engine 的运行时（只用类型）。

## 8. 验收

- `spec/` 的纯函数用例（条件、选边、值、定义校验、权限、差异）复制进 `packages/flow/spec`，model 的测试逐条跑；
- 场景用例（`spec/scenarios`）写一个适配器按新命令跑，第一版不支持的场景列出原因；
- 引擎测试用 SQLite 内存库与假时钟（`createTestEngine()`），并发与锁另在 MySQL、PG 实库上跑。

## 9. 运行时的规则（沿用 Java 版验证过的，14.4 照此实现）

- **推进**：`leave(节点, 结果)` 选出边 → 依次记 `node.left`、执行连线的 `effects`、进入目标节点；`enter` 按节点类型分派；
  一个命令里最多推进 1000 步（防网关绕圈）；最后整行写回实例（变量、当前节点、运行状态、标题与摘要）并写事件。
- **选边**：并行网关走全部出边；包容网关走条件成立的全部，都不成立走默认边；其余节点在“结果匹配且条件成立”里取一条，
  写明了这个结果的优先，都没有走默认边；一条也选不出是定义错误。
- **运行状态**存在实例的 JSON 列：汇合要等的分支数（分叉时记下选出的边数，包容网关因此只等走了的分支）、依次会签的队列。
  退回、提级的边跳出并行区域时，取消区域里还开着的待办、清掉汇合计数。
- **结束**：到 `end` 就结束整个实例、取消还开着的待办（并行与包容网关必须成对，`end` 不会落在分支中间；Java 版的代码也是这样，
  它的文档写的“只结束这条分支”没有实现）。
- **会签**：每个参与人一份待办，同一节点同一轮共用一个组；`all`、`sequential` 有人选了非通过的结果就立即结束，全部通过才结束；
  `any` 第一个人处理完就结束；`ratio` 同一结果的人数占比达到门槛就结束，都办完没达到按 `fallback`。结束时取消其余待办。
  并发靠先锁实例行、再重读这一轮的全部待办。
- **处理（complete）**：锁实例行 → 重读待办（不是 open 报 `already-handled`；在收件箱里的先自动认领；不是候选人报 `forbidden`）
  → 校验结果与意见 → 守卫 → 带状态条件的更新（改到 0 行是重复提交）→ 往下推进。
- **作业**：和命令同一事务插入；到点先锁实例，实例结束了就跳过、暂停了往后推；待办已不是 open、节点轮次变了的提醒与时限跳过；
  失败回滚并记尝试次数与错误，按 n² 分钟重试，用完标 `failed`，异步自动节点的 `onFailure: 'error'` 同时暂停实例。
  实例结束时删掉它还没到点的作业。
- **调用流程**：子实例记父实例、父节点、父轮次；子实例结束时锁父实例推进；父实例终止时递归终止子实例。
