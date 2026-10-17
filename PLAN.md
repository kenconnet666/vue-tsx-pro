# vue-tsx-pro 工程规划

日期：2026-10-17（Asia/Singapore）
依据：`RESEARCH.md`（组件写法、StyleX）、`RUNES.md`（符文编译）、`research/probe`（35 项测试）以及本次补充验证（§8）。

---

## 1. 已定的决定

| 项 | 决定 |
| --- | --- |
| 渲染 | 只做 Vue 虚拟 DOM；只写 TSX，不兼容 SFC 模板 |
| 编译底座 | vue-jsx（Oxc 编译器 + 宏），作者层用 `component()` |
| 响应式写法 | 下划线符文：`_state`、`_derived`、`_bindable`、`_from`、`_ref`，编译为 Vue 原生 API |
| 组件双向绑定 | `_bindable` + Vue 标准 `v-model:xxx` 协议 |
| CSS | StyleX，外部覆盖统一走 `sx` prop |
| 包管理 | pnpm workspace（monorepo） |
| 包名 | `@vue-tsx-pro/*`；编译相关合成一个 `@vue-tsx-pro/tsx` 包 |

---

## 2. 对规划的几点提醒

你让我在规划不妥时直接提出来，以下是我认为需要调整或注意的地方。

### 2.1 不要把编译相关拆成多个包，先合成一个

"TSX 编译相关"自然会想拆成 compiler、vite 插件、runtime、类型几个包。但它们**总是一起升级、一起使用**，拆开只会增加版本对齐和发布成本。建议先做**一个包、多个子路径导出**：

```
@vue-tsx-pro/tsx            component()、公共类型
@vue-tsx-pro/tsx/vite       Vite 预设（符文 + StyleX + vue-jsx，一行配置）
@vue-tsx-pro/tsx/compiler   符文编译器纯函数（给测试、其他打包器用）
@vue-tsx-pro/tsx/jsx-runtime  jsxImportSource 类型入口（含 v-model:K 补层）
```

等出现"有人只要编译器、不要运行时"的真实需求再拆。

### 2.2 "测试相关"不要做成集中的测试项目

单元测试应该**跟着各自的包走**（`packages/*/test`），改代码的人就近看到。单独的测试工作区只放**跨包、面向产物**的测试：真实浏览器 E2E、发布产物验证。见 §5。

### 2.3 下划线前缀可行，但有两个代价要接受

- **技术上没有冲突**：已实测改名后 35 项全过；编译器生成的 Vue 导入别名改为 `_vue_ref` 这类名字，不会和 `_ref` 符文或 vue-jsx 生成的 `_cache`、`_openBlock` 撞名。
- **可读性代价 1**：`_` 在 JS 社区普遍表示"私有/未使用"，`$` 在 Svelte、Vue Macros 里才是"编译期魔法"的约定信号。新读者看到 `_state(0)` 不一定意识到它会被编译。
- **可读性代价 2**：编译产物里 vue-jsx 生成的辅助函数也是 `_` 开头，调试时作者写的符文和生成代码在视觉上混在一起。

建议的缓解办法是把 `_` 前缀**保留给这 5 个符文**：项目代码里普通函数和变量不用 `_` 开头，由 lint 规则检查。另外 `_ref(x)` 容易被读成"创建一个 ref"，可考虑改名为 `_refOf(x)`，这一点可以等写完几个组件再定。

### 2.4 预发布版本叠得比较多

整条链上同时有：Vue 3.6 RC、vue-jsx 3.3 RC、VitePress 2 alpha（已 alpha 20 个月），外加一个宏补丁。每个单独都可控，叠在一起时任何一个升级都可能牵动全局。对策：

- 用 pnpm catalog **精确固定**所有共享版本，升级集中在一次提交里做；
- 用 `overrides` 保证全仓只有一份 Vue（已实测：不加会同时装 3.5.44 和 3.6 RC，见 §8）；
- 保留"上游哨兵测试"，上游行为变了立刻变红；
- **Vue 3.6 正式版发布前不发 1.0**，只发 `0.x` 的 `next` 标签。

### 2.5 补丁不会跟着发布包走

