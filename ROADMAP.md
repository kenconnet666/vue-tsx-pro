# 路线图

目标：把组件库做到成熟可用（1.0）。达到的标准是 API 一致、基础设施完整、后台业务常用的组件齐全，每个组件都达到
COMPONENTS.md §8 的完成标准，可以发布。主会话在 master 上单线程推进，每完成一块就提交、推送，并在这里勾掉。
2026-10-22 的全站审查结果在 [.claude/reports/audit-2026-10-22.md](.claude/reports/audit-2026-10-22.md)，下面 §1 的条目都来自它。

## 工作方式

- **审核与整理随做随改**：碰到的代码先看它在整体里的位置。上层组件要用好基础设施与基础组件（ButtonBase、ListPopover、
  useHoverLayer、focusRingStyles、FormValue、NumericValue、hasContent、focusControl……）。同一个逻辑出现第三次就抽出来。
  死代码、过时文件、命名不一致顺手改，整理与功能改动分开提交。
- **架构意识**：同一个问题在多处出现时修根因；改公共 API 时调用方、类型、测试、文档、COMPONENTS.md 一起改，不留半截。
- **宽屏优先**：在用户的宽屏 Chrome（Claude in Chrome）里看效果，先保证宽屏占满、好看，再顾窄屏。
- **验证**：本地只跑与改动相关的检查与测试，放后台；全量测试、浏览器测试交给 CI。检查链用 `&&` 串起来，不用管道吞掉退出码。
  推送前看一眼上一次 CI。

## 现状

- tsx 包：符文编译器、运行时、Vite 预设、StyleX 类型入口完整；日常修补（§1.5）。
- ui 包：约 190 个组件，分基础、布局、展示、反馈、浮层、导航、输入、日期、表单、表格、图表（子路径）、3D（子路径）、配置。
  另有 12 套主题、主题编辑器、设计令牌导出、语言包与格式化、路由适配。清单见 HANDOFF.md §1。
- 文档站：每个组件一页（示例、API 表、键盘），指南（快速开始、主题定制、设计资源、演练场），降本管理整页案例。
- 已完成的大块（细节见提交历史与 COMPONENTS.md §10）：主题定制页；文档两轮补齐；内置值类型（Decimal、bigint、日期）；
  日期组件三层；3D 与效果；图表 P0–P2 前半（Bar、Line、Area、Scatter、Donut、Sankey、Chord）；开发体验与性能。
  降本案例 M1、M2、M5 也已完成，进度见 §4。

## 1. 审查整改

已修复（2026-10-22）：

- 29bf5f2：表单校验、数字输入、选择类控件、滚动区域、几处错误处理。
- 584c4ed：编译器的渲染优化与解构赋值、stylex.attrs 的注入问题。
- 60121f6：路由地址的解析与分页链接。
- c6b5011：表格的合计与数字排序、基础设施。
- e0944b8：死代码与过时注释。

### 1.1 API 统一（公共契约，一类一次改完：调用方、文档、测试同步）

- [x] 色调：文字类的 `tone` 改用状态色调的六档再加文字专用的 `muted`（`default` → `neutral`）；Result 的 `status` 改成 `tone`
- [x] 圆角：统一一个 `Radius`（none、xs–xl、full，对应 tokens，`radiusStyles`），各组件给默认值；Alert、Card、SpotlightCard、TiltCard、BorderBeam 补上
- [x] 时长一律毫秒（BorderBeam 的 duration、delay）；BorderBeam 的光带长度改叫 `length`（`size` 只表示字号档位；SpotlightCard 的光斑半径仍叫 size，排在下一批）
- [x] 内容属性：Alert 加 `description`（两个都给时 children 是说明下面的额外内容，同 Empty、Result）。
      决定保留：Spinner、LoadingOverlay 的 `label` 是读屏文字、Progress 的 `label` 是可见标题（各自文档写清，成熟组件库也这样分）
- [x] 项的形状：都可以带 `key`（Steps、Breadcrumbs 补上）；取 key 的函数统一叫 `getKey`（DataTable 的 rowKey、VirtualList 的 itemKey）。
      决定保留：标题与说明成对的项（Steps、Timeline、AccordionItem）叫 `title`，“名称：值”的项（Breadcrumbs、Descriptions）叫 `label`
