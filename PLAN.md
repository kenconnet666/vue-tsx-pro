# vue-tsx-pro 工程规划

日期：2026-10-17（Asia/Singapore）
依据：`RESEARCH.md`（组件写法、StyleX）、`RUNES.md`（符文编译）、原型 `research/probe`（35 项测试，已清理，见提交 `7ad76fb`）以及补充验证（§8）。

---

## 1. 定位与已定的决定

**定位**：在**已有的 Vue 3.5 项目**里，用我们的 TSX 写法构建**独立页面**，配合**我们自己的组件库**。与宿主共享的只有同一份 Vue、响应式状态（pinia、组合式函数）、`provide` / `inject` 与路由挂载；不兼容 SFC 模板，也不和 SFC 互相使用组件。

| 项           | 决定                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| 渲染         | 只做 Vue 3.5 虚拟 DOM；只写 TSX                                                                               |
| 编译         | 我们的符文编译器（Babel 7）先执行，再交给官方插件：StyleX → `@vitejs/plugin-vue-jsx`（JSX、去类型、热更新）   |
| 文件范围     | 不按目录隔离：只有用到符文或 `_component` 的文件被我们改写，宿主其他代码原样交给后续插件                      |
| 响应式写法   | 下划线符文：`_state`、`_derived`、`_bindable`、`_from`、`_ref`，编译为 Vue 原生 API                           |
| 组件         | 只有 props：参数解构即 props（Svelte 式响应式解构）；内容用 `children`；通知用 `onXxx`；不用 slot/emit/expose |
| 组件双向绑定 | `_bindable` + Vue 标准 `v-model:xxx` 协议（我们组件之间使用）                                                 |
| CSS          | StyleX，外部覆盖统一走 `sx` prop；自家语法糖在我们的编译器里改写成 StyleX 标准调用，不 fork StyleX            |
| 包管理       | pnpm workspace（monorepo）                                                                                    |
| 包名         | `@vue-tsx-pro/*`；编译相关合成一个 `@vue-tsx-pro/tsx` 包                                                      |

**明确不做**：具名插槽映射、SFC 里写符文、不解构的整体 props（等真有需要再加）、SSR。

---

## 2. 设计说明

### 2.1 编译相关合成一个包

compiler、Vite 插件、runtime、类型总是一起升级、一起使用，拆开只会增加版本对齐和发布成本。**一个包、多个子路径导出**：

```
@vue-tsx-pro/tsx              _component()、prop 访问器
@vue-tsx-pro/tsx/vite         Vite 预设（符文 → StyleX → 官方 JSX 插件，一行配置）
@vue-tsx-pro/tsx/compiler     符文编译器纯函数（给测试、其他打包器用）
@vue-tsx-pro/tsx/jsx-runtime  jsxImportSource 类型入口（基于 vue/jsx-runtime，含 children 与 v-model:K）
```

### 2.2 测试跟着包走

单元测试放在各自的包里（`packages/*/test`）。单独的工作区只放跨包、面向产物的测试：宿主集成、真实浏览器 E2E、发布产物验证。见 §5。

### 2.3 下划线前缀的代价

- **技术上没有冲突**：编译器生成的 Vue 导入别名是 `_vue_ref` 这类名字，不会和 `_ref` 符文或 JSX 编译器生成的 `_createVNode` 等撞名。
- **可读性代价**：`_` 在 JS 社区普遍表示"私有/未使用"；编译产物里 JSX 编译器生成的辅助函数也是 `_` 开头。

缓解：`_` 前缀**保留给符文**，项目代码里普通函数和变量不用 `_` 开头。

### 2.4 依赖与升级

- 整条链除文档站的 VitePress 2 alpha 外都是正式版；共享版本用 pnpm catalog **精确固定**，升级集中在一次提交里做。
- **Babel 停在 7**：官方 `@vitejs/plugin-vue-jsx` 5.1.6 与 StyleX 0.19 都基于 Babel 7。`@vue/babel-plugin-jsx` 3.0 只是改为要求 Babel 8，编译结果与 2.0.1 相同；等官方 JSX 插件和 StyleX 都迁到 Babel 8 后一起升级（Babel 7 官方维护到 2027 年 6 月底，届时复查）。
- **StyleX 不 fork**：编译器约 2 万行、Flow 源码、1～3 个月一版。它的 Babel 8 支持只有一个无人回复的 issue（facebook/stylex#1790）；扫描发布产物发现它几乎不用 Babel 8 删除的 API，迁移成本不高，适合向上游贡献而不是 fork。

