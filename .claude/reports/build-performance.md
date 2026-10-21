# 编译、启动、类型检查与加载性能调研

快照：master @ eb951b8（2026-10-21），Windows 11、Node 24.12、Vite 8.3.4、Rolldown 1.2.14、Babel 7.29、Vue 3.5.44、@vue/babel-plugin-jsx 2.0.1、StyleX 0.19.1、TypeScript 6.0.3。
样本：`apps/docs/src` 与 `packages/ui/src` 里除测试、演练场外的全部 587 个 TS/TSX 文件（1.9 MB）。
本机后台有别的负载，单线程计时的波动在 20–30%：比较都取同一进程里交替跑的结果（多轮取最好），只看比例，不看绝对值。
原型与基准脚本没有进仓库；需要复现时按“附：怎么测的”重写。

## 实施结果（2026-10-21，37fea01 起）

| 项                     | 结果                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 合并编译 + Babel 8     | `compiler/compile.ts` + 一个 Vite 插件；开发服务器输出 602 个文件、组件库发布产物、文档站 CSS 都与原来等价；CI 全绿                     |
| StyleX 的 CSS          | 自己合成（`vite/stylex.ts`）：只改注释时不再拉 CSS，改样式时只拉一次；构建时输出并在 HTML 里引用，**修好了文档站生产构建整页没有样式** |
| 磁盘编译缓存           | `vite/cache.ts`：文档站重启后首页 12.1 s → 3.9 s，命中缓存时服务的 CSS 与冷启动逐字节相同                                             |
| TypeScript 7           | `pnpm typecheck` 约 15 s；组件库声明生成 11.8 s → 2.2 s（只差属性顺序与引号风格）                                                       |
| API 提取结果落盘       | 组件页的 API 数据：冷 2 s → 缓存 4 ms                                                                                                   |
| 只读 prop 访问器       | `readonlyProp`：Button 的 17 个 prop 全部适用，实例化开销相对普通组件 4.0 倍 → 3.1 倍                                                 |
| lazyBarrel             | 文档站、宿主示例的构建开启，产物不变                                                                                                     |
| 首屏图标块             | `apps/docs/build/icons.ts`：构建时图标的具名导入改成单个图标模块，首屏 gzip 415 KB → 249 KB；桶文件再进首页的依赖图时构建报错并给出导入链 |
| Shiki 按需加载         | `createShikiHighlighter` 第一次高亮时才加载 shiki/core 与正则引擎：文档站首屏 gzip 249 KB → 197 KB（组件库改动，使用方同样受益）        |
| 运行时热点             | 无头 Chromium 剖析：prop 访问器直读 Vue props、字面量默认值直接传、合并属性少分配；Button 58 → 43 µs/实例，Checkbox 158 → 129 µs，1000 个 Button 更新 30 → 21 ms |
| 编译线程池             | `vite/pool.ts`：构建与开发服务器在工作线程里并行编译（Vitest 不用）；冷启动首页约 -30%，文档站构建 20–27 s → 9 s（含 API 缓存）       |
| prettier 缓存          | `pnpm check` 约 40 s → 15 s                                                                                                              |
| 主题定制子路径         | 色阶、对比度、token 清单、`customizeTheme` 移到 `@vue-tsx-pro/ui/theme-customize`；文档站只在访客改过主题设置时加载，挂载前等它免得闪：首屏 JS（入口块及其静态导入）gzip 170.0 → 152.9 KB |

试过但不做的：

- 开发时把 `@vue-tsx-pro/ui` 入口的具名导入改成直接导入所在模块：首页模块 247 → 160 个，但依赖链变深、往返层数变多，命中编译缓存时反而略慢（2.3 s → 2.5 s），撤掉。
  后来为了热更新又做了（见“开发体验：热更新与重启”），有了编译线程池与磁盘缓存之后重启并不变慢。
- 按入口分组合并首页那十几个一两百字节的图标小块（`codeSplitting` 的 `entriesAware`）：阈值稍大就把整套图标并回首屏，太脆弱。
- Vitest 的 `isolate: false`：环境创建与模块导入占测试时间的四分之三，但测试之间会共享全局状态，不值得冒串扰的风险。

## 全站巡检与运行时剖析（2026-10-21 下午，751d8b0 起）

起因：开发服务器里从别的页点进 VirtualList 页时整页无响应。查下去是新页面的 StyleX 规则比组件代码晚到——列表容器
那一刻没有高度，一万项全部渲染，每项首次测量都强制重排（平方级）。修好之后把整个文档站在真实浏览器里过了一遍。

**方法**（脚本没进仓库，按这里重写即可）：Playwright 的 Chromium；

- 巡检：从侧栏逐页点进去，记控制台错误与警告、页面错误、请求失败、主线程心跳（卡死）、横向溢出、示例溢出边框；
  每页点示例里的按钮、开关、标签，往输入框打字；axe（WCAG 2.1 AA + best-practice）在 12 套内置主题下各跑一遍；
  宽屏 1600 截亮色整页、暗色首屏拼成总览图逐张看
