# 交接文档

给接手这个仓库的人（或下一个会话、换了电脑的自己）：读完这一页就能接着做。细节以各自的规范文档为准，这里只讲现状、地图、做事方式和踩过的坑。路线图与勾选状态在 [ROADMAP.md](ROADMAP.md)。

## 1. 现状（2026-10-29）

- **TS 全栈**（执行清单是 ROADMAP 的"总览"与阶段 10–15，取舍在 FULLSTACK.md）：阶段 10–15 的条目除下面几项都已勾掉。
  - 阶段 12：组件库支持服务端渲染，文档站 137 页预渲染、水合无不一致（CI 的 hydration 任务逐页查）。
  - 阶段 13：`apps/fullstack-demo`（Nitro 3）按页面选 ssr / csr / static，loader、action、请求上下文、会话与权限，端到端测试两种渲染模式。
  - 阶段 14：纯 TS 流程引擎 `packages/flow`（model、engine、ui）：Java 版 37 个场景里 20 个跑通（SQLite、MySQL 8.0.18、8.4、PG 17），
    试运行、流程图、低代码设计器、流程自带的 TS；`apps/flow-demo` 是审批应用（端到端测试进 CI）。
  - 阶段 15：两个应用一样的接线抽成 `packages/kit`（`@zerodep-dev/vue-tsx-pro-kit`，还没发布），带模块（`KitModule`）。
  - 文档站加了"全栈"分区（ORM、框架、流程引擎）。
  - 没做的：11b.7（按需）、14.9 里会签、超时、子流程的页面；"待决"里一条（打成包的流程模块）。

- **分支**：`master` 已推送到 origin；阶段 9 的画布底座与通用输入已合进 master。进行中的功能在各自的 `feat/*` 分支上，合并后才进 master。
  `proto/runtime-styles` 是样式引擎换成运行时之前的原型，已并入。开工前先 `gh run list --branch master --limit 3` 看最近一次 CI。
- **进度**：[ROADMAP.md](ROADMAP.md) 的阶段 0–7 已完成（整理、基础设施、小组件、选择与日期、导航与外壳、表格与表单、展示与协作、图表），
  阶段 8（质量与发布）只补了包的元数据。2026-10-25 起做阶段 9：为流程引擎（`flow` 仓库）做前端的底座（流程组件的方案在 `flow` 的 `docs/frontend.md`），
  顺序是画布底座 → 流程组件 → 运行时组件，每个组件开着文档站边做边看。
  2026-10-26：9.1 画布底座、9.2 通用输入（条件构造器、人员选择器、FilterBar 高级筛选）做完；按 `flow` 仓库的决定 0003（B），
  流程组件在 `flow` 仓库重做；本库的 `/workflow` 子路径（FlowDiagram、FlowDesigner、ApprovalActions、流程定义与校验）与文档站的
  “流程”分类 2026-10-26 已删除，旧实现在提交 `f7bfdc2e`。
- **发布**：0.1.0 已于 2026-10-26 发布到 npm（`@zerodep-dev/vue-tsx-pro-tsx`、`@zerodep-dev/vue-tsx-pro-ui`，标签 `v0.1.0`），现在的版本是 0.2.0-dev；之后按 [RELEASE.md](RELEASE.md) 手动发布（CI 不发布）；`flow` 引擎以发布的包为依赖。
  发布前做过一轮文档站巡检（`pnpm docs:review`、`pnpm docs:sheets` 逐页看截图，修外观、示例用词与几处组件的布局）。
- **与 query 的配合**：表格请求（`useTableQuery` 的 `-amount,name` 排序、表头筛选、已知总数、`tableParams`）、线上的 typed JSON
  （`utils/request/wire.ts`、`http` 的 `wire` 选项）、`buildTree` 对应 query 的 0015、0016，2026-10-25 合进 master。
