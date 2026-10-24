# 路线图

目标：把组件库做到成熟可用（1.0）。达到的标准是分层清楚、API 一致、基础设施完整、后台业务常用的组件齐全，每个组件都达到
COMPONENTS.md §8 的完成标准，可以发布。主会话在 master 上单线程推进，每完成一块就提交、推送，并在这里勾掉。

2026-10-23 起联合降本管理暂停（停在 D3），先按下面的阶段 0–8 把组件库做完。依据是当天的盘点：目录与依赖、各组件的使用情况、
按 §8 的完成度、与 Ant Design（含 ProComponents）、Element Plus、Arco、Mantine、Radix / React Aria、Naive UI 的对照。

## 工作方式

- **审核与整理随做随改**：碰到的代码先看它在整体里的位置。上层组件要用好基础设施与基础组件（ButtonBase、ListPopover、
  useHoverLayer、focusRingStyles、FormValue、NumericValue、hasContent、focusControl……）。同一个逻辑出现第三次就抽出来。
  死代码、过时文件、命名不一致顺手改，整理与功能改动分开提交。整个仓库的基础设施（编译器、脚本、CI、文档站构建、各应用的接线）一起维护，
  遇到问题直接改。
- **架构意识**：同一个问题在多处出现时修根因；改公共 API 时调用方、类型、测试、文档、COMPONENTS.md 一起改，不留半截。
- **文档站同步**：动到哪个组件就在用户的 Chrome（Claude in Chrome，宽屏优先）里看它的文档页：示例饱满、贴近真实场景，
  外观、交互与 API 的灵活性不够就一起改；示例里重复出现的写法抽成组件或工具。
- **验证**：本地只跑与改动相关的检查与测试，放后台；全量测试、浏览器测试交给 CI。检查链用 `&&` 串起来，不用管道吞掉退出码。
  推送前看一眼上一次 CI。

## 现状

- tsx 包：符文编译器、运行时、Vite 预设、StyleX 类型入口完整；整个仓库只用 TypeScript 7.1 beta（类型检查、声明生成、脚本的 API、语言服务）。
- ui 包：约 168 个组件、102 个文档页、343 个示例；12 套主题、主题编辑器、设计令牌导出、语言包与格式化、路由适配、请求层。
  模块之间没有循环依赖。清单见 HANDOFF.md §1，各批的设计与取舍见 COMPONENTS.md §10。
- 盘点出的问题（阶段 0 处理）：目录按文档分类而不是按层分，配置层里放着界面组件（ThemeSwitcher、ThemeCustomizer），
  布局与反馈目录里放着依赖导航、浮层、输入的页面级组合（AppShell、PageHeader、NotificationCenter）；主入口混着通用组件、
  页面级组合与领域 / 展示组件（流程、视觉效果、Marquee、SlideVerify）；子路径要在五处分别登记。
- 完成度（阶段 8 补齐）：类型测试几乎没有；约 20 个有键盘逻辑的组件没有专属浏览器测试；输入法只测了 TextField；
  ActionBar、FormSection、ModalCore 没有文档页。

## 分层

```
扩展（子路径：只依赖核心与基础设施，彼此不依赖，workflow → patterns 这类显式登记的除外）
  /patterns  /workflow  /charts  /three  /effects  /xlsx  /theme-customize  /docs-kit  /shiki  /vue-router
核心（主入口：按分类目录放，与文档站的分类一致；目录之间可以互相用，模块之间不能有环）
  base  layout  display  feedback  overlay  navigation  input  date  form  table
基础设施（不渲染界面）
  utils/（data、dom、motion、style、virtual、request）  config/（context、defaults、theme、lang、query-state）
```

核心不强行再分层，同 Ant Design、Mantine、Element Plus 的核心包（平铺），页面级与领域组件放扩展（同 ProComponents、
`@mantine/notifications` 这类扩展包）。`pnpm layers:check` 检查四条规则：

1. 基础设施在运行时不导入组件（只导入类型可以：组件默认值、语言包的文案类型）
2. 核心不导入任何扩展
3. 扩展只依赖核心与基础设施，扩展之间的依赖要登记
4. 模块之间没有环

## 阶段 0：整理（只动结构与登记，不加功能）

