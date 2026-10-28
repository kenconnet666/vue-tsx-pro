# 路线图

目标：把组件库做到成熟可用（1.0）。达到的标准是分层清楚、API 一致、基础设施完整、后台业务常用的组件齐全，每个组件都达到
COMPONENTS.md §8 的完成标准，可以发布。主会话在 master 上单线程推进，每完成一块就提交、推送，并在这里勾掉。

2026-10-23 起先按下面的阶段 0–8 把组件库做完。依据是当天的盘点：目录与依赖、各组件的使用情况、
按 §8 的完成度、与 Ant Design（含 ProComponents）、Element Plus、Arco、Mantine、Radix / React Aria、Naive UI 的对照。

2026-10-25 起为流程引擎（`flow` 仓库）做前端的底座，即下面的阶段 9；流程组件的方案在 `flow` 的 `docs/frontend.md`。阶段 8 的缺口在动到的组件上随做随补，
API 审计按“流程界面用到的先审”拆进阶段 9。

2026-10-28 起本仓库成为 TS 全栈的家，按下面的“总览”执行阶段 10–15；为什么这样做、各项取舍见 [FULLSTACK.md](FULLSTACK.md)。

## 总览：TS 全栈（阶段 10–15）

```
10 基础设施修复 ──> 11 迁入 easy-query TS ──┬─> 12 组件库 SSR ──> 13 Nitro 底座与 fullstack-demo ──┐
                                            └─> 14.1–14.6 流程引擎核心（不依赖 12、13）            ├─> 14.7–14.10 引擎接 Nitro、界面、flow-demo ──> 15 收敛成框架
                                                                                                   ┘
```

每一阶段做完都能停：交付可用、CI 绿、HANDOFF 的现状与本文的勾选已更新。完成一项就在这里打钩。

### 自主执行的规矩（用户不在时照此推进）

- **小步快跑**：本地只跑与改动相关的检查，长命令放后台，等待时准备下一项；全量测试交给 CI 与打包产物；每次推送前看上一次 CI，红了先修。
- **提交**：本仓库在 master 上单线程推进，每完成一项提交并推送；整理与功能分开提交。`easy-query` 仓库按它自己的 CLAUDE.md（开分支、PR、CI 绿后合并，不推 tag）。
  `flow` 仓库只读，不改。不发布 npm、不推 tag（发布由用户按 RELEASE.md 手动做）。
- **遇到下面的情况，这一项停下，写进本节末尾的“待决”，转去做下一个不依赖它的项**：
  要加默认清单（下表第 4 条）以外的第三方依赖；要破坏已发布包（`@zerodep-dev/*`）的公共 API；要凭据、账号、发布；同一个 CI 失败修了两次仍不明原因；实库环境起不来；
  设计上出现下表没覆盖、又有多种合理方向的分歧。
- **不影响现有的使用方**：组件库（`-tsx`、`-ui`）不依赖 easy-query、Nitro、框架与引擎，新依赖都在新包里；SSR 只做加法，浏览器里的行为不变；
  "装进已有的 Vue 项目"这条路由 `apps/host-demo` 与发布产物验证（`pnpm test:consumer`）一直盯着。修正带来的行为变化
  （例如命令式对话框随调用它的组件关掉）写进发布说明，使用方升级版本时才会遇到。
- **不写过程流水账**：结论进对应的文档（决定、特性页、HANDOFF 的坑），过程留在提交说明里。

### 默认决定（用户审阅；没改动就按这里执行）

| #   | 事项                       | 默认                                                                                                                                                 |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 仓库的名字与定位           | 名字不改，README 写清"TS 全栈"的定位；源码条件 `@vue-tsx-pro/source` 不改名；已发布的包名不改                                                        |
| 2   | `flow`（Java）的去留       | 继续维护、本计划不碰它；新引擎的界面在本仓库按新引擎重做，不搬旧的 flow-ui；`spec/` 的用例复制进来，来源写在 README                                  |
| 3   | Nitro 版本                 | Nitro 3 beta，固定精确版本，只有服务端相关的包依赖它                                                                                                 |
| 4   | 允许新增的依赖             | `nitro`（含 h3）；easy-query 原有的 `mysql2`、`pg`、`hdb`；head 管理自己写最小实现，不引入 unhead；其余新依赖进“待决”                                |
| 5   | json-wire                  | 保持独立仓库，按发布的包依赖                                                                                                                         |
| 6   | 设计器里写的服务端 TS 代码 | 默认关闭；开启时只有管理员能写，`node:vm` 只做隔离，文档写明它不是安全边界                                                                           |
| 7   | 迁移                       | 引擎自带建表（代码优先的 DDL + 一张版本表），ORM 先不加迁移这个公共概念，等第二个使用方                                                              |
| 8   | 全栈框架                   | 自己的薄层（Nitro + Vite + vue-router），先写在两个应用里，第三次重复才抽成 `packages/kit`（`@zerodep-dev/vue-tsx-pro-kit`）（用户 2026-10-28 已定） |

