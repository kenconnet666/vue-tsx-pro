# 基础设施复用审查（只读，未改任何文件）

范围：`packages/ui/src` 全部组件，`apps/docs/src`、`apps/host-demo/src` 自己写的界面代码。
快照：master @ ed0f264 加工作区未提交改动（tones-expand、skeleton-loading 两个会话正在改 Button 家族、Stat、Card、Skeleton、Charts、ThemeCustomizer 等，下文标「冲突区」）。

## 总体结论

基础设施整体用得好，没有发现大面积绕开：

- 颜色、间距、圆角、时长基本都走 token，裸色值只有下面 E1 的几处。
- 浮层统一走 `useAnchoredPopover` / `createAnchoredLayer` / `anchorFloating`，模态统一走 Modal。
- 没有手写 `setTimeout` 做动画，也没有自己算浮层位置。
- 弹出层的滚动全部是 `ScrollArea`，`Listbox` 自滚动时也换成了 ScrollArea 的浮层滚动条。
- DataTable 用 Checkbox，Pagination 用 Button / LinkButton / IconButton，Alert（Toast 经由它）用 CloseButton，Select / Combobox / TagsInput / CommandPalette 用 `useListState` 加 `ListboxView`，ToggleGroup / Tabs / Toolbar / Menu 用 `rovingFocus`。
- 触发本次审查的文档站图标列表：`IconGallery` 在工作区里（未提交，不是本会话改的）已经换成 `VirtualList`（内部是 ScrollArea）加 `ButtonBase`，不再有原生滚动条，不用再处理。

真正的问题集中在三类：**同一块代码复制了三份或两份**、**「每个内部节点都有 propsXxx」约定漏了一批节点**、**少数残留的原生滚动和重复的小样式**。下面按严重程度排。

---

## 问题清单

### A. 重复实现（该抽公共件）

**A1. 选项弹出层整块复制三份** — 改动量：中；公共 API 影响：无（内部抽取，三个组件的 props 不变）

- 位置：`input/Select.tsx:346-386`、`input/Combobox.tsx:368-407`、`input/TagsInput.tsx:355-396`
- 现状：三处是同一段：`<div popover="auto">`，样式 `floatingStyles.anchored + surface + scrollPanel + 各自 popover + fontSizeStyles[size] + transitions.scale`，里面 `<ScrollArea focusable={false} sx={floatingStyles.scrollArea} propsViewport={{ref: scroller}}>` 包 `<ListboxView {...mergePartProps(…)}>`。差异只有 `onPick`、`multiple`、条件渲染和各自的 popover 样式。
- 应该：抽 `ListPopover`（放 `input/`），接收 panel ref、scroller ref、size、`propsPopover`、`propsListbox`、`list`、`onPick` 等。三个组件各删约 35 行，以后改浮层外观只改一处。已满足「第三次才抽象」的标准。
- 同类重复：`aria-labelledby` / `aria-label` 的二选一表达式在三处各写一遍，抽走后一并消失。

**A2. Tooltip 与 HoverCard 的壳层几乎一样** — 改动量：中；公共 API 影响：无

- 位置：`overlay/Tooltip.tsx:96-179`、`overlay/HoverCard.tsx:93-178`
- 现状：两边的 `useId`、`anchor` / `panel` / `arrowElement` 三个 raw state、`createAnchoredLayer` + `useHoverIntent`、Esc 监听（`onKeydown`，document 捕获阶段，逻辑逐字相同）、`_effect` 里 show / hide、渲染 `<div popover="manual">` 加 arrow `<span>`，全都复制。差别只有：HoverCard 多了 `lazy` 内容、失焦判断和 surface 样式；Tooltip 带 `role="tooltip"` 和 `aria-describedby`。
- 应该：抽 `useHoverLayer(read)`（放 `utils/dom/hover-intent.ts` 旁边），返回 trigger props、panel props、arrow props。Esc 监听本身必要（`popover="manual"` 没有原生 Esc），保留，只是不该写两遍。
- 说明：`Menu.tsx:196` 的手写 Esc 是有意的（注释写了 Firefox close watcher 偶尔不关），不算问题。

### B. 约定漏项：多节点组件的内部节点没有 propsXxx

COMPONENTS.md §2.1 规定「每个内部节点都是部件」。下面这些节点是裸的 `<span {...stylex.attrs(...)}>`，使用方没法给它们加 sx、aria、class。