### 2.5 组件库的 StyleX 发布形态要提前验证

StyleX 的 Vite 插件会自动转换"依赖了 `@stylexjs/stylex` 的已安装包"，模型是**组件库保留 `stylex.create` 源码、由使用方应用统一编译**，原子类能跨库去重，`sx` 覆盖也能正确合并。因此 UI 包产物是：TSX 与符文**已编译**、StyleX **保留**，使用方必须装 StyleX 插件（用我们的 Vite 预设就自动包含）。M5 用独立的使用方应用验证。

### 2.6 文档站用 VitePress 2 alpha，但要留退路

VitePress 1.6.4 稳定版内置 Vite 5，与我们的 Vite 8 不匹配；2.0 alpha 已实测可行（§8）。退路是自建：Vite + vue-router + vite-ssg + TSX 页面，Markdown 写作与搜索要自己补。演示代码都放在独立的 `.tsx` 里，将来迁移成本只在 Markdown 层。

---

## 3. 仓库结构

```
vue-tsx-pro/
├─ package.json               根：只放仓库级脚本（lint、全量检查、发布），不放业务依赖
├─ pnpm-workspace.yaml        工作区与 catalog 版本
├─ tsconfig.base.json         共享编译选项
├─ packages/
│  ├─ tsx/                    @vue-tsx-pro/tsx（发布）
│  │  ├─ src/
│  │  │  ├─ runtime/          _component()、children 映射、prop 访问器
│  │  │  ├─ compiler/         符文编译器（纯函数，不依赖 Vite）
│  │  │  └─ vite/             预设插件：符文 → StyleX → @vitejs/plugin-vue-jsx
│  │  ├─ types/               符文全局类型、jsx-runtime 类型
│  │  └─ test/                编译、运行时、类型（*.test-d.tsx）
│  └─ ui/                     @vue-tsx-pro/ui（发布）
│     ├─ src/
│     │  ├─ tokens/           StyleX defineVars / createTheme：颜色、间距、圆角、字号
│     │  └─ components/
│     │     └─ Switch/        Switch.tsx、Switch.test.tsx（一个组件一个目录）
│     └─ test/                跨组件测试、浏览器模式测试配置
├─ apps/
│  ├─ docs/                   文档站（VitePress 2，私有）
│  │  ├─ guide/               写法指南：组件、符文、样式、互通
│  │  ├─ components/          每个组件一页 Markdown
│  │  └─ demos/               演示代码 .tsx（页面引用；E2E 也复用）
│  └─ host-demo/              宿主示例：普通 Vue 3.5 项目里的一个 TSX 页面（私有）
├─ tests/
│  ├─ e2e/                    Playwright：对构建后的文档站跑真实浏览器
│  └─ consumer/               用 pnpm pack 的产物搭独立应用，验证发布包可用
└─ .github/workflows/ci.yml   Ubuntu + Windows
```

依赖方向只有一条：`ui → tsx`，`docs → ui + tsx`，`host-demo → tsx`（组件库有组件后再加 `ui`），`tests/* → 构建产物`。`tsx` 不依赖 `ui`。

注意：pnpm 12 已不再读取 `package.json` 里的 `pnpm` 字段，工作区设置必须写在 `pnpm-workspace.yaml`。

---

## 4. 约定

**命名**

- 包：`@vue-tsx-pro/*`（正式使用前先注册 npm 组织占位）。
- 符文：只有 `_state`、`_state.raw`、`_derived`、`_derived.by`、`_bindable`、`_from`、`_ref` 七个写法，`_` 前缀保留给它们。
- 组件：PascalCase 文件名，一个组件一个目录，测试就近放。

**组件写法**（详见 `RESEARCH.md`、`RUNES.md`）

- 参数解构写 props；`_bindable(默认值)` 表示双向；函数体执行一次，`return () => JSX` 是渲染。
- 通知用 `onXxx` 函数 prop；内容用 `children`；具名内容用 JSX prop；不用 emit / slot / expose。
- 副作用、生命周期、provide/inject 直接用 Vue。
- 跨函数传值优先 getter，要可写 Ref 时用 `_ref(x)`；接入外部 Ref 用 `_from`。

**样式**

- 每个组件文件顶部一个 `stylex.create`，按布局、尺寸、文字、外观、状态分组。
- 主题值只来自 `tokens/` 的 `defineVars`，组件里不写裸色值。
- 对外只开放一个 `sx` prop 作为覆盖口。