### 待决

（执行中遇到的停顿点记在这里：日期、项号、卡在哪、需要用户决定什么。）

## 工作方式

- **审核与整理随做随改**：碰到的代码先看它在整体里的位置。上层组件要用好基础设施与基础组件（ButtonBase、ListPopover、
  useHoverLayer、focusRingStyles、FormValue、NumericValue、hasContent、focusControl……）。同一个逻辑出现第三次就抽出来。
  死代码、过时文件、命名不一致顺手改，整理与功能改动分开提交。整个仓库的基础设施（编译器、脚本、CI、文档站构建、各应用的接线）一起维护，
  遇到问题直接改。
- **架构意识**：同一个问题在多处出现时修根因；改公共 API 时调用方、类型、测试、文档、COMPONENTS.md 一起改，不留半截。
- **文档站同步**：动到哪个组件就在用户的 Chrome（Claude in Chrome，宽屏优先）里看它的文档页：示例饱满、贴近真实场景，
  外观、交互与 API 的灵活性不够就一起改；示例里重复出现的写法抽成组件或工具。阶段 9 起每个组件都开着文档站（`pnpm dev:docs`）
  边做边看：动手前先截图现状、列出要改的外观与 API，做的过程中随时看效果，做完在文档页上逐项核对。
- **验证**：本地只跑与改动相关的检查与测试，放后台；全量测试、浏览器测试交给 CI。检查链用 `&&` 串起来，不用管道吞掉退出码。
  推送前看一眼上一次 CI。

## 现状

- tsx 包：符文编译器、运行时、Vite 预设、样式引擎完整；整个仓库只用 TypeScript 7.1 beta（类型检查、声明生成、脚本的 API、语言服务）。
- ui 包：约 168 个组件、102 个文档页、343 个示例；12 套主题、主题编辑器、设计令牌导出、语言包与格式化、路由适配、请求层。
  模块之间没有循环依赖。清单见 HANDOFF.md §1，各批的设计与取舍见 COMPONENTS.md §10。
- 盘点出的问题（阶段 0 处理）：目录按文档分类而不是按层分，配置层里放着界面组件（ThemeSwitcher、ThemeCustomizer），
  布局与反馈目录里放着依赖导航、浮层、输入的页面级组合（AppShell、PageHeader、NotificationCenter）；主入口混着通用组件、
  页面级组合与领域 / 展示组件（流程、视觉效果、Marquee、SlideVerify）；子路径要在五处分别登记。
- 完成度（阶段 8 补齐）：类型测试几乎没有；约 20 个有键盘逻辑的组件没有专属浏览器测试；输入法只测了 TextField；
  ActionBar、FormSection、ModalCore 没有文档页。

## 分层