| 组件 | 缺 propsXxx 的节点（文件:行） | 冲突区 |
| --- | --- | --- |
| Stat | icon、number、unit、change、changeLabel、description（`display/Stat.tsx:144-186`；现有 propsLabel、propsValue） | 是 |
| Timeline | time、rail、line、title、description（`display/Timeline.tsx:161-211`；现有 propsItem、propsMarker、propsContent） | 否 |
| Tree | indent、toggle、checkbox、sizer、row（`display/Tree.tsx:387-475`；现有 propsItem、propsLabel、propsViewport） | 否 |
| XYChart / BarChart / LineChart | header、unit、tooltip 系、center、隐藏的数据表（`charts/XYChart.tsx:220-226,438-452,511`；现有 propsLegend、propsPlot） | 是 |
| DataTableView | leading、content、sortLabel、thead、col、progress 行、empty / spacer（`table/DataTableView.tsx:372-374,482,551-563,590-591,640-687`） | 否 |
| CodeBlock | lineNumber、title、body（`base/CodeBlock.tsx:247,276,280`） | 否 |
| Upload | body、name、meta（`input/Upload.tsx:216-226`） | 否 |
| Breadcrumbs | 折叠项 li（`navigation/Breadcrumbs.tsx:116`） | 否 |
| Switch | contentText（`input/Switch.tsx:154`） | 否 |
| FileDrop | description（`input/FileDrop.tsx:217`；已有 propsHint，需确认是不是同一节点） | 否 |
| AvatarGroup | moreText（`display/AvatarGroup.tsx:80`） | 否 |
| TreeDataTable | indent、placeholder（`table/TreeDataTable.tsx:105,122`） | 否 |
| Tour | content（`overlay/Tour.tsx:286`） | 否 |
| 完全没有 propsXxx 的多节点组件 | `input/CharacterCount.tsx`（2 个节点）、`base/List.tsx`、`config/ThemeCustomizer.tsx`（4 个节点）、`config/Provider.tsx` | ThemeCustomizer 是 |

- 应该：按组件逐个补 `propsXxx`，用 `mergeAttrs` 合并；props 注释、文档 API 表同步更新（`pnpm docs:check` 逐个检查注释）。
- 改动量：每个组件小，整体大（约 13 个组件）。公共 API 影响：只增不改，向后兼容。
- 有些节点是纯装饰（`aria-hidden` 的缩进占位、spacer），可以不开口子，需要逐个判断：这是设计决策，不是机械替换。

### C. 滚动

**C1. `Sortable` 横排用原生 overflow** — 改动量：小到中；公共 API 影响：有（外观与 DOM 结构）

- 位置：`display/Sortable.tsx:58`（`horizontal: { overflowX: 'auto' }`）
- 现状：横排项多了出现原生滚动条，和整站的浮层滚动条不一致。
- 应该：内部包 ScrollArea（`axis="x"`）。`utils/dom/sortable.ts:326-330` 的 `scrollParent` 按 computed overflow 找滚动祖先，ScrollArea 视口的 `overflow: auto` 能被识别，自动滚动不用改。要决定：根元素是 `<ul>`（FlexList），套一层 ScrollArea 会改 DOM 结构，影响 `propsRoot` 语义与已有测试。

**C2. host-demo 的 `SortableDemo` 给 Sortable 加 `overflowY: auto`** — 改动量：小；API 影响：无

- 位置：`apps/host-demo/src/pages/SortableDemo.tsx:12`
- 现状：竖排待办用 `sx` 加 `maxHeight + overflowY: auto`，原生滚动条。
- 应该：外面包 `<ScrollArea sx={{ maxHeight: '14rem' }}>`；Sortable 的自动滚动会找到 ScrollArea 视口（同 C1）。核对 `apps/host-demo/test` 里 sortable 浏览器测试用到的选择器。这页本来就演示「拖到滚动区域外自动滚动」，正好验证。

**C3. docs 演练场的 CodeMirror 编辑器用原生滚动条** — 改动量：中；API 影响：无

- 位置：`apps/docs/src/playground/editor.ts:77`（`.cm-scroller` 没改滚动条）、`playground/CodeEditor.tsx:20`
- 现状：`.cm-scroller` 是 CodeMirror 自己的原生滚动容器，是文档站里唯一仍是原生滚动条的地方。
- 应该：第三方滚动容器，不能直接套 ScrollArea。要么把 ScrollArea 的滚动条外观（`scrollbarWidth`、thumb 颜色，`layout/ScrollArea.tsx:79-128`）提成共用样式给 `.cm-scroller` 用；要么接受不一致。需要设计决策。
- 说明：`Marquee` 在 reduced-motion 下 `overflow: auto`（`display/Marquee.tsx:70`）和 `Textarea` 的 `overflowY: auto`（`input/Textarea.tsx:51`）是原生控件行为，不建议改。

