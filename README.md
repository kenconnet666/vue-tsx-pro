# vue-tsx-pro

更自然的 Vue TSX 写法：props 驱动的组件、下划线符文（`_state`、`_derived`、`_bindable`……）、StyleX 样式。

定位：在**已有的 Vue 3.5 项目**里用这套写法构建独立页面，配合本仓库的组件库。与宿主共享同一份 Vue、响应式状态（pinia、组合式函数）与 `provide` / `inject`；只写 TSX，不兼容 SFC 模板。

## 在已有 Vue 项目中使用

要求 Vue 3.5+、Vite 8。组件库的 peer 依赖由宿主安装：

```bash
pnpm add @vue-tsx-pro/tsx @vue-tsx-pro/ui @stylexjs/stylex @lucide/icons zod
```

`@lucide/icons` 是组件用的图标数据，`zod` 是表单（`useForm`）的校验库：字段的必填、长度、范围也从 zod schema 推出。

```ts
// vite.config.ts：宿主原有的 @vitejs/plugin-vue 保留，再加上预设
import vue from '@vitejs/plugin-vue';
import { vueTsxPro } from '@vue-tsx-pro/tsx/vite';

export default defineConfig({ plugins: [vue(), ...vueTsxPro()] });
```

预设对每个文件只解析、生成一次：符文编译 → token 字符串写法 → StyleX → Vue JSX 与去类型，加上组件热更新；StyleX 的 CSS 开发时由服务器按版本推送，构建时输出成 CSS 文件并在 HTML 里引用；重启开发服务器时没改过的文件直接取磁盘上的编译缓存。只有用到符文或 `_component` 的文件会被符文编译改写，宿主的其他代码不受影响；宿主不要再单独加 `@vitejs/plugin-vue-jsx` 或 StyleX 的打包插件。

TypeScript 需要 `"jsx": "preserve"` 与 `"jsxImportSource": "@vue-tsx-pro/tsx"`，之后即可直接使用 `_state` 等符文。

```ts
// 宿主入口：应用级配置；页面内还可以用 <Provider> 局部覆盖
import { createUi, darkTheme, lightTheme } from '@vue-tsx-pro/ui';
import { createShikiHighlighter } from '@vue-tsx-pro/ui/shiki'; // 可选：代码高亮（需安装 shiki）
import { vueRouterAdapter } from '@vue-tsx-pro/ui/vue-router'; // 可选：站内链接走路由、导航判断当前页

app.use(
  createUi({
    theme: { light: lightTheme, dark: darkTheme }, // 跟随系统明暗；可传 ref 在运行时切换
    lang: { timeZone: 'Asia/Shanghai' },
    router: vueRouterAdapter(router),
    highlighter: createShikiHighlighter(),
    defaults: { Button: { variant: 'outline' } }, // 组件默认外观
  }),
);
```

写样式从 `@vue-tsx-pro/tsx/stylex` 导入（运行时同 `@stylexjs/stylex`，属性悬停、补全、跳转都有中文说明）。主题 tokens 直接写成字符串，预设编译时换成 token 变量并补上导入：

```ts
import * as stylex from '@vue-tsx-pro/tsx/stylex';

const styles = stylex.create({
  card: {
    padding: '_md',
    borderRadius: '_lg',
    color: '_text',
    minHeight: 'max(_control, _minTarget)',
  },
});
```

短写按属性找 token 组（`padding` → space，`color` → colors），跨组写 `'_space.md'`；规则见 COMPONENTS.md §4。动态样式的参数等运行时才知道的值，从 `@vue-tsx-pro/ui/tokens.stylex` 导入 token 变量。

构建时 StyleX 的 CSS 会追加到宿主产物里的 CSS 文件（宿主一般都有全局样式）；如果宿主一个 CSS 文件都没有，StyleX 会另写一个 `stylex.css` 但不会自动引用。

完整示例见 `apps/host-demo`：SFC 首页 + vue-router + pinia，加一个 TSX 页面读取路由参数、写入 store、inject 宿主提供的值。

## 结构

| 路径             | 包                               | 说明                                                                          |
| ---------------- | -------------------------------- | ----------------------------------------------------------------------------- |
| `packages/tsx`   | `@vue-tsx-pro/tsx`               | `_component()`（Svelte 式 props 解构）、符文编译器、Vite 预设、JSX 与符文类型 |
| `packages/ui`    | `@vue-tsx-pro/ui`                | 组件库（StyleX）                                                              |
| `apps/docs`      | `@vue-tsx-pro/docs`（私有）      | 文档站：用组件库自己写的 TSX 网站（Vite + vue-router），开发时热更新各包源码  |
| `apps/host-demo` | `@vue-tsx-pro/host-demo`（私有） | 宿主示例：普通 Vue 3.5 项目里的 TSX 页面                                      |

依赖方向只有一条：`ui → tsx`，`docs → ui + tsx`，`host-demo → ui + tsx`。

组件库现有的组件（基础、布局、展示、反馈、导航、输入）与基础设施见 COMPONENTS.md §10，交接说明见 [HANDOFF.md](HANDOFF.md)。

## 命令