- **定位**：在已有的 Vue 3.5 项目里，用 TSX + 下划线符文（语义对标 Svelte 5）写独立页面，配自己的组件库（运行时样式，写法像 StyleX）。见 [README.md](README.md) 的“定位与决定”。
- **tsx 包**（编译器、运行时、Vite 预设、类型）：功能完整，日常只做修补。编译是一次解析、两遍遍历、一次生成（`compiler/compile.ts`）。
- **ui 包**：分基础设施、核心（主入口）、扩展（子路径）三层，见 [COMPONENTS.md](packages/ui/COMPONENTS.md) §7；各批的设计与取舍见 §10：
  - 基础：文字（Text / Paragraph / Strong / Em / Small、H1–H6）、List / OrderedList、Blockquote、Mark、Icon、Link、Code、Kbd、CodeBlock（可选 Shiki 高亮）、Spinner、按钮家族（ButtonBase / Button / LinkButton / IconButton / IconLinkButton / CloseButton / ClearButton / CopyButton、ButtonGroup）、Badge / StatusBadge、Indicator、Tag、StatusDot
  - 布局：Affix、BackTop、Flex / Grid / Container（含 create* 工厂）、Separator、ScrollArea 与 PageScrollbar、Prose、Splitter、ResizeHandle、AsideLayout、ViewportFill
  - 展示：Image / ImageGroup（懒加载、失败占位、点开看大图）、Collapse、Collapsible、Accordion、VirtualList、Card、Avatar / AvatarGroup、AnimatedNumber、Stat / StatGroup、Sparkline（迷你图）、Gauge（仪表盘）、Descriptions（columns="auto"、复制）、Checklist（状态、负责人、日期、证据、可勾选）、FieldCompare（表格、列表，变化量按好坏着色）、Timeline（reverse、操作人、详情、maxVisible 收起）、Tree（搜索过滤、拖动移动）、Sortable、ItemList、ProportionBar、Ellipsis、Watermark
  - 反馈：Progress（条形 / 环形）、Skeleton、Alert、Banner、Empty、Result、Toast（createToaster + Toaster）、LoadingOverlay、LoadingBar（createLoadingBar；路由用 `vue-router` 子路径的 useRouteLoadingBar）
  - 浮层：Dialog / Drawer / AlertDialog（共用 ModalCore，onConfirm 给出“取消 / 确认”与等待；useConfirm，可带理由；命令式 useDialog / useDrawer）、Popover、Popconfirm、Tooltip、HoverCard、Menu、ContextMenu、Tour、CommandPalette、Lightbox（图片预览：缩放、拖动、旋转、切换）；所有浮层的 onOpenChange(open, { reason }) 报告开关原因（utils/dom/open-change）
  - 导航：Toolbar、Tabs（可关闭、新建、拖动排序、溢出滚动与全部标签页）、Steps、Breadcrumbs、Pagination（PaginationBar、PageSizeSelect、PageJump、Pager）、NavList（紧凑时分组弹出、角标）、NavBar（横向导航）、TableOfContents、SkipLink
  - 输入：TextField、Textarea、NumberField / NumberRangeField、ColorField、Checkbox / Radio / Switch、Listbox、Select（标签可移除、maxTagCount、creatable）、Combobox、Autocomplete、Mentions / MentionText（@ 提及）、OtpField、TreeSelect、Cascader、Transfer / TreeTransfer、TagsInput、FileDrop / Upload（图片墙：预览、排序、粘贴）、Slider、Rating、ToggleGroup、ControlGroup
  - 日期：Calendar、RangeCalendar、QuarterCalendar、CalendarBoard（整页月历）、DateField、TimeField、DatePicker（年、季、月、周、日期时间，快捷选项）、TimePicker、DateRangePicker（月、季、年、周、日期时间区间）、RelativeTime、DateTime、Countdown（`@internationalized/date`，值可以是 ISO 字符串或 DateValue）
  - 表格：Table 家族、DataTable（始终虚拟滚动；排序与多列排序、表头筛选、列菜单（固定、移动、隐藏）、行拖动（onReorder）、就地编辑（editable、validate、validateRow、onCellChange，网格方向键）、勾选、固定列、列宽、滚动加载、activeKey）、ColumnSettings（列设置：勾选显示、拖动排序）、TreeDataTable、ColumnTable（按列定义的静态表格，合并单元格）、PivotTable / pivot（透视、合计、热力着色）、useTableQuery、tableToCsv
  - 表单（form/）：Field（labelHidden；form.Field 只有一个控件时自动绑定值）、Label、Form、FormErrorSummary（错误汇总）、FormSection、FormValue、useForm（zod；decimalSchema / bigintSchema）、useLeaveConfirmation
  - 页面组合（子路径 `@zerodep-dev/vue-tsx-pro-ui/patterns`）：AppShell / AppShellBrand（顶部导航、页签区、页脚、可收起侧栏）、PageTabs（路由用 `vue-router` 子路径的 useRouteTabs）、QueryTable（查询栏 + 工具栏 + 表格 + 分页，接 useTableQuery）、StepsForm（分步表单）、DataImport（导入：上传、对应列、逐行校验、就地改正）、CommentThread / CommentComposer（留言与回复、@、附件）、ActionBar、FilterBar、NotificationCenter / NotificationList、KanbanBoard、DeadlineBadge、ThemeSwitcher、useFormDialog；文案在 patternsMessages
  - 画布（子路径 `@zerodep-dev/vue-tsx-pro-ui/diagram`）：Diagram（视口、点选与框选、拖动、连线与改接、正交路由、键盘与读屏）、DiagramNode、DiagramLanes、DiagramControls、小地图、导出 SVG / PNG；撤销重做 `createHistory` 在主入口
  - Excel（子路径 `@zerodep-dev/vue-tsx-pro-ui/xlsx`，可选 peer exceljs）：exportXlsx / tableToXlsx（列定义导出，分组表头合并、数字格式、合计）、readXlsx（展开合并、多行表头、换行拆行）；CSV 用主入口的 readCsvFile、parseCsv
  - 图表（子路径 `@zerodep-dev/vue-tsx-pro-ui/charts`，包装 Unovis）：BarChart、LineChart、AreaChart、ComboChart（柱 + 线、对齐的第二数值轴）、ScatterChart、DonutChart、SankeyChart、ChordChart、WaterfallChart、FunnelChart、GraphChart、TimelineChart（计划与实际、今天、里程碑）、RadarChart、TreemapChart、MapChart（TopoJSON 分区着色与地点）；缩放（zoom）、导出图片与数据（exportable）、目标线（targets）、标注（annotations）、区间（bands）、百分比堆叠（stacked="percent"）、下钻（onItemClick）
  - 3D（子路径 `@zerodep-dev/vue-tsx-pro-ui/three`，three 是可选 peer）：ThreeCanvas、ShaderBackground、MeshGradient、AuroraBackground、ParticleField、WaveGrid、Confetti、Globe、ModelViewer
  - 卡片的装饰效果是 Card 的 `effect`（tilt 倾斜、spotlight 聚光、beam 流光边框，纯 CSS）；跑马灯 Marquee 在主入口（展示）。原 `@zerodep-dev/vue-tsx-pro-ui/effects` 子路径 2026-10-24 取消
  - 主题定制（子路径 `@zerodep-dev/vue-tsx-pro-ui/theme-customize`）：customizeTheme、对比度、设计令牌、ThemeCustomizer、ThemeThumbnail；文档站组件在 `@zerodep-dev/vue-tsx-pro-ui/docs-kit`（CodePreview、PropsTable、CodeGroup、ColorSwatch）
- **主题**：12 套内置主题（亮、暗、纸张、高对比与几套风格主题），`createThemePreference` 记住选择，`ThemeSwitcher`（patterns）切换，`ThemeCustomizer` 定制（子路径 `@zerodep-dev/vue-tsx-pro-ui/theme-customize`），`themeBootScript` 防闪烁，`pnpm themes:check` 逐对检查对比度。
- **文档站**（`apps/docs`）：每个组件一页，示例饱满、带 API 表与键盘一节；示例卡片只展示，右上角“编辑”在演练场里改。指南有快速开始、主题定制、设计资源（每套主题导出 Figma 变量）、演练场；侧栏固定在左侧。文档站不收案例页。
- **host-demo**（`apps/host-demo`）：模拟宿主项目，留着几个综合页面与组件行为的浏览器测试（`test/*.browser.test.tsx`）。
- **CI**：GitHub Actions 五个并行任务：check（静态检查）、test（Ubuntu 与 Windows）、browser（三种浏览器的浏览器测试，每个系统分三片并行与文档站的 axe）、build、consumer（发布产物验证）。

## 2. 文档地图

| 文件                                            | 讲什么                                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [README.md](README.md)                          | 定位与决定、怎么在宿主项目里用、命令、语言服务（MCP）、配置要点                                                              |
| [ROADMAP.md](ROADMAP.md)                        | 当前的全部目标与执行顺序，做完一块勾一块                                                                                     |
| [FULLSTACK.md](FULLSTACK.md)                    | TS 全栈的规划草案（迁入 easy-query、SSR、Nitro 薄框架、纯 TS 流程引擎）与待拍板的事；定稿后拆进 ROADMAP 与 `docs/decisions/` |
| [RUNES.md](packages/tsx/RUNES.md)               | 符文规范：`_state`、`_derived`、`_effect`、props、`_bindable` / `_bind`、`_untrack` 等                                       |
| [STYLE-ENGINE.md](packages/tsx/STYLE-ENGINE.md) | 运行时样式引擎：设计、调研、实测与取舍                                                                                       |
| [COMPONENTS.md](packages/ui/COMPONENTS.md)      | 组件库规范：API 约定、部件与透传、样式与 token、依赖与待办、每批组件的设计与取舍（§10）                                      |