- [x] 子路径只在 package.json 的 `exports` 里登记：Vite 的构建入口、`pnpm exports`、文档站的 API 表与两个演练场都从它读
      （演练场漏登记时 page-imports 测试报错）；`pnpm exports` 同时生成各子路径的 index.ts（保留开头的说明），名字在所有入口里全局唯一；
      `pnpm move` 挪完自动改应用里的入口导入（entry-imports.mjs）；文档页顶部的导入文字由 page-imports 测试检查
- [x] `pnpm layers:check`（进 `pnpm check` 与 CI）
- [x] `@vue-tsx-pro/ui/patterns`（页面组合）：AppShell（Brand 并入为 AppShellBrand）、ActionBar、FilterBar、NotificationCenter、
      KanbanBoard、DeadlineBadge（原 DeadlineTag）、ThemeSwitcher、useFormDialog；文案进 patternsMessages；文档站加“页面组合”分类。
      PageHeader 删除（占一整块却没几项信息，页面里直接用 Breadcrumbs、标题与操作排）
- [x] `@vue-tsx-pro/ui/workflow`：流程定义、校验、排布、运行时与 FlowDiagram、ApprovalActions、useWorkflowTimeline。
      WorkflowTimeline 并进 Timeline：流转记录由 useWorkflowTimeline 写成 Timeline 的各项，Timeline 加 `reverse`（新的在前）
- [x] 对话框的 onConfirm（Dialog、Drawer、AlertDialog 共用“取消 / 确认”、等待与失败留着）：AlertDialog、useFormDialog、
      ApprovalActions 改用它（取代原计划的“ApprovalActions 改用 useFormDialog”：业务字段与附件放不进 useFormDialog 的字符串字段）
- [x] `@vue-tsx-pro/ui/effects`：BorderBeam、SpotlightCard、TiltCard、Marquee；删除 SlideVerify
- [x] ThemeCustomizer、ThemeThumbnail 与主题定制的工具收成 `theme-customize/` 目录；ColorSwatch 进 `/docs-kit`
- [x] StatusDot 挪到 base；`Modal.tsx` 改名 `ModalCore.tsx`；内容判断统一用 hasContent（36 处 `!= null`）。
      决定保留：Collapsible 不并入 Collapse（一个是动效原件、一个是 Disclosure 模式，合并后 Collapse 有两种根结构）；
      Result 不建在 Empty 上（会吃到 defaults.Empty 的尺寸，重复的只是几十行排版）
- [x] 测试按组件拆对（Timeline、Toolbar、Steps 各自一个文件），host-demo 的 `/pilot` 与 `pilot.*` 改名 `/integration`、`integration.*`
- [x] 文档页补齐：FormSection、ActionBar、useFormDialog、Drawer（之前只在 Dialog 页里）、NotificationList；挪过的页面组合逐页在 Chrome 里看过、示例重做成整行与真实数据。
      ModalCore 是内核，不单独成页（Dialog、Drawer 的属性表里已有它的全部属性）
- [x] COMPONENTS.md §7 写上分层与目录、§8 完成标准按现状修订；PLAN §2、HANDOFF 同步
- [x] 降本案例跟着改导入与用法，不报错（暂停期间只保证这一点）

## 阶段 1：基础设施（后面阶段要用的工具先铺好）

- [x] 整个仓库只用 TypeScript 7.1（去掉 TS 6）：解析源码的脚本、文档站的 API 表改用 7.1 的 API，语言服务 MCP 改接 TS 7 自带的语言服务器
      （API 表的属性改按源码声明顺序排；建程序从几秒降到约 1 秒）

- [x] `useSortable` 多容器分组：列内排序 + 跨列（KanbanBoard 已改建在它上面，加了列内排序 `onReorder` 与落点插入线；Tree、Transfer、Tabs 的拖动也用）。
      顺手修复：指针捕获放在按下的项上，排序时 Vue 移动 DOM 让它失去捕获，向前拖动会被当成取消；`startMove` 加 `captureTarget`，排序改在容器上捕获