- [x] Listbox、ToggleGroup 的 `required`（必须有选中项）跟随 Field 的必填：在必填字段里最后一项不能取消，Listbox 带 aria-required；名字不改
- [x] 空值约定：单值的选择控件（Select、Combobox、TreeSelect、Listbox、ToggleGroup、RadioGroup、Accordion）没有值时也是 `null`，
      同数字、日期控件；文本框是 `''`。COMPONENTS.md §1 与 Form 文档写清与 `.nullable()` 的对应
- [x] NumberRangeField 补 size、variant、radius（两端共用）。决定保留：表单 name 跟着值的形状——NumberRangeField 的值是
      `[起, 止]`，name 也是二元组；DateRangePicker 的值是 `{ start, end }`，name 是 `startName` / `endName`（同 React Aria）
- [x] 间距：List 的 `spacing` 改成 `gap`（全档）；Flex 加 rowGap / columnGap；Heading 加 wrap / lineClamp
- [x] 枚举类取值改成带注释接口的 `keyof`：AppShell 的 sidebarMode、ButtonGroup / BarChart / Sortable 的方向、图表的骨架、
      useForm 的 validateOn。决定保留：Flex 的 `wrap`（`true` 的简写更常用）、标题级别 1–6（数字本身就清楚）、镜像原生属性的 `type`、`scope`
- [x] ComponentDefaults 补上 Progress、Indicator、Link、Empty、Result（各自的 `XxxOptions`）。决定不加 Spinner：它在按钮、Alert、
      Switch 里跟随所在文字的大小，统一的 size 会打破这一点
- [x] PageSizeSelect 的 `onUpdate` 改名 `onSizeChange`（回调统一叫 onXxxChange）。决定保留 Drawer 的 `side`（四条边，
      与浮层的定位 placement 不是一回事）；Steps 的 current 可绑定并入 §4 M3 的 Steps 升级

### 1.2 复用与整理

- [x] 浮层：Tour 与 ModalCore 共用打开流程 `openModalDialog`（utils/dom/overlay.ts），Tour 补上锁定页面滚动
- [x] 选择类：日期面板、TreeSelect、ListPopover 共用 `anchoredPanelSx(size)`（定位、表面、字号、进出场），日期面板跟着 size。`SelectTrigger` 只有 Select 与 TreeSelect 两处，按三次再抽的约定暂不抽
- [x] 外链的 target、rel 收成 `externalLinkAttrs`（utils/dom/link.ts），Link、LinkButton、IconLinkButton 共用；图标与读屏提示各组件不同，留在原处。
      决定暂缓 `useDismissible`：先离场再交给使用方移除的只有 Tag、Alert 两处（Toast 由控制器管），§3 加 Banner 时再抽
- [x] 输入：清空按钮 `controlClear()`（七处）；组的名称 `labelledByField()`（使用方写了 aria-label 时不再指向 Field 的标签，八处）；
      `fullIsoDay`（DateField、DatePicker）、`toTime`（TimeField、TimePicker）各一份
- [ ] 数字：按语言解析数字移出 NumberField（`utils/data/number-parse.ts`，按语言缓存）；Intl 缓存合成 `cachedIntl`
- [x] 工具：手写的 clamp 十处改用 `clamp`；`visibilitychange` 三处改用 `usePageVisible`；方向键 × RTL 七处改用 `inlineArrows`；
      MenuTriggerProps 继承 TriggerProps。决定保留：toArray 剩三处、语义各不相同（null 算不算一项、要不要复制）；
      Tooltip 与 HoverCard 的触发器属性只有两处（并入 §1.3 的触发器写法）
- [ ] 生命周期一律 `onScopeDispose`；一部分钩子返回 Ref、一部分返回 getter 对象，统一成 getter（RUNES §7）
- [ ] 内置主题的元数据（名字、图标、防闪烁底色）集中到 builtin.ts，其余从它派生
- [ ] 静态 Table 的样式移到 table-styles.ts（不再连带打包 DataTable）；Menu 三种菜单项与 MenuSub 的重复
- [ ] 图表：`useUnovisContainer`、`ChartCommonProps`、骨架样式、`toggle`；3D 的 `themeColors.list`
- [ ] Lang 拆成核心与扩展（文档站、主题编辑器、PropsTable 的键不必每种语言都翻）
- [ ] 文档站用的组件（CodePreview、PropsTable、CodeGroup、TableOfContents、Pager）挪到单独的入口
- [ ] 脚本：`scripts/lib`（TypeScript 解析、仓库根目录、createRequire）；没登记的脚本登记或删掉；清理旧 worktree

