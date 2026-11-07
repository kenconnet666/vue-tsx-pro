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

- 新组件 Carousel（轮播）：原生横向滚动加 scroll-snap，上一张 / 下一张、页点；`autoplay`（指针停留、焦点进来时暂停，
  有暂停 / 播放按钮，偏好减少动态效果时一开始暂停）；`slidesPerView`（可以是 1.5）、`gap`、`loop`、`_index`；
  WAI-ARIA 轮播模式（区域、每张 role="group"、不自动播放时 aria-live="polite"）；滚动区域能聚焦，方向键横向滚动。
- **破坏性**：语言包合并重复的条目：`lightboxZoomIn` 与 `chartZoomIn` 合成 `zoomIn`，`lightboxZoomOut` 与 `chartZoomOut`
  合成 `zoomOut`，`lightboxCounter` 改名 `slideCounter`（图片预览的计数与轮播共用）。自定义的语言包照着改名。
- `usePanZoom` 加 `frame`（平移按视口里的一块限制，如裁剪框）与 `cover`（缩放下限是内容盖满 frame 的比例），
  `min`、`max` 可以写成函数；`clampPan` 的第二个参数可以带 x、y（视口里的一块）。
- 新组件 ImageCropper（裁剪图片）：裁剪框固定在中间（`aspect`，`shape="round"` 圆形），图片在底下拖动、缩放，框里永远是图；
  工具条有缩小、缩放滑块、放大、还原；`handle` 拿到 `toCanvas`、`toBlob`、`toFile`（可以指定输出像素、类型、质量）。
  Upload 加 `transform`：选到的文件加进列表前先过一遍（弹出裁剪、压缩、改名），返回 null 不加。
- 新组件 ColorPicker（取色器面板）：饱和度 / 明度色板（role="slider"，方向键调）、色相与不透明度滑块（Slider，渐变轨道）、
  吸管（支持 EyeDropper 的浏览器）、HEX / RGB / HSL 输入、`presets` 与最近使用；`alpha={false}` 去掉不透明度。
  颜色工具新增 `toHsva`、`hsvaToHex`、`formatColor`。语言包加了 `colorArea` 等八条。
- DataTable（及 TreeDataTable）加 `virtualColumns`：列也虚拟滚动，只渲染看得见的列（前后各多三列），跳过的列用一格
  colspan 占位，colgroup 的列宽都在，固定列、分组表头、列宽调整、单元格导航照常；没写宽度的列按 150px，两端的固定列总在，
  固定列夹在中间时不虚拟化；各格带 aria-colindex、表格带 aria-colcount。新导出 `columnSkips`、`VIRTUAL_COLUMN_WIDTH`。
- **破坏性**：ColorField 的色块不再是原生取色器，点开弹出 ColorPicker（能选透明度、各系统外观一致）；`propsSwatch` 现在是按钮
  （ButtonBase）的属性，`propsPicker` 现在是 ColorPicker 的属性；新增 `presets`、`alpha`、`propsPopover`。
- **破坏性**：语言包 `lightboxReset` 改名 `resetView`（图片预览与裁剪共用）；新增 `cropLabel`、`cropHint`、`cropZoom`。
- 画布（`/diagram`）能画流程图：节点数据加 `shape`（`rect`、`pill`、新增的 `circle` 与 `diamond`），里面的 DiagramNode
  默认跟着画，连线接到形状的轮廓上（圆、菱形的几条线都接在顶点，`borderPoint`、`straightRoute`、`routeEdges` 认形状）；
  DiagramNode 加 `active`（正在进行：加粗的边框与色调的光晕），小地图里胶囊、圆画成圆角。新导出 `DiagramNodeShape`、
  `DiagramShapeRect`；`DiagramNodeShapes` 改从几何模块导出（名字不变）。
- **破坏性**：`LinkUnderlineContext` 提供的值改成函数（`provide(() => 'hover')`）：LinkUnderlineScope 的 `underline` 变了，
  里面的链接跟着变。自己提供这个上下文的照着改。