### D. 手写按钮

**D1. `XYChart` 图例项是裸 `<button>` 加手抄的重置样式** — 改动量：小；API 影响：无（冲突区）

- 位置：`charts/XYChart.tsx:462`，样式 `:158-182`（`padding: 0, borderWidth: 0, backgroundColor: transparent, fontFamily: inherit, cursor: pointer` 加 `focusRingStyles.visible`）
- 现状：和 `buttonBaseStyles.root`（`base/button-core.ts:94`）的重置逐项重复，焦点环也自己拼。
- 应该：换成 `ButtonBase`（带重置、焦点环、颜色过渡，`aria-pressed` 透传），样式只留布局和文字色。

**D2. 不算问题的原生 `<button>` / `<a>`**

- `input/ToggleGroup.tsx:253`、`input/Select.tsx:297` 已用 `buttonSx` / `buttonBaseStyles.root`，没有重复样式；ButtonBase 文件头注释写了「少一层实例」的取舍。
- `base/Heading.tsx:122`（标题锚点）、`navigation/Pager.tsx:79`（上一篇 / 下一篇卡片，已用 `focusRingStyles`、`interactionTransitions`）、`NavList`、`TableOfContents`、`Menu:450` 是外观不同于按钮的专用链接。
- host-demo 的 `pages/Base.tsx:143,1083`、`Profile.tsx:28`、`components/NameField.tsx:10` 是有意演示宿主原生元素与 class 互操作，不改。

### E. 样式 token 与共用样式

**E1. 色块内描边三处各写一个透明度，棋盘格逐字重复** — 改动量：小；API 影响：外观极细微变化

- 位置：`display/ColorSwatch.tsx:41`（`rgb(0 0 0 / 0.1)`）、`config/ThemeCustomizer.tsx:61`（`0.12`）、`input/ColorField.tsx:91`（`0.15`）
- 现状：裸 `rgb(0 0 0 / …)`，不跟主题，三处数值不一致。
- 应该：在 `utils/style/vars.stylex.ts` / 主题里加共用 token（或共用 `swatchRingStyles`），三处引用。
- 附带：棋盘格 `repeating-conic-gradient(_colors.fill 0 25%, _colors.surface 0 50%)` 在 `ColorSwatch.tsx:38` 和 `ColorField.tsx:66` 逐字重复，一起收进共用样式。
- 冲突提示：ThemeCustomizer 在冲突区。

**E2. 响应式断点是魔法数字，没有 token** — 改动量：中；需设计决策

- 位置：`layout/AppShell.tsx:39-41`（同一个 64rem 同时写成 media query 字符串和 `@media`，手动保持一致）、`overlay/CommandPalette.tsx:42`（40rem）；docs：`pages/Playground.tsx:33,38`（72rem）、`pages/guide/Theming.tsx:48,52`（72rem）、`components/base/Icon/IconLibrary.tsx:28`（64rem）、`playground/props/PropsPlayground.tsx:53`（60rem）。
- 现状：同一类「宽屏」在 60 / 64 / 72rem 之间不一致，没有统一断点档位。
- 应该：先决定要不要定义断点 token（和 `useMediaQuery` 共用）；StyleX 的 `@media` 键能否引用常量要看 Vite 预设的支持。单独出方案。

**E3. 手写 `Math.min(Math.max(…))`，已有 `clamp`** — 改动量：小；API 影响：无

- 位置：`display/Descriptions.tsx:164`、`overlay/Tour.tsx:153`、`utils/dom/sortable.ts:109`；`utils/data/number.ts:6` 已有 `clamp`，Slider、Progress、Pagination、PageJump 等在用。

**E4. 焦点环有多份独立定义** — 改动量：小到中；API 影响：无

- 位置：`utils/style/styles.ts:87`（`focusRingStyles`，外偏移）、`input/choice-styles.ts:78-81`、`input/control.ts:58-62`（`:focus-within`，内偏移）、`input/FileDrop.tsx:91-94`（`:has(:focus-visible)`）。
- 现状：宽度、颜色、样式是同一组 token，只有伪类和偏移不同。choice-styles 与 FileDrop 几乎逐字相同。
- 应该：把 `focusRingStyles` 扩成带偏移与伪类的变体（如 `visible`、`within`、`hasVisible`），choice-styles 和 FileDrop 直接引用；control.ts 的外壳版保留，数值走同一组变量。

**E5. 零引用导出** — 改动量：小；API 影响：有（公开导出）