需要 Node 24（见 `.node-version`）与 pnpm 12。日常开发只跑和改动相关的检查，全量检查由 CI 并行完成（见 PLAN.md §4）。

```bash
pnpm install
pnpm build          # 依次构建 tsx、ui
pnpm typecheck      # 各包类型检查（TypeScript 7，全部约 15 秒）
pnpm test           # 先构建 tsx，再运行各包测试
pnpm dev:docs       # 启动文档站（http://localhost:5174，固定端口）
pnpm build:docs     # 构建文档站静态页面
pnpm build:host     # 构建宿主示例
pnpm test:consumer  # 发布产物验证：pnpm pack 的包在独立应用里安装、构建、浏览器运行
pnpm test:browser   # 真实浏览器测试（首次先运行 pnpm --filter @vue-tsx-pro/host-demo exec playwright install chromium）
pnpm css-docs       # 重新生成 StyleX 属性的中文注释（数据见 scripts/css-docs）
pnpm exports        # 重新生成组件库入口 packages/ui/src/index.ts（模块里加了导出后）
pnpm lint           # oxlint（含类型感知规则）
pnpm format         # prettier
```

## 语言服务（MCP）

项目级 MCP 服务器 `vue_tsx_pro_lsp` 把 TSX 语言服务提供给 Claude Code 与 Codex。它直接使用仓库固定的 TypeScript 6（有 JS API；`pnpm typecheck` 用的 TypeScript 7 没有，两者结果一致）；诊断还会附带符文编译器的误用报错。只处理 `.ts`/`.tsx`，不涉及 Vue SFC。

| 工具          | 作用                                                     |
| ------------- | -------------------------------------------------------- |
| `diagnostics` | 单个文件的类型错误 + 符文误用与警告（`source: "runes"`） |
| `hover`       | 位置处的类型与文档                                       |
| `definitions` | 跳转定义                                                 |
| `references`  | 查找引用                                                 |
| `completions` | 补全，可按前缀过滤                                       |

- **Claude Code**：项目级配置 `.mcp.json` 与 `.claude/settings.json` 已提交，用相对路径启动、默认启用。克隆后在仓库根目录打开即可使用（需要 Node 24）。
- **Codex**：运行 `pnpm lsp:setup` 生成本机的 `.codex/config.toml`（含绝对路径，已被 git 忽略；模板是 `.codex/config.example.toml`），换机或移动目录后重新运行。

```bash
pnpm lsp:verify            # 按 .mcp.json 真实启动并逐项检查
pnpm lsp:verify --codex    # 改用生成的 Codex 配置检查
```

### Claude Code 原生 LSP

除上面的 MCP 外，Claude Code 还通过项目级插件 `vue-tsx-pro-lsp` 接入原生 LSP：编辑 `.ts`/`.tsx`/`.js` 等文件后自动推送诊断，并提供内置 `LSP` 工具（定义、引用、悬停、符号）。

- 插件在仓库内的本地市场 `.claude/marketplace/`，`.claude/settings.json` 用 `extraKnownMarketplaces`（相对路径）声明并在 `enabledPlugins` 中启用；首次打开仓库时按提示信任即可。
- 语言服务器是 catalog 里固定的 `typescript-language-server`，通过 `node` 直接启动 `node_modules` 里的入口（不依赖全局安装，也绕开 Windows 的 `.cmd` 包装），并自动使用仓库的 TypeScript。需先 `pnpm install`。
- 改了 `.lsp.json` 后在新会话中生效；排查启动失败看 `/plugin` 的 **Errors** 页。

## 配置要点

- **版本**：共享依赖的精确版本集中在 `pnpm-workspace.yaml` 的 `catalog`，各包写 `"catalog:"`。升级只改这一处。
- **源码条件**：各包 `exports` 带有 `@vue-tsx-pro/source` 条件。仓库内的 TypeScript（`customConditions`）和 Vite（`workspaceSource()`）据此直接读取源码，不必先构建；发布包的使用方不受影响。
- **仓库内不用先构建**：`pnpm-workspace.yaml` 的 `nodeOptions` 让 Node 按 `@vue-tsx-pro/source` 条件解析各包源码，脚本里的 Vite / Vitest 都用 `--configLoader native` 加载配置，编译器、预设与组件都直接用源码（文档站开发时热更新）。改了编译器或 Vite 预设要重启开发服务器。
- **符文类型**：配置 `jsxImportSource: "@vue-tsx-pro/tsx"` 后即可直接使用 `_state` 等；只有 `.ts` 文件的包再在 `types` 里加 `"@vue-tsx-pro/tsx/runes"`。
- **组件库构建**：编译 TSX 与符文，保留 `stylex.create`，由使用方应用的 StyleX 插件统一编译。

## 文档

- [RUNES.md](RUNES.md)：符文规范（状态、派生、副作用、props、双向绑定、共享状态，与 Svelte 5 对照）
- [COMPONENTS.md](COMPONENTS.md)：组件库规范（API 约定、部件透传、尺寸、主题与语言、现状与待办）
- [PLAN.md](PLAN.md)：定位、结构、测试分层、里程碑与技术约束
- [HANDOFF.md](HANDOFF.md)：交接文档（现状、怎么接着做、坑与约定）
