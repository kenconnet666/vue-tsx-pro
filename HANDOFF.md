# 交接文档

给接手这个仓库的人（或下一个会话）：读完这一页就能接着做。细节以各自的规范文档为准，这里只讲现状、地图、做事方式和踩过的坑。

## 1. 现状（2026-10-20）

- **定位**：在已有的 Vue 3.5 项目里，用 TSX + 下划线符文（语义对标 Svelte 5）写独立页面，配自己的 StyleX 组件库。见 [PLAN.md](PLAN.md) §1。
- **tsx 包**（编译器、运行时、Vite 预设、类型）：功能完整，日常只做修补。
- **ui 包**：已完成的组件与基础设施见 [COMPONENTS.md](COMPONENTS.md) §10.1–§10.17：
  - 基础：文字（Text / Paragraph / Strong / Em / Small、H1–H6，标题可带锚点链接）、List / OrderedList / ListItem、Blockquote、Mark、Icon、Link、Code、Kbd、CodeBlock（可选 Shiki 高亮、复制、行号、行高亮、diff、长代码折叠）、Spinner、按钮家族（ButtonBase / Button / LinkButton / IconButton / IconLinkButton / CloseButton / ClearButton / CopyButton、ButtonGroup 相连的按钮组）、Badge、Indicator（角标）、Tag
  - 布局：Flex / FlexList / FlexOrderedList、Grid / GridList、Container（含 create\* 工厂）、Separator、ScrollArea 与 PageScrollbar（浮层滚动条）、Prose（长文容器）、AppShell（顶栏 + 两侧栏的整页骨架）
  - 展示：Collapse、Collapsible、Accordion、VirtualList（虚拟滚动，带加载状态）、Card、Avatar / AvatarGroup、AnimatedNumber、Descriptions、Timeline、Tree、Sortable、Marquee、CodeGroup、CodePreview（代码示例卡片）、ColorSwatch、PropsTable（API 表格）
  - 反馈：Progress、Skeleton、Alert、Empty、Toast（createToaster + Toaster，可滑动关闭、可堆叠）、LoadingOverlay、Result
  - 浮层：Dialog / Drawer / AlertDialog（共用 Modal 内核，含命令式的 useConfirm）、Popover、Tooltip、HoverCard、Menu（复合，含链接 / 复选 / 单选项、子菜单）、ContextMenu、Tour、CommandPalette（Mod+K 搜索面板）
  - 导航：Toolbar、Tabs（复合）、Steps、Breadcrumbs、Pagination（配套 PageSizeSelect、PageJump）、NavList（复合，含 NavGroup、NavSection）、TableOfContents（本页目录，滚动高亮）、Pager（上一篇 / 下一篇）、SkipLink
  - 输入：TextField、ColorField、Textarea、NumberField、Checkbox / CheckboxGroup、RadioGroup / Radio、Switch、Listbox、Select、Combobox、TagsInput、FileDrop / Upload、Slider、SlideVerify（拖动验证）、ToggleGroup（复合）
  - 表格：Table 家族（静态表格，内容写在 JSX 里）、DataTable（始终虚拟滚动；排序、勾选、固定列、吸顶表头、列宽调整、骨架与进度加载）、TreeDataTable（建在 DataTable 上，懒加载子项）
  - 表单（form/）：Field、Label、Form、useForm（zod 校验，schema 推出字段约束，`form.Field` 的 name 带类型；数组字段、dirty、单字段异步校验）