```
扩展（子路径：只依赖核心与基础设施，彼此不依赖，要依赖时在 layers 检查里显式登记）
  /patterns  /diagram  /charts  /three  /effects  /xlsx  /theme-customize  /docs-kit  /shiki  /vue-router
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
- [x] `@zerodep-dev/vue-tsx-pro-ui/patterns`（页面组合）：AppShell（Brand 并入为 AppShellBrand）、ActionBar、FilterBar、NotificationCenter、
      KanbanBoard、DeadlineBadge（原 DeadlineTag）、ThemeSwitcher、useFormDialog；文案进 patternsMessages；文档站加“页面组合”分类。
      PageHeader 删除（占一整块却没几项信息，页面里直接用 Breadcrumbs、标题与操作排）
- [x] `@zerodep-dev/vue-tsx-pro-ui/workflow`：流程定义、校验、排布、运行时与 FlowDiagram、ApprovalActions、useWorkflowTimeline（2026-10-26 整个删除，见阶段 9）。
      WorkflowTimeline 并进 Timeline：流转记录由 useWorkflowTimeline 写成 Timeline 的各项，Timeline 加 `reverse`（新的在前）
- [x] 对话框的 onConfirm（Dialog、Drawer、AlertDialog 共用“取消 / 确认”、等待与失败留着）：AlertDialog、useFormDialog、
      ApprovalActions 改用它（取代原计划的“ApprovalActions 改用 useFormDialog”：业务字段与附件放不进 useFormDialog 的字符串字段）
- [x] `@zerodep-dev/vue-tsx-pro-ui/effects`：BorderBeam、SpotlightCard、TiltCard、Marquee；删除 SlideVerify
      （2026-10-24 取消这个子路径：三个卡片效果并进 Card 的 `effect`，Marquee 挪到主入口的展示类）
- [x] ThemeCustomizer、ThemeThumbnail 与主题定制的工具收成 `theme-customize/` 目录；ColorSwatch 进 `/docs-kit`
- [x] StatusDot 挪到 base；`Modal.tsx` 改名 `ModalCore.tsx`；内容判断统一用 hasContent（36 处 `!= null`）。
      决定保留：Collapsible 不并入 Collapse（一个是动效原件、一个是 Disclosure 模式，合并后 Collapse 有两种根结构）；
      Result 不建在 Empty 上（会吃到 defaults.Empty 的尺寸，重复的只是几十行排版）
- [x] 测试按组件拆对（Timeline、Toolbar、Steps 各自一个文件），host-demo 的 `/pilot` 与 `pilot.*` 改名 `/integration`、`integration.*`
- [x] 文档页补齐：FormSection、ActionBar、useFormDialog、Drawer（之前只在 Dialog 页里）、NotificationList；挪过的页面组合逐页在 Chrome 里看过、示例重做成整行与真实数据。
      ModalCore 是内核，不单独成页（Dialog、Drawer 的属性表里已有它的全部属性）
- [x] COMPONENTS.md §7 写上分层与目录、§8 完成标准按现状修订；PLAN §2、HANDOFF 同步
- [x] 案例应用跟着改导入与用法，不报错（暂停期间只保证这一点）

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
- [x] 拼音匹配：子路径 `@zerodep-dev/vue-tsx-pro-ui/pinyin` 的 `createPinyinMatcher()`（pinyin-pro，可选 peer 依赖），交给 createUi / Provider 的 `textMatcher`；
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
- [x] Excel：子路径 `/xlsx`（分组表头导出成合并单元格；读多行表头、展开合并、单元格内换行拆行）；
      DataImport（patterns：选文件、列对应、逐行校验、预览、确认）

## 阶段 6：展示与协作

- [x] Image 与 Lightbox（缩放、旋转、拖动）→ Upload 的图片墙（预览、排序、粘贴）
- [x] Descriptions 的自适应列与复制
- [x] Timeline 升级：操作人、折叠、项里放字段差异（倒序 `reverse` 已有）
- [x] FieldCompare（建在 diffFields 上）、CommentThread 与 Mentions（patterns）
- [x] 完成清单重新设计（原 Checklist 删除：只有勾与日期，信息太少；案例应用暂用 shared/Checklist 的副本）
- [x] FlowDesigner（workflow：流程图上选节点，属性面板改处理人、时限、超时、提醒，校验后发布；2026-10-26 随 `/workflow` 删除）

## 阶段 7：图表

- [x] 标注、组合图（柱 + 线，双轴）、100% 堆叠
- [x] 热力图 / PivotTable、Gauge、Sparkline（Stat 里用）、TimelineChart
- [x] 雷达、矩形树图、缩放、导出图片与数据；地图（TopoJSON、Leaflet）排在最后
      （Leaflet 瓦片地图不包装：要瓦片服务与 leaflet 的样式，需要时直接用 Unovis 的 LeafletMap；TopoJSON 的 MapChart 已有）
- [x] 浏览器测试补上 Area、Scatter、Donut、Sankey、Chord、Funnel、Graph、Waterfall；部件属性的示例（柱状图页）

## 阶段 8：质量与发布

2026-10-24 盘点（脚本按文档页逐个对 §8）：文档页 130 个，有自己键盘逻辑的组件 28 个；类型测试只有 3 个文件
（useForm、list-state、props），带泛型或可绑定值的组件基本没有；`docs:shot` 只在本地看；文档站搜索只搜标题与简介；
两个包都是 0.0.0，没有 changesets 与发布工作流（LICENSE、包级 README 与元数据 2026-10-25 补上）。

顺序：先补测试与文档的缺口（8.1、8.2，发布前要有的底），再把视觉回归接进 CI（8.3，之后的改动有截图兜底），
然后发 0.x（8.4），用一段时间、收集问题、冻结 API 后发 1.0（8.5）。每一步都按“补齐 → 勾掉 → 提交推送”推进。

### 8.1 §8 的缺口：测试

- [ ] §8 的达标矩阵进 COMPONENTS.md（每个组件：运行时测试、浏览器测试、类型测试、键盘一节），用脚本生成并进 `pnpm check`，
      新组件缺项时报出来
- [ ] 键盘的浏览器测试（三种浏览器）：Accordion、CalendarBoard、Cascader、ColorField、FieldCompare、KanbanBoard、
      Mentions、NumberField 与 NumberRangeField、TreeSelect、ResizeHandle、Splitter、CommentThread、NotificationCenter、
      Checkbox、Switch、ToggleGroup、Drawer 的拖宽与 beforeClose
- [ ] 输入法的浏览器测试（组字中的回车、空格不触发提交、选择、跳转）：Combobox、TagsInput、Mentions、NumberField、Textarea、
      DateField、CommandPalette 的过滤框、Select 的按字母跳转
- [ ] 类型测试（`*.test-d.tsx`，§8 第 4 条）：值类型跟着数据走、`_bind` 的约束、事件参数。先做可绑定值与泛型最常用的：
      Select、Combobox、Autocomplete、Cascader、TreeSelect、Transfer、ToggleGroup、Tabs、Slider、DatePicker、DateRangePicker、
      DataTable、QueryTable、PivotTable、Tree、KanbanBoard、StepsForm、FilterBar、Pagination；图表的 data / series 键名约束

### 8.2 §8 的缺口：文档站

- [ ] 键盘一节补上：AppShell、NotificationCenter、ResizeHandle、ModelViewer、FieldCompare
- [ ] 无障碍一节：KeyboardReference 扩成“无障碍”（角色与名称、键盘、读屏念什么、减少动态效果），有交互的组件页都写
- [ ] 搜索：命令面板搜得到组件的属性名、示例标题（从 API 表与示例生成索引，结果直达对应小节）
- [ ] 示例卡片的工具：切换视口宽度（手机、平板、桌面）、从右到左、紧凑密度，不用离开文档页
- [x] 发布前的逐页巡检（2026-10-26）：`pnpm docs:review` 记控制台错误、桌面与手机宽度的溢出并截下每个示例，
      `pnpm docs:sheets` 拼成联系表逐页看；修了 ColumnTable 部件样式没合成一个类（透视表热力着色被盖住）、Stat 窄卡片挤字、
      Textarea 不随外壳拉伸、目标线文字压在柱子上看不清、ThemeCustomizer 色板竖成一列，示例用词换成通用场景

### 8.3 视觉回归进 CI

- [ ] 在固定的 Linux 容器里（Playwright 官方镜像，字体、渲染一致）截每个示例的亮、暗主题，与仓库里的基线比对；
      只在 ubuntu 任务跑，差异图作为 CI 产物上传。基线更新用一条命令重拍（`pnpm docs:shot --update`），随改动一起提交
- [ ] 先覆盖基础、输入、浮层、表格（最常被顺手改到的），稳定后扩到全部示例；动画、随机、时间相关的示例固定种子与时钟

### 8.4 发布 0.x

- [x] 包的元数据：LICENSE（MIT）、两个包各自的 README（安装、最小例子、链到文档站）、repository / homepage / bugs、
      keywords、`sideEffects`（样式文件）、`publishConfig.access`；`engines` 只写在 tsx 包（Vite 预设跑在 Node 里，
      与 Vite 8 一致），ui 包跑在浏览器里不写
- [ ] peer 范围放宽到实际测过的区间（Vite、Vue、各可选 peer），`test:consumer` 按区间的两端各跑一遍
- [ ] changesets：每次改动带一条变更说明，合并后自动开“版本 PR”，生成 CHANGELOG；npm 发布走 GitHub Actions（带 provenance）
- [ ] 体积预算：主入口与各子路径打包后的大小进 CI（size-limit），超了报出来
- [ ] 文档站部署（每次推送 master 自动更新），README 与 npm 页链过去
- [x] 两个包的版本定为 0.1.0，[RELEASE.md](RELEASE.md) 写手动发布的步骤（预检、`pnpm test:consumer`、`pnpm publish`）
- [x] 发 0.1.0（2026-10-26 已发布；包名是 `@zerodep-dev/vue-tsx-pro-tsx`、`@zerodep-dev/vue-tsx-pro-ui`）

### 8.5 1.0

- [ ] API 冻结前的审计：全部公共 API 的命名、默认值、事件参数对一遍 COMPONENTS.md §1–§2，出一份清单逐条改完
- [ ] 浏览器与环境的支持说明（Chrome、Edge、Firefox、Safari 的版本下限，SSR 的边界）、迁移说明（0.x 到 1.0 的破坏性改动）
- [ ] 发 1.0.0，之后按语义化版本：破坏性改动只进大版本

每个阶段新做的组件当场达到 §8；顺手动到的老组件一起补齐。

## 阶段 9：流程引擎的前端

方案与已定的细节见 `flow` 仓库的 `docs/frontend.md`（原本库的 WORKFLOW.md）§5、§6。每步配文档页、饱满的示例、单元与浏览器测试，用到的老组件按 COMPONENTS.md §1–§2 对一遍 API。

- [x] 9.1 画布底座（COMPONENTS.md §10.24）
  - [x] 撤销重做 `createHistory`（主入口，快照、合并输入、连续操作、保存点）
  - [x] 子路径 `/diagram`：视口与控制器 `useDiagram`、节点与连线、点选与框选、键盘与读屏、`DiagramControls`、文档页
  - [x] 拖动节点（吸附、对齐线、自动平移）、从端口连线与改接、正交路由、导出 SVG / PNG、小地图
  - [x] 标准节点 `DiagramNode`、泳道 `DiagramLanes`、连线的 `tone` / `dashed`：示例不再自己写节点与泳道的样式
- [x] 9.2 通用输入：条件构造器、人员与组织选择器（核心的 input），FilterBar 的高级筛选接上条件构造器
  - [x] 条件树 `Condition`、`matchesCondition`、`describeCondition` 与 `ConditionBuilder`（COMPONENTS.md §10.25）
  - [x] 人员与组织选择器 `PeoplePicker`、`PeoplePickerPanel`（COMPONENTS.md §10.26）
  - [x] FilterBar 的高级筛选：`conditionFields` + `_condition`，展开条件构造器、收起时写摘要、重置清空
- [x] 9.3 模型包（`flow` 仓库）与流程组件的接法：按 `flow` 的决定 0003 选 B，流程组件挪到 `flow` 仓库，以本库发布的包为依赖重做；
      本库只留通用底座（画布、撤销重做、条件构造器、人员选择器）。下面 9.4–9.6 在 `flow` 仓库里做
- [x] 删除本库的 `/workflow` 子路径与文档站的“流程”分类（2026-10-26，用户要求流程图要么建在画布上、要么删掉单独的演示）：
      FlowDiagram、FlowDesigner、ApprovalActions、layoutProcess、流程定义与校验、运行时类型、useWorkflowTimeline 一起删，
      Timeline 的两个流转记录示例改成普通的 items；旧实现在提交 `f7bfdc2e`，流程风格的画布示例见 Diagram 页的泳道示例
- [ ] 9.4 流程图重做（`flow` 仓库，建在 `/diagram` 上）
- [ ] 9.5 流程设计器重做（`flow` 仓库）：结构编辑、属性面板、问题列表、版本对比
- [ ] 9.6 运行时组件（`flow` 仓库）：收件箱表格、审批面板、进度卡、流转记录、实例详情的组合；表单改为代码表单加拖拽设计器（不做 `SchemaForm`，见 `flow` 的决定 0004）
- [ ] 9.7 契约扩展：随 `flow` 的表设计一起定
- [x] 9.8 浏览器里编译与代码编辑器改成公开入口（`flow` 的决定 0004 第 7 节，用户 2026-10-26 同意），文档站改用它们、删掉自己那份：
  - [x] `@zerodep-dev/vue-tsx-pro-tsx/browser-compile`：Worker 里的编译（带好 Babel 要的 Node 模块空壳）、把 `import` 改成"接收模块表的模块"的插件、设计时直接执行的辅助函数
  - [x] `@zerodep-dev/vue-tsx-pro-ui/code-editor`：`CodeEditor`（现在文档站的 CodeMirror 编辑器），语言由使用方传，对外给出编辑器状态
- [x] 9.9 人员选择器的标准类型改成用户、部门、角色（用户 2026-10-26：标准组织模型是用户、部门、角色加权限、菜单、按钮控制，"岗位"不是标准名词）：
      `PeopleTypes` 的 `position` 换成 `role`（`PeopleSource.positions` 跟着改名），岗位这类由使用方经接口合并（declaration merging）自己加类型；文档页与示例同步

## 阶段 10：基础设施修复（2026-10-28 审查的结果）

为 TS 全栈做准备时的审查与探测。基线：类型检查通过，单测 240 个文件、2230 个用例通过。下面每条都写了怎么验证的；按优先级做，每条带回归测试。
完成标准：八条都打钩，CI 绿。

- [ ] **P0 SSR 登记的虚拟模块在 Windows 上加载失败**：预设的 `/__vue-jsx-ssr-register-helper` 在 Vite 的模块运行器（Vitest 的 node 环境、Vite 的服务端开发）里变成
      `file:///__vue-jsx-ssr-register-helper`，Windows 上不是合法的绝对路径，`createRequire` 抛错，服务端加载任何 TSX 组件都失败（文档站 449 个示例全挂）。
      改成 `\0` 开头的虚拟 id 后实测 437 个示例服务端渲染无警告（其余见 P2）