### 1.3 行为与无障碍

- [x] 按钮不可用时不响应悬停（按钮家族、itemStyles.hoverable）
- [x] forced-colors（Windows 高对比）：Separator、Progress、Indicator、Skeleton 用边框或系统色
- [x] 共用的读屏播报 `announce`（utils/dom/announcer.ts，常驻的 polite / assertive 区域，模态打开时挂进去）：Select、
      Combobox 的结果条数与“没有匹配”（`useResultAnnouncement`）、SelectionBar、CopyButton 改用它；常驻的播报区（Sortable、Upload…）不动
- [ ] 内部部件跟随根上的 size（Result 标题、Progress 标签、Alert 关闭按钮、ActionBar、Separator、PageHeader）
- [ ] 部件属性补齐：PageHeader 的标题块、Progress 的标题行、AppShell 的内层与三个滚动区域、按钮的内容层、Indicator 的计数、Toast 的 Collapse
- [ ] DataTable：单选用单选框；行模型不随 columns 的引用变化重建；调整列宽时只在松手时写回
- [ ] Toolbar 的漫游焦点不进子弹层；Popover、Menu 不盖使用方的 aria-label；Tooltip 与 Menu 共用触发器的写法
- [ ] Steps：竖排的连线、状态文字给读屏、每步的 key / href / status
- [ ] Tree：loading 与 empty、checkStrictly；TreeDataTable 的勾选联动与 manualSort
- [ ] 日期：字符串的 min / max 带时间时日历也禁用；分段输入重置时清掉半截；年份输完再写回；Enter 提交表单
- [ ] TagsInput 失焦时保留文字（acceptOnBlur）；Upload / FileDrop 读 Field 的只读与不可用；Label 点击聚焦组控件
- [ ] Toast：只给显示出来的计时；important（role="alert"）；Progress 的不确定动画跟随从右到左
- [ ] reveal.ts 的转场样式只在转场期间生效；主题定制的圆角档位按主题自己的取值缩放

### 1.4 编译器（tsx）

- [ ] `_effect.pre` 在服务端不执行；警告的误报（const 的对象状态）与 `n++` 的警告位置
- [ ] 渲染优化遍改成自底向上汇总（现在对嵌套深度近似立方）
- [ ] token 写法遇到不支持的形状时报错（不静默留下 `'_lg'`）；`_derived` 里写状态、`_untrack(() => x)` 报错
- [ ] `_bindable` 的默认值随前面的 prop 更新；`snapshot` 复制 Map、Set、类型化数组；解构的 `_derived` 按变量取路径
- [ ] 热更新：非组件的导出变了时 invalidate；工厂函数做的组件也能热更新
- [ ] 编译缓存的键只算 token-map；StyleX 路径解析缓存 package.json；重复的语言判断与 StyleX 来源名

### 1.5 文档与案例

- [ ] 过时文档：COMPONENTS.md（图表清单、§7 待办、§10 里的旧说法）、RUNES.md（untrack、`_bind(get, set)`、运行时清单）
- [ ] 缺文档页或 API 表的导出（EffectSurface、ListPopover、CalendarView、DataTableView…）；示例缺的属性（TreeSelect、DateRangePicker…）
- [ ] 案例：`addDays`、`daysBetween` 换成组件库的；单位与格式的映射合成一份；两个编辑页共用 schema；DmcEditor 用 `form.array`；
      铺满视口的高度用 `layoutVars`；看板的栅格用 Grid；图表示例里的真实机型名换成虚构的

## 2. 基础设施

