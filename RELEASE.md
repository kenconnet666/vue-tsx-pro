# 发布

`node scripts/release.mjs <版本>` 打标签，CI 带 provenance 发布到 npm（下面“每次发布”）。
发布的四个包都在 npm 组织 `zerodep-dev` 下（和 query 的包同一个组织，npm 上没有 `@vue-tsx-pro` 这个范围），版本号一起走：

| 包                                | 内容                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@zerodep-dev/vue-tsx-pro-tsx`    | TSX 编译器（符文、组件边界）、运行时样式引擎、Vite 预设；`dist` 与 `types`                                          |
| `@zerodep-dev/vue-tsx-pro-ui`     | 组件库与各子路径（`/diagram`、`/charts`、`/patterns`、`/three`…），编译好的 JS；依赖 `@zerodep-dev/vue-tsx-pro-tsx` |
| `@zerodep-dev/vue-tsx-pro-mobile` | 移动端组件库（H5 为主）与子路径 `/area`，编译好的 JS；依赖 `@zerodep-dev/vue-tsx-pro-tsx`                           |
| `@zerodep-dev/vue-tsx-pro-mini`   | 小程序运行时、构建（`/build`）、测试工具（`/testing`）、命令 `vtp-mini` 与新项目模板（`template`）；`tsx` 是 peer   |

`ui`、`mobile`、`mini` 对 `tsx` 的依赖写成 `workspace:^`，`pnpm publish` 发布时换成实际版本号，所以必须用 pnpm 发布，不能用 `npm publish`。

## 下一版对使用方的变化

发版时 `release.mjs` 把下面的条目搬进 CHANGELOG.md（也是 GitHub Release 的说明）。组件库照样能在不做服务端渲染的普通 Vue 项目里用，下面是能察觉到的行为变化：

- SchemaForm / useForm：字段的条件写在 meta 里——`visibleWhen`、`requiredWhen`、`readonlyWhen`（条件同 ConditionBuilder）；
  useForm 的 `access` 按字段路径给权限（hidden、readonly、editable、required；可以是函数，参数是当前的值），`form.fieldState(path)`
  给出字段此刻的样子。不显示的字段不校验，条件必填的空着报“必填”。
- SchemaForm 的明细表：对象数组写 `control: 'table'` 排成表格（一行一条、能增删行），列写 `total: 'sum'` 在表底精确合计（带千分位与单位）。
- 表单的数据来源 `formSources`（`createUi`、`Provider`，SchemaFields 的 `sources` 局部覆盖）：meta 的 `source` 按名字取字典或远程搜索；
  `control: 'people'` 用 PeoplePicker（要登记 `people`，没登记时报错说明在哪里给），`control: 'file'` 用 Upload。
- SchemaForm 的页签：meta 写 `tab` 分进标签页。新组件 SchemaView：按 schema 只读地显示值（查看、打印），选项显示文字、开关显示是否、
  人员与附件显示名字、明细表带合计；`access` 与 `visibleWhen` 不显示的不列。
- `decimalSchema` 加 `type`（Decimal 的构造函数）：SchemaForm 生成的字段一开始为空时也写回 Decimal；`bigintSchema` 写回 bigint。
- 下拉（Select、Combobox 等的 Listbox）与 TreeSelect 的弹层按最宽的一项定宽：触发框窄时选项文字不再被截断。
- Tabs 的 id 里，值的字母、数字、`-` 以外的字符写成 `_码位_`（原来都换成 `_`，中文的页签会撞成同一个 id）；按 id 写的样式、测试要跟着改。
- PeoplePicker 的触发框是 `role="combobox"`（弹出对话框的组合框）：必填、只读、出错的状态合规地带在它上面。
- 聚焦收起内容里的控件（错误汇总的链接、提交后聚焦出错字段）时先发 `beforematch`，TabPanel 收到就切过去。
- Descriptions 的值占满标签后剩下的宽度（值是表格时不再被压窄）；起始边的标签与开关、单个复选框的文字基线对齐。
- 语言包新键：`formRowLabel`、`formRowActions`、`formTabs`、`formValueTrue`、`formValueFalse`、`formValueEmpty`。
- tsx：浏览器里编译纯 `.ts` 模块也去掉类型、改写导入导出。
- 流程引擎（还没发布到 npm）：只认 PostgreSQL（测试用 PGlite，浏览器里能跑）；流程即 TS 工程；待办动作插件化与补齐（委托、加签减签、
  撤回这一步、指定承办人、票签、批量、forEach 与异步调用、自定义节点、迁移版本）；单据就是字段清单、两种草稿；注册的字段类型；
  预测下一步与上一步选处理人。新包 flow-ts-ui：按清单渲染单据、流程图与环节设置、表单权限矩阵、表单设计器。

## 每次发布

只有一条线：每批改动在 master 上 CI 全部通过后就发一版，使用方一律用最新版；没有补丁分支，也不来回改版本号。

1. **写变化**：这一版对使用方能察觉的变化写进上面的“下一版对使用方的变化”（破坏性改动写清怎么改）。
2. **发版**：`node scripts/release.mjs <版本>`。它先确认在 master、工作区干净、与 origin 一致、HEAD 的 CI 全部通过，
   再把四个包的 `version` 改成这个版本、把上面那一节搬进 [CHANGELOG.md](CHANGELOG.md)（原处清回“（暂无）”），提交 `chore(release): <版本>`，
   打标签 `v<版本>` 并推送。
3. **发布**由标签触发的 `.github/workflows/release.yml` 完成：核对版本号，`pnpm test:consumer`（`pnpm pack` 的包在仓库外的独立应用里安装、
   类型检查、构建、真实浏览器里运行），带 provenance 发布四个包（`-r` 按依赖顺序先发 `tsx`；各包的 `prepack` 重新构建），用 CHANGELOG
   这一节建 GitHub Release。令牌是 `release` 环境（只允许 master 分支与 `v*` 标签）的 secret `NPM_TOKEN`。
4. **之后**：npm 上新版本要经过几分钟校验才出现在版本列表里（这期间显示 `0.0.0-stage`）；能装了以后把 easy-query-ts 文档站升到这一版，
   两个文档站都到线上核对。

## 一次性准备（已做好）

1. npm 账号开启 2FA，建一个范围是 `@zerodep-dev`、勾选 Bypass 2FA 的 Granular Access Token：放进 GitHub 仓库 `release` 环境的
   secret `NPM_TOKEN`（CI 发布用），本机也放进用户级环境变量 `NPM_TOKEN`、`~/.npmrc` 写 `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`（手动发布用）。
2. 组织 `zerodep-dev` 在 npm 上已建好，账号是它的 owner。

## 手动发布（CI 发布出问题时）

在打了标签的提交上（必须用 pnpm 发布，见开头）：

```bash
pnpm install --frozen-lockfile && pnpm build && pnpm test:consumer
pnpm -r --filter "./packages/tsx" --filter "./packages/ui" --filter "./packages/mobile" --filter "./packages/mini" publish --access public --no-git-checks
```

发布中途报 `409 Cannot publish over previously staged version` 说明上传已被接收，等一会儿，不要重发。

## 使用方怎样装

```bash
pnpm add @zerodep-dev/vue-tsx-pro-ui @zerodep-dev/vue-tsx-pro-tsx vue
```

`vite.config.ts` 用 `@zerodep-dev/vue-tsx-pro-tsx/vite` 的预设；`@zerodep-dev/vue-tsx-pro-ui` 的可选依赖（图表、3D、Excel、Shiki、拼音、zod、Pinia、vue-router）
按用到的子路径另装，列在 `packages/ui/package.json` 的 `peerDependencies` 里。组件库缺的能力，使用方的 TSX 文件由同一个预设编译，
直接写在自己的项目里即可，不必等组件库发版。

移动端：

```bash
npx @zerodep-dev/vue-tsx-pro-mini create my-app   # H5 加两端小程序的新项目
# 或在已有项目里
pnpm add @zerodep-dev/vue-tsx-pro-mobile @zerodep-dev/vue-tsx-pro-tsx vue @lucide/icons
pnpm add -D @zerodep-dev/vue-tsx-pro-mini
```

小程序工程由 `vtp-mini build` 按 `mini.config.ts` 出到 `dist/wx`、`dist/my`，见 `packages/mini/README.md`。