- [ ] **P1 展开 attrs 与手写 ref 互相覆盖**：JSX 编译成 Vue 的 `mergeProps`，`ref` 后者盖前者——ref 写在后面，样式绑定失效（状态变了类不变，组件也不重渲染）；
      写在前面，使用方的 ref 拿不到元素。扫描全部 TSX 的编译产物，实际命中两处：Tree 的 `sizer`（一直是 null，虚拟滚动的 scrollMargin 恒为 0）、
      文档站 PropsPlayground 的 `stage`（居中判断失效）。修根因：编译器把 JSX 的 `mergeProps` 换成会合并 ref 的版本（组件库的 `mergeAttrs` 已经这样做）
- [ ] **P1 样式绑定换类晚于 Vue 的 post 回调**：`_effect`、`watch(…, { flush: 'post' })` 四种情形里三种读到旧类（实测）。改走 Vue 的调度（pre 任务），
      用 `/bench/style-updates` 复测；顺带：现在同一批更新里一个出错，同批其余的就丢了
- [ ] **P1 命令式对话框不随调用它的组件卸载**：`useConfirm` 打开后调用的组件卸载，对话框仍开着（实测，`overlay/detached.tsx`）；图表提示框的 `render()` 同类，抽成同一个工具
- [ ] **P2 服务端渲染的组件问题**（阶段 B3 的输入）：11 个示例在服务端抛 `HTMLElement is not defined`——`utils/dom/overflow.ts` 等处的 `value instanceof HTMLElement`
      在渲染时执行（Select 的标签、TreeSelect、NavBar、PeoplePicker、ConditionBuilder、AppShell）；收成一个 `isHTMLElement` 工具。ThemeCustomizer 的 immediate + post 侦听在服务端读 `document`