- 性能：生产构建，CPU 降速 4 倍；从首页点侧栏进去，量“点击 → 新页面的 h1 出现”、长任务（TBT）、
  Performance.getMetrics 的布局与样式耗时，以及停下来以后 2 秒里还耗多少 CPU；最重的几页录 CPU 剖析，
  再给 offsetXxx、clientXxx、getBoundingClientRect、getComputedStyle 包一层计时，按调用栈汇总慢的读取（强制重排）

**结果**（81 页，4 倍降速，同一台机器上前后对比）：

| 指标 | 之前 | 之后 |
| --- | --- | --- |
| 点击 → 渲染完成（中位数） | 1030 ms | 643 ms |
| 主线程阻塞 TBT（中位数） | 783 ms | 420 ms |
| 布局耗时（81 页合计） | 11.5 s | 9.8 s |
| 日历页 / 按钮页 / 图标页 | 3089 / 2362 / 2788 ms | 2360 / 1126 / 1374 ms |
| 骨架页停着不动时 2 秒里的 CPU | 1563 ms | 50 ms |

| 问题 | 做法 |
| --- | --- |
| 开发时新页面先按没有样式渲染 | 有 StyleX 规则的模块末尾 `await stylexReady(版本)`，求值完之前等规则进了页面（不挪代码，source map 不变）；客户端请求串行、合并 |
| 虚拟列表首次测量逐项强制重排 | 同一批新渲染的项在微任务里先全部读完再更新：没限高的一万行从约 120 秒降到 4.4 秒 |
| 收起的示例源码一打开就全部高亮（Shiki 每页 0.7–1 秒） | CodeBlock 加 `highlight`；CodePreview 指针移到、焦点落到“显示代码”上或展开时才高亮 |
| 骨架扫光每帧重绘 | 光带画在 `::after` 上用 transform 平移，`contain: paint` 按圆角裁 |
| 挂载时各组件“读 → 写”交错，反复重排 | `batchLayout` 先读后写；`useResizeObserver` 全应用共用一个观察器（回调之间不穿插 Vue 的更新）；滚动区、指示条都走它 |
| 收起的内容（`hidden="until-found"`）里读尺寸，每次都单独排版 | 滚动区看不见时不量（`checkVisibility()`），显示时由 ResizeObserver 再通知；Collapse 一开始就收起时不再 `getAnimations` |
| 示例重新分列时卸载重建（按钮页一次 6 个） | 先改成可换列的 flex 容器；下一轮改为分列在代码里写定（见下节） |
| API 表在页面底部也要排版 | `content-visibility: auto` |

顺带发现并修掉的：图表放在按内容定宽的容器里时不会跟着变窄（SVG 写死的宽度反过来撑住外层，绘图区加
`contain: inline-size`）、横排 Sortable 的项被挤成一字一行、Unovis 十字线在容器未渲染时报缺访问器、
代码高亮色在行内代码与 diff 行上对比度不够、无面板的 Tabs 指向不存在的面板、命令面板与菜单的快捷键混进名称。

还剩的大头：首次排版本身（一页几千到上万个节点，组件页 0.4–0.8 秒），以及主题定制页的预览（十二套主题卡片、图表）。
下一轮（见下节）把首屏用不到的 API 表与示例卡片推迟到首帧之后。

## 换页再提速与冷启动（2026-10-21 晚，ba42622 起）

同样的生产构建、4 倍降速；前后两份构建并排起服务器，交替各测 5 轮取中位数（“点击 → h1 出现”）：

| 做法 | 结果 |
| --- | --- |
| API 表在首帧画出来以后、浏览器空闲时一张一张渲染（`site/idle.ts` 的 `afterFirstPaint` / `whenIdle`），表格仍带 `content-visibility: auto` | Select 1478 → 890 ms，DatePicker 896 → 550 ms |
| 示例分列在代码里写定（`<Examples><ExampleColumn>…`，67 个页面按原来量出的分列一次改好），两列还是一列由容器查询决定；每列前两个示例的卡片立即渲染，其余先占位，进视口附近或首帧之后补上；标题一开始就在，目录与锚点照常，带锚点打开时全部立即渲染 | Button 974 → 658 ms，Calendar 1699 → 1321 ms |
| 指针停到站内链接上、焦点落到它上面时先下载那一页的模块（`prefetchOnIntent`） | 点击时模块多半已经到了，省掉一次往返 |

**冷启动**（第一次打开、没有缓存）：慢 4G（RTT 150 ms、1.6 Mbps）+ 4 倍降速，HTTP/1.1 的 FCP 约 3.0 s，HTTP/2 约 2.2 s；
首屏是入口加它静态导入的 61 个块，共 163 KB（gzip）。组件页的块要等入口执行完、路由开始加载时才发起（Button 页约 2.1 s）。