- [ ] 请求层：薄封装原生 fetch（baseURL、query、JSON 体、超时与取消、`HttpError`、请求与响应钩子拆后端的
      `{ code, data, message }` 包装）。组件只依赖 `HttpClient` 接口，createUi / Provider 可以换成 axios、ky 或自己的实现。
      `useRequest` 只采用最后一次、取消上一次、防抖、保留旧数据；文档站用内存里的假接口演示，加“请求与数据”指南
- [ ] 列表查询 `useTableQuery`：页码、条数、排序、筛选、总数、加载与出错一起管，联动 DataTable + Pagination + FilterBar；
      可选同步到 URL 的 query
- [ ] 远程选项：Select / TreeSelect 的搜索词交出来（`onSearch`），Combobox / TreeSelect 的 `load`；Upload 走同一个客户端
- [ ] 工作日与时限：节假日日历走 Provider，`useDeadline` 给出截止日、剩余与逾期天数、状态；`workdaysBetween`、`addWorkdays`
- [ ] 字段差异 `diffFields`：两份记录按字段比较，得出是否变化与数值差
- [ ] 跨容器拖动：`useSortable` 加分组
- [ ] 通知控制器 `createNotifications()`（与 `createToaster` 同一模式），NotificationCenter 用它
- [ ] 持久化状态 `usePersistentState`：列宽、密度、每页条数、侧栏、筛选条件（文档站的 sidebar.ts、theme.ts 改用它）
- [ ] 导出 CSV：从列定义生成（BOM、转义、列的 value 与格式）；`downloadFile` 的 BOM 说明改对
- [ ] 通用钩子：`useEventListener`、`useDebounce`、`useIntersectionObserver`（页面可见性已有 `usePageVisible`）
- [ ] 快捷键：作用域、序列键（`g i`）、预解析；离开确认接上路由守卫与 `form.dirty`
- [x] zod 的报错跟随语言包：useForm 按语言包给 zod 传错误文案，空值是 `lang.formRequired`，其余是 `lang.formIssues`（zod 自带的语言包）；
      createContext 在 setup 之外读取时直接用 fallback

## 3. 组件补齐（后台常用）

- **输入**：Cascader（级联，路径显示、只选叶子）、Transfer（穿梭框）、Autocomplete（值就是文字）、Select 的 `maxTagCount` 与逐个删除、
  CheckboxGroup / RadioGroup 的 items、拼音匹配；Upload 的已有文件（名字与地址）、超出数量的提示、图片预览与排序；
  InputGroup（币种 + 金额这类组合）、格式化输入（手机号、证件号）、OTP；NumberField、Textarea 可清空
- **日期**：DateRangePicker 的月、季、年与日期时间区间，自定义快捷区间；DatePicker 的快捷项与“今天”；禁用的时间段
- **表单**：错误汇总、跨字段联动校验、`form.Field` 自动绑定值
- **反馈**：Popconfirm；Toast 的 `success()` / `error()` / `loading()` 与去重的 id、关闭回调；Progress 的环形、分段、步骤与目标刻度；
  Result 的 403 / 404 / 500；页面级的 Banner；带必填理由的确认（`useConfirm` 的 reason）
- **浮层**：Dialog 的 beforeClose；命令式的 `useDialog` / `useDrawer`；`onOpenChange(open, { reason })`；可拖动宽度的 Drawer
- **导航**：Tabs 的溢出与可关闭（路由页签）；NavList 收起成图标栏（悬停弹出子项）；分页组合条（总数 + 每页条数 + 页码 + 跳转）
- **布局**：Splitter（可拖动分栏、收起）、Affix、Watermark；AppShell 的可收起侧栏、页脚、尺寸属性
- **展示**：图片与预览（Lightbox）、Descriptions 的自适应列与复制、迷你图（Stat 里用）、CommentThread、KanbanBoard、FieldCompare
- **表格**：服务端模式（§2 的 useTableQuery）、多列排序、表头筛选、行点击与键盘、单元格编辑、列菜单（`DataTableColumnMenu`）、
  导出、跨页全选、列的固定与拖动、行拖动、合并单元格、网格的方向键导航、列定义驱动的静态表格

## 4. 降本管理案例（以《需求定义方案》与《信息表》为准）

