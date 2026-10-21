# 路线图

当前的全部目标与执行顺序。由主会话在 master 上单线程推进（不再开并行子会话）；每完成一块就提交、推送，并在这里勾掉。

## 工作方式

- **审核与整理随做随改**：碰到的代码先看它在整体里的位置。上层组件要用好基础设施与基础组件（ButtonBase、ListPopover、useHoverLayer、usePointer、focusRingStyles、swatchStyles、FormValue、NumericValue……），重复的逻辑出现第三次就抽出来；死代码、过时文件、命名不一致顺手改。整理与功能改动分开提交。
- **架构意识**：同一个问题在多处出现时修根因；改公共 API 时调用方、类型、测试、文档、COMPONENTS.md 一起改，不留半截。
- **宽屏优先**：效果在用户的宽屏 Chrome（Claude in Chrome，约 1600 CSS px）里看，先保证宽屏占满、好看，再顾窄屏。
- **验证**：本地只跑与改动相关的检查与测试，放后台；全量测试、浏览器测试交给 CI。检查链用 `&&` 串起来，不用管道吞掉退出码。推送前看一眼上一次 CI。

## 1. 主题定制页（色调会话的审核意见）

- [x] 起点主题改成缩略图卡片（ThemeThumbnail），选中时品牌色描边
- [x] 主题名走语言包（builtinThemeLabel），ThemeSwitcher 与起点共用
- [x] 色板改成按色相排列的紧凑色块网格，名字走语言包（customizeColorNames），悬停与读屏给名字和色值，标题旁显示选中的名字与色值
- [x] “跟随系统”示例：并排展示亮色时与暗色时的同一张卡片
- [x] “运行时切换”示例：完整的主题切换面板（缩略图卡片 + 跟随系统），显示主题名而不是内部 key

## 2. 已有组件补齐文档、示例、注释与测试

每个页面：示例饱满（多组合、占满宽度、贴近真实场景）、API 表（virtual:api）、注释齐全、有单元测试；在宽屏 Chrome 里逐页看效果，必要时美化组件、优化 API，或调整主题与基础设施。已有页面同样复查效果并优化。

相关的组件放在同一页讲（括号里是并入同一页的组件），做完的打勾：

- **基础**：[x] Text（Paragraph、Strong、Em、Small、Link、Mark、Kbd、Blockquote、H1–H6；List 在 Prose 页）· [x] Button（ButtonGroup、LinkButton）· [x] IconButton（IconLinkButton、CloseButton、ClearButton、CopyButton）· [x] Badge（Tag）· [x] Code（CodeBlock、CodeGroup、CodePreview）· [x] ButtonBase 与 VisuallyHidden（“无障碍与基础部件”页）
- **布局**：[x] Flex 与 Grid（FlexList、GridList、Container、Separator）· [x] ScrollArea（OverlayScrollbar、PageScrollbar）· [x] Prose（List、OrderedList）· [x] AppShell（整页示例：frames 目录 + Example 的 frame）
- **展示**：[x] Card · [x] Accordion（AccordionItem、Collapsible、Collapse）· [x] Avatar（AvatarGroup、Indicator）· [x] AnimatedNumber（并入 Stat 页）· [x] Descriptions · [x] Timeline · [x] Tree · [x] VirtualList · [x] Marquee · [x] Sortable · [x] ColorSwatch（并入 ColorField 页）
- **反馈**：[x] Alert · [x] 加载与进度（Spinner、Progress、LoadingOverlay）· [x] Empty 与 Result · [x] Toast（Toaster）· [x] Skeleton（SkeletonText）
- **浮层**：[x] Dialog（AlertDialog、Drawer）· [x] Popover（HoverCard、Tooltip）· [x] Menu（全部菜单项、ContextMenu）· [x] CommandPalette · [x] Tour
- **导航**：[x] Tabs · [x] Pagination（PageJump、PageSizeSelect、Pager）· [x] Breadcrumbs 与 Steps · [x] NavList（NavItem、NavGroup、NavSection、TableOfContents、SkipLink）· [x] Toolbar
- **输入**：[x] NumberField · [x] TextField（Textarea、CharacterCount）· [x] Checkbox、Radio 与 Switch · [x] Select（Combobox、TagsInput、Listbox）· [x] Slider · [x] ToggleGroup · [x] ColorField（ColorSwatch）· [x] Upload（FileDrop）· [x] SlideVerify
- **日期**：CalendarView、DateSegmentGroup、SegmentedField 是内部部件，在 Calendar / DateField 页说明
- **表单**：[x] Form（Field、Label、FormValue、useForm、decimalSchema、bigintSchema）
- **表格**：[x] Table（全部子部件）· [x] DataTable（DataTableView、DataTableRow、ColumnResizer、TreeDataTable）
- **图表**：XYChart 并入图表总览
- **配置**：[x] Provider（ConfigScope、createUi、defaults、语言包、useFormat）· [x] ThemeSwitcher、ThemeCustomizer、ThemeThumbnail（并入主题定制指南）
- **3D**：EffectSurface 并入 ShaderBackground 页
- [x] **第二轮补齐**（2026-10-21）：所有页面的示例覆盖 API 里有意义的属性（`pnpm docs:coverage` 列出缺口，剩下的是
      children、open、placement、lazy 这类透传属性）；补示例时发现的 API 缺口一并补上：Menu 项的说明、
      CommandPalette 远程搜索、Tour 封面与方向键、Progress 标签、Alert 尺寸、Toast 的 Esc、输入框图标（controlIcon）、
      Select 只读、List 图标、散点图横轴标题、3D 效果的 `quality="off"`、CopyButton 异步取值、TagsInput 异步建议