试过“每个页面一个 HTML，写上本页模块的 modulepreload”：页面的块在 0.2 s 就和入口一起发起，但慢网下是带宽瓶颈，
它们与首屏块抢带宽——首屏块到齐 1.55 → 1.96 s，FCP 2.15 → 2.55 s，h1 只早约 150 ms（3.6 → 3.45 s）；
主题定制页还会预加载 101 KB 的图表块，h1 反而更晚。收益太小，**不做**：冷启动等 JS 下载、执行完可以接受。

## 开发体验：热更新与重启（2026-10-21 晚）

优先级换成写代码时的速度：热更新、重启开发服务器、类型检查。

**方法**（脚本没进仓库）：每轮新起一个进程跑文档站的开发服务器（独立的 cacheDir 与端口，带上 pnpm 的
`--conditions=@vue-tsx-pro/source`，否则 Node 读到的是 tsx 包的构建产物），Playwright 量首页、点侧栏进 Button、
DataTable 页的 h1；再在 Button 页上依次改组件、样式模块、工具函数、文档页、示例、token 文件，记“写文件 →
`[vite] hot updated` 或整页刷新 → 页面上可见”。另外打开几页建起模块图，按 Vite 的 `propagateUpdate` 推演每个
源文件改了会不会整页刷新，打印走到死胡同的导入链。

| 问题 | 做法 | 效果 |
| --- | --- | --- |
| 组件库 252 个已加载的模块里 102 个改了会整页刷新：样式模块（button-core）、状态与工具函数、表单工具、工厂函数做的组件（Text、Heading、Flex、Grid、Container、CloseButton），热更新都经过桶文件 index.ts 走到 main.ts | `workspaceSource()` 在开发与测试时把桶文件的具名导入改成直接导入所在模块（解析用 Vite 的 `parseSync`，只改真正的 import 语句，行数不变）；构建不改（lazyBarrel） | 会整页刷新的剩 26 个，全是应用启动时就用掉的配置（createUi、主题、语言包、主题偏好、shiki / vue-router 适配）；改 button-core 的样式 277 ms、Heading 63 ms、工具函数 16 ms 热更新完成；首页加载的组件库模块 252 → 175 个，重启后首页 3.12 → 2.48 s，接着进 Button 753 → 792 ms（以前首页已经加载了整个库），两者合计快约 0.6 s（同一份缓存交替各 8 次取中位数） |
| 重启后点 DataTable 要 11–13 s | 悬停预取在开发时也开着：指针划过侧栏就取了别的页，那些页的 API 数据没缓存，Worker 要建十几秒的 TypeScript 程序，挂起的请求占满浏览器到开发服务器的连接，点开的页面被堵住。改成只在生产环境预取 | 约 0.5 s |
| cacheDir 不在 node_modules 下时，预构建的依赖（three.module.js 1 MB）被当成项目代码过 Babel | 编译插件把 cacheDir 里的文件排除在“项目自己的代码”之外 | — |

其余几类改动本来就快：改组件文件 40–80 ms，改示例 30 ms，改站点组件 35–40 ms，改文档页正文 150 ms 页面上可见；
改 token 文件整页刷新约 0.9 s（token 的值会内联进引用方，刷新是对的）。改了组件库源码之后进别的组件页，API 数据
重新提取只要 40–180 ms（Worker 在后台增量重建程序），不用改。

**类型检查**：`pnpm typecheck` 原来 8.5–9.3 s，正好是四个包（tsx 1.3、ui 2.6、docs 3.0、host-demo 2.4 s）之和——
`pnpm -r` 按依赖顺序一个个跑，可类型检查不产出文件、各包都直接读源码，不需要先后。改成 `pnpm -r --parallel`，
各包加 `--incremental`（tsbuildinfo 放在各包的 node_modules/.cache）：首次 7.5 s，之后 2.4–2.8 s（ui 单独：
全量 2.8 s，没改动 0.64 s，改一个文件 1.05 s）；有错误时照样报出并以非零码退出。

**测试**：组件库的 106 个 happy-dom 测试文件 37 s，建环境（38%）与导入模块（37%）占了大头，测试本身只占 6%。
按 Vitest 的 improving-performance 换成 `pool: 'vmForks'`：每个 Worker 只建一次 happy-dom，每个文件仍是新的 VM 上下文
与 window。VM 上下文里外部化的依赖按 Node 的 import 条件加载，@emotion 的 `.cjs.mjs` 包装默认导入拿到的是对象
（Unovis 用到），把 @unovis、@emotion 交给 Vite 内联后全部通过：**37 s → 10 s**。文档站的测试不换：时间主要在编译
（53%），建环境只占 8%，而且 VM 上下文里没有 CompressionStream 等全局，有 11 个用例过不了。

## 结论

