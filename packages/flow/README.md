# 流程引擎 TS 版（@zerodep-dev/flow-ts-*）

审批流程引擎：图（节点 + 连线）是数据，设计器与代码读写同一份定义；一个流程可以写成小 TS 工程（图、单据、逻辑、场景测试）。
库只认 PostgreSQL（测试与浏览器演示用 PGlite），持久层是 easy-query-ts，界面用本仓库的组件库。比 `flow` 仓库的 Java 版简洁：
一个后端、一个命令入口、一个扩展选项对象。

| 包                            | 内容                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/flow-ts-model`  | 定义的类型与 `defineProcess`、条件、值、图、选边、校验、单据清单与权限、差异；两端通用                                                                |
| `@zerodep-dev/flow-ts-engine` | 引擎：`createFlowEngine`、`engine.run(command, actor)`、查询、作业、通知、代理、统计；`./client` 页面用、`./org` 组织目录、`./testing` 内存库加假时钟 |
| `@zerodep-dev/flow-ts-studio` | 流程工程的编译（组件库的编译器）与类型检查（`./typecheck`，TS 7）                                                                                     |
| `@zerodep-dev/flow-ts-ui`     | 界面组件：按清单渲染单据、流程图、环节设置与表单权限矩阵、表单设计器                                                                                  |

完整的演示是文档站的流程中心（`apps/docs/src/flow-center/`，路由 `/flow`）：引擎在浏览器的 Worker 里跑 PGlite，
工作台、审批单、工作室（在线编写、语言服务、试运行、场景测试、版本与迁移）、代理、监控都在。

## 代码在哪

- **model/src**：`definition/`（类型、图、分叉与汇合、校验、编辑函数、差异）、`routing/`（取值、条件、选边）、
  `form/`（字段清单、值的检查、清单校验、字段权限）、`project.ts`（流程即 TS 工程）。
- **engine/src**：`engine.ts` 对外接口与组装；`core/`（核心的槽、表、错误、广播频道）、`runtime/`（推进现场、处理人、会签、调用流程、
  预测下一步）、`commands/`（发起、处理、待办上的动作、实例操作、外部消息、分发）、`publish/`（发布与版本、工程的编译与链接）、
  `queries/`（查询、统计）、`jobs/`（作业）、`notify/`（通知的生成与信箱）、`proxy/`（代理）、`client/`、`org/`、`testing/`；
  `views.ts` 是结果的形状，`types.ts` 是选项与命令，`extensions.ts` 是流程代码用的扩展点（`defineLogic`、`defineScenarios`）。
- **ui/src**：`form/`、`form-designer/`、`process-designer/`、`diagram/`。

`spec/` 是从 `flow` 仓库复制来的语言无关样例，各包的测试逐条跑（场景 37 个跑通 30 个，没跑的见 `engine/test/scenarios.test.ts`）。

## 文档

- [服务端部署](docs/deploy.md)：表与迁移、引擎与端点、作业、多实例广播、组织。
- 决定：[0001 设计](docs/decisions/0001-design.md)、[0002 流程即 TS 工程](docs/decisions/0002-projects.md)、
  [0003 待办上的动作](docs/decisions/0003-operations.md)、[0004 单据](docs/decisions/0004-forms.md)、
  [0009 流程中心](docs/decisions/0009-flow-center.md)、[0010 通知、广播、代理与监控](docs/decisions/0010-notifications.md)。

## 开发

```bash
pnpm exec vitest run --configLoader native --project flow
pnpm -C packages/flow/ui test
node scripts/dev/check.mjs
```