## 3. 内置值类型（Decimal、bigint、日期）

- [x] NumericValue 基础（numeric.ts）、表单提交十进制文本（FormValue）、zod 的 decimalSchema / bigintSchema
- [x] NumberField（valueType、精确运算）、AnimatedNumber、Stat、Progress
- [x] 日期组件接受 ISO 字符串与 DateValue，写回保持类型
- [x] Slider：不接 NumericValue（拖出来的值用 number 足够，snapToStep 已处理浮点误差；精确小数、超大整数的输入用 NumberField）
- [x] DataTable：列的 type（number、currency、percent、fileSize、date、dateTime）按语言格式化并决定对齐，不写时按值推断；排序按值类型比较（collation）
- [x] 图表：系列的值接受 NumericValue（画图转 number，提示框与数据表按原值格式化）

## 4. 日期组件

- [x] 第 0 层（日期运算、日历状态、分段输入）、第 1 层（Calendar、RangeCalendar、DateField、TimeField）
- [x] 文案搬进语言包；DateField 的 min / max 比较时间
- [x] 第 2 层：DatePicker（granularity 覆盖 MonthPicker、YearPicker、DateTimePicker：选年、月，或选完日期接着输入时间）
- [x] 第 2 层：TimePicker（按步长列出时间，“此刻”）
- [x] 第 2 层：DateRangePicker（同一个外壳里两组分段、快捷区间夹到 min–max；与 DatePicker、TimePicker 共用 usePickerPopover）
- [x] 第 3 层：RelativeTime、DateTime、Countdown（共用对齐整秒、页面隐藏时停下的 useNow；useFormat 加 relative）

## 5. 3D 与效果

- [x] 第 0 层（ThreeCanvas、useThree、主题色、画质、上下文名额）、第 1 层（ShaderBackground、MeshGradient、AuroraBackground、ParticleField、WaveGrid、TiltCard、SpotlightCard、BorderBeam）
- [x] 第 2 层：Confetti（trigger 驱动，只在飘的时候占画布；顶层显示，盖得住对话框）
- [x] 第 2 层：Globe（Natural Earth 陆地位图的点阵、标注光圈、流动的弧线、拖动带惯性）
- [x] 第 2 层：ModelViewer（glTF / GLB 或程序生成的对象、RoomEnvironment 环境光、拖动环绕与 Globe 共用 createOrbit）
- [x] 首页英雄区用上效果（异步加载的粒子星座）；统计看板示例加 Globe（供应商分布）
- [x] 代码演练场支持 three 子路径（模块表按需加载 three 与 @vue-tsx-pro/ui/three）

## 6. 图表（@unovis/ts 包装，见 .claude/reports/unovis-api.md）