- [x] `useOverflowItems`：量出放得下几项，其余折成 +N（Select / TreeSelect 的 maxTagCount、Tabs 溢出、横向导航、Toolbar 做的时候直接用）
- [x] `useIntersectionObserver`（ActionBar、3D 画布已改用；Affix、BackTop、图片懒加载做的时候直接用）
- [x] 树工具：`filterTree`、`moveNode`、勾选策略 `checkedByStrategy`（只返回父 / 子 / 全部）、路径 `treePath`；`flattenTree` 的第 4 个参数改成选项（`order`、`include`），getKey 的位置参数统一按数据里的位置
- [x] 表单：`form.validate(paths)` 局部校验、字段联动 `dependencies`（改 A 时校验 B，B 的单字段校验也重跑）；文档站加了分步填写的示例
- [x] `usePanZoom`（建在 startMove 上）、二维方向键导航 `gridFocus`（表格网格、整页日历）、`ControlGroup` 组合输入（`AttachedContext` 与 ButtonGroup 共用）。
      顺手修复：相连的组里首尾的外侧圆角一直是 0（StyleX 里条件值写 null 不会撤销 default），选择框的弹出面板是兄弟元素时首尾判断错位
- [x] 拼音匹配：子路径 `@vue-tsx-pro/ui/pinyin` 的 `createPinyinMatcher()`（pinyin-pro，可选 peer 依赖），交给 createUi / Provider 的 `textMatcher`；
      Select、Combobox、TagsInput、TreeSelect、CommandPalette 经 `useTextMatcher()` 取用，文档站已开启
- [x] `useDismissible`：Tag、Alert 已改用（先离场、焦点移到相邻元素、离场后才报告），Banner 做的时候直接用

## 阶段 2：小组件

- [x] 反馈：Popconfirm；Toast 的 `success()` / `error()` / `loading()`、去重的 id、关闭回调；Progress 的环形与目标刻度
      （分段由 ProportionBar 负责）；Result 的 403 / 404 / 500；页面级的 Banner；`useConfirm` 的必填理由（`reason`，得到填的理由）
- [x] 输入：Autocomplete（值就是文字）、OtpField、InputGroup（由阶段 1 的 ControlGroup 承担：币种 + 金额）、格式化输入（TextField 的 format：手机号、证件号、银行卡号；phoneSchema、idCardSchema）、
      CheckboxGroup / RadioGroup 的 items（Checkbox、Radio 加了 description）、NumberField 与 Textarea 可清空、Rating
- [x] 展示与布局：Ellipsis（溢出才出提示、可展开）、Affix、BackTop、Watermark、LoadingBar（路由切换的进度条）

## 阶段 3：选择与日期

- [x] Select 的 maxTagCount 与逐个删除、可新建选项
- [x] Cascader（级联：路径显示、只选叶子、远程加载）
- [x] TreeSelect 的勾选策略与 maxTagCount；Tree 的拖拽移动与搜索过滤
- [x] Transfer（穿梭框，含树形）
- [x] DatePicker 的季、周、快捷项与“今天”、禁用的时间段；DateRangePicker 的月、季、年与日期时间区间、自定义快捷区间
- [x] 整页 Calendar（单元格渲染：排班、节假日、日程）：CalendarBoard

## 阶段 4：导航与外壳

- [x] Tabs 的溢出、可关闭、新增、拖动（路由页签）
- [x] NavList 收起成图标栏（悬停弹出子项）、条目角标；横向导航（顶部菜单，放不下收进“更多”）：NavBar
- [x] AppShell（patterns）：页脚、可收起侧栏、顶部与混合布局、页签区（PageTabs；路由用 useRouteTabs）
- [x] PaginationBar：总数 + 每页条数 + 页码 + 跳转（三处页面在手写这一组）
- [x] 命令式 `useDialog` / `useDrawer`；`onOpenChange(open, { reason })` 统一

## 阶段 5：表格与表单

- [x] 表格：表头筛选、多列排序、列菜单（显隐、固定、拖动）、网格方向键与单元格编辑（行校验）、行拖动、
      静态表格的合并单元格、列定义驱动的静态表格
- [x] QueryTable（patterns）：FilterBar + DataTable + 工具栏（密度、列设置、刷新、全屏）+ useTableQuery
- [x] 表单：错误汇总、跨字段联动校验、`form.Field` 自动绑定值；StepsForm（patterns）
- [ ] Excel：子路径 `/xlsx`（分组表头导出成合并单元格；读多行表头、展开合并、单元格内换行拆行）；
      DataImport（patterns：选文件、列对应、逐行校验、预览、确认）

## 阶段 6：展示与协作