- **主题**（§6.2、§10.17）：亮色、暗色、纸张三套内置主题，`createThemePreference` 记住选择，`ThemeSwitcher` 切换（从按钮处圆形展开），`ThemeCustomizer` 定制品牌色、圆角等，`themeBootScript` 防闪烁，`pnpm themes:check` 检查对比度。
- **性能、类型与基础设施**（§10.16）：编译器的渲染优化（稳定插槽、属性值缓存，RUNES §9）、表格行组件、浮层延迟渲染、Virtualizer 增量重排、Icon 用 innerHTML、`mergeAttrs`；`stylex.create` 不再标类型；表单拆到 `form/`、对话框一族在 `overlay/`。
- **试点组件**已全部转正，`apps/host-demo/src/pilot` 已删除；`/pilot` 页面与它的测试改用正式组件。
- **CI**：GitHub Actions 五个并行任务全绿，包括三种浏览器、Ubuntu 与 Windows、发布产物验证。看最新状态：`gh run list --limit 3`。

## 2. 文档地图

| 文件                                | 讲什么                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [README.md](README.md)              | 怎么在宿主项目里用、命令、语言服务（MCP）、配置要点                                                             |
| [PLAN.md](PLAN.md)                  | 定位与决定、仓库结构、测试分层、里程碑、技术约束与退路                                                          |
| [RUNES.md](RUNES.md)                | 符文规范：`_state`、`_derived`、`_effect`、props、`_bindable` / `_bind`、`_untrack` 等                          |
| [COMPONENTS.md](COMPONENTS.md)      | 组件库规范：API 约定（§1）、部件与透传（§2）、样式与 token（§4）、依赖与待办（§7）、每批组件的设计与取舍（§10） |
| `packages/ui/src/index.ts`          | 组件库的全部导出，按目录分组；由 `pnpm exports` 生成，不要手改                                                  |
| `apps/host-demo/src/pages/Base.tsx` | 所有组件的演示页（`/base`），浏览器测试与 axe 检查也跑在这一页                                                  |

## 3. 上手

需要 Node 24、pnpm 12（Windows 11 上开发；Bash 是 Git Bash，PowerShell 是 7.6）。

```bash
pnpm install
pnpm --filter @vue-tsx-pro/host-demo exec playwright install chromium firefox webkit   # 首次跑浏览器测试前
```

常用的短检查（改了哪个包就跑哪个）：

```bash
pnpm -C packages/ui typecheck
pnpm -C packages/ui exec vitest run src/navigation          # 只跑相关目录
pnpm -C apps/host-demo typecheck                             # 各包的 typecheck 都用 TypeScript 7，几秒
pnpm docs:check      # 导出的声明都要有 JSDoc（只检查已被 git 跟踪的文件：新文件先 git add）
pnpm css-docs:check  # 改了 tokens 或 StyleX 属性数据后先 pnpm css-docs 重新生成
pnpm exports:check   # 模块里加、改了导出后先 pnpm exports 重新生成入口
```

推送前跑 `pnpm check`（约 15 秒；prettier 带缓存，第二次起只查改过的文件）：CI 静态检查任务的同一组检查（lint、格式、生成文件、注释、导出、对比度、文字），加上上面这些。

单独跑某个浏览器的某个测试文件（几十秒，放后台）：

```bash
pnpm -C apps/host-demo exec vitest run --configLoader native --config vitest.browser.config.ts --project "host-demo-browser (chromium)" test/navigation.browser.test.ts
```

## 4. 架构速览

**tsx 包**（`packages/tsx/src`）：

- `compiler/`：Babel 8。`compile.ts` 是一个文件的完整编译（解析一次、两遍遍历、生成一次：符文、token、StyleX → Vue JSX、去类型），Vite 预设与演练场共用；符文转换五步，见 `compiler/index.ts` 开头：
  1. 符文声明换成 Vue API；
  2. `_component` 参数解构换成 prop 访问器；
  3. 读写改成 `.value`；
  4. `_bind` 转成 v-model，`_untrack`、`_effect` 等转成运行时函数；
  5. 报告误用。
     另有 `tokens.ts`：把 `stylex.create` 里的 `'_xs'` 换成 token 变量。