| 问题                    | 做法                                                                                                         | 效果（实测或估算）                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 每个文件过四遍 Babel    | 自己的 Vite 插件：**一次解析 → 两次遍历 → 一次生成**，组合官方的 Babel 插件，不 fork 编译器本体              | 编译 CPU **-35%~45%**（实测），输出与现在逐字等价（587/587）                 |
| 升级到 Babel 8          | 与上一条一起做：jsx 3.0 只支持 Babel 8，官方的 `@vitejs/plugin-vue-jsx` 还绑着 Babel 7，自己的插件正好不需要它 | 速度与 Babel 7 持平；输出与现在等价（587/587）                               |
| StyleX 换社区 Rust 版   | **不换**：不支持我们的自定义模块解析、不认 `@vue-tsx-pro/tsx/stylex`，233/242 个文件的类名不同                | 合并后 StyleX 的边际成本只剩零点几秒，换了也省不了多少                       |
| 重启后第一页慢          | 持久化转换缓存（内容哈希 + 编译器版本 + `.stylex` 文件纪元）；API Worker 的结果也落盘                        | 首页可达的模块图：12.9–18.3 s → 5.3–6.3 s（四个 Babel 插件命中缓存，模拟实测） |
| 类型检查慢              | `typecheck` 改用 **TypeScript 7.0.2**（Go 原生版）；JS API 的使用方（脚本、语言服务、IDE）留在 TS 6           | 每个包 **5.5–7 倍**：ui 22.3 s → 3.3 s，docs 17.0 s → 3.0 s，结果一致        |
| 热更新时 CSS 重算两遍   | 自己的 StyleX 集成里按规则版本缓存 CSS，只在 StyleX 文件变化时通知                                            | 每次保存少一到两遍全量 LightningCSS（现在每遍约 100 ms，同步阻塞）           |
| 生产首屏带了整套图标    | 原因在分块阶段：1893 个图标模块合成一个首页依赖的公共块；几种简单修法都无效，需要按下文继续查                  | 首屏 394 KB（gzip）里图标占 173 KB                                           |
| 组件实例化              | prop 访问器按“会不会被写”在编译期选实现；不被写的不建 watch                                                  | 每个 prop 0.70 µs → 约 0.07 µs；Button（80 µs/实例）约省一成                 |
| Vapor、静态内容 innerHTML | 现阶段不做：Vue 3.6 还在 RC；本库“一个元素一个组件”，静态的原生元素子树很少                                 | —                                                                            |

顺手修的两个问题见文末“附：本次修复”。

---

## 1. 现状测量

### 1.1 编译管线

预设（`packages/tsx/src/vite/index.ts`）按顺序组合四个插件，**每个都是一次完整的 Babel 解析 → 遍历 → 生成**：

| 插件                         | 587 个文件的耗时（Vite 开发服务器里顺序转换，各轮之间差异大） |
| ---------------------------- | ------------------------------------------------------------- |
| `vue-tsx-pro:runes`          | 2.9–5.1 s                                                     |
| `@stylexjs/unplugin`         | 1.8–3.5 s                                                     |
| `vite:vue-jsx`               | 2.3–2.6 s（还是同步的 `transformSync`，自带一遍 TS 去类型）   |
| `vue-tsx-pro:tokens`         | 1.3–2.4 s                                                     |
| 合计（墙钟 13.1 s 里的 ~10 s） |                                                               |

Babel 自身各阶段的成本（同样 587 个文件，5 轮取最好）：

| 阶段                         | 耗时    |
| ---------------------------- | ------- |
| 只解析                       | 0.31 s  |
| 解析 + 建作用域、遍历一遍    | 1.97 s  |
| 解析 + 生成代码与 source map | 2.45 s  |
| oxc 解析（对照）             | 0.09 s  |

**大头是遍历（作用域）和生成（尤其 source map），不是解析**。四遍流水线付了四次遍历、四次生成，还要把四份 source map 串起来。这也决定了：只把某一步换成 Rust、中间仍然要“生成字符串 → 再解析”，省不了多少（见 2.4）。

### 1.2 重启与页面加载（开发服务器）

- 重启后打开首页：约 **8 s**。首页加载 250+ 个模块，其中 219 个是组件库源码（`@vue-tsx-pro/ui` 的入口把整个库都导入了）。
- 首页还没编译完时换到 DataTable 页：再等 3.7 s，其中包括 API Worker 用 TS 6 建整个组件库的类型程序（`apps/docs/build/api.ts`）。
- 模拟重启（同一进程里先起一个服务器编译首页可达的整个模块图 982 个模块，再起一个空模块图的新服务器）：冷启动 12.9–18.3 s；四个 Babel 插件命中内存缓存后 **5.3–6.3 s**。剩下的时间主要在 `docs:component-api` 等 Worker 建程序，以及 Vite 自身。
- 热重载后的刷新（服务器有缓存）约 0.4 s，不是问题。

### 1.3 热更新

在 Button 页给 `Button.tsx` 末尾加注释，浏览器里观察到（以写文件为 0）：

| 时间        | 事件                                                                 |
| ----------- | -------------------------------------------------------------------- |
| +13 ms      | StyleX 插件的 `handleHotUpdate` **无条件**通知重新拉 `/virtual:stylex.css` |
| +120~140 ms | 新的 `Button.tsx` 到达                                               |
| +370~460 ms | 150 ms 轮询发现规则版本变了，**再拉一次**整份 CSS                    |