**版本**

- 共享依赖一律走 catalog 精确版本；升级单独提交，并在提交说明里写清验证结果。

---

## 5. 测试分层

| 层         | 测什么                                                              | 工具                           | 位置                |
| ---------- | ------------------------------------------------------------------- | ------------------------------ | ------------------- |
| 编译       | 符文输入 → 输出代码；误用写法给出带位置的中文报错                   | Vitest                         | `packages/tsx/test` |
| 运行时语义 | 符文、`_bindable`、children、与 Vue 响应式互通                      | Vitest + happy-dom             | `packages/*/test`   |
| 类型       | 正确写法通过；错误写法用 `@ts-expect-error` 标注                    | `tsc`                          | `*.test-d.tsx`      |
| 宿主集成   | 在普通 Vue 3.5 项目里挂载 TSX 页面：路由、store、inject             | Vitest + happy-dom             | `apps/host-demo`    |
| 组件交互   | 焦点、键盘、输入法组合事件、真实布局                                | Vitest 浏览器模式 + Playwright | `packages/ui`       |
| 文档站 E2E | 页面可用、演示可交互、无控制台错误；可选视觉回归                    | Playwright                     | `tests/e2e`         |
| 发布产物   | `pnpm pack` 出的包在独立应用里能安装、构建、运行；StyleX 由应用编译 | Vite 构建 + 冒烟测试           | `tests/consumer`    |

`@ts-expect-error` 标注的行不报错时 `tsc` 会失败，因此不需要人工核对错误列表。

CI 顺序：安装 → lint → 格式 → 类型检查 → 单元/运行时 → 构建各包 → 文档站构建（之后加入浏览器模式、E2E、发布产物验证）。

---

## 6. 里程碑

每个阶段都以"可验证的退出条件"结束，不以完成多少文件为准。

| 阶段            | 内容                                                                                                                 | 退出条件                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **M0 骨架**     | workspace、catalog、tsconfig、lint/format、CI                                                                        | CI 上安装、lint、类型检查全部通过（已完成）                            |
| **M1 tsx 包**   | 符文与 props 编译；Vue 3.5 + 官方 JSX 插件底座；宿主示例；children 渲染函数、带连字符的 prop 名、`_derived` 解构     | 测试全部通过；宿主示例中页面能用路由、store、inject                    |
| **M2 UI 基础**  | tokens 与主题切换；Button、Switch、TextField、Checkbox；浏览器模式交互测试；基础可访问性                             | 4 个组件在真实浏览器中通过键盘、焦点、输入法测试；主题可在局部嵌套切换 |
| **M3 文档站**   | 写法指南；组件页（演示 + 源码展示）；部署；E2E 冒烟                                                                  | 文档站构建并部署；E2E 覆盖每个组件页                                   |
| **M4 复杂组件** | 泛型 Select（验证 `renderItem` 的泛型推导）、列表（`For`）、Dialog（父级控制器对象替代 expose）                      | Select 泛型推导在纯 `tsc` 下成立                                       |
| **M5 发布准备** | `tests/consumer`；确定 UI 包 StyleX 发布形态；放宽 Vite peer 范围（宿主示例验证 Vite 5～7 后）；changesets；发 `0.x` | 独立应用只用 npm 产物即可构建运行，样式与覆盖正确                      |
| **之后**        | Babel 8 升级（等官方 JSX 插件与 StyleX）；`sx` 语法糖；setup 顶层读取符文的快照警告；评估 TS 7                       | 按需                                                                   |

关于 TS 7：npm 上 7.0.2 是 Go 重写的稳定版，用它检查本仓库没有报错，但它移除了旧的 JS API（`createLanguageService` 等），而 `scripts/language-services` 依赖这套 API。升级需要重写该脚本，因此先用 TS 6。

---

## 7. 工具与版本

以下版本均为 2026-10-17 从 npm 读取，标 ✓ 的已在仓库中实际使用。