需求来自《联合降本需求定义方案》与《降本项目信息表（单机 + DMC）》：两条渠道（供应商建议、项目团队方案）、任务池、一本账、
储备库，收件箱认领，测算版本与 A / B / D 值。组件尽量进组件库，业务逻辑只留在文档站的案例里；案例用虚构数据。

**页面设计**

- 原则：一个数只在一处完整展示，别处引用或跳转；统计都能点进去看明细（跳到筛好条件的列表）；编号都是链接。
  进度与计价是两个维度：任务池看进度（PEMO），一本账看钱（成本团队），交叉成矩阵，不用“其中”。
- 口径：任务池总数每个视图只出现一次；已确认收益、挂账待定、方案待定三桶互斥、加总等于总数；机会、预测、承诺、实现四种收益
  分开挂账、不跨状态合计，挂账待定写“待定价”；单机降本（万元）与降 DMC（美元 / FH）单位不同，分栏不相加；
  金额口径硬节约、成本规避、软节约分栏。
- 导航：顶栏是品牌、本页的视图页签、收件箱与我负责的任务（角标计数、点开看列表）；侧栏是盖在页面上的抽屉，按模块分组。

**里程碑**

- [x] M1 表单：长表单的布局上下文、金额格式、左标签、只读、FormSection、ActionBar；案例：单机降本编辑
- [x] M2 列表：状态映射、PageHeader、FilterBar、DataTable（合计、分组表头、列格式、行色调、展开行、列显示、固定列、滚动到行、状态列）、
      SelectionBar、TreeSelect、NumberRangeField；案例：单机 / DMC 台账、统计看板、收益认定、一本账
- [ ] M3 流程与协作：工作日与时限、Steps 升级、Timeline（操作人、折叠、倒序）、Countdown 逾期、CommentThread、带理由的确认、
      Upload 服务端文件、NotificationCenter、跨容器拖动与 KanbanBoard；案例：任务卡详情升级、工作台与收件箱、渠道一 / 二
- [ ] M4 测算与看板：字段差异、FieldCompare、WaterfallChart、FunnelChart、PivotTable、Stat 目标与下钻、XYChart 目标线与点击；
      案例：测算对比与协商、储备库
- [x] M5 设计资源：主题导出为设计令牌（DTCG JSON，Figma 变量面板原生导入）；Figma 文件里的变量、样式、图标与组件；“设计资源”指南
- [ ] M6 降本的 Figma 界面：Figma MCP 免费版的月度额度用完了，额度恢复后再画；在那之前整页示例就是蓝本

## 5. 图表

- [ ] 点击与下钻：ChartFrame 的 `onItemClick`，统计看板的柱子、环形图能点进筛好的列表
- [ ] 目标线、标注、组合图（柱 + 线，双轴）、100% 堆叠
- [ ] 新图表：WaterfallChart（A → B → D 差额）、FunnelChart、热力图 / PivotTable、Gauge、Sparkline、TimelineChart、GraphChart
- [ ] 其余：雷达、矩形树图、缩放、导出图片与数据；地图（TopoJSON、Leaflet）排在最后
- [ ] 浏览器测试补上 Area、Scatter、Donut、Sankey、Chord；部件属性的示例

## 6. 质量、文档站与发布

- [ ] 逐个组件核对 COMPONENTS.md §8 的完成标准，列成表放进 COMPONENTS.md
- [ ] 视觉回归进 CI（`docs:shot` 的截图对比）
- [ ] 文档站：搜索 API 的属性名；每页一节无障碍说明（角色、键盘、读屏）；示例切换视口、从右到左、密度
- [ ] 发布：放宽 Vite 的 peer 范围、changesets、发 0.x；API 稳定后 1.0（发布产物验证 `test:consumer` 已有）

## 7. 已知局限（有意的取舍，写在文档里）

- VirtualList 不支持从右到左时的横向滚动（scrollLeft 为负）
- Toolbar 里嵌套的 ToggleGroup 各有一个 Tab 位置，没有并入工具栏的方向键移动
- Pagination 的页码之间用 Tab 切换，没用漫游焦点（分页没有 ARIA 复合角色）
- 虚拟化的选项列表里分组标题只是视觉上的一行，组名经 aria-describedby 念出
- 表格是 table 语义，不是 grid：没有单元格之间的方向键导航（§3 表格里排了）