- [ ] **P2 样式登记表是进程级的**：同一进程渲染完 449 个示例，`styleText()` 累积到 817 KB；SSR 必须按请求收集（阶段 B1）
- [ ] **P3 有意读初始值没写 `_untrack`**：ConditionBuilder 每次构建、测试都打印 5 条"组件函数体里直接读取"的警告，会淹没真正的警告
- [ ] **P3 预设跟进 Vite 8 与多环境**：`transform` 的 `ssr` 参数是旧接口（改读 `this.environment`）；多环境构建时一个环境的 `closeBundle` 会关掉共用的编译线程池，
      正在跑的编译会悬住（推断，阶段 13 实测）；跳过 `?assets` 这类查询参数的模块（12.5）

## 阶段 11：迁入 easy-query TS

把 `easy-query` 仓库的 `ts/`（8 个包、418 个用例）搬进 `packages/easy-query/`，工具链向本仓库看齐。完成标准：用例在本仓库全过，CI 跑实库，`easy-query` 仓库不再有 `ts/`。

- [ ] 11.1 带历史搬家：`easy-query` 里 `git subtree split --prefix=ts`，本仓库 `git subtree add` 到 `packages/easy-query/`，再 `git mv` 成 `core/ sqlite/ mysql/ pg/ hana/ decimal/ date/ test/`。
      只搬不改；验收：`git log --follow` 看得到原来的提交
