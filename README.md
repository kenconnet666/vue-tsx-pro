# vue-tsx-pro

更自然的 Vue TSX 写法：props 驱动的组件、下划线符文（`_state`、`_derived`、`_bindable`……）、StyleX 样式。

定位：在**已有的 Vue 3.5 项目**里用这套写法构建独立页面，配合本仓库的组件库。与宿主共享同一份 Vue、响应式状态（pinia、组合式函数）与 `provide` / `inject`；只写 TSX，不兼容 SFC 模板。

## 在已有 Vue 项目中使用

要求 Vue 3.5+、Vite 8。

```ts
// vite.config.ts：宿主原有的 @vitejs/plugin-vue 保留，再加上预设
import vue from '@vitejs/plugin-vue';
import { vueTsxPro } from '@vue-tsx-pro/tsx/vite';

export default defineConfig({ plugins: [vue(), ...vueTsxPro()] });
```

预设依次执行：符文编译（本包）→ StyleX → 官方 `@vitejs/plugin-vue-jsx`（JSX、去类型、热更新）。只有用到符文或 `_component` 的文件会被符文编译改写，宿主的其他代码不受影响；宿主不要再单独加 `@vitejs/plugin-vue-jsx`。

TypeScript 需要 `"jsx": "preserve"` 与 `"jsxImportSource": "@vue-tsx-pro/tsx"`，之后即可直接使用 `_state` 等符文。

构建时 StyleX 的 CSS 会追加到宿主产物里的 CSS 文件（宿主一般都有全局样式）；如果宿主一个 CSS 文件都没有，StyleX 会另写一个 `stylex.css` 但不会自动引用。

完整示例见 `apps/host-demo`：SFC 首页 + vue-router + pinia，加一个 TSX 页面读取路由参数、写入 store、inject 宿主提供的值。

## 结构

| 路径             | 包                               | 说明                                                                          |
| ---------------- | -------------------------------- | ----------------------------------------------------------------------------- |
| `packages/tsx`   | `@vue-tsx-pro/tsx`               | `_component()`（Svelte 式 props 解构）、符文编译器、Vite 预设、JSX 与符文类型 |
| `packages/ui`    | `@vue-tsx-pro/ui`                | 组件库（StyleX）                                                              |
| `apps/docs`      | `@vue-tsx-pro/docs`（私有）      | 文档站（VitePress 2）                                                         |
| `apps/host-demo` | `@vue-tsx-pro/host-demo`（私有） | 宿主示例：普通 Vue 3.5 项目里的 TSX 页面                                      |

依赖方向只有一条：`ui → tsx`，`docs → ui + tsx`，`host-demo → tsx`。

## 命令

需要 Node 24（见 `.node-version`）与 pnpm 12。

```bash
pnpm install
pnpm build          # 依次构建 tsx、ui
pnpm typecheck      # 各包类型检查
pnpm test           # 先构建 tsx，再运行各包测试
pnpm dev:docs       # 启动文档站
pnpm build:docs     # 构建文档站静态页面
pnpm build:host     # 构建宿主示例
pnpm lint           # oxlint（含类型感知规则）
pnpm format         # prettier
```

## 语言服务（MCP）

项目级 MCP 服务器 `vue_tsx_pro_lsp` 把 TSX 语言服务提供给 Codex 与 Claude Code。它直接使用仓库固定的 TypeScript，结果与 `pnpm typecheck` 一致；诊断还会附带符文编译器的误用报错。只处理 `.ts`/`.tsx`，不涉及 Vue SFC。

| 工具          | 作用                                                     |
| ------------- | -------------------------------------------------------- |
| `diagnostics` | 单个文件的类型错误 + 符文误用与警告（`source: "runes"`） |
| `hover`       | 位置处的类型与文档                                       |
| `definitions` | 跳转定义                                                 |
| `references`  | 查找引用                                                 |
| `completions` | 补全，可按前缀过滤                                       |

```bash
pnpm lsp:setup    # 生成本机配置：.codex/config.toml、.mcp.json、.claude/settings.local.json
pnpm lsp:verify   # 按生成的配置真实启动并逐项检查
```

验证通过后重启 Codex / Claude Code 即可使用。生成的三个文件含本机绝对路径，已被 git 忽略；模板是 `.codex/config.example.toml`。换机或移动目录后重新运行 `pnpm lsp:setup`。

## 配置要点

- **版本**：共享依赖的精确版本集中在 `pnpm-workspace.yaml` 的 `catalog`，各包写 `"catalog:"`。升级只改这一处。
- **源码条件**：各包 `exports` 带有 `@vue-tsx-pro/source` 条件。仓库内的 TypeScript（`customConditions`）和 Vite（`workspaceSource()`）据此直接读取源码，不必先构建；发布包的使用方不受影响。
- **Vite 配置文件**从构建产物加载 `@vue-tsx-pro/tsx/vite`，所以首次 `test` 或 `dev:docs` 之前要先 `pnpm build:tsx`（这两个脚本已自动执行）。
- **符文类型**：配置 `jsxImportSource: "@vue-tsx-pro/tsx"` 后即可直接使用 `_state` 等；只有 `.ts` 文件的包再在 `types` 里加 `"@vue-tsx-pro/tsx/runes"`。
- **组件库构建**：编译 TSX 与符文，保留 `stylex.create`，由使用方应用的 StyleX 插件统一编译。

## 文档

- [RESEARCH.md](RESEARCH.md)：组件写法、StyleX、遇到的上游问题
- [RUNES.md](RUNES.md)：符文编译到 Vue Ref 的设计与证据
- [PLAN.md](PLAN.md)：工程规划与里程碑
- [COMPONENTS.md](COMPONENTS.md)：组件库规范（API 约定、部件透传、尺寸、Provider 的主题与地区配置）与实施范围