- [ ] Image 与 Lightbox（缩放、旋转、拖动）→ Upload 的图片墙（预览、排序、粘贴）
- [ ] Descriptions 的自适应列与复制
- [ ] Timeline 升级：操作人、折叠、项里放字段差异（倒序 `reverse` 已有）
- [ ] FieldCompare（建在 diffFields 上）、CommentThread 与 Mentions（patterns）
- [ ] 完成清单重新设计（原 Checklist 删除：只有勾与日期，信息太少；降本案例暂用 shared/Checklist 的副本）
- [ ] FlowDesigner（workflow：流程图上选节点，属性面板改处理人、时限、超时、提醒，校验后发布）

## 阶段 7：图表

- [ ] 标注、组合图（柱 + 线，双轴）、100% 堆叠
- [ ] 热力图 / PivotTable、Gauge、Sparkline（Stat 里用）、TimelineChart
- [ ] 雷达、矩形树图、缩放、导出图片与数据；地图（TopoJSON、Leaflet）排在最后
- [ ] 浏览器测试补上 Area、Scatter、Donut、Sankey、Chord、Funnel、Graph、Waterfall；部件属性的示例

## 阶段 8：质量与发布

- [ ] §8 的矩阵进 COMPONENTS.md，逐个补齐：
  - 有键盘逻辑、没有专属浏览器测试：Accordion、KanbanBoard、Splitter、ResizeHandle、ColorField、NumberField、
    NumberRangeField、TreeSelect、NotificationCenter、Checkbox、Switch、ToggleGroup、Drawer 的拖宽与 beforeClose
  - 输入法：Combobox、TagsInput、NumberField、Textarea、DateField、CommandPalette 的过滤框、Select 的按字母跳转
  - 类型测试：选择类、表格、表单与可绑定值的组件
  - 文档页没有键盘一节：AppShell、NotificationCenter、ResizeHandle、ModelViewer
- [ ] 视觉回归进 CI（`docs:shot` 的截图对比）
- [ ] 文档站：搜索 API 的属性名；每页一节无障碍说明（角色、键盘、读屏）；示例切换视口、从右到左、密度
- [ ] 发布：放宽 Vite 的 peer 范围、changesets、发 0.x；API 稳定后 1.0（发布产物验证 `test:consumer` 已有）

每个阶段新做的组件当场达到 §8；顺手动到的老组件一起补齐。

## 联合降本管理（`apps/cost-reduction`，暂停）

设计依据是 [apps/cost-reduction/DESIGN.md](apps/cost-reduction/DESIGN.md)。暂停期间它只跟着组件库改导入与用法，保证类型检查与 CI 通过，
不加新页面。DESIGN.md §9 里还没做的组件已排进上面的阶段：Popconfirm、Result 403（2）、DataTable 单元格编辑、xlsx、DataImport（5）、
Timeline 升级、FieldCompare、CommentThread、FlowDesigner（6）、useSortable 分组（1）。

- [x] D0 设计规格与底座；D1 流程；D2 收件箱、工作台、通知；D3 任务池（任务列表、看板、详情、信息表编辑、计划调整、DMC 审批链）
- [ ] D4 收益：收益认定、商务洽谈、一本账（时点）、差额分析；Excel 导入导出
- [ ] D5 渠道一：建议列表、提交建议、建议详情、测算表单与版本对比、协商
- [ ] D6 渠道二：方案列表、新需求、方案详情；供应商门户
- [ ] D7 测算公式与参数、储备库与匹配推送、降本明细两页
- [ ] D8 统计分析四页；基础数据、系统管理（流程配置、工作日历、分级授权、提醒、日志）
- [ ] 降本的 Figma 界面：Figma MCP 的月度额度恢复后再画，以 DESIGN.md 与做好的页面为蓝本

## 已知局限（有意的取舍，写在文档里）

- VirtualList 不支持从右到左时的横向滚动（scrollLeft 为负）
- Toolbar 里嵌套的 ToggleGroup 各有一个 Tab 位置，没有并入工具栏的方向键移动
- Pagination 的页码之间用 Tab 切换，没用漫游焦点（分页没有 ARIA 复合角色）
- 虚拟化的选项列表里分组标题只是视觉上的一行，组名经 aria-describedby 念出
- 表格是 table 语义，不是 grid：没有单元格之间的方向键导航（阶段 5 排了）

## 附：已完成

