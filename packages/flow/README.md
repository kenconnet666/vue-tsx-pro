# 流程引擎 TS 版（@zerodep-dev/flow-ts-*）

审批流程引擎：图（节点 + 连线）是数据，设计器与代码读写同一份定义；持久层是本仓库的 easy-query TS，界面用本仓库的组件库。
比 `flow` 仓库的 Java 版简洁：只有一个后端、一个命令入口、一个扩展选项对象。设计与取舍见 [docs/decisions/0001-design.md](docs/decisions/0001-design.md)。

| 包                            | 内容                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/flow-ts-model`  | 定义的类型与 `defineProcess`、条件、值、图、选边、校验、表单权限、差异；两端通用                           |
| `@zerodep-dev/flow-ts-engine` | 引擎：`createFlowEngine`、`engine.run(command, actor)`、待办与实例查询、作业；`./testing` 是内存库加假时钟 |

`spec/` 是从 `flow` 仓库复制来的语言无关样例（条件、选边、值、定义校验、权限、差异、场景），各包的测试逐条跑。

## 开发

```bash
pnpm --filter @zerodep-dev/flow-ts-model typecheck
pnpm exec vitest run --configLoader native --project flow
```