每次拉 CSS，服务器都同步把全部规则重新跑一遍 LightningCSS（只加载了几页时 104 KB、约 1000 条规则，70–100 ms；全站规则加载后更多）。改任何文件都会触发，哪怕文件里没有 StyleX。

大文件单次编译（现在 → 合并后）：DataTableView（816 行）167 → 108 ms，Menu（899 行）155 → 97 ms。

### 1.4 类型检查

| 项目           | TS 6.0.3 | TS 7.0.2 | 错误数（两者） |
| -------------- | -------- | -------- | -------------- |
| packages/tsx   | 13.1 s   | 1.9 s    | 0 / 0          |
| packages/ui    | 22.3 s   | 3.3 s    | 0 / 0          |
| apps/docs      | 17.0 s   | 3.0 s    | 0 / 0          |
| apps/host-demo | 13.8 s   | 2.8 s    | 0 / 0          |

### 1.5 生产首屏（文档站）

首屏（index.html 里的入口与 modulepreload）43 个文件、1298 KB / **394 KB gzip**。最大的是 `lucide-icons-*.js`：716 KB / **173 KB gzip**，即全部 1893 个图标。见 3.4。

文档站构建 25–27 s，最大的单项是演练场的编译 Worker（浏览器里跑的 Babel，嵌套打包一次，8–14 s）。

### 1.6 组件实例化（浏览器、开发版 Vue，2000 个实例取中位数）

| 渲染内容          | 每个实例 |
| ----------------- | -------- |
| 原生 `<button>`   | 3 µs     |
| 普通 Vue 组件     | 20 µs    |
| ui 的 `Button`    | 85 µs    |

单独测 prop 访问器（20000 个）：

| 实现                                                   | 每个    |
| ------------------------------------------------------ | ------- |
| `overridable`（现在的 prop：computed + customRef + 同步 watch） | 0.70 µs |
| `computed`                                             | 0.13 µs |
| getter ref（`toRef(() => …)`）                         | 0.07 µs |

---

## 2. 编译方案

### 2.1 合并编译的原型

复制 `packages/tsx/src` 做了三种组合（都用官方的 `@stylexjs/babel-plugin`、`@vue/babel-plugin-jsx`、`@babel/plugin-transform-typescript`）：

| 方案                                          | 587 个文件（同一进程交替 5 轮取最好） | 与现在的输出         |
| --------------------------------------------- | ------------------------------------- | -------------------- |
| A 现在：四遍                                  | 10.0–11.0 s                           | —                    |
| B 一次 `transformAsync`，全部插件一遍遍历      | 5.4–6.4 s                             | 17 个文件多了运行时 `mergeProps` |
| **D 一次解析 → 两遍遍历 → 一次生成**          | 6.2–6.9 s                             | **逐字等价**         |

比较方法：两边的输出都重新解析，去掉 import、统一键名写法（`"class"` 与 `class`）、去掉只用于调试的 `$$css` 与 `data-style-src`，再逐字比较。D 连 import 都与 A 完全一致。

D 的两遍：

1. 符文 + token 字符串 + StyleX；
2. vue-jsx + 去类型（+ 热更新注册）。

B 只差一点：StyleX 在 Program 退出时才替换 `stylex.attrs(…)`，一遍遍历里 vue-jsx 先处理了元素，于是生成 `_mergeProps({to}, {class})` 而不是一个对象。结果等价，只是多一次运行时合并，所以选 D。

### 2.2 原型暴露的三处耦合（合并前必须改）

1. **作用域没登记新绑定**。token 插件补的 import、符文改写出的声明没有登记进作用域；分开跑时靠重新解析掩盖了。合并后 StyleX 报 “Referenced constant is not defined”，vue-jsx 判断也会出错。原型在两遍之间 `program.scope.crawl()`；正式做时改成插入节点时登记绑定（`scope.registerDeclaration`），不额外遍历。
2. **vue-jsx 靠 `loc` 区分用户写的调用**。它只对带源码位置的调用子节点做 `_isSlot` 判断。编译器生成的 `forwardChildren(_props)` 没有位置，同一遍里接着跑 vue-jsx 时，转交的插槽对象被当成内容再包一层。**这个问题在代码演练场里已经存在**（演练场本来就是一遍编译），已修复，见文末。
3. **`.ts` 不能开 JSX 解析**。官方 StyleX unplugin 对所有 TS 文件都用 `isTSX: true`；Babel 7 能容忍，Babel 8 对 `<T>(x) => …` 直接报错。自己的插件按扩展名选解析插件（`parserPlugins` 已有）。

另外两处合并后自动变好的：

- `$$css`、`data-style-src` 里的行号现在对应的是“被前几遍重新生成后的代码”，与源码对不上（例如 Text.tsx 的 `paragraph` 在第 56 行，现在标的是 45）；合并后是源码的真实行号。
- 现在 `data-style-src` 在 Windows 上反斜杠被转义了两次（`src\\\\base`），合并后正常。

