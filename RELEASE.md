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
- 样式合并按“后写的赢”处理简写与长属性：后面的片段写了简写（`padding`、`paddingInline`、`border`、`outline`、`flex`、`gap`…），
  前面片段里被它重设的长属性去掉，不再出现后写的简写盖不过前面长属性的情况（如 UserButton 的 `compact` 与整行的内边距、
  示例卡片底栏的 `padding: 0`）。同一个样式对象里两者都写时仍是长属性赢。
- 图表的内部节点带上部件标记：外框、绘图区、标记（柱、线、面积、点）、XY 图的参考线与十字准线等共用部分是 `data-scope="chart"`
  （root、header、unit、unitEnd、legend、legendItem、swatch、plot、state、tooltip、tooltipContent、grid、tick、bars、bar、lines、line、
  areas、area、dots、dot、band、target、event、mark、crosshair…），各图自己的部分用自己的名字（`graph-chart`、`map-chart`、
  `funnel-chart`、`radar-chart`、`treemap-chart`、`sankey-chart`、`chord-chart`、`timeline-chart`、`donut-chart`、`sparkline`）。
  原来手写的 `data-part`（bar、line、area、node、link、segment…）名字不变，多了 `data-scope`；Donut 中心的说明文字改叫 centerTitle。
- 又一批内部节点带上部件标记（部件名取样式键）：ThemeCustomizer、ThemeThumbnail、Diagram、DiagramMinimap、QueryTable、Listbox、
  PeoplePickerPanel、SchemaForm、FieldCompare、Tree、ColumnSettings、ColumnHeaderActions、TreeDataTable、Cascader、ItemList、
  PageSizeSelect、Splitter、ImageCropper、SignaturePad、CalendarView、DatePicker、StepsForm、Popconfirm、Affix、AsideLayout、
  ColorField、ListPopover、OtpField、FormSection、LoadingBar、QRCode、VirtualList。
  图表的 svg 根、坐标轴文字与十字准线，选择框一族（Select、Cascader、TreeSelect、PeoplePicker）共用的 value、placeholder
  （`data-scope="select"`）也带上了。
- 更多部件属性：RadioGroup、CheckboxGroup 的 `propsItem`（按 items 生成的每一项，可以按项计算）、ColumnSettings 的 `propsCheckbox`、
  SelectedTags 的 `propsMore`（“+N”）、DatePicker 与 DateRangePicker 的 `propsPreset`（快捷选项按钮）、NavItem 的 `propsBadge`；
  FilterBar 的计数角标是 `count` 部件，NavBar 的计数、DataImport 的必填星号、CommandPalette 的快捷键提示、表头筛选的选项与“清除”带上标记。
- 输入法：NumberField 在组合中的 ↑ ↓（选候选）不再加减、Enter（上屏）不再提交；Select 的搜索框在组合中按退格不再删掉已选的项。
- 列表行（Listbox、Tree、Cascader、NavList、Menu）的高亮、已选、当前、不可用改成跟着元素上的属性走（条件别名）：
  `itemStyles.highlighted / selected / current / disabled` 合成 `itemStyles.states`，元素写 `data-highlighted`、`aria-selected`、
  `aria-current`（或 `data-current`）、`aria-disabled` 即可；Listbox、Tree 的 `data-active` 换成 `data-highlighted`（Tree 只在有焦点时），
  Tree 选中的节点多一个 `data-current`；`menuItemLayer` 去掉 `disabled` 参数。外观不变，当前项悬停时文字保持品牌色。
  ItemList（`data-selected`、`data-disabled`）、NavBar（`aria-current`，下拉与“更多”按钮带 `data-current`）、按钮家族的不可用
  （`disabled` / `aria-disabled`；`buttonSx` 去掉 `disabled`）、DataTable 的已选与正在看的行（`aria-selected`、`aria-current`）、
  CalendarBoard 的选中与不可用格（不可用格多了 `aria-disabled`，悬停不再有底色）同样改了。

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