文档的放法：给使用者的只在文档站（`apps/docs`）；仓库里的 Markdown 是给维护者的，全局的放根目录，模块的跟着包走（`packages/<包>/`）。
代码注释里写文件名（`COMPONENTS.md §4`）即可，`pnpm refs:check` 检查文档与注释里提到的 `.md` 都找得到。
| `.claude/reports/` | 调研报告：全站审查（2026-10-22，标出已修与待办）、构建与加载性能、Unovis 的 API 清单 |
| `packages/ui/src/index.ts` | 组件库的全部导出，按目录分组；由 `pnpm exports` 生成，不要手改 |
| `apps/docs/src/components/<分类>/<Name>/` | 文档页 `docs.tsx`、示例 `demo/`（整页示例在 `frames/`）；站点自己的组件在 `apps/docs/src/site/` |

## 3. 上手

需要 Node 24、pnpm 12（Windows 11 上开发；Bash 是 Git Bash，PowerShell 是 7.6）。

```bash
pnpm install
pnpm --filter @vue-tsx-pro/host-demo exec playwright install chromium firefox webkit   # 首次跑浏览器测试、截图前
pnpm dev:docs        # 文档站开发服务器，端口 5174（.claude/launch.json 里的 docs）
```

实库测试用本仓库自己的数据库（WSL Debian 的 Docker，compose 项目 `vue-tsx-pro-dev`，端口与 easy-query 仓库的错开）：

```bash
wsl -d Debian -- bash -lc 'cd /mnt/c/Users/lionheart/IdeaProjects/vue-tsx-pro && bash infra/dev/db.sh up -d --wait'   # MySQL 8.4（23306）、PG 17（25432）；8.0.18 基线加 --profile polardb（23318），平时由 CI 跑
wsl -d Debian -- bash -lc 'cd /mnt/c/Users/lionheart/IdeaProjects/vue-tsx-pro && bash infra/dev/db.sh --profile hana up -d'   # 按需加 HANA（29041，要 12 GB 内存）
```

密码、连接说明与实库测试的环境变量（`EQTS_*`）在不提交的 `.local/db.env`、`.local/connections.md`，首次运行 `db.sh` 时生成。

常用的短检查（改了哪个包就跑哪个）：

```bash
pnpm typecheck                                   # 各包并行、增量，之后每次两三秒
pnpm -C packages/ui test src/input               # 只跑相关目录（走包里的 test 脚本：exec vitest 会读到 tsx 包过时的构建产物）
pnpm check                                       # 推送前必跑：lint、格式、生成文件、注释、导出、对比度、文字
```

- 直接用 `node` / `npx vitest` 而不经 pnpm 脚本时，要自己带上 `NODE_OPTIONS=--conditions=@vue-tsx-pro/source`（pnpm 的 nodeOptions 会加），否则 Node 读到的是 tsx 包的构建产物。
- `pnpm check` 看退出码：`pnpm check && git commit …`。用管道过滤输出会把失败藏起来。
- 文档站的单元测试：`npx vitest run --configLoader native --project docs`（约 40 秒，放后台）。

文档工具（不进 CI，补示例时用）：

```bash
pnpm docs:shot /components/select basic,states --themes=light,dark   # 示例截图，存到 node_modules/.cache/docs-shots
pnpm docs:coverage input/                                            # 各页 API 里示例没用到的属性
pnpm docs:review                                                     # 逐页巡检：控制台错误、桌面与手机宽度的溢出、每个示例的截图
pnpm docs:review stat,splitter                                       # 只看几页（其他页的截图与报告保留）
pnpm docs:sheets                                                     # 把巡检的截图拼成每页一张联系表，逐页过目
```

`docs:shot` 的路径以 `/` 开头，Git Bash 会把它改写成 Windows 路径：在 PowerShell 里跑，或前面加 `MSYS_NO_PATHCONV=1`。

日常提交用 `scripts/dev/` 里的三个脚本（Git Bash 里跑）：

```bash
bash scripts/dev/check.sh && git commit …   # 新文件 intent-to-add、文字与格式自动修、pnpm exports、pnpm check；失败退出 1
bash scripts/dev/push.sh                    # master 上次跑完的 CI 失败就不推（修复本身的推送加 --fix）
node scripts/dev/hmr-watch.mjs              # 文档站开着时放后台监视：只在编译出错、恢复、断线时打印一行
```

挪 `packages/ui/src` 里的文件用 `pnpm move 旧=新`（git mv 并改写所有相对导入），之后 `pnpm exports`。

## 4. 架构速览

```
packages/
  tsx/   @zerodep-dev/vue-tsx-pro-tsx
    src/compiler/   编译器（纯函数，不依赖 Vite）：符文、样式绑定，compile 组合全部步骤
    src/runtime/    _component、prop 访问器、overridable / snapshot / effect
    src/vite/       Vite 预设：调用 compile、组件热更新、编译缓存、工作线程
    src/styles/     运行时样式引擎与类型（属性中文注释由 scripts/css-docs 生成）
    types/          符文全局类型、jsx-runtime 类型
    RUNES.md  STYLE-ENGINE.md
  ui/    @zerodep-dev/vue-tsx-pro-ui（基础设施 utils/ config/、核心（主入口的分类目录）、扩展（子路径），见 COMPONENTS.md §7；pnpm layers:check 检查）
    COMPONENTS.md
apps/
  docs/        文档站：TSX 与本组件库写的网站（Vite + vue-router）；组件页、示例与示例测试在 src/components/<分类>/<Name>/
  host-demo/   宿主示例：普通 Vue 3.5 项目 + TSX 页面
scripts/       css-docs（CSS 属性注释数据）、language-services（TSX 语言服务 MCP）、exports、structure、docs 等
tests/consumer 发布产物验证
```

依赖方向：`ui → tsx`，`docs → ui + tsx`，`host-demo → ui + tsx`。共享依赖的精确版本集中在 `pnpm-workspace.yaml` 的 catalog。

**测试分层**（本地只跑和改动相关的，全量交给 CI 的五个并行任务）：

| 层       | 测什么                                                                       | 工具                                                        | 位置                |
| -------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------- |
| 编译     | 符文输入 → 输出；误用写法给出带位置的中文报错                                | Vitest                                                      | `packages/tsx/test` |
| 运行时   | 符文、props、`_bindable`、`_effect`、children、与 Vue 互通                   | Vitest + happy-dom                                          | `packages/*/test`   |
| 类型     | 正确写法通过；错误写法用 `@ts-expect-error` 标注                             | `tsc`                                                       | `*.test-d.ts(x)`    |
| 宿主集成 | 普通 Vue 3.5 项目里挂载 TSX 页面：路由、store、inject                        | Vitest + happy-dom                                          | `apps/host-demo`    |
| 组件交互 | 焦点、键盘、输入法、真实布局、原生弹层行为、axe 无障碍检查                   | Vitest 浏览器模式 + Playwright（Chromium、Firefox、WebKit） | `apps/host-demo`    |
| 发布产物 | `pnpm pack` 的包在仓库之外的独立应用里安装、类型检查、构建，并在浏览器里运行 | `pnpm test:consumer`                                        | `tests/consumer`    |

**技术约束与退路**：