### 2.3 Babel 8 与 @vue/babel-plugin-jsx 3.0

- Babel 8.0.0 于 2026-06-16 发布，当前 8.0.7；`@vue/babel-plugin-jsx` 3.0.0（2026-06-22）只支持 Babel 8，选项与 2.x 相同（没有新的优化）。
- `@vitejs/plugin-vue-jsx` 最新 5.1.6 仍依赖 Babel 7 与 jsx 2.x——升级 Babel 8 的阻碍正是它，而自己的插件本来就要替代它。
- `@stylexjs/babel-plugin` 0.19.1 把 `@babel/core ^7` 写在 dependencies 里，在 Babel 8 下实测能跑，输出一致，但它自己会再装一份 Babel 7 的 traverse / types。
- 实测：Babel 8 下 A 与 D 的耗时与 Babel 7 持平；**Babel 8 + jsx 3.0 + D 的输出与现在的 Babel 7 四遍完全等价（587/587）**。
- 代码演练场的 Worker 也在浏览器里跑同一套 Babel 插件，升级时一起换（Babel 8 只有 ESM，对浏览器打包没有影响）。

### 2.4 社区的 Rust 版 StyleX（@stylexswc/rs-compiler 0.19.2）

- 速度：同样 242 个用到 StyleX 的文件，单独跑 0.65–0.77 s，官方 Babel 版单独跑 3.3–4.6 s，约快 5 倍。
- 但在我们的配置下用不了：
  - `unstable_moduleResolution` 只有 `type / rootDir / themeFileExtension`，**没有 `custom`**。我们靠 `custom` 的 `filePathResolver` / `getCanonicalFilePath` 让 src 与 dist 算出同一个变量名（`stylex-resolution.ts`）。
  - `importSources` 不接受带子路径的包名，`@vue-tsx-pro/tsx/stylex` 直接报 “Import path does not match required pattern”。
  - 换成能接受的写法后，**242 个文件里 233 个的类名与官方不同**（凡是引用 token 变量的样式都不同，README 自己也说 exports 字段“只部分支持”）。
- 合并编译后 StyleX 在共享遍历里的边际成本只有零点几秒（实测噪声内），换 Rust 还要多一次“生成 → Rust 解析 → Rust 生成 → 再解析”，得不偿失。
- 演练场在浏览器里只能用 Babel 版，换 Rust 等于维护两套 StyleX 实现。

结论：不换。等官方 StyleX 自己出编译器、或社区版支持自定义解析并且输出一致后再评估。

### 2.5 全部换 oxc / Rust

- 解析只占 0.3 s，换 oxc 解析省的就是这些；真正的成本在遍历和生成。
- 要把符文编译器（约 1700 行，基于 Babel 的 path / scope）改写到 oxc 的 AST 上，还要替换 vue-jsx。Vue JSX 的 Rust 实现目前只有 vue-jsx-vapor 的 compiler-rs，目标是 Vapor。
- 结论：现在不做。如果将来转向 Vapor（见 5.3），再一起考虑。

### 2.6 选型

**不 fork vue-jsx 与 StyleX 的编译器本体**：原型证明它们可以原样组合进一遍编译，需要改的三处都在我们自己的编译器里。要“自己写”的只是 Vite 胶水层：

- 热更新注册（`__hmrId`、`createRecord`、`accept`，取自 `@vitejs/plugin-vue-jsx`，约 60 行）；
- StyleX 规则收集与 CSS（开发时的 CSS 端点与更新通知、构建时输出 CSS；`@stylexjs/babel-plugin` 自带 `processStylexRules`）。这样也删掉现在为绕开 unplugin 问题写的两个包装（`skipDevServerWithoutHttp`、`loadStylexModulesOnly`），但要保留“先加载导入的 `.stylex` 模块”的行为。

编译核心做成一个与 Vite 无关的函数（`@vue-tsx-pro/tsx/compiler` 导出），Vite 插件、演练场 Worker、测试共用，三处不再各写一份插件列表。

---

## 3. 启动与加载

### 3.1 持久化转换缓存

Vite 没有跨重启的转换缓存（每次重启全部重编），Vitest 有 fsModuleCache（预设已经登记了编译器哈希，见 `cache-key.ts`）。在自己的插件里加：

- 键：编译器哈希（复用 `compilerCacheKey`）+ 选项 + 文件内容 + 依赖版本（Babel、StyleX、jsx 插件）+ **`.stylex` 纪元**（所有 `.stylex` 文件内容的哈希：`defineConsts` 的值会被内联进引用方，token 写法要读 token 组名）；
- 值：代码、source map、StyleX 规则（命中缓存时把规则重新登记，否则 CSS 会缺）；
- 位置：Vite 的 `cacheDir` 下。