`patchedDependencies` 和 `overrides` **只在本仓库生效**，使用方安装 `@vue-tsx-pro/tsx` 时拿到的是未打补丁的 vue-jsx。好在符文方案已经绕开了这个 bug：双向 prop 用 `_bindable`（编译成 `defineModel`），不再需要 `x = ref(false)` 这种默认值。发布前三选一：上游合入修复（首选，已备好一行补丁）／由我们的编译器在前置阶段改写这类默认值／文档里明确不支持。

### 2.6 组件库的 StyleX 发布形态要提前验证

StyleX 的 Vite 插件会自动转换"依赖了 `@stylexjs/stylex` 的已安装包"，说明它的模型是**组件库保留 `stylex.create` 源码、由使用方应用统一编译**。这样原子类能跨库去重，`sx` 覆盖也能正确合并。

由此推出的 UI 包产物形态是：TSX 与符文**已编译**、StyleX **保留**。代价是使用方必须装 StyleX 插件（用我们的 Vite 预设就自动包含）。是否另出一份预编译 CSS 给不用 StyleX 的使用方，等有需求再说。这一点要在 M5 用独立的使用方应用验证（§6）。

### 2.7 文档站用 VitePress 2 alpha，但要留退路

VitePress 1.6.4 稳定版还停在 Vite 5，和我们的 Vite 8 不兼容；2.0 alpha 已实测可行（§8）。它带来 Markdown、搜索、静态生成、主题，代价是 alpha。退路是自建：Vite + vue-router + vite-ssg + TSX 页面，完全吃自己的狗粮，但 Markdown 写作与搜索要自己补。建议先用 VitePress 2，把演示代码都放在独立的 `.tsx` 里，将来迁移成本只在 Markdown 层。

---

## 3. 仓库结构

```
vue-tsx-pro/
├─ package.json               根：只放仓库级脚本（lint、全量检查、发布），不放业务依赖
├─ pnpm-workspace.yaml        工作区、catalog 版本、overrides、补丁登记
├─ tsconfig.base.json         共享编译选项
├─ patches/                   上游补丁（git diff 格式），合入后删除
├─ packages/
│  ├─ tsx/                    @vue-tsx-pro/tsx（发布）
│  │  ├─ src/
│  │  │  ├─ runtime/          component()、children 映射
│  │  │  ├─ compiler/         符文编译器（纯函数，不依赖 Vite）
│  │  │  └─ vite/             预设插件：runes → StyleX → vue-jsx
│  │  ├─ types/               符文全局类型、jsx-runtime 类型补层
│  │  └─ test/
│  │     ├─ compiler/         输入 → 输出快照；编译报错
│  │     ├─ runtime/          符文与组件语义（happy-dom）
│  │     ├─ types/            *.test-d.tsx，用 @ts-expect-error 标注应报错的行
│  │     └─ upstream/         上游哨兵：记录已知问题，修复后变红
│  └─ ui/                     @vue-tsx-pro/ui（发布）
│     ├─ src/
│     │  ├─ tokens/           StyleX defineVars / createTheme：颜色、间距、圆角、字号
│     │  └─ components/
│     │     └─ Switch/        Switch.tsx、Switch.test.tsx（一个组件一个目录）
│     └─ test/                跨组件测试、浏览器模式测试配置
├─ apps/
│  └─ docs/                   文档站（VitePress 2，私有）
│     ├─ guide/               写法指南：组件、符文、样式、互通
│     ├─ components/          每个组件一页 Markdown
│     └─ demos/               演示代码 .tsx（页面引用；E2E 也复用）
├─ tests/
│  ├─ e2e/                    Playwright：对构建后的文档站跑真实浏览器
│  └─ consumer/               用 pnpm pack 的产物搭独立应用，验证发布包可用
└─ .github/workflows/ci.yml
```

依赖方向只有一条：`ui → tsx`，`docs → ui + tsx`，`tests/* → 构建产物`。`tsx` 不依赖 `ui`。

### 3.1 pnpm-workspace.yaml 草案

