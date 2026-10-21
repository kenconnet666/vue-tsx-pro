# 工程规划

写法规范见 [RUNES.md](RUNES.md)，组件库规范见 [COMPONENTS.md](COMPONENTS.md)，目标与进度见 [ROADMAP.md](ROADMAP.md)。
逐次变更的细节看提交历史。

## 1. 定位与决定

在**已有的 Vue 3.5 项目**里，用我们的 TSX 写法构建**独立页面**，配合**我们自己的组件库**。与宿主共享同一份 Vue、响应式状态（pinia、组合式函数）、`provide` / `inject` 与路由挂载；不兼容 SFC 模板，也不和 SFC 互相使用组件。

| 项         | 决定                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| 渲染       | 只做 Vue 3.5 虚拟 DOM；只写 TSX                                                                      |
| 编译       | 一个 Vite 插件、每个文件解析一次：符文编译器与官方的 StyleX、Vue JSX Babel 插件组合（Babel 8）       |
| 文件范围   | 不按目录隔离：只有用到符文或 `_component` 的文件被改写，宿主其他代码原样交给后续插件                 |
| 响应式写法 | 下划线符文，语义对标 Svelte 5，编译为 Vue 原生 API（[RUNES.md](RUNES.md)）                           |
| 组件       | 只有 props：参数解构即 props；内容用 `children`；通知用 `onXxx`；不用 slot / emit / expose           |
| 样式       | StyleX：原子类、类型安全、组件库保留 `stylex.create` 由使用方统一编译（跨库去重）；外部覆盖只走 `sx` |
| 包         | pnpm workspace；`@vue-tsx-pro/tsx`（编译器、运行时、Vite 预设、类型）与 `@vue-tsx-pro/ui`（组件库）  |

**明确不做**：具名插槽映射、SFC 里写符文、不解构的整体 props、SSR。

## 2. 仓库结构

```
packages/
  tsx/   @vue-tsx-pro/tsx
    src/compiler/   编译器（纯函数，不依赖 Vite）：符文、token 写法，compile 组合全部步骤
    src/runtime/    _component、prop 访问器、overridable / snapshot / effect
    src/vite/       Vite 预设：调用 compile、组件热更新、StyleX 的 CSS、编译缓存
    src/stylex/     StyleX 类型入口（属性中文注释，scripts/css-docs 生成）
    types/          符文全局类型、jsx-runtime 类型
  ui/    @vue-tsx-pro/ui
    src/base/         基础：文字、图标、链接、按钮家族、标记、代码块、加载
    src/layout/       布局：Flex、Grid、Container、Separator、ScrollArea
    src/display/      展示：折叠、虚拟列表、卡片、头像、树、时间线
    src/table/        表格：DataTable、TreeDataTable（虚拟滚动）
    src/feedback/     反馈：进度、骨架屏、提示条、通知、空状态、结果
    src/overlay/      浮层：对话框、抽屉（共用 Modal 内核）、Popover、Tooltip、HoverCard、Menu、Tour
    src/navigation/   导航：Tabs、Toolbar、Steps、Breadcrumbs、Pagination、NavList
    src/input/        输入：TextField、Textarea、NumberField、Checkbox、Radio、Switch、Listbox、Select、Combobox、Slider、SlideVerify、ToggleGroup、Upload
    src/form/         表单结构与校验：Field、Label、Form、useForm（控件经 useFieldControl 接入）
    src/config/       Provider、createUi、组件默认值、theme/（tokens 与明暗主题）、lang/（语言与格式化）、
                      可选依赖的适配（子路径 shiki、vue-router）
    src/utils/        部件 props 合并（props.ts）、JS 动画（animation.ts），以及按职责分的子目录：
                      style/（档位、字号、色调、过渡样式）、dom/（焦点、漫游焦点、弹层、定位、拖动、波纹、路由链接、
                      排版方向、尺寸监听）、motion/（动画、过渡、布局动画）、data/（比较与匹配、选择、分页、数值、树）、virtual/（虚拟滚动）
    （每个目录下的 .test/ 放测试）
apps/
  docs/        文档站：TSX 与本组件库写的网站（Vite + vue-router）；组件页、示例与示例测试在 src/components/<分类>/<Name>/
  host-demo/   宿主示例：普通 Vue 3.5 项目 + TSX 页面（/base 演示页、/pilot 集成验证页）
scripts/
  css-docs/            StyleX 属性注释的数据与生成器
  language-services/   TSX 语言服务（MCP）
```