- **Babel 8**：符文编译器、样式绑定与 Vue JSX 插件（3.0）一起用 Babel 8，一个文件解析一次（`compiler/compile.ts`）。
- **不依赖 StyleX**：写法像 StyleX，运行时引擎与类型都是自己的（`@zerodep-dev/vue-tsx-pro-tsx/styles`，STYLE-ENGINE.md）。
- **文档站不用 Markdown**：用 TSX 与本组件库写普通网站（Vite + vue-router 自建）。
- **只用 TypeScript 7**（Go 重写，跟 7.1 的 beta）：类型检查、CI、两个包的声明生成用 `tsc`；脚本与文档站的 API 表用 7.1 的程序化 API
  （`typescript/sync` 的程序与检查器、`typescript/ast` 的语法树）。检查器在 tsc 子进程里，每次调用都是一次跨进程往返，成批的查询用 `api.batch` 一次取回。
  语言服务是 `tsc --lsp`。tsdown 的声明插件只自动识别 7.0，tsx 包的 tsdown.config.ts 显式指定 7.1 的 tsc。
- **pnpm 12** 不再读 `package.json` 的 `pnpm` 字段，工作区设置写在 `pnpm-workspace.yaml`。
- 组件库依赖（定位、图标、日期、精确数字、焦点、校验接口）用成熟库，组件自己写，见 COMPONENTS.md §7。

**tsx 包**（`packages/tsx/src`）：

- `compiler/`：Babel 8。`compile.ts` 是一个文件的完整编译（解析一次、两遍遍历、生成一次：样式绑定与热更新、符文 → Vue JSX、去类型），Vite 预设与演练场共用；符文转换五步，见 `compiler/index.ts` 开头。token 短写 `'_xs'` 在运行时由样式引擎换成变量（`styles/tokens.ts`）。
- `runtime/`：`_component`、prop 访问器（没写过的 prop 用只读的 `readonlyProp`，`children` 用不缓存的 `childrenProp`）、`overridable`、`snapshot`、`untrack`、`effect`、`createContext`。
- `vite/`：预设是一个编译插件（`module.ts` 调用 `compile`，`hmr.ts` 登记组件热更新，`pool.ts` 把编译分到工作线程，`cache.ts` 是开发服务器的磁盘编译缓存，`ssr-register.ts` 是 SSR 时登记组件模块的虚拟模块）。仓库内专用的 `workspace.ts`（`workspaceSource()`）按源码解析各包，开发与测试时把桶文件的具名导入改成直接导入所在模块，热更新不经过桶文件。
- `styles/`：运行时样式引擎与带中文注释的类型（`documented.ts` 由 `scripts/css-docs` 生成，不要手改），设计见 STYLE-ENGINE.md。

**ui 包**（`packages/ui/src`）的基础设施都在 `utils/` 与 `config/`。写新组件前先看有没有现成的：