2026-10-22 的全站审查在 [.claude/reports/audit-2026-10-22.md](.claude/reports/audit-2026-10-22.md)。下面保留当时每一项的做法与“决定保留”的理由，
之后改到相关代码时先看这里。之前的“组件补齐”清单已并进阶段 2–6，图表并进阶段 7，质量与发布并进阶段 8。

### A. 审查整改（2026-10-22）

已修复（2026-10-22）：

- 29bf5f2：表单校验、数字输入、选择类控件、滚动区域、几处错误处理。
- 584c4ed：编译器的渲染优化与解构赋值、stylex.attrs 的注入问题。
- 60121f6：路由地址的解析与分页链接。
- c6b5011：表格的合计与数字排序、基础设施。
- e0944b8：死代码与过时注释。

#### A.1 API 统一（公共契约，一类一次改完：调用方、文档、测试同步）

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

#### A.2 复用与整理

- [x] 浮层：Tour 与 ModalCore 共用打开流程 `openModalDialog`（utils/dom/overlay.ts），Tour 补上锁定页面滚动
- [x] 选择类：日期面板、TreeSelect、ListPopover 共用 `anchoredPanelSx(size)`（定位、表面、字号、进出场），日期面板跟着 size。`SelectTrigger` 只有 Select 与 TreeSelect 两处，按三次再抽的约定暂不抽
- [x] 外链的 target、rel 收成 `externalLinkAttrs`（utils/dom/link.ts），Link、LinkButton、IconLinkButton 共用；图标与读屏提示各组件不同，留在原处。
      决定暂缓 `useDismissible`：先离场再交给使用方移除的只有 Tag、Alert 两处（Toast 由控制器管），§3 加 Banner 时再抽
- [x] 输入：清空按钮 `controlClear()`（七处）；组的名称 `labelledByField()`（使用方写了 aria-label 时不再指向 Field 的标签，八处）；
      `fullIsoDay`（DateField、DatePicker）、`toTime`（TimeField、TimePicker）各一份
- [x] 数字：按语言解析数字移出 NumberField（`utils/data/number-parse.ts`，数字符号按语言缓存）；格式化、文字比较、数字解析的 Intl 对象共用 `cachedIntl`
- [x] 工具：手写的 clamp 十处改用 `clamp`；`visibilitychange` 三处改用 `usePageVisible`；方向键 × RTL 七处改用 `inlineArrows`；
      MenuTriggerProps 继承 TriggerProps。决定保留：toArray 剩三处、语义各不相同（null 算不算一项、要不要复制）；
      Tooltip 与 HoverCard 的触发器属性只有两处（并入 §1.3 的触发器写法）
- [x] 组合式函数的清理一律 `onScopeDispose`（九处 onBeforeUnmount：effectScope 里也能用，组件里同样在移除 DOM 之前执行）。
      决定保留两种返回：单个值返回 `Readonly<Ref>`（useMediaQuery、useNow、usePageVisible，同 VueUse），状态加方法返回带 getter 的控制器（RUNES §7）
- [x] 内置主题的登记：themes:check 从 builtin.ts 读出主题文件（不再另抄一份表）；boot.ts 的底色、ThemeSwitcher 的图标、
      语言包的名字都按 `BuiltinThemeName` 写成完整的表，加主题时漏了类型检查会报错。底色仍在 boot.ts 抄一份：它要在 Node 里跑、不能带 StyleX
- [x] 静态 Table 与 DataTable 共用的外观移到 table-styles.ts（Table 不再连带打包 DataTable 的视图）；MenuItem、MenuCheckboxItem、
      MenuRadioItem 共用 `useButtonItem`。MenuSub 的触发项要管子菜单的打开与安全三角，与它们不同，不合并
- [x] 3D：一列颜色变成主题色的写法（四处）收成 setup 上下文的 `themeColorList`；Globe 改 landColor、markerColor 不生效（不在 sceneKey 里）。
      决定保留：Unovis 容器的生命周期两份对应两种容器（XYContainer 给直角坐标图、SingleContainer 给其余），各自已被同类图表共用；
      四类图表的公共属性说明里带着各自的默认高度、骨架形状与格式的用处，不合成 `ChartCommonProps`
- [x] Lang 只留通用组件的文案；主题编辑器与文档站组件各带中英文的文案表，`useMessages` 按语言代码取、退到同语种再退到英文
      （同 React Aria），改写或补语言写在 `lang.messages`，`defineLang` 按组件合并
