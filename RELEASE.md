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

- 组合组件把里面的按钮、勾选框、链接、头像的部件属性转发出来（用 `mergePartProps` 合并，组件管理的点击、勾选、不可用在最后）：
  Timeline 的 `propsAvatar`、`propsPending`；PeoplePickerPanel 的 `propsAvatar`、`propsCheckbox`、`propsSelectAll`、`propsDrill`、
  `propsClear`、`propsRemove`；DataImport 的 `propsTemplate`、`propsPrevious`、`propsNext`、`propsAgain`、`propsOnlyErrors`；
  SchemaFields 的 `propsAddRow`、`propsRemoveRow`，SchemaForm 的 `propsSubmit`、`propsReset`；Upload 的 `propsLink`、`propsHandle`；
  ConditionBuilder 的 `propsAddRule`、`propsAddGroup`、`propsRemoveRule`、`propsRemoveGroup`；Breadcrumbs 的 `propsButton`；
  CommentThread 的 `propsAttachment`、`propsReply`；FilterBar 的 `propsClearAdvanced`；SlideCaptcha 的 `propsRefresh`；
  QueryTable、ErrorBoundary 的 `propsRetry`；JsonViewer 的 `propsExpandAll`、`propsCollapseAll`；ImageCropper 的 `propsButton`；
  QuarterCalendar 的 `propsPrevious`、`propsNext`；Carousel 的 `propsPause`、`propsDot`；TabList 的 `propsScrollButton`；
  Transfer、TreeTransfer 的 `propsCheckAll`；XY 图的 `propsZoomReset`；MapChart 的 `propsControl`。
- 日历改成配方组件 `Calendar`（CalendarView 渲染的 Calendar、RangeCalendar、日期选择器的弹层，以及 QuarterCalendar 共用）：
  `components.Calendar` 可以给 `size`、`showWeekNumbers`、`fixedWeeks` 的默认值（如全站显示周数），按部件（root、months、month、
  header、heading、grid、weekday、weekNumber、cell、cellButton、footer）追加样式。部件标记的 `data-scope` 从 `calendar-view`、
  `quarter-calendar` 统一成 `calendar`，格子与格子里的按钮也带上了标记。
- CodeBlock 改成配方组件：各部件带 `data-scope="code-block"` 标记（原来没有），`components.CodeBlock` 可以给 `wrap`、`copyable`、
  `lineNumbers`、`maxLines`、`flush` 的默认值（如全站显示行号），按部件（root、header、title、body、pre、code、line、lineNumber）
  追加样式。
- Tour 改成配方组件：`components.Tour` 可以给 `padding`（镂空比目标大出多少）的默认值，按部件（root、spotlight、panel、cover、
  content）追加样式。
- Stat 改成配方组件：各部件带 `data-scope="stat"` 标记（原来没有），`components.Stat` 可以给 `tone` 的默认值、按部件
  （root、label、icon、value、number、unit、change、changeLabel、description、body、footer）与色调档位追加样式。
- 新组件 UserButton：头像 + 名字（可带一行说明）+ 箭头，做账号菜单的触发器，Menu 的 `trigger` 里把触发器的 props 展开给它。
  没有说明时是顶栏里的胶囊，有说明时占满一行（侧栏底部），`compact` 只剩头像。配方组件 `UserButton`，部件 root、avatar、text、
  name、description、indicator；`vtp-ui create` 的模板顶栏换成了用它的账号菜单。
- Countdown 加 `variant="blocks"`：一格一格的数字块（限时抢购），天数单独一格，字号随上下文。改成配方组件 `Countdown`，部件
  root、segment、separator，`components.Countdown` 可以给 `variant` 的默认值、按部件追加样式（如数字块换成危险色）。