- [ ] 11.2 接进工作区：`pnpm-workspace.yaml` 逐个写包族；驱动版本进 catalog；TS 7.0.2 → catalog 的 7.1 beta；`exports` 改用 `@vue-tsx-pro/source` 条件；
      保留它更严的编译选项（`exactOptionalPropertyTypes`、`noUncheckedIndexedAccess`）。验收：`pnpm typecheck` 过
- [ ] 11.3 测试换成 Vitest（`node:test` 的导入换掉，`node:assert` 照用）；SQLite 用例本地全过
- [ ] 11.4 风格对齐：prettier 整体格式化单独一个提交；oxlint、`docs:check`、`text:check` 打开并修完
- [ ] 11.5 CI 加 db 任务：MySQL 8.0.18、PG 17 的服务容器跑实库套件（照搬 `easy-query` 的 ts 任务）；HANA 仍在本机
- [ ] 11.6 分层检查扩到包这一级：easy-query 不导入 vue 与组件库，组件库不导入 easy-query；规则写进 `layers:check`
- [ ] 11.7 发布产物核对：各包 `pnpm pack` 的文件清单与已发布的 0.1.0 一致（元数据除外）；`repository`、`homepage` 改指本仓库
- [ ] 11.8 文档：`docs/fork/decisions/0002-ts-design.md` 搬到 `packages/easy-query/docs/decisions/`；文档站加 ORM 分区，27 页特性文档改写进去
- [ ] 11.9 `easy-query` 仓库收尾（开分支、PR、CI 绿后合并）：删掉 `ts/` 与 CI 的 ts 任务；CLAUDE.md、STATUS、ROADMAP 写明 TS 版已迁到本仓库

## 阶段 12：组件库支持服务端渲染

完成标准：文档站构建时预渲染每一页，禁用 JS 也能看到带样式的内容，水合时没有不一致的警告，浏览器测试全绿。

SSR 的支持分两层放，组件库这一层不依赖 Nitro 与框架，用 Nuxt 或别的 SSR 方案也能接：

| 层                                                                        | 放在哪                                                                                      | 阶段       |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------- |
| 样式按请求收集、输出与客户端接管                                          | `packages/tsx`：样式引擎加服务端的收集接口（例如子路径 `@zerodep-dev/vue-tsx-pro-tsx/ssr`） | 12.2       |
| 预设的服务端编译                                                          | `packages/tsx/src/vite`                                                                     | 10、12.5   |
| 首屏主题与语言、只在浏览器里画的包装、服务端安全的工具                    | `packages/ui`（`createUi` 的服务端分支、`ClientOnly`、`isHTMLElement`）                     | 12.3、12.4 |
| 渲染管线：按路由选模式、`load` 的数据进页面、head、资源清单、出错退回 CSR | 框架 `@zerodep-dev/vue-tsx-pro-kit` 的 `./server` 与 `./vite`；先写在 `apps/fullstack-demo` | 13、15     |
| 文档站预渲染                                                              | `apps/docs` 的构建，直接用组件库这一层的接口                                                | 12.6       |