| 需要                                                           | 用                                                                                                                                                                                                                                             |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 合并部件属性                                                   | `mergeAttrs<'tag'>`（原生元素）、`mergePartProps<XxxProps>`（子组件）；底层是 `mergeProps` + `elementProps`                                                                                                                                    |
| 档位样式（间距、字号、色调、焦点环…）                          | `utils/style/styles.ts`、`utils/style/typography.ts`、`utils/style/tone-styles.ts`                                                                                                                                                             |
| 波纹                                                           | `useRipple(() => ripple)`，返回值展开到受管层                                                                                                                                                                                                  |
| 按钮类的不可用、加载中、拦截点击                               | `useButtonBehavior(() => ({ disabled, loading, focusableWhenDisabled, ripple }), () => onClick)`（`base/button-core.ts`）                                                                                                                      |
| 长得不像按钮的按钮（菜单项、标签页、折叠标题、步骤、排序按钮） | `ButtonBase`：去掉默认外观，焦点环、波纹、颜色过渡、不可用与加载中都有                                                                                                                                                                         |
| 交互颜色过渡、展开箭头旋转、出现与离场的淡入淡出               | `interactionTransitions.colors`、`disclosureStyles.icon`、`presenceStyles.fade` / `leaving`（`utils/style/transitions.ts`）                                                                                                                    |
| 组件里的 JS 动画                                               | `useAnimate()`：取主题时长、缓动、弹簧，卸载时取消（`utils/motion/animation.ts`）                                                                                                                                                              |
| 跟随数值的过渡（数字滚动、进度）                               | `useTween(() => value)`、`useSpring(() => value)`（`utils/motion/tween.ts`）                                                                                                                                                                   |
| 输入框外壳、前面的图标、勾选类控件                             | `input/control.tsx`（`inputRecipe`、`controlParts`、`controlIcon(部件层, icon, propsIcon)`、`focusOnShell`）、`input/choice-styles.ts`（`choiceRecipe`、`choiceParts`）                                                                        |
| 控件接入 Field（标签、说明、错误、状态）                       | `useFieldControl(() => ({ id, invalid, required, disabled, readonly }))`；不是原生输入的控件用 `labelledBy`，不可用时在 `label for` 指向的元素上写 `aria-disabled`                                                                             |
| 表单字段的约束（必填、长度、范围）                             | 从 zod schema 推出（`form/form-constraints.ts`），控件经 `useFieldControl()` 的 `constraints` 拿到                                                                                                                                             |
| 表单值与校验                                                   | `useForm({ initial, schema, fields, onSubmit })` + `<Form controller>`；`form.array(path)`、`form.dirty`、`form.validating(path)`                                                                                                              |
| 一组字段的标签位置与宽度、整组只读或不可用                     | `provideFieldLayout(() => ({ labelPlacement, labelWidth, readonly, disabled }))`（`form/field-layout.ts`）；Form、FormSection 已接，Field 与 `useFieldControl` 读取                                                                            |
| 数字的显示格式：缩放（万元）、单位文字、币种默认取语言包       | `NumericFormat`（`useFormat().number(value, { scale: 10_000, suffix: '万元' })`），按十进制移位的 `shiftDecimal`；没有值时显示 `lang.emptyValue`                                                                                               |
| 单选 / 多选组件的 props、选项数据                              | `SelectionProps`（`selectionMode` + `value`）、`OptionMapping`（`toOption`）、`toggleSelection`                                                                                                                                                |
| 选项列表（高亮、选择、键盘）、弹出的选项列表                   | `useListState` + `handleListKeydown` + `ListboxView`、`ListPopover`（`input/`）                                                                                                                                                                |
| 链接走路由、判断当前页                                         | `useRouterLink()`                                                                                                                                                                                                                              |
| 组件默认值                                                     | 在 `config/defaults.ts` 登记，组件里 `useDefaults('Xxx', () => ({ variant, size }), { variant: 'solid' })`                                                                                                                                     |
| 方向键在一组项里移动、按字母跳转；网格的行列移动               | `rovingFocus(container, { items, orientation, typeahead })` 或 `createTypeahead()`；网格用 `gridFocus(container, { rows, cells })`                                                                                                             |
| 拖动、拖动排序                                                 | `startMove(event, { onMove, onEnd })`；`useSortable({ items, getKey, onChange, container })`（`utils/dom/sortable.ts`）；分组（看板的列）加 `groups: { keys, of, canMove, onMove }`，组元素上展开 `groupProps(组)`，拖动中读 `target`、`ghost` |
| 树：展开成行、勾选联动、懒加载、搜索、路径、移动               | `flattenTree`、`indexTree` + `toggleChecked` / `checkStates` / `checkedByStrategy`（只要父 / 子 / 全部）、`useTreeExpansion`、`filterTree`（交给 flattenTree 的 include）、`treePath`、`moveNode`（`utils/data/tree.ts`）                      |
| 关闭后等离场结束再卸载、第一次打开才渲染；可关闭的先离场再移除 | `usePresence(() => open, { onExited, exit })`、`useLazyContent(() => open, () => lazy)`；`useDismissible(() => onClose?.())`（Tag、Alert、Banner）（`utils/motion/presence.ts`）                                                               |
| 子元素换位置时平移、跟着当前项走的指示条                       | `useLayoutAnimation(() => container, { children })`、`useActiveIndicator(…)`（`utils/motion/`）                                                                                                                                                |
| 加载指示防闪烁                                                 | `useDelayedLoading(() => loading, { delay, minDuration })`；aria-busy 仍按真实的 loading                                                                                                                                                       |
| 动效、视口与系统设置                                           | `useReducedMotion()`、`useMediaQuery('(min-width: 64rem)')`                                                                                                                                                                                    |
| 滚动到哪一节、粘性顶栏的高度                                   | `useScrollSpy(…)`、`collectHeadings(container)`；`layoutVars.stickyOffset`                                                                                                                                                                     |
| 子元素按祖先的悬停、聚焦取样式                                 | `css.when.ancestor(':hover', marker)`，标记在 `utils/style/markers.ts`                                                                                                                                                                         |
| 键盘快捷键、可编辑元素判断                                     | `useHotkeys(() => ({ 'Mod+K': open, 'G I': inbox }), { target })`（序列键、区域、模态打开时只认对话框里的按键）、`formatHotkey`、`isEditable`（`utils/dom/hotkeys.ts`）                                                                        |
| 事件监听（随作用域移除、目标是 getter 时换绑）                 | `useEventListener(target, type, listener)`（`utils/dom/event-listener.ts`）；别再手写 add / removeEventListener                                                                                                                                |
| 请求、列表查询、远程选项                                       | `useHttp()`（createUi / Provider 的 `http`）、`useRequest(fetcher, { params })`、`useTableQuery(fetcher, { filters, syncToUrl })`；选择类控件的 `load(搜索词, signal)`                                                                         |
| 地址里的状态（页签、条件、页码）                               | `useQueryState('view', 'all')`、`useQueryStates({...})`、`queryCodecs`（`config/query-state.ts`）；路由适配的 `query` / `replaceQuery`                                                                                                         |
| 未保存离开的提醒                                               | `useLeaveConfirmation(() => form.dirty && !form.submitting)`（`form/`）：关标签页由浏览器问，站内跳转经 `UiRouter.beforeLeave` 弹确认                                                                                                          |
| 记在浏览器里的状态                                             | `usePersistentState(key, initial)`（`utils/dom/storage.ts`）：列设置、侧栏、主题偏好                                                                                                                                                           |
| 工作日、时限、字段差异、导出 CSV                               | `useWorkCalendar()` + `deadlineOf`（`utils/data/workdays.ts`）、`diffFields`（`utils/data/diff.ts`）、`tableToCsv`（`table/csv.ts`）+ `downloadFile`                                                                                           |
| 结构相等                                                       | `sameValue(a, b)`（`utils/data/equality.ts`）：Decimal、日期值、Date 按值比较                                                                                                                                                                  |
| 复制到剪贴板                                                   | `useClipboard()`：`copy(text)`、`copied`（自动复原）；按钮用 `CopyButton`（`value` 可以是异步函数）                                                                                                                                            |
| 浮层：焦点、遮罩、锁滚动、定位、悬停打开                       | `utils/dom/overlay.ts`、开关原因 `openSetter`（`open-change.ts`）、`createAnchoredLayer()` + `floatingStyles`、`useAnchoredPopover`、`useHoverIntent(createHoverGroup(), …)`（`utils/dom/`）                                                   |
| 模态打开期间还要可交互的浮层                                   | `topModal()` 取最上层的模态，Teleport 进去；内容用 `ConfigScope` 带上主题                                                                                                                                                                      |
| 命令式确认                                                     | `const confirm = useConfirm()`（setup 里），之后 `await confirm({ title })`                                                                                                                                                                    |
| 状态色调的颜色与默认图标、列表行的外观                         | `statusToneSx`、`statusIcons`（`utils/style/tone-styles.ts`）、`itemStyles`（`utils/style/item-styles.ts`）                                                                                                                                    |
| 虚拟滚动                                                       | `useVirtualizer(read)`（Vue 接线）；核心 `Virtualizer`（`utils/virtual/`）                                                                                                                                                                     |
| 按语言匹配、比较文字；数值夹取与步长；从右到左                 | `createMatcher`、`createComparer`（`utils/data/collation.ts`）；`clamp`、`snapToStep`；`isRtl`                                                                                                                                                 |
| 浮层滚动条                                                     | 局部区域 `ScrollArea`（视口自己管焦点时 `focusable={false}`）；整页 `PageScrollbar`；会滚动的弹出层 `floatingStyles.scrollPanel`                                                                                                               |
| 颜色解析、对比度、主题定制                                     | `utils/data/color.ts`（culori）；`customizeTheme`、`checkContrast`、`tokenCatalog`（`@zerodep-dev/vue-tsx-pro-ui/theme-customize`）                                                                                                            |
| 元素大小变化                                                   | `useResizeObserver(() => [a, b], onResize)`（`utils/dom/resize.ts`）                                                                                                                                                                           |
| 元素进出视口、是否完整可见                                     | `useIntersectionObserver(() => el, ([entry]) => …, () => ({ threshold: [0, 1] }))`（`utils/dom/intersection.ts`；ActionBar、3D 画布用它）                                                                                                      |
| 一行放不下时后面的项折成 +N                                    | `useOverflowItems({ container, count })`，项上展开 `itemProps(i)`、“+N”上展开 `restProps()`，读 `visible` / `hidden`（`utils/dom/overflow.ts`）                                                                                                |
| 拖动平移、滚轮与捏合缩放                                       | `usePanZoom({ viewport, min, max, wheel, bounds })`，视口上展开 `viewportProps`，内容写 `transform`（`utils/dom/pan-zoom.ts`）                                                                                                                 |
| 相连的一组控件（去掉相邻圆角、边框叠在一起）                   | 组件里 provide `AttachedContext`，控件外壳加 `attachedStyles[方向]`（`utils/style/attached.ts`；ButtonGroup、ControlGroup 用它）                                                                                                               |
| 内容（插槽、标题、说明、错误）有没有东西                       | `hasContent(node)`：null、undefined、空字符串与布尔（`cond && …` 不成立时的 false）都算没有（`utils/props.ts`）                                                                                                                                |
| 聚焦一个控件（它本身不能聚焦时聚焦里面第一个能聚焦的）         | `focusControl(element)`（`utils/dom/focus.ts`）：表单提交不通过时用                                                                                                                                                                            |
| 输入法组合中的按键                                             | `isComposingKey(event)`（`utils/dom/hotkeys.ts`）：列表键盘操作、快捷键、TagsInput 都先排除它                                                                                                                                                  |
| 命令式创建的元素写上样式                                       | `applyStyleAttrs(element, css.attrs(…))`（`utils/props.ts`）；`css.attrs` 的 style 是对象，不是字符串                                                                                                                                          |
| 能读成数字的文字（接口给的 '19.90'）                           | `isNumericText(value)`（`utils/data/numeric.ts`）：DataTable 的格式化、合计、数字列的排序用它                                                                                                                                                  |
| 站内链接的地址与点击                                           | `useRouterLink()`：`href(href)` 渲染路由解析后的真实地址（带 base、hash 模式的 #），`onClick(event, href)` 把原文交给路由                                                                                                                      |
| 主题导出为设计令牌（Figma 变量）                               | `themeDesignTokens(theme)`、`elementDesignTokens(element)`（`@zerodep-dev/vue-tsx-pro-ui/theme-customize`）：DTCG JSON                                                                                                                         |
| 图表的外层结构（图例、空与加载、读屏数据表）                   | `ChartFrame`（`charts/frame.tsx`）；直角坐标图 `XYChart`，单容器图 `useSingleChart`（`charts/single.tsx`）                                                                                                                                     |
| 3D 场景、画质、降级                                            | `ThreeCanvas` / `useThree`（`three/core/`）；效果的外层 `EffectSurface`；`quality="off"` 不创建 WebGL、显示 fallback                                                                                                                           |

