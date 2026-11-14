# 更新记录

每一版对使用方的变化。发版时由 `node scripts/release.mjs` 从 [RELEASE.md](RELEASE.md) 的“下一版对使用方的变化”搬过来；
0.11.0 及更早的版本见 [GitHub Releases](https://github.com/kenconnet666/vue-tsx-pro/releases)。

## 0.25.0（2026-11-14）

- **服务端渲染时的时区**（语言没配置 `timeZone` 时）：服务端固定按 UTC 渲染时刻，不再取服务器所在的时区；水合时先按 UTC
  （和服务端的节点一致），挂载后换成浏览器的时区，文字与悬停提示都跟着改过来。之前服务端按自己的时区渲染、浏览器直接按
  浏览器的时区水合，属性的不一致不会被改回来：RelativeTime 的悬停提示一直是服务器时区的时间（服务器在 UTC、用户在东八区
  时差 8 小时）。涉及 `useFormat()` 的 `date` / `relative`（DateTime、RelativeTime、表格的日期列）、Countdown、日历的“今天”、
  TimelineChart。语言配置了 `timeZone` 的、不做服务端渲染的项目没有变化。
- **日历的“今天”**（Calendar、RangeCalendar、QuarterCalendar、CalendarBoard）：服务端渲染时把渲染的时刻记在根元素上
  （`data-now`），水合时先按它算今天，挂载后换成真实的今天；没有值、没指定默认日期时，显示的月份也跟到这个月。
  之前静态生成的页面隔几天再打开，今天的标记还停在构建那天（区间日历甚至不标真正的今天）。
- 新增 `useTimeZone()`：在 setup 里取“当前的时区”的读取函数，自己换算时刻时用它，服务端渲染与水合期间和组件一致；
  `isServerRendering()`：在 setup 里判断是不是在做服务端渲染。`useDateLocale()` 的返回值多了 `rootAttrs()`
  （自己用它的 `today()` 写日历类组件时，展开到根元素上）。

## 0.24.0（2026-11-14）

- **服务端渲染后存的状态、媒体查询生效**：`usePersistentState`（QueryTable 的列设置、自己存的布局）与 `useMediaQuery`
  （连带 `usePrefersDark`、`useReducedMotion`、AppShell 的宽屏判断）水合时先按服务端的值渲染，挂载后换成真实的。
  之前直接用存的值渲染，和服务端的节点对不上，存的状态刷新后反而显示不出来（生产构建里不报错）。不做服务端渲染的项目没有变化。
  新增 `isHydrating()`（在 setup 里判断这个组件是不是正在水合）。
- **`sameValue`**：`Map` 逐项比、`Set` 比成员。之前任何两个 `Map` / `Set` 都被当成相等（表单看不出改过、`useRequest` 的参数变了不重新请求）。
- **`tableToXlsx` / `exportXlsx`**：`Date` 实例、带时区的 ISO 字符串按 `timeZone`（新选项，默认浏览器的时区）的墙上时间写进表格，
  和页面上看到的一致；之前按 UTC 写，东八区零点的日期会差一天。不带时区的日期照字面写，没有变化。
- **TagsInput** 允许自己输入（默认）时，打字不再自动高亮第一条建议：回车加的是打的字，要选建议按 ↓ 再回车。
  `allowCustomValue={false}` 时照旧高亮第一条。
- **触屏**：NavList 紧凑时的分组点图标弹出子项（之前只能悬停、键盘聚焦，触屏上子项到不了）；ContextMenu 按住 700ms 打开
  （iOS 的 Safari 长按不发 `contextmenu`）；Splitter、ResizeHandle 能按到的范围扩到 24px 以上（布局不变）。
- **新的属性**：Switch 的 `description` / `propsDescription`（同 Checkbox、Radio）；ColumnTable 的 `empty`（没有行时表体里一行，
  默认“暂无数据”，之前只剩表头）；CodeEditor 实例的 `setReadonly`。页面组合的文案新增 `notificationsNoMatch`。
- **只读、不可用的表单里**：ConditionBuilder 增删条件的按钮不可用；CodeEditor 不能改（`readonly` 之后再变也跟着）；
  Autocomplete 不可用时隐藏的 input 不随原生表单提交。
- **NotificationList** 有通知、只是筛选后一条都没有时显示“没有符合条件的通知”，不再说“没有通知”；**NavBar** 收进下拉、
  “更多”菜单的项也带徽标。
- **Diagram** `fitView`：用缩放按钮、小地图动过视口之后，尺寸变化不再把视口重新适应回去（之前只认拖动、滚轮、键盘）；
  卸载时结束进行中的拖动。

## 0.23.0（2026-11-14）

- **Provider / ConfigScope** 只在这一层配置了语言时才往元素上写 `lang`、`dir`；没配置时沿用外层的（宿主页面自己的 `lang` / `dir`
  不再被盖成默认的中文、从左到右）。
- **数字格式**：取整后是 0 的负数不带负号（`-0.4` 保留整数显示 `0`，不是 `-0`）；要保留写 `signDisplay`。
  `format.fileSize` 遇到不是数的值返回占位符，`999,999 B` 显示 `1 MB`。
- **`defineTheme` / `defineLang` / 组件默认值**（`createUi` 与 Provider 的 `components`）：值是 `undefined` 的键不再把外层写好的盖掉
  （同上一版部件属性的规则）；主题里写了不认识的 token 会报错并带上名字。
- **StepsForm**：不在最后一步时，表单的提交（点“下一步”、输入框里按回车）是下一步，不再提交整份表单；这一步没通过时焦点到
  第一个出错的控件上。“下一步”按钮是 `type="submit"`（`propsNext` 的类型里去掉了 `type`）。
- **表头的关键字筛选**（DataTable 列的 `filter: { options: 'text' }`）：停手 300ms 才生效，回车、清空立即生效；服务端筛选时
  不再每敲一个字发一次请求。
- **Steps** `navigable` 时出错的步骤也能点回去。
- **KanbanBoard** 在触屏、触控笔下只能从把手拖，卡片留给手指滚动（之前手机上整个看板滚不动）；鼠标下照旧整张卡片都能拖。
- **CodeEditor**：父级改值时只替换有差别的那一段（光标、滚动位置留在原处），这次替换不进撤销历史。
- **新的属性**：
  - Avatar `decorative`（旁边已经有名字时不让读屏再念一遍头像；UserButton 展开时自动带上）。
  - Listbox `readonly`，Transfer / TreeTransfer 在只读的 Field、Form 里不能移动；ControlGroup 把 Field 的不可用、只读交给组里的控件。
  - Pagination、PaginationBar `disabled`。
  - ModelViewer 的状态多了 `fallback`（没有 WebGL、显示的是 `fallback` 内容时：不转圈、不标忙碌）；环境贴图在模型加载完之后才生成。
  - `themeSettingsCode` 第四个参数 `base`：圆角按基础主题自己的取值缩放，导出的代码与预览一致。
  - 语言包新增 `floatButtonMore`（FloatButton 展开按钮的默认名称）、`copyFailed`（复制失败时播报）；页面组合的文案新增
    `dataImportFailed`。自己写了完整语言包的要补上。
- **DataImport**：`onImport` 失败时在预览里显示原因（之前只进控制台）；换步后焦点跟到这一步的内容上。
- **图表**：柱子、瀑布图不再冲出数值轴的范围；折线、面积图在触屏上点得动下钻；全是负数时对齐轴的上端不再被改成 1；
  漏斗图（没有 svg）不再显示“导出图片”，导出的图片保留镂空、虚线偏移；从右到左的语言里坐标不再镜像；雷达图的轴按数据的最大值
  （不再至少是 1）；`zoomRange` 超出数据时夹回去；时间条图跳过无效的时间；MapChart 没有任何数据时显示 `empty`。
- **浮层与反馈**：LoadingOverlay 一开始加载就拦住点击（遮罩的外观仍然延迟出现）；没有箭头的 Popover 内容过高时在面板里滚，
  不再伸到视口外；嵌套的 ContextMenu 只弹里层的；Toast 超出 `max` 还没显示的通知被关掉后不再留着；模态、Lightbox、Tour
  快速关了再开时不会被上一次迟到的关闭事件关掉；ErrorBoundary 的默认内容是 `role="alert"`；CopyButton 复制失败会播报。
- **输入**：Upload 图片墙里失败、被拒绝的文件都显示原因，只收一个文件时同一批里的坏文件不再把好文件顶掉；ColorPicker 只有改了
  颜色的键才记进最近使用；Rating 不可用时悬停不预览；Carousel 用指针点了翻页按钮后自动播放照常，点“播放”一定恢复；
  Splitter、ResizeHandle 右键按下不再卡在“拖动中”；Descriptions 没有值的项显示占位符。
- **画布与 3D**：Diagram 节点里的输入框能正常打字（空格、回车、方向键不再被画布拿走），按住空格拖动时页面不跟着滚；
  ModelViewer 在“减少动态效果”下拖动也跟手，键盘聚焦看得见焦点环。
- **工具函数**：`usePanZoom` 捏合后单指继续拖不再跳回、滚轮按行滚动的鼠标换算成像素；`useInfiniteList` 滚动加载不再清掉等待中的
  防抖刷新；`useHistory` 截断重做段后保存点正确；`useHotkeys` 在非拉丁键盘布局下不串键；`useRequest` 命中缓存时清掉上一次的错误；
  `useAutosave` 保存中再改不并发保存；`http` 读响应体也受超时管，调用方写的请求头大小写不同也能覆盖默认的。
- **无障碍与样式**：Windows 高对比（强制颜色）下日历选中的日期、区间与表格选中、正在看的行看得出来；AppShell 进入、退出全屏后焦点
  跟到对应的按钮上；SchemaForm 的明细添加行后焦点到新行、删行后到相邻的行；QRCode 加载中读屏念得到；ActionBar 吸底时让开手机
  底部的安全区；SlideCaptcha 的结果条跟主题的状态色走；CodeBlock 的复制按钮不再压住第一行代码；FloatButton 展开按钮默认有名称。
- 其余修正：QueryTable 加载失败且没有行时表格里写“加载失败”；Countdown 的 `to` 从过去改到将来立即更新；Avatar 的缩写不再取到
  半个字符；xlsx 没写小数位的数字列整数不再显示成 `1,234.`；英文语言包 1 条时是 `1 item`；代码高亮、示例源码下载失败后下次再试；
  主题定制的对比度检查读不到颜色时不再显示“全部通过”；实色底上的文字色在白、深灰都不够对比度时用纯黑。

## 0.22.0（2026-11-13）

- **部件属性的合并规则**（`mergeProps` / `mergeAttrs` / `mergePartProps`，所有组件的 `...rest` 与 `propsXxx` 都经过它）：
  - 值是 `undefined` 的属性不再盖掉前面几层的：组件没有值可给时（没有错误时的 `title`、不在 Field 里时的 `aria-describedby`），
    你写的照常落到元素上；`propsIcon={{ size: undefined }}` 这样的写法保留组件的默认值。确实要去掉默认值写 `null`。
  - `aria-describedby` 各层拼在一起：控件在 Field 里时，你自己写的提示与 Field 的说明、错误都念得到。
  - 嵌套的部件属性（`propsTag={{ propsRemove: … }}`）与组件给这个子部件的默认合并，不再整个替换。
  - 展开的属性与显式写的属性都有同名事件（`<Menu {...propsMenu} onOpenChange={…}>`）时两个都调用，不再报错。
- **NumberField** 的 `format={{ style: 'percent' }}` 编辑时输入的是百分数：显示 `85%`，输入 `90` 得到 `90%`（值是 `0.9`）。
  之前聚焦后显示 `0.85`，输入 `90` 会被夹成 `100%`。
- **TableHeaderCell** 在表体、表尾里默认 `scope="row"`（之前都是 `col`）；要列标题时写 `scope="col"`。
- **Link** `external` 的 `target`、`rel` 是默认值，可以改（`rel="noopener noreferrer nofollow"`），同 LinkButton。
- **Upload** 不可用时“重试”也不可用；**Listbox**（连带 Transfer）不可用时点选项不再改值；**TagsInput** 只读时粘贴不再加标签，
  从建议里选的也受 `max` 限制；不可用的日期输入框按 Enter 不再提交表单。
- **Popconfirm**：`onConfirm` 还在进行时被 Esc、点外面关掉，不再触发 `onCancel`（没确认成才触发）。
- **DatePicker** 的“今天”和当前值同一种类型写回（绑定 `CalendarDate` 时不再变成字符串）；**DateRangePicker** 清空后父级再给值、
  再清空，输入框都跟着，表单重置时半截输入也清掉。
- **TreeDataTable**：开了表头筛选后行不再串（展开、勾选落在对的行上）；`multiSort` 生效。
- **useForm**：单字段校验的接口出错时清掉上一个值留下的错误、不挡提交；提交等校验期间值又改了，按最新的值再校验。
- **QueryTable**：`propsTable` 里的 `resizable`、`columnMenu` 等生效，新增 `propsColumnSettings`；只改了固定、列宽时“重置”可用。
- **Field**：控件自己写了 `id` 时，标签的 `for` 与错误汇总的链接跟着指过去。
- **Rating** 只读时名称里总有分数（自己的 `aria-label` 或 Field 的标签后面接上“4 星，满分 5 星”）。
- **新的部件属性**：NavBar 的 `propsItem` / `propsLink` / `propsTrigger` / `propsMore`，QuarterCalendar 的 `propsHeader` / `propsHeading` /
  `propsGrid` / `propsCell` / `propsCellButton`，DataTable 的 `propsFilterButton` / `propsColumnMenuButton`，ImageCropper 的 `propsImage`
  （图片默认 `crossorigin="anonymous"`），ColumnSettings 的 `changed`；Upload 的 `propsItem`、`propsIcon` 在图片墙里也生效。
- **类型更严**：组件自己管理的属性从部件属性的类型里去掉了（Splitter、Carousel、Ellipsis、Sortable、ConditionBuilder、
  FormErrorSummary、CommandPalette 的 `propsInput`、DataTable、Tab、NavItem、LoadingBar、Marquee）。之前写了不报错、
  运行时被丢掉，现在类型检查会指出来。AlertDialog / `useConfirm` 的类型去掉了没有效果的 `draggable`。
- 其余修正：Splitter 收起开始那一栏时布局正确；FloatButton 的 `badge={false}` 照常固定在角落；CSV 导出对没登记的状态值、
  数字与日期列里的字符串同样防公式；`pivot` 的 `avg` / `min` / `max` 认十进制字符串；MenuSub 的 `description` 照常显示；
  PaginationBar 的 `size` 也作用于每页条数的下拉，页码的 `onClick` 里 `preventDefault` 可以拦下换页；图片在监听接上之前就加载好
  （服务端渲染后水合）时照常显示；Textarea 宽度变了重新算高度；输入法组合中的 Enter、Esc 不再提交或取消表格的单元格编辑；
  LoadingBar、Breadcrumbs、Checklist、VirtualList（`scroll="window"` 的服务端渲染）的几处边界情况。

## 0.21.0（2026-11-08）

- **触屏上的输入框字号不小于 16px**（`pointer: coarse`）：TextField 这类输入框、OtpField、日期与时间的分段、CodeEditor。
  iOS 的 Safari 聚焦小于 16px 的输入框时会放大整页；桌面不变。新导出 `touchInputStyles`（自己写的原生输入框用 `touchInputStyles.font`）
  与 `coarsePointer`（触屏的媒体查询）。

## 0.20.1（2026-11-08）

- **FilterBar** 的按钮区、**QueryTable** 的工具栏不再宽过整排：按钮多、屏幕窄时在里面换行（之前手机上会把整页撑宽、缩小显示）。

## 0.20.0（2026-11-08）

- **Tabs** 整组卸载时不再逐个改选、写回旁边的值（之前标签一个个注销时会依次发出 `update:_value`，使用方据此改地址会把离开的导航拽回来）。
- **流程引擎**（flow-ts-engine）：
  - 通知：`engine.notifications.list / unread / read`，表 `flow_notification`（站内信箱兼发件箱，与推进同一个事务写入）；
    引擎选项 `notifications.deliver` 做外部投递，失败的由 `jobs.runDue` 重试。
  - 广播：推进、作业、发布随提交 `NOTIFY` 频道 `FLOW_CHANNEL`，组织目录改了发 `ORG_CHANNEL`；多实例部署用 easy-query-ts-pg 的
    `listen` 收听（文档站 Flow 页的“服务端接入”）。`jobs.runDue` 之后不必再自己通知页面。
  - 代理：`engine.proxies.list / save / cancel`，表 `flow_proxy`；新到的待办交给代理人，待办多了 `proxyFor`。
  - 统计：`engine.stats.overview({ from, to, processKey, timeZone })`（端点只给管理员）。
  - 父流程经手的人看得到它调起的子流程（查单据、实例详情）。
  - 流程工程的视图 `views/*.tsx`：发布时编译、引擎不加载；`engine.views(key, version?)` 给页面编好的模块，用 `flow-ts-engine/client`
    的 `linkProject` 加载；模型包的 `FlowViewProps`、`isViewFile`、`PROJECT_FILES.views`。
  - 迁移预览的每个节点多了 `choices`（目标版本里同类型的节点），对不上的可以在 `migrate` 的 `nodes` 里手动对应。
  - 客户端：端点读参数时也把时刻还原成 `Date`（之前参数里的 `Date` 到引擎不是 `Date`）。
  - 新表、新列（`flow_notification`、`flow_proxy`、`flow_work_item.proxy_for`）：已有的库要补上（`createTables` 只建缺的表，不补列）。

## 0.19.0（2026-11-08）

- `useFormDialog`（`/patterns`）：下拉字段的选项可以写 `group`，同组的归在一个组标题下（如选人按部门分组）；
  多选字段（`multiple: true`）的 `defaultValue` 可以给数组，打开时就选好这些。

## 0.18.0（2026-11-08）

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

## 0.17.0（2026-11-08）

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

## 0.16.0（2026-11-08）

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
- 交互状态补齐：可选中的 Tag 悬停时叠一层 8% 的文字色（原来没有悬停反馈）；可移除的 Tag 的移除按钮悬停、按下的底色取标签的文字色
  （原来是灰色，彩色标签上不协调）；`tone="muted"` 的 Link 悬停时换成正文色（`underline="none"` 的导航链接原来没有悬停反馈）。
  Splitter 的分隔条悬停、拖动时线从 1px 加粗到 3px 并变深，键盘聚焦时加粗成强调色（同 ResizeHandle，去掉了原来贯穿整栏的焦点框）；
  Splitter 与 ResizeHandle 拖动中带 `data-dragging`，指针离开了也保持高亮。
- 暗色主题的实色悬停改成调亮（原来调暗，在深色背景上看不出悬停）：dark 的 `accentHover` `#3758d4` → `#4a6ddf`，dark、midnight、ember、
  cyberpunk 的 `dangerHover` `#a33b3e` → `#bd5356`，白字仍有 4.6:1。midnight 的品牌色、big-screen 的危险色白字已贴着 4.5:1，仍是调暗。
- 输入法：NumberField 在组合中的 ↑ ↓（选候选）不再加减、Enter（上屏）不再提交；Select 的搜索框在组合中按退格不再删掉已选的项。
- 列表行（Listbox、Tree、Cascader、NavList、Menu）的高亮、已选、当前、不可用改成跟着元素上的属性走（条件别名）：
  `itemStyles.highlighted / selected / current / disabled` 合成 `itemStyles.states`，元素写 `data-highlighted`、`aria-selected`、
  `aria-current`（或 `data-current`）、`aria-disabled` 即可；Listbox、Tree 的 `data-active` 换成 `data-highlighted`（Tree 只在有焦点时），
  Tree 选中的节点多一个 `data-current`；`menuItemLayer` 去掉 `disabled` 参数。外观不变，当前项悬停时文字保持品牌色。
  ItemList（`data-selected`、`data-disabled`）、NavBar（`aria-current`，下拉与“更多”按钮带 `data-current`）、按钮家族的不可用
  （`disabled` / `aria-disabled`；`buttonSx` 去掉 `disabled`）、DataTable 的已选与正在看的行（`aria-selected`、`aria-current`）、
  CalendarBoard 的选中与不可用格（不可用格多了 `aria-disabled`，悬停不再有底色）同样改了。

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