- [ ] 12.1 SSR 体检进 CI：文档站的示例逐个在 node 环境 `renderToString`，再在浏览器里水合，统计报错与不一致；输出清单（12.4 按它修）
- [ ] 12.2 样式按请求收集：请求级的登记表，输出 `<style data-vue-tsx-pro>`，客户端接管这张表、不重复插入（STYLE-ENGINE.md 第 7 条的设计）
- [ ] 12.3 首屏主题与语言：`createUi` 在服务端把主题 class、变量、`lang` / `dir` 写进 HTML 属性；明暗偏好服务端读 cookie；`themeBootScript` 继续挡闪烁
- [ ] 12.4 按 12.1 的清单修水合不一致：Teleport 的内容一起输出；与"现在"有关的输出从配置取同一个时刻；只能在浏览器里画的（图表、3D、测量布局）给 `ClientOnly` 一类的包装
- [ ] 12.5 Vite 预设：服务端环境的编译与热更新、改读 `this.environment`、跳过 `?assets`
- [ ] 12.6 文档站预渲染（SSG）：构建时生成每页的 HTML
- [ ] 12.7 文档：README 的“明确不做”、STYLE-ENGINE.md 与 RUNES.md 补 SSR 一节

## 阶段 13：Nitro 底座与 fullstack-demo

框架先长在应用里（默认决定第 8 条）。完成标准：`apps/fullstack-demo` 在开发服务器与 `node .output/server/index.mjs` 下都能跑，端到端测试在 SSR、CSR 两种模式下都绿。

- [ ] 13.1 接上 Nitro 3（固定精确版本）与 `nitro/vite`；依赖进 catalog
- [ ] 13.2 `apps/fullstack-demo` 骨架：一个 SSR 页、一个 CSR 页、一个预渲染页，站内跳转不整页刷新
- [ ] 13.3 路由级渲染模式 `mode: 'ssr' | 'csr' | 'static'`；SSR 出错时退回 CSR 发空壳
- [ ] 13.4 路由级 `load`：SSR 时在服务端直接调用、CSR 时经接口调用，页面不知道自己是哪种模式；数据经 json-wire 进页面，水合时不重复请求
- [ ] 13.5 `defineAction(schema, handler)`：zod 校验入参，客户端拿到带类型的调用函数
- [ ] 13.6 请求上下文：当前用户、租户、按租户过滤的 easy-query `db`，`load` 与 action 共用
- [ ] 13.7 权限：路由与 action 声明 `permission`，服务端拦、客户端藏按钮；菜单从路由生成
- [ ] 13.8 端到端测试（Playwright）在 SSR、CSR 两种模式各跑一遍，进 CI；顺带实测阶段 10 P3 的线程池问题

## 阶段 14：纯 TS 流程引擎

比 `flow` 的 Java 版更简洁、易用、灵活（FULLSTACK.md §7）。14.1–14.6 只依赖阶段 11，可以和阶段 12、13 交替推进。
完成标准：`apps/flow-demo` 走完发起、会签、退回、超时、子流程，在 SQLite 与 MySQL 上都绿。

- [ ] 14.1 设计（`packages/flow/docs/decisions/`）：能力分级（第一版只做核心与常用）、定义格式（`defineProcess` 与类型推导）、表、六类扩展点、表单、命令与接口。
      写完就按它做，不等审阅；有分歧的点记进“待决”
- [ ] 14.2 模型包 `packages/flow/model`（两端通用）：以 `flow` 的 TS 模型包为起点，去掉为对齐 Java 才有的部分；`spec/` 里的纯函数用例（条件、选边、值、权限、差异、清单、定义）全过
- [ ] 14.3 easy-query 补引擎要用的能力，各带文档与测试：`tx.afterCommit` / `afterRollback`、锁住聚合根（按方言选写法）、受影响行数断言
- [ ] 14.4 引擎核心 `packages/flow/engine`：命令联合加一个 `run`、推进、各种节点、作业（抢占与重试）；SQLite 内存库的测试
- [ ] 14.5 场景：`spec/scenarios` 的 37 个场景写适配器按新接口跑，删减的写明原因
- [ ] 14.6 模拟器 `simulate(process, steps)` 与 `createTestEngine()`（内存库、假时钟），设计器的试运行与单测共用
- [ ] 14.7 接 Nitro：命令作为 action、作业用 Nitro 的定时任务、当前用户与权限
- [ ] 14.8 界面 `packages/flow/ui`：流程图、设计器（定义 ↔ 代码来回编辑、节点逻辑写 TS、试运行）、审批面板、表单（先做 flow-demo 用到的）
- [ ] 14.9 `apps/flow-demo`：真实的审批应用；端到端测试进 CI，MySQL 实库
- [ ] 14.10 文档站加流程引擎分区

## 阶段 15：收敛成框架