- [x] CodePreview、PropsTable、CodeGroup 挪到子路径 `@vue-tsx-pro/ui/docs-kit`。决定保留在主入口：CodeBlock、
      TableOfContents、Pager（帮助中心、文章页也用）；顺手把 SelectionBar 里有意只取初始值的读取写成 `_untrack`
- [x] 脚本：`scripts/lib/repo.mjs`（`root`、`requireFrom`、`parseSource`），十二个脚本不再各算根目录、各自建 require；
      没登记的三个登记成 `pnpm move`、`gen:globe-land`、`gen:trophy`（重跑结果与仓库里的一致）；五个已合并的旧 worktree 与分支删掉

#### A.3 行为与无障碍

- [x] 按钮不可用时不响应悬停（按钮家族、itemStyles.hoverable）
- [x] forced-colors（Windows 高对比）：Separator、Progress、Indicator、Skeleton 用边框或系统色
- [x] 共用的读屏播报 `announce`（utils/dom/announcer.ts，常驻的 polite / assertive 区域，模态打开时挂进去）：Select、
      Combobox 的结果条数与“没有匹配”（`useResultAnnouncement`）、SelectionBar、CopyButton 改用它；常驻的播报区（Sortable、Upload…）不动
- [x] 内部部件跟随根上的 size：新增 `relativeFontSizeStyles`（相对所在字号的 em 档位）；Result 标题、Progress 标签、Alert 关闭按钮、
      ActionBar、Separator、PageHeader 的说明不再写死 token 字号
- [x] 部件属性补齐：PageHeader 的标题块 / 标题文字 / 标题一行、Progress 的标签行、AppShell 的 header 内容格 / 主体 / 两个滚动区域、
      IconButton 与 IconLinkButton 的内容层、Indicator 的计数、Toaster 的 Collapse
- [x] DataTable：单选用单选框（DataTableView 提供 RadioGroupContext，不用包一层元素；文档加“单选”示例）；调整非固定列的宽度时
      各行不再重渲染（固定列偏移没变就沿用，render-counts 有回归测试）。行模型只在 columns 的引用变了才重算，列定义放在 setup 里即可（HANDOFF 已写）
- [x] 漫游焦点不收容器里弹层（popover、dialog）的项；Popover、Menu 的面板写了 aria-label 时不再加默认的 aria-labelledby
      （`defaultLabelledBy`，与 Field 的控件共用）；同一按钮套 Tooltip 与 Menu 用 `mergeProps` 合并触发器属性（文档示例）
- [x] Steps：current 可绑定、`navigable` 点回已完成的步骤（替代 onStepChange）；每步的 `status`（替代 error）与 `href`（已完成的是链接）；
      竖排有连接线；已完成、未开始、出错有读屏文字（`lang.stepState`）
- [x] Tree：loading（骨架行、aria-busy）与 empty、checkStrictly；TreeDataTable 多选默认父子联动（父行半选，DataTableView 加 `partialKeys`）、
      checkStrictly 与 manualSort
- [x] 日期：字符串的 min / max 带时间时日历按日期部分禁用；表单重置时分段丢掉半截输入（新增 `resetCount`、`useFormReset`）；
      年份打满四位或离开这一段才写回；分段里按 Enter 写回并提交所在的表单
- [x] TagsInput 失焦时把文字加成标签（`acceptOnBlur`，默认 true，同 Mantine）；Upload / FileDrop 读 Field 的只读与不可用、
      已有文件时不再原生必填；Label 的 for 指向组时点击聚焦组里第一个控件（focusControl 先判断能否聚焦）
- [x] Toast：只给显示出来的（最新的 max 条）计时（控制器的 `setLimit`）；`important` 打断播报（aria-live="assertive"，同 Sonner）；
      Progress 的不确定动画跟随从右到左
- [x] reveal.ts：去掉默认淡入淡出的样式只对转场期间的根元素生效（不再关掉宿主自己的 View Transitions），跳过的转场不报错、
      时长用 parseDuration；主题定制的圆角按这套主题自己的取值缩放（`themeValues` 在页面里量，量不到时按默认值）

#### A.4 编译器（tsx）

- [x] `_effect` / `_effect.pre` 在服务端不执行（Vue 会立即执行 pre 的 watchEffect）；const 的状态在函数体里读取不再警告；
      `n++` 这类既读又写的不再出没有位置的警告
