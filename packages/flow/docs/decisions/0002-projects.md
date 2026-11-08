# 0002 流程即 TS 工程

取代 0001 第 3.3 节的单个 `code` 模块。

## 1. 工程

一个流程是几份文件（`FlowProject = { files: { 路径: 源码 } }`），在线编辑、仓库里写的是同一种东西：

| 文件           | 内容                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `process.json` | 图：节点、连线、泳道、布局（设计器画的）；必须有                                                                |
| `form.ts`      | 单据：`export default defineForm({ fields })`；字段推出单据的类型（`FormValues`），发布时生成流程变量的声明     |
| `logic.ts`     | 逻辑：`export default defineLogic(form, { resolvers, guards, actions, functions })`；定义里写 `logic.名字` 引用 |
| `views/*.tsx`  | 需要时才写，在页面里渲染：发起页的分区、审批单的分区、打印页（第 6 节）                                         |
| `test.ts`      | 场景测试：`defineScenarios(form, { 名字: { variables, steps, expect } })`，工作室与 Node 的测试都跑             |

- 类型贯通：`defineLogic(form, …)` 里 `ctx.variables`、`ctx.read` 按单据的类型；宿主代码 `engine.process<typeof form>('purchase').start({ variables })` 写错字段是编译错误。
- `logic.名字` 按位置决定种类：处理人里的 `resolver` 找 `resolvers`，结果的 `guards` 找 `guards`，自动节点的 `action` 找 `actions`，条件里的 `fn.logic.名字` 找 `functions`。发布时逐个核对，缺的报 `logic.missing`。

## 2. 编译与加载

- 转换用组件库自己的模块编译（`@zerodep-dev/vue-tsx-pro-tsx/browser-compile`）：与 Vite 预设同一个编译函数（去类型、Vue JSX、符文），导入改成从模块表取。
  引擎不带编译器（包之间的分层：引擎不依赖组件库），发布工程时用选项里的 `transform`：Node 里是新包 `@zerodep-dev/flow-ts-studio` 的
  `compileInPlace`（在当前线程编译），浏览器页面里用 Worker 编译。引擎只认编译结果的格式（导入读 `__modules`，导出写 `__exports`）。
  不选 sucrase、esbuild-wasm：前者不出 Vue JSX，后者 14 MB；oxc-transform 没有导入改写。
- 编译结果跟着版本存（`flow_definition.modules`），执行时由引擎的链接器加载：相对路径在工程里找（照写的、`.ts`、`.tsx`、`/index.ts`），
  包名先找引擎自带的（`@zerodep-dev/flow-ts-model`、`@zerodep-dev/flow-ts-engine` 的 `defineLogic`），再找宿主登记的 `modules`；循环 import 报错。
  每个版本加载一次，缓存在引擎里。
- 宿主模块：`createFlowEngine({ modules: { '@app/erp': { exports, types } } })`，也可以 `load: () => import(…)` 用到才加载；`types` 是给类型检查与在线编辑器的声明。

## 3. 类型检查

- 服务端：`@zerodep-dev/flow-ts-studio/typecheck` 的 `createTypeChecker()`，用 TypeScript 7 的 `typescript/sync` API，在宿主目录上叠一层内存文件
  （工程的文件、宿主模块的声明装成虚拟的包），真装着的包照常从 node_modules 解析。发布前检查，有错报 `invalid-definition`，`details.types` 列出文件、行、列。
- 浏览器：工作室的编辑器在 Worker 里跑 TypeScript 7 的 `tsc --lsp`（社区的 tsgo-wasm，与仓库的 typescript 钉在同一个提交），
  内存文件系统里放工程文件、模型包与引擎扩展点的类型、宿主模块的声明；视图用到的页面模块给宽松的类型。以服务端的检查为准。

## 4. 版本

- 每次发布一个不可变的版本：定义（并进了单据变量）、全部源码、编译结果、发布说明、发布人。
- `engine.versions.list(key)`、`engine.versions.project(key, version?)`（取源码在线编辑；只发布过定义的给出只有 process.json 的工程）、
  `engine.versions.rollback(key, version)`（把旧版的工程原样发成新版本）。运行中的实例留在自己的版本上；
  管理员可以迁到别的版本（`migrate` 命令；`versions.migrationPreview` 列出每张单正在用的节点能对应到哪，对不上的手动选同类型的节点）。
- 同一个流程的发布用咨询锁串行，`(process_key, version)` 有唯一索引兜底。

## 5. 信任模型

不变：只有管理员能写，代码在宿主里直接执行，不做沙箱；改动有发布记录。

## 6. 视图

- `views/*.tsx` 是界面代码，在页面里渲染，引擎不加载：发布时与别的文件一起编译、存进版本，引擎链接逻辑时跳过它们
  （它们 import 的 vue、组件库是引擎没有的模块）。
- `engine.views(key, version?)` 给出编好的视图，加上它们相对路径 import 的工程文件（单据……），不含逻辑；谁都能取。
  页面用同一个链接器（`flow-ts-engine/client` 的 `linkProject`）加载，宿主模块登记 vue、编译器的运行时与组件库——与页面本身同一份模块，
  主题、数据来源这些 Provider 都管得到。
- 约定：默认导出组件，属性是模型包的 `FlowViewProps`（单据的值、这张单的概况；发起页上没有单）；`export const title` 是分区的标题。
  `start.tsx` 是发起页的分区（拿正在填的值），`print.tsx` 是打印页（审批单上“打印”：预览，抄进看不见的 iframe 打印），
  别的按文件名排成审批单的分区。视图出错只在它那一块写出错误，不拖垮审批单。
