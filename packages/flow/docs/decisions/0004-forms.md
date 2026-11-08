# 0004 表单模块（2026-11-08）

规划见 `.claude/reports/plan-flow-2026-11-08.md` 的 D 节，ROADMAP 26.4。

## 1. 单据就是字段清单

- 单据的格式是模型包的字段清单（`FormManifest`，`model/src/form/manifest.ts`）：字段名 → `{ label, type, required, visibleWhen, requiredWhen, … }`。
  Java 版、流程设计器、表单设计器、引擎都只认这一份；值的校验（`checkFieldValue`）、按环节合算的字段权限（`fieldStates`）、
  提交时的合并（`mergeSubmission`）已经有了，两边跑同一套 spec 样例。
- 流程工程的 form.ts：`export default defineForm({ title: { label: '标题', type: 'text', required: true }, … })`。
  `defineForm` 原样返回清单字面量，`FormValues<typeof form>` 从清单推出单据的类型（必填的一定有，`list` 推出行的类型）。
  第 2 批的 `defineForm({ fields })`（字段只有类型、标签、必填）是更弱的另一种写法，去掉。
- 表单设计器读写的就是这个字面量（JSON 的子集，函数不进清单）；代码里要算的东西写在 logic.ts。

## 2. 单据属于流程

- 不另设表单的登记处与版本（Java 版有）：单据跟着流程工程发布、分版本、回滚，一个流程一个版本就是一个整体。
  几个流程共用一张单据时用 TS 的 import（宿主模块、工程里的共用文件）。
- 发布时清单写进定义：`ProcessDefinition.form` 是清单本身（不再是 `{ key, version }` 的引用）；只写了 `variables` 的定义照旧
  （`variablesManifest` 把变量当成字段）。
- Java 场景里登记表单的（`forms`、`publishForm`），适配器把清单内联进引用它的流程。

## 3. 引擎

- 发起、处理时按清单校验值：类型与约束（`checkFieldValue`），必填与显示条件按环节的权限合算；不合格报 `invalid-input`，
  `details.errors` 列出字段与原因。
- 发布时内联的清单也要合规（`validateManifest`）：清单有错同流程定义有错一样报 `invalid-definition`。
- 接入方注册的字段类型：选项 `extensions.fieldTypes`（类型名 → 查值的函数，返回问题的代号，如 money 的 `currency`）。
  发布时清单校验认得这些类型，发起、处理、暂存时按它查值；字段上自定的属性（money 的 `currencies`）由函数自己读。
  前端照常用 SchemaForm 的 `fields` 换成自己的控件（Java 场景 field-type）。
- 草稿：
  - 处理前暂存（`saveDraft`）：收件箱里的先认领给自己；只收这一步能改的字段、只查值不查必填；存在待办上（`draft` jsonb：值与意见），
    再打开时表单显示暂存的值；处理完清掉。只有处理人看得到。
  - 发起前存草稿（`saveStartDraft`）：实例的状态是 `draft`，不进流程、不算“我发起的”，只有自己看得到；接着填、从草稿发起用同一个实例；
    `discardStartDraft` 删掉。

## 4. 组件库与流程的前端

- 组件库的 SchemaForm 补上所有使用方都用得着的：字段的显示、必填、只读条件（同 ConditionBuilder 的条件），明细表的表格编辑与合计行，
  选项来源（字典、远程搜索），人员与部门、附件的控件，分页签的布局，只读与打印视图。
- 新包 `@zerodep-dev/flow-ts-ui`（packages/flow/ui）：流程的前端组件——按字段清单渲染单据（清单 → SchemaForm）、审批面板、
  流程图、流程设计器的环节面板、字段 × 环节的权限矩阵、表单设计器。文档站与（已删的）flow-demo 里各放一份的环节面板、流程图收进来。
  文档站的流程中心（第 5 批）与流程工作室（第 6 批）都用它。

## 5. 分步

1. 模型与引擎：`defineForm` 换成清单、定义内联清单、发起与处理按清单校验、两种草稿（Java 场景 save-draft、start-draft）。
2. 组件库 SchemaForm 的增强（条件、明细表、选项来源、人员与附件控件、页签、只读与打印）。
3. flow-ts-ui：清单渲染、流程图与环节面板搬进来，权限矩阵。审批面板随第 5 批的审批单做：它跟着客户端与待办详情的形状走。
4. 表单设计器（拖字段、改属性、实时预览，读写 form.ts 的清单）。