- `runtime/`：`_component`、prop 访问器（没写过的 prop 用只读的 `readonlyProp`，`children` 用不缓存的 `childrenProp`）、`overridable`、`snapshot`、`untrack`、`effect`、`createContext`。
- `vite/`：预设是一个编译插件（每个文件经 `module.ts` 调用一次 `compile` 并由 `hmr.ts` 登记组件热更新；`pool.ts` 把编译分到工作线程 `compile-worker.ts`，Vitest 里不用；`cache.ts` 是开发服务器的磁盘编译缓存）加 `stylex.ts`（收集规则合成 CSS：开发时按版本推送，构建时输出并在 HTML 里引用）。这里还关掉了 lightningcss 对 `:dir()` 的降级。
- `stylex/`：带中文注释的 StyleX 类型入口（`styles.ts` 由 `scripts/css-docs` 生成，不要手改）。

**ui 包**（`packages/ui/src`）的基础设施都在 `utils/` 与 `config/`。写新组件前先看有没有现成的：

| 需要                                                           | 用                                                                                                                                                                                  |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 合并部件属性                                                   | `mergeAttrs<'tag'>`（原生元素，直接展开到元素上）、`mergePartProps<XxxProps>`（子组件）；底层是 `mergeProps` + `elementProps`                                                       |
| 档位样式（间距、字号、色调、焦点环…）                          | `utils/style/styles.ts`、`utils/style/typography.ts`、`utils/style/tone-styles.ts`                                                                                                  |
| 波纹                                                           | `useRipple(() => ripple)`，返回值展开到受管层                                                                                                                                       |
| 按钮类的不可用、加载中、拦截点击                               | `useButtonBehavior(() => ({ disabled, loading, focusableWhenDisabled, ripple }), () => onClick)`（`base/button-core.ts`）                                                           |
| 长得不像按钮的按钮（菜单项、标签页、折叠标题、步骤、排序按钮） | `ButtonBase`：去掉默认外观，焦点环、波纹、颜色过渡、不可用与加载中都有；外观经 sx 给（`base/ButtonBase.tsx`）                                                                       |
| 交互颜色过渡、展开箭头旋转、出现与离场的淡入淡出               | `interactionTransitions.colors`、`disclosureStyles.icon`、`presenceStyles.fade` / `leaving`（`utils/style/transitions.ts`）                                                         |
| 组件里的 JS 动画                                               | `useAnimate()`：取主题时长、缓动、弹簧，卸载时取消（`utils/motion/animation.ts`）                                                                                                   |
| 跟随数值的过渡（数字滚动、进度）                               | `useTween(() => value)`、`useSpring(() => value)`，渲染里读 `.current`（`utils/motion/tween.ts`）                                                                                   |
| 表单字段的约束（必填、长度、范围）                             | 从 zod schema 推出（`form/form-constraints.ts`），控件经 `useFieldControl()` 的 `constraints` 拿到                                                                                  |
| 单选 / 多选组件的 props                                        | `SelectionProps`（`selectionMode` + `value`）、选项数据的 `OptionMapping`（`toOption`）                                                                                             |
| 链接走路由、判断当前页                                         | `useRouterLink()`                                                                                                                                                                   |
| 组件默认值                                                     | 在 `config/defaults.ts` 登记，组件里 `useDefaults('Xxx', () => ({ variant, size }), { variant: 'solid' })`，渲染时读 `appearance().variant`                                         |
| 方向键在一组项里移动                                           | `rovingFocus(container, { items, orientation })`                                                                                                                                    |
| 单选 / 多选                                                    | `toggleSelection`                                                                                                                                                                   |
| 拖动                                                           | `startMove(pointerdownEvent, { onMove, onEnd })`                                                                                                                                    |
| 拖动排序（指针 + 键盘 + 读屏播报）                             | `useSortable({ items, getKey, onChange, container })`：`handleProps(key)`、`itemProps(key)`、`announcement`（`utils/dom/sortable.ts`）                                              |
| 树：展开成行、勾选联动、懒加载                                 | `flattenTree`、`indexTree` + `toggleChecked` / `checkStates`、`useTreeExpansion`（`utils/data/tree.ts`；Tree、TreeDataTable 用它）                                                  |
| 未保存离开的提醒                                               | `useLeaveConfirmation(() => form.dirty)`（`utils/dom/leave-confirmation.ts`）                                                                                                       |
| 进出场过渡、等过渡结束                                         | `utils/style/transitions.ts`（`transitions`、`afterTransitions`）                                                                                                                   |
| 关闭后等离场结束再卸载                                         | `usePresence(() => open, { onExited, exit })`：`mounted`、`state`、`ref`（`utils/motion/presence.ts`；Toast、Tag、Alert 用它）                                                      |
| 内容第一次打开时才渲染（浮层默认、Collapse / Tabs 可选）       | `useLazyContent(() => open, () => lazy)`，浮层的 `lazy` prop 用 `LazyContentOptions`（`utils/motion/presence.ts`）                                                                  |
| 子元素换位置时平移（增删、排序）                               | `useLayoutAnimation(() => container, { children })`，`layout.change(() => mutate())`（`utils/motion/layout.ts`）                                                                    |
| 跟着当前项走的指示条（下划线、选中滑块）                       | `useActiveIndicator(() => ({ container, indicator, active, axis, value }))`（`utils/motion/active-indicator.ts`）                                                                   |
| 加载指示防闪烁（骨架、进度条、按钮的加载指示）                 | `useDelayedLoading(() => loading, { delay, minDuration })`；aria-busy 仍按真实的 loading（`utils/motion/delayed-loading.ts`）                                                       |
| 装饰性动画要不要播                                             | `useReducedMotion()`（取主题时长的动画不需要，时长 token 已是 0）                                                                                                                   |
| 行为随视口、系统设置变化                                       | `useMediaQuery('(min-width: 64rem)')`；只是显示与隐藏时写在样式的媒体查询里（`utils/dom/media-query.ts`）                                                                           |
| 滚动到哪一节                                                   | `useScrollSpy(() => ({ ids, root }))`、`collectHeadings(container)`（`utils/dom/scroll-spy.ts`；TableOfContents 用它）                                                              |
| 粘性顶栏挡住的高度                                             | `layoutVars.stickyOffset`（`utils/style/vars.stylex.ts`）：AppShell 设置，标题的 `scroll-margin` 读它                                                                               |
| 子元素按祖先的悬停、聚焦取样式                                 | `stylex.when.ancestor(':hover', marker)`，标记在 `utils/style/markers.stylex.ts`（标题的锚点链接用它）                                                                              |
| 键盘快捷键                                                     | `useHotkeys(() => ({ 'Mod+K': open }))`，显示用 `formatHotkey`（`utils/dom/hotkeys.ts`）                                                                                            |
| 复制到剪贴板                                                   | `useClipboard()`：`copy(text)`、`copied`（自动复原）、`error`（`utils/dom/clipboard.ts`）                                                                                           |
| 弹层：焦点、遮罩、锁滚动、移除后的焦点                         | `utils/dom/overlay.ts`（`focusAfterRemoval` 用于关闭、移除按钮）                                                                                                                    |
| 浮层贴着触发器定位、打开与关闭                                 | `createAnchoredLayer()`（内部用 `anchorFloating`）+ `floatingStyles`（`utils/dom/floating.ts`）                                                                                     |
| 悬停打开的浮层（延迟、可移到浮层上、同组只开一个）             | `useHoverIntent(createHoverGroup(), read, setOpen)`（`utils/dom/hover-intent.ts`；Tooltip、HoverCard 用它）                                                                         |
| 模态打开期间还要可交互的浮层                                   | `topModal()` 取最上层的模态，Teleport 进去；内容用 `ConfigScope` 带上主题                                                                                                           |
| 菜单、列表里按字母跳转                                         | `rovingFocus(…, { typeahead: true })` 或 `createTypeahead()`                                                                                                                        |
| 输入框外壳、勾选类控件                                         | `input/control.ts`、`input/choice-styles.ts`                                                                                                                                        |
| 控件接入 Field（标签、说明、错误、状态）                       | `useFieldControl(() => ({ id, invalid, required, disabled, readonly }))`                                                                                                            |
| 表单值与校验                                                   | `useForm({ initial, schema, fields, onSubmit })` + `<Form controller>`；`form.array(path)`、`form.dirty`、`form.validating(path)`                                                   |
| 选项列表（高亮、选择、键盘）                                   | `useListState` + `handleListKeydown` + `ListboxView`（`input/`）                                                                                                                    |
| 命令式确认                                                     | `const confirm = useConfirm()`（setup 里），之后 `await confirm({ title })`                                                                                                         |
| 状态色调的颜色与默认图标                                       | `statusToneSx`、`statusIcons`（`utils/style/tone-styles.ts`）                                                                                                                       |
| 虚拟滚动                                                       | `useVirtualizer(read)`（`utils/virtual/use-virtualizer.ts`，Vue 接线）；核心 `Virtualizer`（`utils/virtual/virtualizer.ts`）                                                        |
| 列表行的外观与状态色                                           | `itemStyles`（`utils/style/item-styles.ts`）                                                                                                                                        |
| 按语言匹配、比较文字                                           | `createMatcher`、`createComparer`（`utils/data/collation.ts`）                                                                                                                      |
| 浮层的 open 同步                                               | `useAnchoredPopover(read, { close, shown })`（`utils/dom/floating.ts`）                                                                                                             |
| 焦点进出、移除后的焦点                                         | `utils/dom/focus.ts`                                                                                                                                                                |
| 夹取值、对齐步长                                               | `clamp`、`snapToStep`（`utils/data/number.ts`）；判断从右到左用 `isRtl`（`utils/dom/direction.ts`）                                                                                 |
| 浮层滚动条                                                     | 局部区域用 `ScrollArea`（视口本身管焦点时 `focusable={false}`，拿视口用 `propsViewport.ref`）；整页用 `PageScrollbar`；会滚动的弹出层用 `floatingStyles.scrollPanel` + `scrollArea` |
| 颜色解析、对比度                                               | `parseColor`、`toHex`、`contrastRatio`、`readableText`、`withAlpha`（`utils/data/color.ts`，culori）                                                                                |
| 主题定制                                                       | `paletteColors`（Radix 色阶）、`customizeTheme` / `themeSettingsCode`、`checkContrast`、`tokenCatalog`（`config/theme/`）                                                           |
| 元素大小变化                                                   | `useResizeObserver(() => [a, b], onResize)`：目标换了自动重新观察，卸载时断开（`utils/dom/resize.ts`）                                                                              |