**文档站**（`apps/docs`）：

- `build/demo.ts`：`?demo` 导入示例时导出 `{ component, source, path }`，`source` 是异步取源码的函数（卡片显示时不加载源码）。
- `build/api.ts`：`virtual:api/XxxProps` 从类型与 JSDoc 生成 API 表的数据（Worker 里用 TypeScript 7.1 的 `typescript/sync` 建程序，属性按源码声明顺序）。
- `src/site/`：`DocPage`、`Examples` / `ExampleColumn`（两列写定）、`Example`、`ApiReference`、`KeyboardReference`（键盘一节）、`EditInPlayground`。
- 示例文件开头一行注释说明演示了什么；示例只用公开的组件与工具，能原样复制走。

## 5. 硬性约定（用户的长期要求）

1. **一个元素一个组件**。不做 `as`，几种元素共用一个工厂函数或一份样式表。复合组件用 `createContext` 共享状态。
2. **多节点组件的每个内部节点都有 `propsXxx`**，合并顺序是 `mergeProps(组件默认, propsXxx, 受管)`；按项渲染的部件可以接受函数。
3. **状态写成 data 属性**：`data-state`、`data-disabled`、`data-loading`、`data-orientation` 等。
4. **图标一律用 `@lucide/icons` + `Icon`**。不手画 SVG，不用字符代替图标。
5. **主题 tokens 不写裸值**。值整个是一个 token 写字符串（`'_md'`、`'_space.lg'`），`width`、`height` 里的短写取的是 `sizes`；值里夹着 token 写模板字符串里的 `t.组.名`（`` `calc(-1 * ${t.space.xs})` ``），`t` 从 `@zerodep-dev/vue-tsx-pro-ui` 导入。
6. **类型与注释**：`mergeProps` 写类型参数；`css.create` 的结果不标类型；所有导出、导出接口的每个字段都写 JSDoc；枚举类取值写成带注释接口的 `keyof`。
7. **配置接入**：有外观档位的组件登记到 `ComponentDefaults`；可点击的组件接入波纹；链接用路由适配。
8. **目录**：组件平铺在 `packages/ui/src/<分类>/<Name>.tsx`，测试在同级 `.test/`；文档与示例在 `apps/docs`。
9. **对比度**：所有内置主题满足 WCAG AA 4.5:1；文档站的 axe 测试跑亮色与暗色。
10. **工具全部导出**：名字全局唯一（`<组件>Styles`、`<组件>Managed`）；入口由 `pnpm exports` 生成。
11. **依赖用起来**：表单校验用 zod，JS 动画用 Anime.js（`useAnimate`），日期用 `@internationalized/date`，图表用 Unovis；先看已有依赖能不能做，再自己写。
12. **上层组件用好基础组件与工具**：ButtonBase、ListPopover、ChartFrame、controlIcon、Field……重复的逻辑出现第三次就抽出来。
13. **`_` 前缀保留给符文**：项目代码里普通函数和变量不用 `_` 开头。
14. **只有 Node 直接加载的** `packages/tsx/src/compiler` 与 `src/vite` 在相对导入里写 `.ts` 扩展名。
15. **依赖升级单独提交**，提交说明写清验证结果。

## 6. 做事方式

这些原本记在原电脑的 Claude 记忆里，新电脑没有，照抄在这里：

- **语言**：对话、说明用中文；代码、标识符、注释里的英文名保持英文；**提交说明用中文**（`feat:` 等前缀与标识符保持原样），结尾加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- **全面地改，不是最小改动**：遇到问题修根因，调用方、类型、测试、文档一起改；顺手删死代码、统一命名；补示例时发现样式不够好看、API 不够丰富，一起改。整理与功能改动分开提交。
- **开发体验优先**：热更新、重启、类型检查、测试的速度比冷启动重要（冷启动等 JS 下载执行完可以接受）。
- **基础设施可以直接改进**：写代码时觉得合理的基础设施、组件、样式、主题、工具的增强，直接做，不用先问；大规模重构（跨模块、改目录、改公共 API）先给方案。
- **小步快跑**（2026-10-28 用户重申）：本地只跑与改动相关的检查与测试，超过几十秒的放后台，等待期间准备下一步或做不影响测试的事，不空等；
  全量测试、浏览器测试、实库测试交给 CI 与打包产物验证，不因等全量结果而停下改代码；下一次提交前看上一次 CI，红了先修再继续。
- **推送**：每块提交后直接 `git push origin master`，不用问。推送前用 `gh run list` 看上一次 CI，失败先修；master 上每次推送的 CI 都会跑完（只有 PR 上新提交取消旧的），不用等它，下次推送前看结果。
- **验证页面**：在用户自己的宽屏 Chrome 里看（Claude in Chrome，不用应用内置的浏览器面板），宽屏（约 2000px）好看第一位；
  `pnpm docs:shot` 截图比开浏览器快；交互用 Playwright 脚本或浏览器验证。文档站开发服务器（5174）由 Claude 自己起，
  再用后台监视跑 `scripts/dev/hmr-watch.mjs` 盯编译报错（监视 30 分钟到期，到期重开），不用 IDEA 的运行配置。
  在用户浏览器里别真的触发文件下载、浏览器原生弹窗。