效果：模拟重启实测，首页可达的模块图从 12.9–18.3 s 降到 5.3–6.3 s；剩下的时间见 3.2。

### 3.2 API Worker

每个组件页都等 Worker 用 TS 6 建出整个组件库的程序。把提取结果按“组件库源文件内容的哈希”落盘，重启后直接读；源码变了再按现在的增量方式重建。TS 7 暂时没有 JS API，不能直接换。

### 3.3 开发时的桶文件

`import { … } from '@vue-tsx-pro/ui'` 让首页加载整个库（219 个模块）。可以在开发时把具名导入改写成直接导入所在模块（`pnpm exports` 生成的入口就是现成的映射表），首页只加载用到的部分。等 3.1 做完再测还值不值得做：有缓存后多出的模块只是请求数。

Vite 8.3 的 `experimental.bundledDev`（开发时也打包，带懒打包）能减少请求数，但官方标注 “highly experimental”，热更新语义不同，我们的 StyleX 开发集成也要适配，暂不采用。

### 3.4 首屏的图标

- 首页静态依赖了一个装着全部 1893 个图标模块的公共块（被 87 个块静态导入、被演练场页动态导入）。
- 用到整套图标的只有懒加载的地方：图库（`IconGallery.tsx` 的 `import * as lucide`）与演练场的模块表（`run.ts` 的 `import('@lucide/icons')`）。
- 已排除：开 `experimental.lazyBarrel`、关 `chunkOptimization`、图库改成顶层 `await import('@lucide/icons')`，图标块都还在首屏；构建时把 145 处具名导入改写成单个图标模块，产物逐字不变（Rolldown 本来就把桶文件的再导出直接追到单个模块）；图库改用 `@lucide/icons/dynamic` 逐个懒加载，更糟（1945 个文件进了首屏）。
- 探针查到的链：首页没用到的图标（如 `icons/a-arrow-down.mjs`）← `icons/index.mjs`（全部图标的子桶）← 主桶 `lucide-icons.mjs`（以命名空间再导出子桶）← `App.tsx` 等首页模块。图库对主桶做命名空间使用（`Object.entries`），连带子桶的命名空间对象，全部图标就留在主桶所在、首页依赖的块里。
- 已解决（见上方实施结果）：之前几次“改写后产物不变”的实验，是因为用 `createRequire().resolve()` 读到的是 CommonJS 版桶文件，名字映射表是空的，一个都没改写；按 ESM 解析后改写生效。按入口分组（`codeSplitting` 的 `entriesAware`）能把首页那十几个一两百字节的图标块并成几块，但合并阈值稍大就会把整套图标并回首屏，太脆弱，没有采用。原来的下一步：让首页的依赖图里完全不出现这两个桶文件（全仓库的图标导入在构建时改成单个图标模块，同时开 lazyBarrel），图库与演练场的模块表仍用桶文件，再用探针确认分块；或者图库与演练场改用构建时生成的“图标名 → 单个图标路径”懒加载表。
- `lazyBarrel` 本身值得开：构建时符文插件的调用从 5090 次降到 3884 次，产物首屏一致。

### 3.5 其他懒加载

已经做了的：页面按路由懒加载、Shiki 只加载用到的语言、three 与 Unovis 在子路径、演练场与 API 目录懒加载、浮层内容第一次打开才渲染。可以再加：

- 组件页的示例卡片加 `content-visibility: auto`（长页面只渲染视口附近，纯 CSS，Chrome 85、Firefox 125、Safari 18 起支持）。

---

## 4. 类型检查：TypeScript 7

- 7.0.2 是 Go 原生版，没有 JS API；官方另发了 `@typescript/typescript6` 给需要 API 的工具。
- 仓库里用 TS 的 JS API 的有：文档站构建（`build/api.ts`、`build/pages.ts`）、注释检查、导出生成、css-docs、主题检查、语言服务脚本，以及 `typescript-language-server`（Claude Code 的 LSP 插件）和 IDE。
- 建议：`typescript` 保持 6.0.3（API、IDE、语言服务不受影响），另装 `typescript@7.0.2` 的别名包，各包的 `typecheck` 与 CI 用它的 `tsc`（别名包与 6 都提供 `tsc` 命令，脚本里写路径，不靠 `.bin`）。IDE 与 LSP 支持 TS 7 后再整体切换。
- `oxlint-tsgolint` 已经是基于 tsgo 的类型感知检查，不受影响。

---

## 5. 运行时架构

### 5.1 prop 访问器

每个普通 prop 现在是 `overridable`：1 个 computed + 1 个 customRef + 1 个同步 watch，watch 还在 setup 时就立即求值一次。编译器知道组件里有没有给这个 prop 赋值：

- 没被写过（绝大多数）：生成只读的 getter ref，默认值引用了其他 prop 或要每个实例一份（`[]`、`{}`、函数调用）时才用 computed 缓存；
- 被写过：保留 `overridable`。