## 5. 硬性约定（用户的长期要求）

1. **一个元素一个组件**。不做 `as`，几种元素共用一个工厂函数或一份样式表（如 H1–H6、Text 系列、按钮家族）。复合组件用 `createContext` 共享状态。
2. **多节点组件的每个内部节点都有 `propsXxx`**，合并顺序是 `mergeProps(组件默认, propsXxx, 受管)`：组件样式放默认层（使用方的 `sx` 才能覆盖），按项渲染的部件可以接受函数。
3. **状态写成 data 属性**：`data-state`、`data-disabled`、`data-loading`、`data-orientation` 等（§2.2）。
4. **图标一律用 `@lucide/icons` + `Icon`**。不手画 SVG，不用字符（×、›、… 之类）代替图标。
5. **主题 tokens 用字符串写法，不写裸值**。注意 `width`、`height` 里的短写取的是 `sizes`，要间距就写 `'_space.lg'`（§4）。
6. **类型与注释**：`mergeProps` 写类型参数；`stylex.create` 的结果不标类型（推导出的是具名的 `CompiledStyles`）；所有导出都写 JSDoc；枚举类取值写成带注释接口的 `keyof`。
7. **配置接入**：有外观档位的组件登记到 `ComponentDefaults`；可点击的组件接入波纹（默认开启，可全局或单独关）；链接用路由适配。
8. **目录**：组件平铺在 `packages/ui/src/<分类>/<Name>.tsx`，测试在同级 `.test/`。
9. **对比度**：两套主题都满足 WCAG AA 4.5:1。演示页的 axe 检查会跑亮色与暗色，改颜色前先算对比度。
10. **工具全部导出**：样式表、样式函数、上下文、工厂、组合式函数都导出，名字全局唯一（`<组件>Styles`、`<组件>Managed`）；入口 `index.ts` 由 `pnpm exports` 生成，不手写（COMPONENTS §2.5、§4）。
11. **依赖用起来**：表单校验用 zod（使用方必装的 peer），JS 动画用 Anime.js（`useAnimate`）；先看已有依赖能不能做，再自己写。