- [x] 渲染优化遍自底向上汇总：每个元素退出时记下引用到的外部变量，外层直接用；200 层嵌套从约 7.6 秒降到 0.3 秒（有回归测试）
- [x] token 写法认 as const 等类型外壳与按条件返回的动态样式；模板字符串、写在 create 外面的对象里的 token 写法报错（不再静默留下 `'_lg'`）；
      `_derived` 里修改状态、`_untrack(() => x)` 报错
- [x] `snapshot` 复制 Map、Set、类型化数组与 ArrayBuffer；解构的 `_derived` 只解构一次（默认值不再按变量各执行一次）；
      `_bindable` 的受控判断不再每次读取都做连字符转换。决定保留：`_bindable` 的默认值只在创建时求值（它是组件自己的状态），RUNES §5 写清
- [x] 热更新：模块还导出了组件以外的值时，接住更新后 invalidate，导入方重新执行拿到新值；工厂函数做的组件（大写开头、由调用得到）
      运行时确认是组件才登记、才热替换（同 React Refresh 的判断），不是组件时也按组件以外的值处理
- [x] 编译缓存的键只算 stylex 目录里的 token-map；StyleX 路径解析按进程缓存 package.json 与包根目录；
      语言判断（`languageOf`，含单文件组件的 lang 查询参数）与 StyleX 导入来源（`STYLEX_SOURCES`）各只定义一处，
      compile 总认官方包与本包入口，使用方的 importSources 加在后面（Vite 预设、演练场不再各写一份）

#### A.5 文档与案例

- [x] 过时文档：COMPONENTS.md（目录与子路径、拖拽排序、图表与 3D 清单、演练场的编译、§10 各节的状态与“以后再加”）、
      RUNES.md（`_untrack`、函数绑定、运行时清单、编译期报错补上 `_derived` 与 token 写法）
- [x] 组合用的底层组件补上 API 表（CalendarView、DateSegmentGroup、SegmentedField、DataTableView、ColumnResizer、EffectSurface、
      Label、ListPopover、ListboxView），API 表的说明改取组件自己的注释；TreeSelect 补“外观与状态”（isDisabled、图标、外观、必填、只读），
      DateRangePicker 补 valueType、必填、图标与圆角。决定不补：DataTableRow 这类渲染单元；PageSizeSelect 这类继承来的属性不逐个演示
- [x] 案例：日期用组件库的 `shiftIsoDate`、`daysBetween`；两种降本类型的名称、编码表头、单位与格式合成 `costKinds`，台账只传类型；
      两个编辑页共用 `task-form.ts` 的字段与条件必填；DmcEditor 的实施节点用 `form.array`（删行时错误跟着移动）；
      铺满视口的高度读 `layoutVars.stickyOffset`（新子路径 `@vue-tsx-pro/ui/vars.stylex`，主入口不再导出它）；看板用 Grid；
      图表示例的真实机型名换成“机型 A / B”

#### A.6 审查余项

- [x] 剪贴板：没有 Clipboard API（内网常见的 http 部署）时退回 execCommand，焦点还给按钮，模态对话框里也能复制（同 VueUse 的 legacy）
- [x] `themeTransitionOrInstant` 只在读不到 token 时直接到位，token 格式写错照常报错（新增 `tokenValue`）；
      `downloadFile` 过一会儿再回收地址（Safari、Firefox，同 FileSaver.js），BOM 由调用方加的说明改对
- [x] `toElement` 从 overlay.ts 挪到 utils/dom/element.ts（十几个模块只为它导入浮层工具）；selection、text、layout-batch、
      download 补上单元测试。决定保留：utils 读主题与配置（动画时长、波纹、路由），模块图里没有环（271 个模块、1117 条边）；
      culori 按需注册颜色空间；date.ts 解析返回 null、运算抛 RangeError 的约定写进文件说明；floating、resize、hover-layer、
      pointer、reveal、sortable、use-virtualizer 由组件与浏览器测试覆盖，不另写

### B. 基础设施（2026-10-22）

