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
- [ ] 第 2 层：Globe、ModelViewer
- [ ] 首页英雄区用上效果；统计看板示例加 Globe
- [ ] 代码演练场支持 three 子路径

## 6. 图表（@unovis/ts 包装，见 .claude/reports/unovis-api.md）

- [ ] P0：ChartFrame / SingleChart 公共结构；修 XYChart 的重建问题（保留 key='state' / 'plot'）
- [ ] P1：AreaChart、ScatterChart、DonutChart、StackedBarChart、图例与提示框统一
- [ ] P2：Timeline、Sankey、Graph、ChordDiagram
- [ ] P3：TopoJSON 地图、LeafletMap、BulletLegend 等其余组件

## 7. 复用与整理（见 .claude/reports/reuse-audit.md）

- [ ] 第 5 批：Stat 与图表补 propsXxx；XYChart 图例改用 ButtonBase；色块的棋盘格与描边统一用 swatchStyles
- [ ] 目录整理：零散文件按职责收进文件夹；删除无人调用的代码与过时文件

## 8. 开发体验

- [x] 开发服务器冷启动、热更新、换页提速（StyleX 加载、API Worker、shiki 语言表、预热）
- [ ] 每个文件要过三四次 Babel（符文、tokens、StyleX、vue-jsx）：评估合并成一次解析
