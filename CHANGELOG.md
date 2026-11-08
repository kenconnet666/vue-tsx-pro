# 更新记录

每一版对使用方的变化。发版时由 `node scripts/release.mjs` 从 [RELEASE.md](RELEASE.md) 的“下一版对使用方的变化”搬过来；
0.11.0 及更早的版本见 [GitHub Releases](https://github.com/kenconnet666/vue-tsx-pro/releases)。

## 0.15.0（2026-11-08）

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
- Timeline 改成配方组件：`createUi` / `Provider` 的 `components.Timeline` 可以给 `alternate`、`size` 的默认值，按部件
  （root、item、rail、marker、line、content、title、meta、actor、time、description、toggleLine、toggleContent）追加样式。

## 0.14.0（2026-11-07）

- 新子路径 `@zerodep-dev/vue-tsx-pro-ui/testing`：在自己的测试里按用户的操作驱动复合控件——`selectHarness`、
  `cascaderHarness`、`treeSelectHarness`、`treeHarness`、`dateFieldHarness` / `datePickerHarness`、`dataTableHarness`，
  `getControl(容器, 名称)` 按标签找控件，`setupTestingDom()` 给 happy-dom / jsdom 补上 popover 等 API 与视口大小。
  文档站加“Testing 测试”指南。Tree 的勾选框带 `data-part="checkbox"`。
- 组件库带命令行 `vtp-ui create <目录>`（`npx -p @zerodep-dev/vue-tsx-pro-ui vtp-ui create my-admin`）：从模板建一个
  桌面后台——AppShell、vue-router、列表页（QueryTable）、详情页、编辑页（SchemaForm），假接口在 src/api 里。
- 更多组件的内部节点带上 `data-scope` / `data-part`（写在部件上的宽高按 border-box 算）：Descriptions、Banner、
  FormErrorSummary、FormSection、Carousel、QRCode、Gauge、Marquee、Watermark、AnimatedNumber、ValueChange、ImageCropper、
  CharacterCount、Ellipsis、DiagramLanes、DiagramMinimap、ActionBar、AuthLayout、SelectionBar、Steps、Breadcrumbs、
  PaginationBar、Tour、AsideLayout、Splitter、LoadingOverlay、SchemaForm、FloatButtonGroup。
- 键盘聚焦时焦点环不再被容器裁掉：贴着容器边的整行与角上的按钮把环画在里面（Tabs 的标签、Listbox、Splitter 的把手、
  Tree、容器模式的 VirtualList、NavList、Accordion 的标题、NotificationCenter 的条目、CodeBlock 的复制、SlideCaptcha 的
  换一张、Upload 图片墙的缩略图）；Collapse 完全展开后不再裁剪内容（过渡中与收起时照旧裁）；DataTable 的单元格、
  StatGroup 只横向裁剪；Upload 的文件名是链接时省略号在链接上。ItemList 可悬停或整条可点的条目，没写 `inset` 时两侧留 `sm`
  （悬停底色不贴着内容，带圆角）。
- 主题新增间距档位 `space.xxs`（`0.125em`）：组件里标题与说明之间、挨在一起的小按钮之间原来写死的 2px 换成它，跟着字号缩放；
  自定义主题时可以覆盖。几处写死的边框、轮廓宽度换成 `borderWidths`。
- 部件名（`data-part`）一律是小驼峰，与配方的部件键、`propsXxx` 一致：原来写成连字符的改了——CalendarBoard 的 `dayHead`、
  `dayButton`，CalendarView 的 `weekNumber`，Diagram 的 `edgeLine`、`edgeArrow`、`edgeText`、`edgeEnd`，JsonViewer 的 `pathBar`，
  ColorPicker 的 `eyeDropper`，Breadcrumbs 的 `collapsedItem`，AppShell 的 `headerContent`，DonutChart 的 `centerLabel`、MapChart 的
  `areaLabels`、`pointLabels`（这三处现在也带 `data-scope`）。按 `[data-part="day-head"]` 写的样式要跟着改。
- TreemapChart 给读屏的数据表：表头已写单位，格子里不再重复单位（同 DonutChart、FunnelChart）。

## 0.13.0（2026-11-07）

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

## 0.12.0（2026-11-07）

- 新组件 ErrorBoundary：一块内容出错时只把这一块换成出错提示，可以重试、`resetKeys` 变了自动恢复；语言包加了 `errorTitle`、`errorRetry`。
- 部件（带 `data-part` 的元素）一律 `box-sizing: border-box`：使用方给部件写的宽高就是整个部件的宽高。以前没设的组件（如 Listbox 的根）
  写 `height` 时实际高度会少算内边距，现在按写的高度。
- 条件别名 `_hover`、`_active` 在不可用（`disabled`、`aria-disabled="true"`、`data-disabled`）时不算：不可用的项不再有悬停、按下的反馈。
- 键盘焦点的样式（`_focusVisible`、`_focusWithin`）排在悬停之后，鼠标停在已聚焦的元素上时不再盖掉焦点样式。
- 日期输入（DateField、DateRangePicker）点后面的段，焦点就在那一段（以前会被拉回第一段）；输入框外壳只在点到空白处时才转交焦点。
- CodeBlock 的展开按钮焦点环画在里面，不再被外框裁掉。
- 内容安全策略：`createUi({ nonce })` 或 Vite 的 `html.cspNonce` 让样式引擎的 `<style>` 带上 nonce；服务端渲染用 `renderStyleTag(html, { nonce })`。
- 样式引擎新增 `css.globalRule`：登记放在最前面级联层（`vtp.base`）的基础规则。
- 服务端渲染：RelativeTime、Countdown 把渲染时的“现在”写在根元素的 `data-now` 上，水合时先按它渲染、挂载后再换成此刻，
  隔了几天打开静态页面不再报水合不匹配（“16天前”与“17天前”）；服务端不再起计时器。自己用 `useNow` 做的计时组件，
  根元素写上新导出的 `nowAttrs(now.value)` 得到同样的效果。
- CommentThread、NotificationCenter 的时间改用 RelativeTime：随时间自动更新，悬停显示完整的日期时间。
- ProportionBar 的图例从起始边依次排开（以前两端对齐）。
- Grid、GridList 新增 `balanced`（和 `minItemWidth` 一起用）：按项数取列数，最后一行最多空一格，4 项不排成 3 + 1。
  `provideGridColumns` 的返回值改成 `{ ref, columns }`（以前直接是 ref）。
- FilterBar 重排：第一排是 `start`、条件与全部按钮（展开、重置、查询，再隔一条竖线是 `end`），按钮在结束边；按剩下的宽度
  量出放得下几个条件，这几个铺满第一排，放不下的与展开的条件从第二排起排成整行的栅格。`minFieldWidth` 默认改成 14em；
  新增部件属性 `propsBody`、`propsRow`；`propsMore` 现在是第二排起那个栅格。QueryTable 的标题与工具栏按钮并进查询栏第一排，
  所有按钮在同一排。
- 单选、复选的卡片外观：RadioGroup、CheckboxGroup（以及单个 Radio、Checkbox）加 `card`，每项是一张卡片、整块可点，
  选中时边框与底色换成色调色；横排时按 `minItemWidth`（默认 14em）分列。Radio、Checkbox 加 `end`（结束边：价格、标记）与 `propsEnd`，
  勾选类的配方多一个 `end` 部件。
- 选文件夹：FileDrop、Upload 加 `directory`，对话框里选整个文件夹（webkitdirectory），拖进来的文件夹递归读出里面的文件，
  补上 `webkitRelativePath`；Upload 的列表显示相对路径，隐含多选。
- 新组件 FloatButton、FloatButtonGroup：页面角落的常驻操作（客服、反馈、新建），圆形按钮、悬停提示名称、`badge` 角标；
  单个固定在视口的结束边底角（留出安全区），一组时竖排在一起；FloatButtonGroup 给了 `icon` 是速拨（主按钮展开、收起其余按钮，
  `_open` 双向，Esc 或点外面收起）。BackTop 现在是一个 FloatButton：悬停有提示，可以放进 FloatButtonGroup（没出现时不占位），
  位置同样留出安全区；`backTopStyles.root` 换成 `fade`（单独用时的淡入淡出）。
- 新组件 QRCode：自带编码器（ISO/IEC 18004，UTF-8 字节模式、四档纠错、自动选版本与掩码），输出一条 path 的 SVG；`logo`
  放在中间（此时纠错默认 H）、`size`、`margin`（静区）、`color`、`bgColor`；`status` 有 loading、expired（`onRefresh` 刷新）、
  scanned，状态层是 role="status"。颜色跟主题，深色主题下仍是白底深色模块。也导出 `encodeQr` 拿到矩阵。
  语言包加了 `qrCode`、`qrExpired`、`qrRefresh`、`qrScanned`。
- 新组件 SignaturePad（手写签名）：canvas 上用鼠标、笔、手指写，笔画随速度粗细，撤销上一笔、清空；`_value` 是透明底的 PNG
  （data URL），`name` 随表单提交；外框同输入框（认 Field 的出错、不可用、只读），只读时显示已签的图；`handle` 拿到 `toPng`、
  `toSvg`、`undo`、`clear`；`penColor`、`minWidth`、`maxWidth`、`height`。语言包加了 `signature` 等六条。
- 二维码与签名的颜色是“纸面”（新导出 `paperStyles`、`paperInk`、`paperBackground`）：浅色主题下跟主题，深色主题下仍是白底深色。
- 新组件 JsonViewer：接口返回、日志、配置的键值树，建在 Tree 上（虚拟滚动、树的键盘、搜索过滤）；值按类型着色（代码高亮的 token），
  bigint、Decimal 照实显示，Date 显示 ISO，Map、Set 可以展开，循环引用显示 [Circular]；`expandDepth`、`maxHeight`、`toolbar`
  （搜索与全部展开 / 收起）；选中一项后路径栏可复制路径（`$.items[0]["unit-price"]`）与值。语言包加了 `jsonItems` 等七条。
- 新子路径 `@zerodep-dev/vue-tsx-pro-ui/area`：全国省市区（与移动端 `/area` 同一份数据）。`areaTree({ depth })` 是三级
  （或两级、一级）的 `{ code, name, children }` 树，`{...areaAccessors}` 直接交给 Cascader、TreeSelect，`areaName`、`areaNames`
  把代码换回名称。约 100 KB，用不到的应用不打包。
- 新增 `useInfiniteList`（滚动加载）：一页页取、接在后面，按 `key` 去重，记住还有没有下一页；`onRangeChange` 直接交给
  VirtualList、DataTable，离末尾不到 `threshold` 项时取下一页；`params` 变了或 `refresh()` 从第一页重来，失败时停下等重试。
  新组件 InfiniteListStatus 放在列表下方：失败时显示原因与“重试”，取完了显示“没有更多了”；语言包加了 `listNoMore`。
- 远程选项可以分页：Select、Combobox、Mentions 的 `load` 多了第三个参数（第几页，从 1 开始），返回 `{ items, next }` 时
  滚到列表末尾取下一页，已有的选项留着、骨架接在后面，重复的值只留一个。ListboxView 的 `loading` 可以是 `'more'`（骨架接在末尾），
  新增 `onRangeChange`。TreeSelect 的 `load` 只收数组。
- Dialog 加 `draggable`：按住标题栏拖动（标题栏上的按钮照常点），不超出窗口，每次打开回到正中；位移用 `translate`。
- 可选中的 Tag：写了 `_selected` 时整个标签是按钮（`aria-pressed`），点一下切换；没选中时有描边，选中时实底色加对勾，
  不写色调时用 accent、字号默认 sm。筛选条件的一排标签用它。
- ItemListItem 整条可点：`href`（标题是 Link，走路由适配）或 `onSelect`（标题是 ButtonBase），标题伸展盖住整条，结束边的操作叠在上面照常可点；
  `selected` 是正在看的一条（选中色、aria-current），`disabled` 变淡点不了；`propsLink`、`propsButton` 转发给标题的链接、按钮。
- 界面里的链接默认悬停才有下划线：ItemList、Card 的页头、Stat、StatGroup、Timeline、Descriptions、Checklist 里的 Link
  不写 `underline` 时是 hover（新导出 `LinkUnderlineScope`、`LinkUnderlineContext` 给自己的容器用）；正文里的照旧带下划线。
  Upload 的文件名、CommentThread 的附件链接同样悬停才有下划线。
- Upload：父级放进 value 的“已选择”文件（带 `file`）在给了 `upload` 时也马上开始上传（拖到页面别处、恢复的草稿）。
- ScrollArea 的根、视口、内容层、滚动条、滑块带上部件标记（`data-scope="scroll-area"`），一样 border-box：Tree、Listbox
  这类以视口为主体、带内边距的组件，写的高度（`maxHeight`）就是整块的高度。Tree 写 `maxHeight` 时节点少按内容高、多了才滚动。
- Listbox 的根带上部件标记（`data-scope="listbox" data-part="root"`），和别的部件一样 border-box：写的高度就是整个列表的高度。
- 静态 Table 新增 `stickyHeader`（外层限高、竖向滚动时表头吸顶），TableHeaderCell、TableCell 新增 `sticky`（第一列固定在起始边）。
- Sparkline 的柱（`type="bar"`）在 `showLast` 时最新的一根实色、前面的淡下去。**破坏性**：删掉已废弃的 `variant` 属性与
  `SparklineVariants` 类型，改用 `type` 与 `SparklineTypes`。

## 0.11.2（2026-11-07）

- Calendar、DatePicker 的月份、年份视图里用指针点一格，逐级回到日期视图时焦点仍是原来那天（以前会变成那个月的 1 日、那年的 1 月；键盘一直是对的）。
- DataTable 的勾选列、单选列不再把表头和各行撑高（以前有勾选列的表头约高 5px），勾选框在格子里上下居中。
  部件 `selectAll`、`selectCheckbox`、`selectRadio` 的样式与 `data-part` 改加在 Checkbox / Radio 的外层 label 上（以前在里面的 input 上）；
  按 `input[data-part="selectCheckbox"]` 写的选择器要改成 `label[data-part="selectCheckbox"] input`。

## 0.11.1（2026-11-07）

- Checkbox、Radio、Switch（以及表格里的勾选列）的方框、圆、开关轨道按外层文字的字号算：以前原生 input 没继承字体，
  按浏览器的 13.333px 算，和文字、开关滑块的比例对不上，`size` 档位越大差得越多。
- ColorField 的取色器、OtpField 的输入框同样改为继承字体（外观不变）。