- [x] 请求层：`HttpClient` 接口（只有 request，axios、ky 包一层即可）经 createUi / Provider 的 `http` 给出，`useHttp()` 取它；
      `createHttpClient` 是原生 fetch 的薄封装（baseURL、query、JSON 体、超时与取消、`HttpError`、onRequest / onResponse 拆包）；
      `useRequest` 只采用最后一次、取消上一次、参数防抖与去重、保留旧数据、mutate；“请求与数据”指南连着内存里的假接口演示。
      `sameValue`（结构相等）从 useForm 挪到 utils/data/equality.ts 共用
- [x] 列表查询 `useTableQuery`：页码、条数、排序、已应用的条件、总数、加载与出错一起管（建在 useRequest 上）；page、pageSize、sort
      直接 _bind 到 Pagination、PageSizeSelect、DataTable；换排序、条数、条件、params 回到第一页且只请求一次，当前页空了退到最后一页；
      降本台账改用它（删掉手写的请求编号与侦听）
- [x] 地址里的状态：`UiRouter.query` / `replaceQuery`（vueRouterAdapter 实现，同一轮的写入合并成一次 replace）；
      `useQueryState`、`useQueryStates`（本地为准、双向同步、等于初始值不写、按初始值类型读写，`queryCodecs`）；
      useTableQuery 的 `syncToUrl`（page、pageSize、`sort=-key`、筛选条件）。降本台账、收益确认、价值台账、详情与编辑页改用它，
      删掉文档站自写的 useCaseQuery，useCaseNavigate 改走路由适配
- [x] 远程选项：Select、Combobox、TreeSelect 的 `load(搜索词, signal)`（打开时请求、输入停下 300 ms 再请求、只采用最后一次，
      共用 remote-items.ts）；Select、TreeSelect 的 `search` 可绑定、`filter={false}`；Upload 的 `action` 走 createUi 的 http；
      useRequest 加 `enabled`
- [x] 工作日与时限：`createWorkCalendar`（周末、节假日、调休补班）经 createUi / Provider 的 `workCalendar` 给出，
      `useWorkCalendar()` 取用；`workdaysBetween`、`addWorkdays`、`deadlineOf`（截止日、剩余工作日、五种状态）。
      决定不另做 useDeadline：纯函数加 useWorkCalendar 已经够用；降本案例的认定时限改用它
- [x] 字段差异 `diffFields`：两份记录按字段比较（结构相等），数值字段给出精确的差（Decimal、bigint 不经过浮点）与变化率；
      字段与顺序由 keys 决定，FieldCompare 之后用它
- 跨容器拖动：`useSortable` 加分组移到阶段 1（看板的跨列移动已由 KanbanBoard 解决）
- [x] 通知控制器：决定不另做 `createNotifications()`，NotificationCenter 只管显示，通知的存取、已读由应用决定（D2）
- [x] 持久化状态 `usePersistentState`（参考 VueUse useStorage）：JSON、类型不对用默认值、对象按字段合并、存不了只在这次有效、
      别的标签页改了跟着变；文档站的侧栏与主题设置改用它（删掉 site/sidebar.ts），台账记住隐藏的列
- [x] 导出 CSV `tableToCsv`：从列定义生成（RFC 4180 转义、BOM、状态名与列格式同界面、分组表头、raw 原值、防公式注入）；
      台账的“导出所选”用它（跨页所选、显示着的数据列）
- [x] 通用钩子 `useEventListener`（作用域销毁时移除、getter 目标换绑、服务端什么都不做），页面可见性、快捷键、指针、
      离开确认、目录高亮、持久化状态六处改用它。决定不做：useDebounce（防抖在 useRequest 里，别处的延时语义各不相同）、
      useIntersectionObserver（只有 ActionBar 与 3D 两处，到第三处再抽）
- [x] 快捷键：序列键（`'G I'`，1.5 秒内，序列优先于单键）、`target` 限定区域、模态对话框打开时页面级的只认对话框里的按键、
      解析结果按平台缓存；序列键的 Kbd 照常给读屏念（aria-keyshortcuts 表达不了序列）。
      离开确认挪到 form/，`UiRouter.beforeLeave` 接上路由守卫（vueRouterAdapter 实现，只换 query、锚点不问）：
      有改动时站内跳转弹确认对话框，注册示例与两个编辑器用 `form.dirty && !form.submitting`
- [x] zod 的报错跟随语言包：useForm 按语言包给 zod 传错误文案，空值是 `lang.formRequired`，其余是 `lang.formIssues`（zod 自带的语言包）；
      createContext 在 setup 之外读取时直接用 fallback