- NavList、Menu、Toaster 改成配方组件，各部件带上标记（原来没有）：
  `components.NavList` 按部件（root、list、item、link、icon、label、badge、group、trigger、chevron、groupList、flyout、section、
  sectionLabel、sectionIcon、sectionText）追加样式，NavItem、NavGroup、NavSection、NavMenu 共用；`components.Menu` 可以给 `size`
  的默认值，按部件（panel、content、item、icon、label、text、description、indicator、shortcut、chevron、group、groupLabel）追加样式，
  ContextMenu、子菜单与各种菜单项共用；`components.Toaster` 可以给 `placement`、`max`、`stack`、`progress` 的默认值（全站的通知
  位置、叠放），按部件（region、list、item、gap、toast、progress）追加样式。`menuItemSx` 换成 `menuItemLayer(parts, tone, disabled)`，
  `menuItemContent` 的第一个参数是所在菜单的部件（`useMenuItem().menu.parts()`）；`toastStyles` 不再导出（用 `components.Toaster`），
  `createToaster` 的选项类型改名 `CreateToasterOptions`（`ToasterOptions` 是 Toaster 的档位）。
- AppShell 改成配方组件：`components.AppShell` 可以给 `sidebarCollapsible`、`fullscreenable`、`skipLink`、`pageScrollbar` 的默认值
  （如全站不要全屏按钮），按部件（root、header、menuButton、brand、nav、headerContent、headerMain、fullscreenButton、fullscreenExit、
  body、sidebar、sidebarScroll、sidebarContent、collapseBar、collapseButton、column、main、footer、aside、asideScroll、asideContent、
  drawer）追加样式；headerMain、column、collapseBar 等原来没有标记的节点也带上了。
- Transfer 改成配方组件（TreeTransfer 共用）：`components.Transfer` 可以给 `searchable` 的默认值，按部件（root、panel、header、
  checkAll、title、count、search、searchField、list、actions、action、actionIcon）追加样式；原来没有标记的节点也带上了。
- NotificationList、NotificationCenter 改成配方组件：`components.NotificationList` 按部件（root、head、title、markAll、filters、
  types、unreadOnly、scroll、list、item、dot、body、itemTitle、description、time、empty、footer）追加样式，`components.NotificationCenter`
  按部件（panel、indicator、trigger、list）追加样式。顺手修了“只看未读”没有靠结束边（样式落到了开关的 input 上）。
- Card 的 `padding="none"` 只让正文贴边，页头、页脚仍留 sm / md 的内边距（原来文字贴着边框）。
- FilterBar 改成配方组件（QueryTable 的查询栏也是它）：`components.FilterBar` 可以给 `labelPlacement`、`labelWidth`、`minFieldWidth`
  的默认值（全站查询栏的标签位置、条件宽度），按部件（root、start、body、row、fields、actions、toggle、advancedToggle、reset、search、
  more、advanced、summary、clearAdvanced）追加样式。
- Upload 改成配方组件：`components.Upload` 可以给 `listType`、`thumbnailSize`、`sortable`、`pasteable` 的默认值，按部件（root、drop、
  hint、list、item、icon、body、name、link、progress、meta、retry、remove、wall、wallList、card、image、placeholder、overlay、actions、
  handle）追加样式；drop、list、card、image、retry、remove 等原来没有标记的也带上了。
- 列表行（Listbox、Tree、Cascader、NavList、Menu）的高亮、已选、当前、不可用改成跟着元素上的属性走（条件别名）：
  `itemStyles.highlighted / selected / current / disabled` 合成 `itemStyles.states`，元素写 `data-highlighted`、`aria-selected`、
  `aria-current`（或 `data-current`）、`aria-disabled` 即可；Listbox、Tree 的 `data-active` 换成 `data-highlighted`（Tree 只在有焦点时），
  Tree 选中的节点多一个 `data-current`；`menuItemLayer` 去掉 `disabled` 参数。外观不变，当前项悬停时文字保持品牌色。
- Timeline 改成配方组件：`createUi` / `Provider` 的 `components.Timeline` 可以给 `alternate`、`size` 的默认值，按部件
  （root、item、rail、marker、line、content、title、meta、actor、time、description、toggleLine、toggleContent）追加样式。

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