- **改完先自己挑毛病**：每个看得见的改动都截图，逐区看大片空白、折行、对不齐、截断、数据不合理（金额、日期、编号矛盾），修完再汇报，不等用户指出。
- **示例饱满、API 成熟**：示例多行多组合占满卡片宽度、贴近真实场景；档位、色调、尺寸对齐 Mantine / Radix Themes / Ant Design。
  小组件的加载反馈用自己的动效（波纹、转圈），只有容器占位才用骨架。
- **目标模式、不阻塞**：按 ROADMAP 持续往下做，不停下来征求确认；超过几十秒的命令放后台，等待时去读代码、查资料（context7、成熟实现）；
  拿不准的先搜，不凭印象。
- **单线程**：主会话直接在 master 上做，不开并行子会话或 worktree（用户 2026-10-20 的决定；之前混提交、互等过）。
  没有用户明确指示时也不派子代理，调研、读代码自己做。
- **示例用已有组件**（2026-10-25）：示例少写原始标签与 `css.create`；示例里要手写一堆样式，说明组件库缺组件或属性，
  先想能不能换现成组件演示，不能就把能力补进库里（如画布的 `DiagramNode`、`DiagramLanes`），再让示例用它。外观要和同页其他示例一样舒服。
- **整体优化**（2026-10-25）：不必迁就旧组件的样式约定与写法，该重做就重做，改过的约定写回 COMPONENTS.md / RUNES.md。
- **发布**：npm 由用户按 [RELEASE.md](RELEASE.md) 手动发布，不要替他发布；`flow` 仓库的流程引擎以发布的包为依赖。
- **Figma**：M5 / M6 在 `UTDP9KBNhelTIK1KoMlHYk`（Starter，em 按 14px 换算成精确 px，indigo + slate，Noto Sans SC 与 JetBrains Mono）。
  2026-10-22 MCP 的月度额度用完，下个月恢复前不调用。
  示例一律用通用的虚构场景（采购、销售、门店、供应商甲），不用具体项目的业务名词与编号（2026-10-26 整理过一遍）。
- **密钥**：`GITHUB_TOKEN`、`CONTEXT7_API_KEY` 放在用户级环境变量里，配置用 `${VAR}` 引用，绝不写进文件或提交；GitHub 走 `gh` 的 keyring 登录。

## 7. 踩过的坑

| 现象                                                           | 原因与解决                                                                                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 改了编译器或组件库，测试结果没变                               | 直接用 `node` / `vitest` 而不经 pnpm 脚本时没带 `--conditions=@vue-tsx-pro/source`，读的是构建产物；Vitest 还要 `--configLoader native`                                                       |
| 新加的示例在测试里找不到                                       | Vitest 的 fsModuleCache 缓存了含 `import.meta.glob` 的模块；预设的缓存键已对这类模块返回 false                                                                                                |
| 组件库的测试里新加的依赖报 “… is not a function”，页面上没事   | ui 的测试用 `vmForks` 池：CommonJS 包装的默认导出拿到的是对象。把它连同引到它的包加进 `packages/ui/vitest.config.ts` 的 `server.deps.inline`                                                  |
| 测试里 `showPopover is not a function`                         | happy-dom 没有原生 popover：弹出层的交互放到浏览器测试里测，单元测试只断言属性                                                                                                                |
| axe 报不可用控件的标签对比度不足                               | 标签的 `for` 指向的元素没有 `aria-disabled`（分段的日期框是 `role="group"`，TagsInput 的标签在外壳里），axe 不知道整个控件不可用；在那个元素上写 `aria-disabled`                              |
| `onCopied?.(await copy(text))` 什么也没复制                    | 可选调用在函数不存在时连参数都不求值：有副作用的表达式先算出来再传                                                                                                                            |
| 和原生属性重名的 prop 出怪事                                   | 组件 props 继承了元素属性（`hidden`、`onToggle`、`color`、`onLoad`、`onError`、`onSelect` 都踩过）：改名或放进受管属性                                                                        |
| `_value={…}` 没有双向绑定                                      | 值要是可写的位置（let 声明的响应式变量、`_bindable` 的 prop、对象属性）；表达式只传值。自己处理更新写 `onUpdate:_value`                                                                       |
| 子组件显示旧内容                                               | `children` 用不缓存的 `childrenProp`（编译器生成）                                                                                                                                            |
| 覆盖样式不生效（如 `borderColor`）                             | 长属性总是优先于简写（引擎把简写排在前面），要写同一个长属性                                                                                                                                  |
| `dir="rtl"` 下图标不镜像                                       | lightningcss 把 `:dir()` 降级成 `:lang()`；预设已关掉。从右到左里混排的中文与数字会被双向算法重排，示例里别让数字打头                                                                         |
| `width: '_lg'` 变成 64rem                                      | 短写按属性找组，`width` 属于 sizes；间距写 `'_space.lg'`                                                                                                                                      |
| 构建报 TS2883（类型无法命名）                                  | 推导出的类型引用了没导出的类型：泛型组件需要的类型要从入口导出                                                                                                                                |
| axe 只在 Firefox 报 label-content-name-mismatch（中文）        | 它把看得见的字连成一串、用 Intl.Segmenter 分词后比对名称，各浏览器的中文分词不同。aria-label 里要包含节点上看得见的每段字，同一段别拆开；多出来的说明（类型、状态）写进名称、不写成节点上的字 |
| axe 在暗色主题报对比度不足，背景是 #ffffff                     | 元素溢出到视口外，axe 取不到背景；容器里的滚动元素外层要 `minWidth: 0`                                                                                                                        |
| Firefox / WebKit 里 axe 测试超时、过渡测试偶发失败             | 等动画结束要设上限并跳过无限循环的动画；WebKit 不一定在下一帧建好过渡，用 `expect.poll`                                                                                                       |
| “ResizeObserver loop completed with undelivered notifications” | 不要在 ResizeObserver 回调里同步改布局                                                                                                                                                        |
| `docs:check` 没查新文件                                        | 它按 `git ls-files` 取文件，新文件先 `git add`                                                                                                                                                |
| CI 的 `exports:check` 失败、`pnpm exports` 报重名              | 模块里加、改了导出后运行 `pnpm exports`；重名按 COMPONENTS §4 改成全局唯一的名字（例：List 的 `ListState` → `ListMarkerState`）                                                               |
| `text:check --fix` 之后 `format:check` 失败                    | 它把拆开的中文行接回去，行可能超长：修完再跑一次 Prettier                                                                                                                                     |
| 改了 tokens 后 `css-docs:check` 失败                           | `token-names.ts` 由 `pnpm css-docs` 生成                                                                                                                                                      |
| 宽的内容把 grid / flex 容器撑宽，页面横向溢出                  | 网格项、弹性项的最小宽度默认等于内容宽度；外层加 `minWidth: 0`                                                                                                                                |
| 勾选一行，表格的所有可见行都重渲染                             | 传给 DataTable 的 `getKey`、`columns` 每次渲染都新建：在 setup 或模块里定义                                                                                                                   |
| 选项、行上万时页面很卡                                         | 渲染路径里不要每项做 O(n) 的查找；用 computed 缓存集合或映射                                                                                                                                  |
| WebKit 里点开下拉后方向键无效                                  | Safari 点击按钮不会聚焦它：焦点要留在按钮上的组件在 click 里自己 `focus()`                                                                                                                    |
| 改了 `apps/docs/build/api.ts` 或 `vite.config.ts` 后页面不对   | Vite 在进程内重启，新加的文档页可能要刷新一次；文件改名后开发服务器还引用旧路径时重启它                                                                                                       |
| 新加的重依赖、Shiki 语言让 CI 的浏览器测试中途重载             | 加进文档站的 `optimizeDeps`                                                                                                                                                                   |
| Windows 上新文件覆盖了大小写不同的同名文件                     | 文件系统不分大小写：`Foo.tsx` 和 `foo.tsx` 是同一个文件，新建前先查                                                                                                                           |
| 脚本里的反斜杠、引号、模板字符串被转义坏                       | 不要在 bash heredoc、`node -e` 里写这类内容：用编辑器（Write / Edit）写成文件再跑                                                                                                             |
| 挪了导出之后本地测试报 “x is not a function”                   | Vitest 的文件缓存还带着旧的导入路径：先移走 `node_modules/.vitest-cache` 再判断（CI 每次从空缓存开始）                                                                                        |
| package.json 加了子路径导出，开发服务器还是解析不到            | 重启文档站开发服务器（5174 被旧进程占着时先结束它）                                                                                                                                           |
| JSX 文字里写 `=>`、`>` 编译报错                                | 包成字符串：`<Code>{'useX(() => a)'}</Code>`                                                                                                                                                  |
| 单元测试里测不了对话框（useConfirm、AlertDialog）              | happy-dom 的 dialog 不完整：单元测试里 `vi.mock` 掉 `useConfirm` 只测接线，对话框本身在浏览器里验证                                                                                           |
| 解构出来的方法触发 oxlint 的 unbound-method                    | 返回对象里写箭头函数属性（`read: (q) => …`），不写方法简写                                                                                                                                    |
| `check.sh … \| tail` 显示 FAILED，退出码却是 0                 | 管道取的是 tail 的退出码：要看结果就重定向到文件再看，或者只用 `&&` 串                                                                                                                        |
| IDEA 里悬停、跳转还是旧行为，设置里显示 TypeScript 6           | IDEA 的 TypeScript 指向 `node_modules/typescript`（7.1）后重启语言服务；仓库里已没有 TS 6                                                                                                     |
| 脚本里查类型检查器很慢                                         | 7.1 的检查器在 tsc 子进程里，每次调用一次往返：成批的查询用 `api.batch(...xs.map((x) => checker.foo.gen(x)))`，能按程序缓存的就缓存                                                           |