- 新组件 SchemaForm、SchemaFields：按 useForm 的 zod schema 生成表单。控件按类型选（文字、枚举的下拉、`z.iso.date()` 的日期、
  数字含 Decimal 与 bigint、布尔的开关、枚举数组的多选、嵌套对象的一组、对象数组的可增删的行）；标签、说明、占位、单位、栏宽
  （`span`）、分组（`group`）、换控件（`control`）写在 `.meta()` 里（扩充了 zod 的 GlobalMeta，有类型提示）；`fields` 按字段路径
  换控件（键有类型检查），`pick` / `omit` 只生成一部分。配套 `emptyValues(schema)`（空白的初始值）、`schemaFields`（字段描述）、
  `schemaFilters`（查询栏的条件，值读写传进去的对象）、`schemaConditionFields`（高级筛选的字段）。表单控制器加 `schema`。
  语言包加 `formSubmit`、`formReset`、`formAddRow`、`formRemoveRow`。
- **破坏性**：删掉标了 `@deprecated` 的旧写法（没有过渡）：`createUi` / `Provider` 的 `defaults`、`styles`（改用
  `components: { Button: { defaults, styles, variants } }`，`styles` 即原来的 `base`），`styles.Tab`（写 `Tabs`）；
  Skeleton 的 `variant`、`SkeletonVariants`、`skeletonVariantStyles`（改 `shape`、`SkeletonShapes`、`skeletonShapeStyles`）；
  WaveGrid 的 `variant`、`WaveGridVariants`（改 `type`、`WaveGridTypes`）；TimelineChart 系列的 `variant`（改 `type`）；
  `Tones`、`Tone`（改 `TextTones`、`TextTone`）；tsx 的 `Theme`（改 `VarTheme`）、配方组合档位的 `when`（改 `match`），
  `@zerodep-dev/vue-tsx-pro-tsx/styles` 不再转出 `hotStyles`、`inlineStyle`、`ConditionMatcher`（在 `styles/internal`）。
- 部件补齐（层层合并、层层转发）：组件内部的节点带上 `data-scope` / `data-part`，使用方的全局样式与测试能稳定选中，
  写在部件上的宽高按 border-box 算。新增的部件属性：CommentThread（`propsAvatar`、`propsBody`、`propsHeader`、`propsAuthor`、
  `propsContent`、`propsAttachments`、`propsActions`、`propsReplies`、`propsEmpty`）与 CommentComposer（`propsMain`、
  `propsUpload`、`propsError`、`propsFooter`、`propsAttach`、`propsCancel`、`propsSend`）；Checklist（`propsSummary`、
  `propsProgress`、`propsList`、`propsStatus`、`propsLabel`、`propsDescription`、`propsMeta`、`propsAction`）；
  Cascader 的 `propsOption`；KanbanBoard（`propsBoard`、`propsColumn`、`propsHeader`、`propsCount`、`propsReason`、
  `propsList`、`propsEmpty`、`propsCard`、`propsHandle`）；CalendarBoard（`propsHeader`、`propsTitle`、`propsPrevious`、
  `propsNext`、`propsGrid`、`propsWeekday`、`propsDayButton`、`propsNote`、`propsEvents`、`propsEvent`、`propsMore`）；
  ColorPicker（`propsArea`、`propsThumb`、`propsEyeDropper`、`propsHue`、`propsAlpha`、`propsPreview`、`propsFormat`、
  `propsInput`、`propsSwatches`、`propsSwatch`）；DiagramNode（`propsStart`、`propsBody`、`propsTitle`、`propsDescription`、`propsEnd`）。
  按列、按卡片、按选项、按日程计算的部件属性写成函数。
- 字段约束认 `z.iso.datetime({ local: true })`：输入框不再把它当普通文字。
- `useFormDialog` 的表单加了 `novalidate`：必填没填时只显示字段下的错误，不再弹浏览器自带的气泡。

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
