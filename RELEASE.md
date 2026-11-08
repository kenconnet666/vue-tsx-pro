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

- 有底色的容器里的关闭、移除按钮（Alert、Banner、Toast 的关闭，Tag 的移除）悬停、按下时叠一层自己文字色的状态层，
  不再是幽灵按钮的灰底；可选中的 Tag 悬停时在底色上叠一层。共用的样式是 `stateLayerStyles`（ghost、overlay），自己拼的彩色容器也能用。
- 包的 homepage 指向文档站。
- Link 的下划线平时是半透明的文字色，悬停时变成实色：一直带下划线的链接也有悬停反馈。
- 横排的 TabList 放不下、可以横向滚动时，还能滚的那一头边缘渐隐（遮罩），被截断的标签不再生硬地切开。
- 补齐悬停反馈（交互状态审计报出的）：Switch 的轨道悬停混进一点正文色（亮色变深、暗色变亮）；soft 外观的输入框、选择框悬停底色加深一档；
  Steps 可点回的步骤、Checklist 的勾选圆圈、KanbanBoard 的拖动把手悬停同幽灵按钮；Upload 照片墙上的把手、重试、移除叠状态层；
  ColorField、ColorPicker 的色块悬停略微放大（共用的 `swatchStyles.interactive`）；能看大图的 Image 悬停略微压暗；
  Carousel 的页点悬停加深；Splitter 的收起按钮恢复描边按钮的悬停。
- FilterBar（QueryTable 的查询栏）：查询按钮与 end（工具栏按钮）之间不再有竖线；默认只显示一排——按钮区旁边放得下的条件
  （常用的在前、more 在后），其余的（包括放不下的常用条件）都收进“展开”，全部放得下时不出“展开”；展开的几排列宽与第一排的每格相同、上下对齐。
- 横排的 RadioGroup、CheckboxGroup 至少与单行控件一样高、内容竖直居中：和输入框、选择框放在同一排时文字在一条线上。
- Card 的正文撑开（flex-grow）：网格里被拉齐的几张卡片，页脚都贴着底边对齐。
- 组件规格（/spec/components.json）多一个 keyboard 字段：文档页键盘一节的按键。
- useFormDialog 的 select 字段可以 `multiple`：值是选中的数组；字段写成字面量时结果按名字给出类型（`FormDialogValues`）。
- 流程引擎：待办详情（query.workItem）多了 `transferable`（能不能转办）与 `returnTargets`（退回到运行时选的节点时能选哪些）；
  催办尊重环节的 `allow.remind: false`（点名催报 forbidden，催全部时跳过）。
- 流程引擎：待办、已办的行（TodoItem）多了 `instanceStatus`、`completedAt`、`outcome`（已办里看得出选了什么、单子结束了没有）。
- 流程引擎：处理时提交的变量按环节的表单权限（`node.form`）合并——流程声明了变量时只收这一步能改的字段，`required` 的要有值，
  其余用存着的值（原来提交什么就写什么，任何处理人都能改任意字段）；没写 `form` 的环节默认只读。没声明的变量照旧直接写入。
  待办详情多了 `fields`（字段在这一步的样子：隐藏的不列，能改、必填标出来）；模型包新增 `variablesManifest`（流程变量当字段清单）。
- 流程模型包：设计器的编辑函数加 `addCallStep`（在某一步后调用另一个流程）、`addCcStep`（在某一步后抄送）。
- kit：换页取数据时遇到 401 / 403（没登录、没权限）不再在控制台报错，页面拿到 null，照常显示“没有权限”。
- AppShell 的 sidebarCollapsible：收起、展开按钮挪到顶栏品牌格的结束边（原来在侧栏底部单独一行，`collapseBar` 部件删掉）；
  收起后品牌格只放展开按钮、不放品牌；没写 brand 时也有这一格放按钮。AppShellBrand 不再按收起状态隐藏产品名。

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