## 6. 做事方式

- **检查分工**：本地只跑短检查（第 3 节）。超过几十秒的命令放后台，等待时研究下一步。完整的浏览器测试、发布产物验证、全量测试交给 CI，推送后不等，下次推送前用 `gh run list` 看上一次的结果，失败先修。
- **推送节奏**：CI 设了 `cancel-in-progress`，连续推送会取消前一次运行。想确认某次提交的结果，就等它跑完再推下一次。
- **提交**：每块单独提交；整理代码和功能改动分开提交；提交说明写中文（标题与正文；`feat:` 等前缀与代码标识符保持原样）、写清原因。
- **方案先行**：大规模重构（跨模块、改目录、改公共 API）先给方案。
- **沟通**：对话用中文；代码、标识符、注释里的英文名保持英文；提交说明用中文。

## 7. 踩过的坑

| 现象                                                           | 原因与解决                                                                                                                                                                   |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 改了编译器，测试结果没变                                       | 以前 Vite 配置从 `packages/tsx/dist` 加载预设；现在走源码（`nodeOptions` + `--configLoader native`），直接用 `vitest` 而不经 pnpm 脚本时要自己带上这两项                     |
| 子组件显示旧内容                                               | 原来 `children` 经 computed 缓存，已改为不缓存的 `childrenProp`（编译器生成）                                                                                                |
| 覆盖样式不生效（如 `borderColor`）                             | StyleX 里长属性总是优先于简写，要写同一个长属性（`borderBottomColor`）                                                                                                       |
| `dir="rtl"` 下图标不镜像                                       | lightningcss 把 `:dir()` 降级成 `:lang()`；预设已关掉（`Features.DirSelector`）                                                                                              |
| `width: '_lg'` 变成 64rem                                      | 短写按属性找组，`width` 属于 sizes；间距写 `'_space.lg'`                                                                                                                     |
| 构建报 TS2883（类型无法命名）                                  | 推导出的类型引用了没导出的类型：泛型组件需要的类型（如 `TsxNode`）要从入口导出；StyleX 的样式引用已是具名的 `CompiledStyles`                                                 |
| StyleX 报 “Referenced constant is not defined”                 | 把导入的样式（如 `focusRingStyles`）直接传给 `stylex.attrs` 会触发编译期求值失败；经 `mergeAttrs({ sx })` 或 `elementProps({ sx })` 传                                       |
| axe 在暗色主题报对比度不足，背景是 #ffffff                     | 元素溢出到视口外，axe 取不到背景按白色算（亮色主题刚好蒙对）。演示页有“窄屏不横向溢出”的回归测试；容器里的滚动元素外层要 `minWidth: 0`                                       |
| Firefox / WebKit 里 axe 测试超时                               | Firefox 里个别过渡永远停在 running；等动画结束要设上限，并跳过无限循环的动画（加载指示）                                                                                     |
| WebKit 里“点击后应有过渡”偶发失败                              | WebKit 不一定在下一帧建好过渡，用 `expect.poll`                                                                                                                              |
| “ResizeObserver loop completed with undelivered notifications” | 不要在 ResizeObserver 回调里同步改布局；Virtualizer 已改为下一帧应用测量结果                                                                                                 |
| `docs:check` 没查新文件                                        | 它按 `git ls-files` 取文件，新文件先 `git add`                                                                                                                               |
| CI 的 `exports:check` 失败，或使用方导入不到新加的工具         | 入口由脚本生成：模块里加、改了导出后运行 `pnpm exports`；报重名时按 COMPONENTS §4 改成全局唯一的名字                                                                         |
| 改了 tokens 后 CI 的 `css-docs:check` 失败                     | `token-names.ts` 由 `pnpm css-docs` 生成，改了 tokens 要重新生成                                                                                                             |
| 宽的内容（表格）把 grid / flex 容器撑宽，页面横向溢出          | 网格项、弹性项的最小宽度默认等于内容宽度；表格外层用了 `contain: inline-size`，自己写的宽内容外层加 `minWidth: 0`                                                            |
| 勾选一行，表格的所有可见行都重渲染                             | 传给 DataTable 的 `rowKey`、`columns` 每次渲染都新建（条件表达式、调用结果编译器不缓存）：在 setup 或模块里定义；直接写成箭头函数的会被编译器缓存                            |
| 选项、行上万时页面很卡                                         | 渲染路径里不要每项做 O(n) 的查找（findLast、includes）；用 computed 缓存集合或映射。演示页有“2 秒内挂载完”的测试，table / Listbox 的单元测试有全选、大量展开与已选的性能用例 |
| WebKit 里点开下拉后方向键无效，焦点在 body 上                  | Safari 点击按钮不会聚焦它：焦点要留在按钮上的组件（Select 的触发按钮）在 click 里自己 `focus()`；`focusOrigin` 已经处理了归还焦点的情况                                      |
| 组件事件名和原生事件冲突（如 `onSelect`）                      | 组件 props 继承了元素属性，自定义回调起不冲突的名字（`onStepChange`）或把原生的放进受管属性                                                                                  |