- `statusToneBorderStyles`（`utils/style/tone-styles.ts:90`）库内、docs、demo 都没引用，只在定义文件里。是公开导出，删前确认版本策略。

### F. 检查过，没有发现问题

- **手写定位 / 焦点**：`getBoundingClientRect` 出现的位置（Slider、ScrollArea thumb、ThemeSwitcher 视图转场原点、Toast 宽度、Tour 镂空、ContextMenu 光标点、ColumnResizer）都是测量而非摆放浮层。Tour 自己的 `<dialog>` 没复用 Modal，但它要镂空、自定位、不锁页面滚动（还要 `scrollIntoView` 目标），是有意差异。
- **键盘导航**：Tree、Slider、SlideVerify、ColumnResizer、Sortable 是各自特有的交互，不与 rovingFocus / useListState 重复。
- **动效**：`setTimeout` 都是节流 / 延迟 / 重复触发（Toast 暂停计时、NumberField 长按、Menu 子菜单延迟、useForm 防抖、typeahead、clipboard），不是手写动画。
- **表单控件**：输入类组件都用 `useFieldControl`；文本类与选择类都用 `controlSx` + `useControlAppearance`。
- **docs / host-demo**：docs 站界面代码已经用组件库，除 C3 外没有手写滚动和手写按钮。

---

## 分批整改方案

原则：每批文件集合互不相交，批内可单会话完成；冲突区文件放最后，等 tones-expand / skeleton-loading 合并后再做。

### 第 1 批：机械替换（可立即做，互不冲突，无 API 影响）

| 项 | 文件 |
| --- | --- |
| E3 `clamp` 替换 | `display/Descriptions.tsx`、`overlay/Tour.tsx`、`utils/dom/sortable.ts` |
| C2 SortableDemo 套 ScrollArea | `apps/host-demo/src/pages/SortableDemo.tsx`，视情况改对应浏览器测试 |
| E4 焦点环合并 | `utils/style/styles.ts`、`input/choice-styles.ts`、`input/FileDrop.tsx`（`input/control.ts` 只改数值引用） |

### 第 2 批：抽公共件（内部重构，无 API 影响）

| 项 | 文件 |
| --- | --- |
| A1 `ListPopover` | 新增 `input/ListPopover.tsx`；改 `Select.tsx`、`Combobox.tsx`、`TagsInput.tsx` |
| A2 `useHoverLayer` | 新增放在 `utils/dom/`；改 `overlay/Tooltip.tsx`、`overlay/HoverCard.tsx` |

A1、A2 文件不相交，可两个会话并行。做完跑 `apps/host-demo/test/render-counts.browser.test.tsx` 和 `native-overlay.browser.test.ts`（A1 影响渲染次数）。

### 第 3 批：补 propsXxx（只增不改的 API，按文件分组并行）

先出一份「哪些节点开口子、哪些保持内部」的清单（设计决策），再分会话：

- 3a：`display/Timeline.tsx`、`display/Tree.tsx`、`display/AvatarGroup.tsx`、`table/TreeDataTable.tsx`
- 3b：`table/DataTableView.tsx`、`base/CodeBlock.tsx`、`input/Upload.tsx`、`input/FileDrop.tsx`、`input/Switch.tsx`、`input/CharacterCount.tsx`、`base/List.tsx`、`navigation/Breadcrumbs.tsx`、`overlay/Tour.tsx`
- 每个组件同步更新：props 接口注释、`docs.tsx` 的 API 表、测试里的透传用例。

### 第 4 批：需要设计决策（先出方案再动手）

- C1：Sortable 横排是否包 ScrollArea（会改 DOM 结构）。
- C3：CodeMirror 滚动条外观是否复用 ScrollArea 样式（要不要把滚动条样式提成共用片段）。
- E2：是否引入断点 token，以及 StyleX 里怎么引用。
- E5：`statusToneBorderStyles` 是否删除。

### 第 5 批：冲突区，等另外两个会话合并后再做

- B 里的 Stat、XYChart / BarChart / LineChart、ThemeCustomizer 的 propsXxx。
- D1：`XYChart` 图例换 `ButtonBase`（与 B 同文件，一起做）。
- E1：色块描边与棋盘格共用样式（涉及 ThemeCustomizer 和主题 token）。

### 不建议动

`Menu` 手写 Esc、`ToggleGroup` / `Select` 的裸 `<button>`、`Marquee` / `Textarea` 的原生滚动、`Tour` 自己的 `<dialog>`、host-demo 里演示宿主互操作的原生元素。