| 用途        | 选择                                                       | 版本              |
| ----------- | ---------------------------------------------------------- | ----------------- |
| 运行时      | Node 24 LTS                                                | 24.18.0 ✓         |
| 包管理      | pnpm                                                       | 12.14.0 ✓         |
| 语言        | TypeScript                                                 | 6.0.3 ✓           |
| 框架        | Vue                                                        | 3.5.44 ✓          |
| JSX 编译    | @vitejs/plugin-vue-jsx（带入 @vue/babel-plugin-jsx 2.0.1） | 5.1.6 ✓           |
| 符文编译    | Babel                                                      | 7.29.7 ✓          |
| 样式        | StyleX + @stylexjs/unplugin                                | 0.19.1 ✓          |
| 构建        | Vite                                                       | 8.3.4 ✓           |
| 测试        | Vitest（含浏览器模式）                                     | 5.0.5 ✓           |
| E2E         | Playwright                                                 | 1.64.1            |
| 文档        | VitePress                                                  | 2.0.0-alpha.20 ✓  |
| 库打包      | tsdown                                                     | 0.23.1 ✓          |
| 发布        | changesets                                                 | 3.0.3             |
| lint / 格式 | oxlint / prettier                                          | 1.88.0 / 3.9.10 ✓ |

---

## 8. 补充验证

| 验证                                                   | 结果                                                                                                                                       |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 符文改为 `_` 前缀                                      | 原型 35 项通过；生成别名改为 `_vue_ref` 等，无冲突                                                                                         |
| pnpm 12 设置位置                                       | `package.json` 的 `pnpm` 字段被忽略，需移到 `pnpm-workspace.yaml`                                                                          |
| VitePress 1.6.4                                        | 内置 Vite ^5，与 Vite 8 不匹配                                                                                                             |
| `@vue/babel-plugin-jsx` 在 Vue 3.5 下的编译结果        | `v-model:checked` → `checked` + `onUpdate:checked`；`<X disabled />` → `disabled: true`；函数子节点原样作为默认插槽                        |
| vue-jsx 3.3 RC（已移除）                               | 运行时要求 Vue ^3.6 RC；虚拟模块 `/vue-jsx/vdom` 在 Windows 上让 Vitest 崩溃                                                               |
| 换底座：Vue 3.5.44 + 官方 JSX 插件                     | Windows 本地与 CI 测试全部通过；全仓只有一份 Vue，不需要 overrides；VitePress 2 静态构建成功                                               |
| 文档站热更新                                           | 改 `_component` 组件后页面不刷新、组件被热替换；组件局部状态重置（官方插件对组件调用 `reload`，会重跑 setup）                              |
| 宿主示例（plugin-vue + vue-router + pinia + TSX 页面） | 测试与真实 Chromium 中：路由参数、`_from(storeToRefs(...))` 双向写入、宿主 `provide`、StyleX 样式都正常；SFC 页面读到 TSX 页面写入的 store |
| 宿主构建产物中的 StyleX CSS                            | 追加到宿主已有的 CSS 文件；宿主没有任何 CSS 文件时只生成未被引用的 `stylex.css`（已写入 README）                                           |

---

## 9. 进度

已确认（2026-10-17）：

1. npm 包名使用 `@vue-tsx-pro/*`。
2. 编译相关合成一个包 `@vue-tsx-pro/tsx`，按子路径导出（§2.1）。
3. 符文名保持 `_ref`、`_derived` 等，不再改名（§2.3 的可读性代价接受）。
4. 定位与底座：已有 Vue 3.5 项目中的独立 TSX 页面；Vue 3.5 + Babel 7 + 官方 JSX 插件（§1、§2.4）。

待定：文档站部署位置；`tests/e2e`、`tests/consumer` 在后续里程碑建立。

**M0 骨架**：根配置、`packages/tsx`、`packages/ui`（构建配置与空入口）、`apps/docs`（VitePress 2 与一个冒烟演示）、CI（Ubuntu + Windows）。

**props 改为 Svelte 式响应式解构**：参数解构由我们的编译器换成实例内的 prop 访问器（参考 Svelte 5 的 `$.prop`），默认值可为任意表达式、按实例惰性求值、可引用前面的 prop 并随之更新；`_bindable` 使用本包的 `bindable`（v-model 协议）；props 声明与组件名自动生成；JSX 子节点按 `children` prop 检查。

**换底座**：Vue 3.6 RC + vue-jsx 3.3 RC 改为 Vue 3.5.44 + 官方 `@vitejs/plugin-vue-jsx`；JSX 类型改为基于 `vue/jsx-runtime`；`.ts` 文件不再开启 JSX 语法；删除面向模板写法的互通用例。

**宿主示例**：`apps/host-demo` 是普通 Vue 3.5 项目（SFC 首页 + vue-router + pinia），TSX 页面作为路由组件挂载；集成测试纳入 `pnpm test`，构建纳入 CI。