- [x] P0：ChartFrame 公共结构（图例改用 ButtonBase、部件属性补齐）；XYChart 换绘图区时连同全部实例重建（SingleChart 等第二种单容器图表时再抽）
- [x] P1：AreaChart（重叠或堆叠）、ScatterChart（连续横轴、气泡）、DonutChart（第一种单容器图表）；StackedBarChart 即 BarChart 的 stacked；图例与提示框统一在 ChartFrame
- [x] P2：SankeyChart、ChordChart（流向数据 flow.ts 共用；单容器图表抽出 useSingleChart，DonutChart 同用）
- [ ] P2：TimelineChart、GraphChart
- [ ] P3：TopoJSON 地图、LeafletMap、BulletLegend 等其余组件

## 7. 复用与整理（见 .claude/reports/reuse-audit.md）

- [x] 第 5 批：Stat 与图表补 propsXxx；XYChart 图例改用 ButtonBase（ChartFrame）；色块的棋盘格与描边统一用 swatchStyles
- [ ] 目录整理：零散文件按职责收进文件夹；删除无人调用的代码与过时文件

## 8. 开发体验（见 .claude/reports/build-performance.md）

- [x] 开发服务器冷启动、热更新、换页提速（StyleX 加载、API Worker、shiki 语言表、预热）
- [x] 评估合并编译、Babel 8、Rust 版 StyleX、TypeScript 7 与运行时优化：数据与结论见报告
- [x] P0：typecheck、CI 与组件库的声明生成改用 TypeScript 7（别名包 typescript7；用 JS API 的脚本、语言服务、IDE 留在 TS 6）；构建开 lazyBarrel
- [x] P1：合并编译（compiler/compile.ts：一次解析、两遍遍历、一次生成），升级 Babel 8 与 jsx 3.0，换掉 @vitejs/plugin-vue-jsx 与 @stylexjs/unplugin；StyleX 的 CSS 自己合成（开发时按版本推送，构建时输出并在 HTML 里引用——修好了生产构建没有样式）
- [x] P2：开发服务器的磁盘编译缓存（重启后首页 12 秒 → 4 秒）；API Worker 的结果落盘
- [x] P2：首屏的整套图标块：构建时把图标的具名导入改成单个图标模块（apps/docs/build/icons.ts），桶文件只留在图库与演练场；首屏 gzip 415 KB → 249 KB；桶文件再进首页的依赖图时构建报错
- [x] P3：没写过的 prop 用只读访问器 readonlyProp（实例化快约两成）
- [x] P3：剖析组件实例化的热点：prop 访问器直读 Vue props、字面量默认值、合并属性少分配（Button 58 → 43 µs）
- [x] Shiki 按需加载（首屏 249 → 197 KB gzip）；编译线程池（文档站构建 9 秒）；prettier 缓存（pnpm check 15 秒）
- [x] 主题定制的子路径 `@vue-tsx-pro/ui/theme-customize`：文档站只在访客改过主题设置时加载（首屏 JS gzip 170 → 153 KB）
- [x] 全站巡检（控制台、卡死、溢出、交互、12 套主题下的 axe、截图）与运行时剖析：开发时模块等 StyleX 规则、
      收起的源码按需高亮、骨架扫光走合成器、先读后写与共用 ResizeObserver；点击到渲染中位数 1030 → 643 ms（4 倍降速）
- [x] 换页再提速：API 表首帧之后逐张渲染、示例分列写定且首屏之外的卡片推迟渲染、悬停预取页面模块（Button 974 → 658 ms，
      Select 1478 → 890 ms）；冷启动的每页 HTML + modulepreload 实测收益太小，不做
- [x] 热更新不整页刷新：开发与测试时桶文件的具名导入改成直接导入所在模块（workspaceSource），组件库里改了会整页刷新的
      模块 102 → 26 个（剩下的是启动时用掉的配置）；开发时不悬停预取（重启后进 DataTable 11 s → 0.5 s）
- [x] `pnpm typecheck` 各包并行、增量：8.5–9.3 s → 之后每次 2.4–2.8 s
- [x] 组件库测试用 vmForks 池（每个 Worker 只建一次 happy-dom）：106 个文件 37 s → 10 s
- [x] 文档站示例卡片只展示：源码与演练场地址按需加载（Button 页的块 gzip 9.8 → 5.2 KB）
- [x] 文档工具进仓库：`pnpm docs:shot`（示例截图，各主题）、`pnpm docs:coverage`（示例没用到的属性）