```yaml
packages:
  - packages/*
  - apps/*
  - tests/*

catalog:
  vue: 3.6.0-rc.12
  vue-jsx: 3.3.0-rc.3
  '@stylexjs/stylex': 0.19.1
  '@stylexjs/unplugin': 0.19.1
  typescript: 6.0.3
  vite: 8.3.4
  vitest: 5.0.5
  '@babel/core': 7.29.7

# 全仓只保留一份 Vue（VitePress 依赖 ^3.5，不统一会多装一份 3.5.x）
overrides:
  vue: 3.6.0-rc.12

patchedDependencies:
  '@vue-jsx/macros@3.3.0-rc.3': patches/@vue-jsx__macros@3.3.0-rc.3.patch

peerDependencyRules:
  allowedVersions:
    vue: 3.6.0-rc.12
```

注意：pnpm 12 已不再读取 `package.json` 里的 `pnpm` 字段，这些设置必须写在 `pnpm-workspace.yaml`；补丁文件也必须是 git diff 格式（已实测）。

---

## 4. 约定

**命名**
- 包：`@vue-tsx-pro/*`（npm 上目前查不到同名包，正式使用前先注册 npm 组织占位）。
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

| 层 | 测什么 | 工具 | 位置 |
| --- | --- | --- | --- |
| 编译快照 | 符文输入 → 输出代码，确认"就是手写 Vue 的样子" | Vitest 文件快照 | `packages/tsx/test/compiler` |
| 编译报错 | 误用写法给出带位置的中文报错 | Vitest | 同上 |
| 运行时语义 | 符文、`_bindable`、children、互通 | Vitest + happy-dom | `packages/*/test` |
| 类型 | 正确写法通过；错误写法用 `@ts-expect-error` 标注 | `tsc` / Vitest typecheck | `*.test-d.tsx` |
| 组件交互 | 焦点、键盘、输入法组合事件、真实布局 | Vitest 浏览器模式 + Playwright | `packages/ui` |
| 文档站 E2E | 页面可用、演示可交互、无控制台错误；可选视觉回归 | Playwright | `tests/e2e` |
| 发布产物 | `pnpm pack` 出的包在独立应用里能安装、构建、运行；StyleX 由应用编译 | Vite 构建 + 冒烟测试 | `tests/consumer` |
| 上游哨兵 | vue-jsx 宏默认值、`defineStyle` 等已知问题 | Vitest | `packages/tsx/test/upstream` |

原型里用"应报错"注释标注类型探针，正式仓库改为 `@ts-expect-error`：标注的行不报错时 `tsc` 会失败，因此不需要人工核对错误列表。

CI 顺序：安装 → lint → 类型检查 → 单元/运行时 → 构建各包 → 浏览器模式 → 文档站构建 → E2E → 发布产物验证。

---

## 6. 里程碑

每个阶段都以"可验证的退出条件"结束，不以完成多少文件为准。

| 阶段 | 内容 | 退出条件 |
| --- | --- | --- |
| **M0 骨架** | 建立 workspace、catalog、overrides、补丁、tsconfig、lint/format、CI 空流水线 | 空仓库在 CI 上安装、lint、类型检查全部通过 |
| **M1 tsx 包** | 迁入原型（已改为 `_` 命名）；编译快照；补两条检查：render 函数内声明符文报错、setup 顶层读取符文给快照警告；source map 测试；Vite 预设 | 原型 35 项测试全部迁入并通过；文档站雏形能用预设跑起一个演示 |
| **M2 UI 基础** | tokens 与主题切换；Button、Switch、TextField、Checkbox；浏览器模式交互测试；基础可访问性 | 4 个组件在真实浏览器中通过键盘、焦点、输入法测试；主题可在局部嵌套切换 |
| **M3 文档站** | VitePress 2；写法指南；组件页（演示 + 源码展示）；部署；E2E 冒烟 | 文档站构建并部署；E2E 覆盖每个组件页 |
| **M4 复杂组件** | 泛型 Select（验证 `renderItem` 的泛型推导）、列表（`For`）、Dialog（父级控制器对象替代 expose）；SSR 水合检查 | Select 泛型推导在纯 `tsc` 下成立；SSR 与客户端渲染一致 |
| **M5 发布准备** | `tests/consumer`；确定 UI 包 StyleX 发布形态；处理上游补丁；changesets；发 `0.x` 的 `next` 标签 | 独立应用只用 npm 产物即可构建运行，样式与覆盖正确 |
| **之后** | 编译器迁到 Oxc 或并入 vue-jsx 宏（去掉二次解析）；评估 TS 7；向 vue-jsx 提 PR（宏默认值、`v-model:K` 类型） | 按需 |

