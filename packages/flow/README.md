# 流程引擎 TS 版（@zerodep-dev/flow-ts-*）

审批流程引擎：图（节点 + 连线）是数据，设计器与代码读写同一份定义；持久层是本仓库的 easy-query-ts，界面用本仓库的组件库。
比 `flow` 仓库的 Java 版简洁：只有一个后端、一个命令入口、一个扩展选项对象。设计与取舍见 [docs/decisions/0001-design.md](docs/decisions/0001-design.md)。

| 包                            | 内容                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/flow-ts-model`  | 定义的类型与 `defineProcess`、条件、值、图、选边、校验、表单权限、差异；两端通用                           |
| `@zerodep-dev/flow-ts-engine` | 引擎：`createFlowEngine`、`engine.run(command, actor)`、待办与实例查询、作业；`./testing` 是内存库加假时钟 |
| `@zerodep-dev/flow-ts-studio` | 流程工程的编译（组件库的编译器）与类型检查（`./typecheck`，TS 7）；在线工作室                              |
| `@zerodep-dev/flow-ts-ui`     | 界面组件（建在组件库上）：按字段清单渲染单据、流程图、流程设计器的环节设置与表单权限矩阵、表单设计器       |

## 代码在哪

- **model/src**：`definition/`（定义的类型、格式版本、图、分叉与汇合、校验、设计器的编辑函数、差异）、
  `routing/`（取值与比较、条件树、选边）、`form/`（字段清单、值的检查、清单校验、字段权限与收提交）、`project.ts`（流程即 TS 工程）。
- **engine/src**：`engine.ts` 是对外接口与组装；`core/`（引擎核心、表、错误）、`runtime/`（推进现场、处理人、会签、调用流程、
  预测下一步、运行状态）、`commands/`（发起、处理、待办上的动作、实例操作、外部消息、命令分发、收单据的值）、`publish/`（发布与版本、
  流程工程的编译与加载）、`queries/`（查询）、`jobs/`（作业）、`views.ts`（结果的形状）、`types.ts`（选项与命令）、`testing/`（测试工具）。
- **ui/src**：`form/`（按清单渲染单据）、`form-designer/`（表单设计器）、`process-designer/`（环节设置、表单权限矩阵）、
  `diagram/`（流程图）。

`spec/` 是从 `flow` 仓库复制来的语言无关样例（条件、选边、值、定义校验、权限、差异、场景），各包的测试逐条跑。

## 开发

```bash
pnpm --filter @zerodep-dev/flow-ts-model typecheck
pnpm exec vitest run --configLoader native --project flow
pnpm -C packages/flow/ui typecheck
pnpm -C packages/flow/ui test
```