## 8. 下一步

按 [ROADMAP.md](ROADMAP.md) 的顺序往下做（用户的总要求：持续执行、不必问，把组件库做到成熟可用）：

1. 阶段 0–7 与阶段 9 的 9.1、9.2 已完成；两个包 0.1.0 已发布。之后按 ROADMAP：阶段 8 的测试与文档缺口（8.1–8.3）、
   8.4 的发布自动化；流程组件（9.4–9.6）在 `flow` 仓库里以本库为依赖重做。
2. 每动一个组件，就在用户的 Chrome 里看它的文档页，补示例、改外观与 API 的灵活性。

审查的细节在 `.claude/reports/audit-2026-10-22.md`（已修的已标出）。每做完一块：勾 ROADMAP、`check.sh`、分开提交（整理与功能）、
`push.sh`。

做图表时照 SankeyChart / ChordChart 的结构：数据类型、`useSingleChart` 或 XYChart、`ChartFrame`；`--vis-*` 变量映射到 tokens；
Unovis 的选项先查 `.claude/reports/unovis-api.md` 和 `node_modules/.pnpm/@unovis+ts@1.7.1/node_modules/@unovis/ts/components/<name>/config.d.ts`；
导出加到 `charts/index.ts`，测试加到 `charts/.test/charts.test.tsx`，文档页放 `apps/docs/src/components/charts/<Name>/`。

新组件的页面照现有的做：示例饱满、贴近真实场景、键盘一节、API 表；`pnpm docs:coverage` 列出示例没用到的属性。

## 9. 已知局限

有意的取舍见 [ROADMAP.md](ROADMAP.md) §7；其余的缺口都排进了 ROADMAP 的各节。

## 10. 换电脑

`git clone` 后仓库里的东西就齐了（`.claude/` 下的启动配置、LSP 插件、调研报告都已提交）。三个仓库放在同一个目录下
（原电脑是 `C:\Users\lionheart\IdeaProjects\`）：`vue-tsx-pro`、`query`（ORM）、`flow`（流程引擎，私有，交接文档在它的根目录 `HANDOFF.md`）。

| 东西                                                    | 新电脑上怎么办                                                                                                                                                                                |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node 24、pnpm 12（`packageManager` 固定 12.14.0）、`gh` | 新装；`pnpm install` 之后按第 3 节跑一遍短检查                                                                                                                                                |
| Playwright 的浏览器                                     | `pnpm --filter @vue-tsx-pro/host-demo exec playwright install chromium firefox webkit`（浏览器测试、`docs:shot`、`docs:review` 要用）                                                         |
| 用户级环境变量                                          | `GITHUB_TOKEN`、`CONTEXT7_API_KEY`，发布用的 `NPM_TOKEN`（`~/.npmrc` 写 `${NPM_TOKEN}`，见 RELEASE.md）                                                                                       |
| Claude 项目记忆                                         | 原电脑 `C:\Users\lionheart\.claude\projects\C--Users-lionheart-IdeaProjects-<仓库>\memory\`。长期要求已抄在第 5、6 节；记忆里还有真实业务项目的背景（不进仓库），需要时手动拷到新电脑对应目录 |
| 用户级 CLAUDE.md                                        | 原电脑 `C:\Users\lionheart\.claude\CLAUDE.md`（语言、工作方式、PowerShell 7.6 的注意事项），手动拷过去                                                                                        |
| IDEA                                                    | TypeScript 指向 `node_modules/typescript`（7.1）；MCP 的 `idea` 服务在新电脑重新配置                                                                                                          |

接着做：先 `gh run list --branch master --limit 3` 确认 CI 是绿的（2026-10-26 最后一次全绿），再按第 8 节与 ROADMAP 往下做。