关于 TS 7：npm 上 TS 7.0.2 已是稳定版。我们的方案只需要普通 `tsc`、不依赖 Volar 插件，理论上比 SFC 项目更容易切到 TS 7。但 d.ts 生成工具链还要核实，所以 M0 先用 TS 6，放到"之后"评估。

---

## 7. 工具与版本

以下版本均为 2026-10-17 从 npm 读取，标 ✓ 的已在原型或本次验证中实际使用。

| 用途 | 选择 | 版本 |
| --- | --- | --- |
| 运行时 | Node 当前 LTS（24） | 安装时核对 |
| 包管理 | pnpm | 12.14.0 ✓ |
| 语言 | TypeScript | 6.0.3 ✓ |
| 框架 | Vue | 3.6.0-rc.12 ✓ |
| JSX 编译 | vue-jsx | 3.3.0-rc.3 ✓ |
| 符文编译 | Babel（原型） | 7.29.7 ✓ |
| 样式 | StyleX + @stylexjs/unplugin | 0.19.1 ✓ |
| 构建 | Vite | 8.3.4 ✓ |
| 测试 | Vitest（含浏览器模式） | 5.0.5 ✓ |
| E2E | Playwright | 1.64.1 |
| 文档 | VitePress | 2.0.0-alpha.20 ✓ |
| 库打包 | tsdown | 0.23.1 |
| 发布 | changesets | 3.0.3 |
| lint / 格式 | oxlint / prettier | 1.88.0 / 3.9.10 |

---

## 8. 本次补充验证

| 验证 | 结果 |
| --- | --- |
| 符文改为 `_` 前缀 | 35 项通过；生成别名改为 `_vue_ref` 等，无冲突 |
| 升级 Vite 7 → 8.3.4、Vitest 3 → 5.0.5、pnpm 10 → 12.14.0 | 35 项通过；类型只有预期报错；构建通过 |
| pnpm 12 设置位置 | `package.json` 的 `pnpm` 字段被忽略，需移到 `pnpm-workspace.yaml`；补丁需 git diff 格式 |
| VitePress 与 Vue 3.6 RC | 不加 `overrides` 会同时装 vue 3.5.44 与 3.6.0-rc.12；加上后只剩一份 |
| VitePress 1.6.4 | 依赖 Vite ^5，与 Vite 8 不兼容 |
| VitePress 2.0.0-alpha.20 + Vite 8 + vue-jsx + `_` 符文 + StyleX | Markdown 中嵌入 TSX 演示，静态构建成功；SSR 输出结构、StyleX 类名与 CSS 规则正确 |

`research/probe` 已同步为下划线命名和上述新版本，可直接作为 M1 的迁移来源。

---

## 9. 决定与进度

已确认（2026-10-17）：

1. npm 包名使用 `@vue-tsx-pro/*`。
2. 编译相关合成一个包 `@vue-tsx-pro/tsx`，按子路径导出（§2.1）。
3. 符文名保持 `_ref`、`_derived` 等，不再改名（§2.3 的可读性代价接受）。

待定：文档站部署位置；`tests/e2e`、`tests/consumer` 在后续里程碑建立。

**M0 骨架已建立**：根配置、`packages/tsx`（迁入原型的 `component()`、符文编译器与类型，新增 Vite 预设）、`packages/ui`（构建配置与空入口）、`apps/docs`（VitePress 2 与一个冒烟演示）。从零安装后 `build`、`typecheck`、`test`（15 项）、`build:docs`、`lint`、`format:check` 全部通过；文档站在真实 Chromium 中可交互、StyleX 样式生效。CI 流水线尚未建立。