依赖方向：`ui → tsx`，`docs → ui + tsx`，`host-demo → ui + tsx`。共享依赖的精确版本集中在 `pnpm-workspace.yaml` 的 catalog。

## 3. 约定

- `_` 前缀保留给符文；组件 PascalCase，平铺在 `packages/ui/src/<分类>/<Name>.tsx`，测试在同级 `.test/`。
- 一个元素一个组件；多节点组件的每个内部节点都有 `propsXxx`；状态写成 data 属性（COMPONENTS.md §1、§2）。
- 颜色、尺寸等只来自主题 tokens（字符串写法）；导出的声明都写 JSDoc（`pnpm docs:check`）。
- 只有 Node 直接加载的 `packages/tsx/src/compiler` 与 `src/vite` 在相对导入里写 `.ts` 扩展名。
- 依赖升级单独提交，提交说明写清验证结果。

## 4. 测试分层

| 层       | 测什么                                                                                            | 工具                                                        | 位置                |
| -------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------- |
| 编译     | 符文输入 → 输出；误用写法给出带位置的中文报错                                                     | Vitest                                                      | `packages/tsx/test` |
| 运行时   | 符文、props、`_bindable`、`_effect`、children、与 Vue 互通                                        | Vitest + happy-dom                                          | `packages/*/test`   |
| 类型     | 正确写法通过；错误写法用 `@ts-expect-error` 标注                                                  | `tsc`                                                       | `*.test-d.ts(x)`    |
| 宿主集成 | 普通 Vue 3.5 项目里挂载 TSX 页面：路由、store、inject                                             | Vitest + happy-dom                                          | `apps/host-demo`    |
| 组件交互 | 焦点、键盘、输入法、真实布局、原生弹层行为、axe 无障碍检查                                        | Vitest 浏览器模式 + Playwright（Chromium、Firefox、WebKit） | `apps/host-demo`    |
| 发布产物 | `pnpm pack` 的包在仓库之外的独立应用里安装、类型检查、构建，并在浏览器里运行（StyleX 由应用编译） | `pnpm test:consumer`                                        | `tests/consumer`    |

**本地只跑和改动相关的检查**（对应包的类型检查与测试文件，动到浏览器行为才跑浏览器测试），**全量交给 CI**。CI 是五个并行任务：静态检查（lint、格式、注释数据、类型检查，只在 Ubuntu）、单元测试、浏览器测试、文档站与宿主构建、发布产物验证（后四个在 Ubuntu 与 Windows 上各跑一份）。

## 5. 里程碑

M0 骨架、M1 tsx 包、M2 组件库基础、M3 文档站、M4 正式组件都已完成；之后的目标、执行顺序与勾选状态都在
[ROADMAP.md](ROADMAP.md)（审查整改、基础设施、组件补齐、降本案例、图表、质量与发布）。

## 6. 技术约束与退路

- **Babel 8**：符文编译器、Vue JSX 插件（3.0）与 StyleX 的 Babel 插件一起用 Babel 8，一个文件解析一次（compiler/compile.ts）。
- **StyleX 不 fork**：只 fork 类型声明（`@vue-tsx-pro/tsx/stylex`），运行时与编译器用官方的。
- **文档站不用 Markdown**：用 TSX 与本组件库写普通网站（Vite + vue-router 自建，已替换原来的 VitePress 冒烟页）。组件都能在 Node 里渲染成 HTML（试过演示页的服务端渲染），静态生成可行。
- **TypeScript 6 与 7 并用**：类型检查、CI 与组件库的声明生成用 TS 7（别名包 `typescript7`，Go 重写、快）；
  TS 7 移除了 `createLanguageService` 等 JS API，用到它们的脚本、语言服务与 IDE 留在 TS 6。
- **pnpm 12** 不再读 `package.json` 的 `pnpm` 字段，工作区设置写在 `pnpm-workspace.yaml`。
- 组件库依赖（定位、图标、日期、精确数字、焦点、校验接口）用成熟库，组件自己写，见 COMPONENTS.md §7。