每个 prop 0.70 µs → 约 0.07 µs。Button 约十几个 prop，每个实例约省 9 µs（占 85 µs 的一成）。剩下的开销在组合式函数（外观默认值、延迟加载指示、按钮行为与波纹）；做之前先用浏览器性能面板看一次 DataTable 大量行的挂载，按热点改。

### 5.2 静态内容转 innerHTML

Vue 的模板编译器会把大段静态子树字符串化，用 innerHTML 一次建好（`createStaticVNode`）；vue-jsx 没有这一步，jsx 3.0 也没有。本库约定“一个元素一个组件”，静态内容大多是组件（Paragraph、H2…），只有原生元素组成的静态子树才能这样做，这种地方很少。Icon 已经用 innerHTML。暂不做。

### 5.3 Vapor 模式

Vue 3.6（当前 3.6.0-rc.12）的 Vapor 不用虚拟 DOM，模板编译成克隆好的 DOM 片段加直接的 DOM 操作，是“实例化”和更新开销的根本解法；JSX 有社区的 vue-jsx-vapor（3.2.x，带 Rust 编译器）。但 3.6 还没正式发布，我们的渲染优化（稳定插槽、属性缓存）是为虚拟 DOM 做的，组件库还要在使用方的虚拟 DOM 应用里工作（需要 interop）。等 3.6 正式发布后单独评估。

---

## 6. 建议的执行顺序

| 优先级 | 内容                                                                                      | 风险                         |
| ------ | ----------------------------------------------------------------------------------------- | ---------------------------- |
| P0     | 类型检查改用 TS 7（别名包，typecheck 与 CI）                                              | 低：结果一致，可随时退回     |
| P0     | 构建开 `lazyBarrel`                                                                       | 低：产物一致                 |
| P1     | 合并编译：编译核心函数 + 自己的 Vite 插件（D 方案），同时升级 Babel 8 与 jsx 3.0；先修 2.2 的三处耦合；拿 587 个文件的“新旧输出等价”比较当回归测试 | 中：替换官方 vue-jsx 插件与 StyleX unplugin |
| P1     | StyleX 开发 CSS：按规则版本缓存，只在 StyleX 文件变化时通知（随合并编译一起做）            | 低                           |
| P2     | 持久化转换缓存；API Worker 结果落盘                                                       | 中：缓存键漏项会读到旧结果   |
| P2     | 查清首屏图标块的成因并修                                                                  | 低                           |
| P3     | prop 访问器按读写选实现；性能面板找组件实例化的热点                                       | 中：涉及符文语义             |
| 观察   | Vite `bundledDev`、Vue 3.6 Vapor、官方 StyleX 编译器、TS 7 的 JS API                      | —                            |

---

## 附：本次修复

1. **Windows 上按正斜杠路径解析包的自引用失败**（`packages/tsx/src/vite/stylex-resolution.ts`、`tokens.ts`）。Vite 给的路径是正斜杠，Node 在 Windows 上从这种路径找不到所在的包，组件库源码导入 `@vue-tsx-pro/ui/tokens.stylex` 时，token 插件报“找不到主题 tokens 模块”。平时没出事，是因为 StyleX 插件内部恰好先用反斜杠路径解析过一次、填上了 Node 的缓存——依赖调用顺序，基准脚本先编译组件库文件时 105 个文件全部报错。改为解析前用 `path.resolve` 规范成本机分隔符（`requireFrom`）；测试在缓存为空的新进程里跑。
2. **代码演练场里转交的 children 显示成 `[object Object]`**（`packages/tsx/src/compiler/optimize.ts`）。组件写 `<Box>{children}</Box>` 转交内容时，编译器生成的 `forwardChildren(...)` 没有源码位置，vue-jsx 不对它做插槽判断，把插槽对象当成内容再包一层。Vite 那条路因为“重新生成再解析”补上了位置所以没出错，演练场是一遍编译就出错了。生成的调用借用元素的位置；演练场的编译测试加了这个场景。

## 附：怎么测的

- 插件耗时：用文档站的 Vite 配置起中间件模式的服务器，给每个插件的 transform 套计时，`transformRequest` 全部源文件（`server.preTransformRequests: false`）。
- 合并编译原型：直接调用各个 Babel 插件，A、B、D 在同一进程里交替跑多轮；输出按 2.1 的方法归一化后逐字比较。Babel 8 在单独的目录里装 `@babel/core@8`、`@vue/babel-plugin-jsx@3` 跑同一份原型。
- Rust 版 StyleX：导出每个文件进入 StyleX 之前的中间代码，Babel 版与 Rust 版分别编译同一批输入。
- 重启：同一进程里先后起两个服务器，从 `/src/main.ts` 按 import 并发爬取模块图；第二个服务器的四个 Babel 插件从内存缓存返回。
- 热更新：浏览器里用 PerformanceObserver 记录 `?t=` 请求与 CSS 请求的时间，Node 里记录写文件的时间。
- 首屏：统计构建产物 index.html 引用的入口与 modulepreload，gzip 后求和；分块用 `generateBundle` 探针打印。