- [ ] 15.1 列出 `fullstack-demo` 与 `flow-demo` 里重复的接线
- [ ] 15.2 抽成 `packages/kit`（`@zerodep-dev/vue-tsx-pro-kit`）（主入口两端通用，子路径 `./vite`、`./server`），两个应用改用它，行为不变（两种模式的端到端测试照样绿）
- [ ] 15.3 组件库、ORM、流程引擎各做成框架的模块，模块接口在三个都写完后再定
- [ ] 15.4 `fullstack-demo` 整理成新项目模板；文档站加框架分区

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
- 584c4ed：编译器的渲染优化与解构赋值、css.attrs 的注入问题。
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
- [x] CodePreview、PropsTable、CodeGroup 挪到子路径 `@zerodep-dev/vue-tsx-pro-ui/docs-kit`。决定保留在主入口：CodeBlock、
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
- [x] 案例：日期用组件库的 `shiftIsoDate`、`daysBetween`；两种业务类型的名称、编码表头、单位与格式合成 `costKinds`，台账只传类型；
      两个编辑页共用 `task-form.ts` 的字段与条件必填；DmcEditor 的实施节点用 `form.array`（删行时错误跟着移动）；
      铺满视口的高度读 `layoutVars.stickyOffset`（新子路径 `@zerodep-dev/vue-tsx-pro-ui/vars`，主入口不再导出它）；看板用 Grid；
      图表示例的真实产品型号换成虚构的名字（2026-10-26 起示例改用通用场景）

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
      台账页改用它（删掉手写的请求编号与侦听）
- [x] 地址里的状态：`UiRouter.query` / `replaceQuery`（vueRouterAdapter 实现，同一轮的写入合并成一次 replace）；
      `useQueryState`、`useQueryStates`（本地为准、双向同步、等于初始值不写、按初始值类型读写，`queryCodecs`）；
      useTableQuery 的 `syncToUrl`（page、pageSize、`sort=-key`、筛选条件）。台账页、收益确认、价值台账、详情与编辑页改用它，
      删掉文档站自写的 useCaseQuery，useCaseNavigate 改走路由适配
- [x] 远程选项：Select、Combobox、TreeSelect 的 `load(搜索词, signal)`（打开时请求、输入停下 300 ms 再请求、只采用最后一次，
      共用 remote-items.ts）；Select、TreeSelect 的 `search` 可绑定、`filter={false}`；Upload 的 `action` 走 createUi 的 http；
      useRequest 加 `enabled`
- [x] 工作日与时限：`createWorkCalendar`（周末、节假日、调休补班）经 createUi / Provider 的 `workCalendar` 给出，
      `useWorkCalendar()` 取用；`workdaysBetween`、`addWorkdays`、`deadlineOf`（截止日、剩余工作日、五种状态）。
      决定不另做 useDeadline：纯函数加 useWorkCalendar 已经够用；案例应用的认定时限改用它
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

### C. 样式引擎换成运行时（2026-10-24）

设计、调研与实测见 [STYLE-ENGINE.md](packages/tsx/STYLE-ENGINE.md)。写法同 StyleX（`create`、`attrs`、`sx`），底层换成运行时引擎，
不再依赖 StyleX：

- [x] 一个元素一个组合类；合并语义修正 StyleX 条件里 `null` 清掉默认值的坑（Tabs 未选中文字恢复成弱化色）
- [x] 动态值：没变过的属性写进类里，变过的转成变量；编译器把 JSX 里的动态样式调用改写成 `css.bind`，值变化只改元素上的变量、组件不重新渲染
- [x] 条件别名（`_selected`、`_disabled`…）与属性选择器条件；Button、Badge、Tabs 改用配方 `css.recipe`（色调后来改回直接写主题 token，见 STYLE-ENGINE.md §4.6）
- [x] 热更新原地生效：改样式值不再连锁刷新整页（约 3 s → 0.23 s）
- [x] 组件库发布编译好的 JS、整个预构建；预设按需载入 Babel 与 StyleX 插件、预热编译线程：新项目开发服务器就绪 8.3 s → 1.0 s，热启动打开页面 8.2 s → 0.78 s
- [x] 测试按元素实际得到的声明断言（`styleOf`、`styleTextOf`），与引擎怎么生成类无关；文档站加样式更新基准（`/bench/style-updates`）与截图逐像素比对脚本
- [x] 完全去掉 StyleX：变量组、token 短写、主题、标记在运行时处理，类型用收录的 CSS 类型表；删掉编译模式与编译期的 token 改写（STYLE-ENGINE.md §9.5）
- [x] 有限状态也绕过组件渲染：`条件 && styles.x` 编译成 `css.select`，由元素上的绑定就地换组合类（1000 行切换 485 → 298 ms、渲染 1000 → 0，手写 396 ms），形状变化也就地换类、不再强制重渲染；挂载时参数只算一次（STYLE-ENGINE.md §9.7）