## 8. 下一步

按优先级：

1. **M3 文档站**（已定方向）：不用 Markdown，用 TSX 与本组件库写的普通网站；代码卡片既显示代码也显示运行效果。
   框架已搭好（COMPONENTS.md §10.18）：`apps/docs` 是 Vite + vue-router 的 TSX 网站，开发时热更新各包源码；
   组件页、示例与示例测试在 `apps/docs/src/components/<分类>/<Name>/`（`docs.tsx`、`demo/`、`test/`），ui 包的组件源码保持平铺、只留行为单元测试。
   已迁移 Button、Icon、Code；下一步按分类迁移其余组件的示例、文档页与浏览器测试（host-demo 的 Base.tsx 与组件行为的浏览器测试随之退役）。
2. **日期**：Calendar、DateField、DatePicker（`@internationalized/date`）。
3. **表格的进阶能力**（按需）：单元格编辑、多级表头、列与行的拖动排序、横向虚拟化。
4. **M5 发布准备**：changesets、发 0.x。

## 9. 已知局限

- VirtualList 还不支持从右到左排版下的横向滚动（`scrollLeft` 为负），见 §10.7。
- Toolbar 里嵌套的 ToggleGroup 各有一个 Tab 位置，没有并入工具栏的方向键移动。Radix 用专门的 ToolbarToggleGroup，需要时再做。
- Pagination 的页码之间用 Tab 切换，没用漫游焦点（分页没有 ARIA 复合角色），这是有意的取舍。
- Toaster 只显示最新的 `max` 条，更早的照样计时，可能没露面就到时了。
- Combobox 只能单选。
- 虚拟化的选项列表里分组标题只是视觉上的一行，组名经 aria-describedby 念出（没法用 role="group" 包住各自定位的选项）。
- 表格是 table 语义，不是 grid：没有单元格之间的方向键导航；TreeDataTable 的层级由缩进与展开按钮表达。
