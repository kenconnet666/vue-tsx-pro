# 组件库规范

适用于 `@vue-tsx-pro/ui`。写法基础见 [RUNES.md](RUNES.md)，工程规划见 [PLAN.md](PLAN.md)。

> 状态：基础设施与 §10 各批组件已完成，下一批是日期选择（§7）。

---

## 1. 组件 API 约定

| 项           | 约定                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 可绑定的状态 | 统一用 `value`（输入类）、`checked`（开关类）、`open`（弹层类），子组件用 `_bindable` 声明，父组件写 `属性={_bind(x)}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 变化回调     | 需要附带原因或细节时才提供，形如 `onOpenChange(open, { reason: 'escape' \| 'outside' \| 'trigger' })`；只是值变化时不额外提供                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 内容         | 默认内容用 `children`；具名内容是 JSX prop（`header`、`footer`）；需要参数的内容是渲染函数（`<List>{(item) => …}</List>`）                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 命令式能力   | 不用 expose：父级用组合式函数创建控制器对象（状态 + 方法）传入，如 `const form = useForm()` → `<Form controller={form}>`，两边用同一份数据（[RUNES.md](RUNES.md) §7）                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 状态标记     | 各部件带 `data-state="open \| closed \| checked \| …"`、`data-disabled` 等，供宿主 CSS 与测试定位，组件内部样式不依赖它们                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 多态         | 不做 `as`：一个元素一个组件，不靠 prop 切换标签。Button（`<button>`）与 LinkButton（`<a>`）、H1–H6、Text / Paragraph / Strong / Em / Small 各是一个组件，用同一个工厂或共用样式表复用（默认值可以各不相同），每个组件只接受自己元素的属性。布局容器内置 div 与 ul 两种（Flex / FlexList、Grid / GridList、Container），其他语义标签用导出的工厂生成：`const Toolbar = createFlex('nav', 'Toolbar')`                                                                                                                                                                                            |
| 选择         | 单选、多选用 `selectionMode: 'single' \| 'multiple'`（Listbox、Select、ToggleGroup、DataTable 同名），props 用 `SelectionProps` 按它区分 `value` 是一个值还是数组；选项的值是 string（与原生表单、URL 参数一致）。选项列表的 `items` 可以是任意数据加 `toOption`（转成 `{ value, label, … }`），渲染函数拿到的仍是原始数据                                                                                                                                                                                                                                                                     |
| 表单         | 校验用 zod（peer 依赖）：`useForm({ schema, initial, onSubmit })`，值的类型取自 schema 的输入、`onSubmit` 拿到解析后的输出；必填、长度、范围从 schema 推出交给 Field 与控件，控件上显式写的优先；`form.Field` 的 `name` 带类型                                                                                                                                                                                                                                                                                                                                                                 |
| 默认值       | 有外观档位的组件在 `ComponentDefaults` 登记，组件里 `useDefaults('Xxx', () => ({ variant, size }), { variant: 'solid' })` 一次合并：显式 prop > Provider > createUi > 组件自己的默认值                                                                                                                                                                                                                                                                                                                                                                                                         |
| 命名         | `use*` 只能在 setup 里调用（用到生命周期、注入、computed）；`create*` 在哪里都能调用。组合式函数的选项写成读取函数：一般是一个返回整个对象的 `read`（`useFieldControl(() => ({ … }))`），要分开追踪依赖时（大列表的 `useListState`）按字段给；回调放在第二个参数（`useAnchoredPopover(read, { close })`）                                                                                                                                                                                                                                                                                      |
| 禁用         | `disabled` 同时作用于交互与样式；只读用 `readonly`；加载中用 `loading`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 尺寸与外观   | `size`（见 §3）、`variant`（外观变体）、`sx`（外部样式覆盖）三个通用 prop；列表类的行高叫 `density`（DataTable：compact / standard / comfortable），不占用 `size`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| variant 词表 | 同名就同义，新组件从这里挑：`solid` 实底（品牌色或色调色）；`soft` 浅色底、没有描边；`surface` 有底色加描边（按钮、标记用浅色调底，卡片、表格、输入框用表面色）；`outline` 只有描边、底透明；`ghost` 没有底色与描边（按钮悬停时才有底）；`elevated` 表面色加阴影（Card）；`line` 只有一条指示线（Tabs）；`link` 像链接（Button）。现有取值：Button solid / soft / surface / outline / ghost / link，Badge、Tag solid / soft / surface / outline，Alert soft / surface / outline，Card surface / outline / elevated / ghost，DataTable surface / ghost，输入框 surface / soft，Tabs line / soft |
| 注释         | 所有导出的 prop、选项、函数参数都写注释；枚举类取值写成带注释接口的 `keyof`（如 `align?: keyof FlexAligns`，接口每个键一条注释），补全列表与悬停取值时能看到每个取值的效果；共用档位见 `utils/style/styles`（SizeScale、SpaceScale）与 `utils/style/typography`（TextSizes、Tones 等）。导出的组件、函数、类型本身也写 JSDoc（文件开头的说明不会挂到导出上）；`pnpm docs:check`（CI 的静态检查）逐个检查                                                                                                                                                                                       |

## 2. 部件与透传

一个组件由若干**部件**（part）组成，例如 TextField 有 `Root`（外层容器）、`Input`（输入框）、`Icon`（前置图标）、`Clear`（清除按钮）。每个组件在文档里列出它的部件名，部件名是公开 API，保持稳定。

### 2.1 透传规则

| 属性去向                        | 规则                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| 组件上未声明的属性（`...rest`） | 落到**主元素**：承载语义与焦点的那个元素。TextField 是 `Input`，Button 是 `<button>`     |
| 某个部件的属性                  | 写在该部件自己的 `propsXxx` 里，原样落到该部件上：`propsRoot`、`propsIcon`、`propsInput` |
| 主元素同时也是某个部件时        | 两处都可以写，`propsXxx` 优先                                                            |

```tsx
<TextField
  value={_bind(name)}
  aria-label="名字" //                     → Input（主元素）
  propsRoot={{ sx: styles.wide }} //       → Root
  propsIcon={{ strokeWidth: 1.5 }} //      → Icon
  propsClear={{ 'aria-label': '清空' }} // → Clear
/>
```

**每个内部节点都是部件**：包装层、装饰层、轨道、滑块、图标、加载指示都有自己的 `propsXxx`，使用方能加 class、`sx`、aria、事件覆盖定制；只有组件管理的状态属性不能改（§2.4）。组件自己的样式放在 `mergeProps` 的第一层，使用方的 `sx` 才能覆盖。按项渲染的部件可以接受函数：VirtualList 的 `propsItem={(item, index) => ({ … })}`。

输入 `props` 时，所有部件的配置在补全列表里排在一起；也不会和内容类 prop 撞名（`icon` 是图标内容，`propsIcon` 是图标节点的属性）。

### 2.2 状态用 data 属性表达

组件把状态写成主元素上的 data 属性，使用方用 `sx` 里的条件或宿主 CSS 选择器就能定制状态样式，不必等组件开新的 prop：

| 属性                            | 取值                                                            | 例                                            |
| ------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `data-state`                    | `open` / `closed`、`visible` / `hidden`、`checked`、`active` 等 | ScrollArea 的滚动条、以后的 Tabs、Collapsible |
| `data-disabled`                 | 有 / 无                                                         | Button、Slider                                |
| `data-loading`                  | 有 / 无                                                         | Button 家族                                   |
| `data-status`                   | 组件自己的状态枚举                                              | SlideVerify                                   |
| `data-axis`、`data-orientation` | `x` / `y`、`horizontal` / `vertical`                            | ScrollArea、以后的 Tabs                       |

### 2.3 部件 props 的类型

- 原生元素部件：该元素的属性类型 + `sx`，去掉组件内部管理的属性（见 §2.4），形如 `PartProps<'input', 'value' | 'aria-invalid'>`。
- 本库组件部件：该组件的 props（全部可选），形如 `Partial<IconProps>`；渲染时用 `mergePartProps<IconProps>(默认, propsIcon, 受管)` 合并：默认层要写齐子组件的必填 props，结果就是完整的 `IconProps`，不必断言。
- 部件 props 不能改内容：`children` 不在部件 props 里，内容走组件自己的 prop。
- 组件 props 接口 `extends PartProps<'主元素', 受管属性>`，`...rest` 才有补全与类型检查。

### 2.4 合并规则

组件内部给部件的属性与使用方传入的属性用同一套规则合并：原生元素用 `mergeAttrs<'tag'>(内部, 使用方, 受管)`（合并后把 `sx` 换成 class 与 style，直接展开到元素上），子组件用 `mergePartProps<XxxProps>(…)`，两者底层都是 `mergeProps`：

| 属性                                                                                  | 规则                                                                                                                                                              |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sx`                                                                                  | 内部在前、使用方在后；StyleX 后者覆盖前者，按 CSS 属性逐个生效                                                                                                    |
| `class`                                                                               | 依次排列成数组交给 Vue 处理（可能是字符串、数组或对象）。只给宿主留后门（例如宿主用 Tailwind）；组件内部只用 `sx`                                                 |
| 事件 `onXxx`                                                                          | **使用方先执行**；使用方调用了 `event.preventDefault()` 就跳过内部处理，可以完全接管交互；使用方传 `undefined` 不会盖掉内部的。组件不可用时先拿掉使用方的交互回调 |
| `ref`                                                                                 | 内部与使用方都拿到元素                                                                                                                                            |
| 状态类属性（`role`、`aria-expanded`、`aria-checked`、`aria-selected`、`tabindex` 等） | 以内部为准，并在类型上去掉，避免意外破坏无障碍语义                                                                                                                |
| 静态属性（`id`、`aria-label`、`title`、`data-*` 等）                                  | 以使用方为准                                                                                                                                                      |

### 2.5 导出

工具都对外导出，方便使用方定制：组件、样式表与样式函数、上下文与状态类型、工厂、组合式函数都导出；模块内部状态（计数器、缓存、注册表）与一两行的私有帮助函数不导出。入口 `packages/ui/src/index.ts` 由 `pnpm exports` 生成，模块里写了 `export` 的就进入口；名字要全局唯一（规则见 §4），重名时生成脚本报错。

### 2.6 渲染性能

渲染函数在任何一个读到的响应式数据变化时整体重跑，按组件为单位更新；写组件时：

- **派生值**：便宜的（取字段、拼字符串）直接写在渲染里；遍历全部数据、建集合或映射、排序过滤写成 `_derived`（如 DataTable 的全选状态）。
- **列表项**：可见项多、又会单独变化的列表，每项要能单独跳过——拆成组件（DataTable 的 `DataTableRow`），或用 Vue 的 `withMemo` 按“会影响它的值”缓存（Listbox 的选项行）。给项的 props 要稳定：回调按 key 调用（`onToggle(row.key)`），不要每项新建闭包。
- **稳定的引用**：JSX 属性里的函数、常量数组与对象，编译器会按实例缓存（RUNES §9）；写在 `mergePartProps({ … })` 这类调用参数里的不缓存，需要稳定引用（交给子组件的回调、子组件 computed 依赖的函数）时在 setup 里定义。
- **浮层内容**第一次打开时才渲染（`LazyContentOptions`、`useLazyContent`）；被 `aria-describedby` 引用的（Tooltip）与需要一直在 DOM 里的（Breadcrumbs 折叠的链接）例外。
- **静态的 SVG 子元素**（图标）拼成标记作 innerHTML，按数据缓存（`iconMarkup`），不为每条路径建虚拟节点。
- 回归测试：`apps/host-demo/test/render-counts.browser.test.tsx` 数关键场景的组件更新次数。

## 3. 尺寸：字号 + em

- 组件根元素决定字号，**内部所有尺寸用 em**：内边距、间距、高度、圆角、图标（`1em`），整体等比缩放。
- **默认继承上下文字号**；`size` 只用来覆盖，取值为五档 `'xs' | 'sm' | 'md' | 'lg' | 'xl'`（对应主题的 `fontSizes` 同名档位）或具体像素数字。
- 只有组件根元素设字号，内部部件不再改字号，避免 em 层层嵌套后越缩越小；部件需要不同字号时用主题里的比例变量。
- 例外用 px：边框宽度、焦点环宽度、分隔线。
- 可点击区域不小于 24px（WCAG 2.5.8）：如 `min-height: max(2em, 24px)`。
- 行高不带单位。

## 4. 样式

- 每个组件文件顶部一个 `stylex.create`，按布局、尺寸、文字、外观、状态分组。
- 样式表导出，名字全局唯一：`<组件>Styles`（`cardStyles`），按部件或档位拆开的叫 `<组件><部件>Styles`（`cardVariantStyles`、`tabListStyles`）；`stylex.create` 的结果不标类型（`create` 返回具名的 `CompiledStyles`，声明文件能直接写出），几张样式表组成的对象用 `StyleTable<键>`（`utils/style/styles.ts`）。受管属性的类型叫 `<组件>Managed`。
- 颜色、字体、间距、圆角、阴影、动效只来自主题 tokens（§6.2），组件里不写裸值。
- tokens 在 `stylex.create`、`stylex.keyframes` 里用字符串写，不 import（Vite 预设编译时换成 token 变量并补上 import）：
  - 短写 `fontSize: '_xs'`：属性在对照表（`packages/tsx/src/stylex/token-map.ts`）里时按表找组，补全只列这一组的 token，悬停、跳转到 token 的注释；
  - 带组名 `width: '_space.xl'`：表外属性或跨组取值，任何属性都能用，但没有补全；
  - 条件值、回退数组、伪元素、动态样式、覆盖变量（`[vars.x]: …`，只能写带组名的）里同样可用；token 不存在、表外属性用了短写时编译报错并指出位置（这些属性的类型接受任意字符串，类型上拦不住）；
  - 值里也能夹 token，用于计算、多值、简写：`minHeight: 'max(_control, _minTarget)'`、`outlineOffset: 'calc(-1 * _xs)'`、`padding: '_sm _md'`，编译成模板字符串；短写同样按属性找组，表外属性（如 `transition`）写带组名的 `'opacity _durations.md _easings.standard'`。token 前后不能紧挨字母、数字、`-`、`.`，引号里的文字与 `url()` 不处理。值中间的 token 没有补全；
  - 注意短写按**属性**找组：`width`、`height` 属于 `sizes`，`'calc(_lg + _xs)'` 写在 `width` 里取的是 `sizes.lg`（64rem）而不是间距；尺寸里要用间距档位时写带组名的 `'calc(_space.lg + _space.xs)'`；
  - 只有动态样式的参数、运行时算出的值才需要 import token 变量；
  - `_` 前缀用来和 CSS 关键字区分：`fontWeight: 'bold'` 是 CSS 值，`'_bold'` 才是 token。
- 使用方的覆盖只走 `sx`（组件级）与 `propsXxx.sx`（部件级）。
- 尊重 `prefers-reduced-motion`；焦点样式用 `:focus-visible`；方向相关的属性一律用逻辑属性（`paddingInline`、`marginBlockStart`），支持从右到左排版。
- 动画：能用 CSS 过渡的用 CSS（进出场、展开收起；原生 popover / dialog 被 Esc、点击外部关闭时 JS 来不及介入）。需要 JS 的（弹簧、时间线、拖拽、布局动画、动画 canvas / 3D 场景里的数值）用 Anime.js：组件里用 `useAnimate()`（时长、缓动、弹簧取主题 tokens，卸载时取消），组件外用 `themeTransition(元素, { duration, ease, bounce })`；主题覆盖与“减少动态效果”都会生效（Anime.js 自己不处理）。已用在 Toast 的滑动、SlideVerify 的弹回与失败晃动。常见场景有现成的组合式函数（`utils/motion/`）：跟随数值用 `useTween` / `useSpring`，关闭后等离场再卸载用 `usePresence`，增删、换位置的平移用 `useLayoutAnimation`，跟着当前项走的指示条用 `useActiveIndicator`，加载指示防闪烁用 `useDelayedLoading`，装饰性动画看 `useReducedMotion`。canvas 图表、3D 场景要用主题颜色时用 `readToken(元素, colors.accent)` 取当前值。
- 含动态样式函数的 `stylex.create` 单独写一个：它走另一个类型签名，组内属性没有中文悬停提示。
- 标签名来自数据时 TSX 没有属性类型：要交互、要更新的用 Vue 的 `h()` 渲染；静态的（图标的 path、circle）拼成标记作 innerHTML（§2.6）。

### 4.1 加载状态：小组件用自己的动效，容器占位才用骨架

判断标准：**加载期间要不要替还没来的内容占位**。

- **小型组件**（控件本身已经在，只是在等一个操作）保留自己的独立动效，不加骨架：按钮家族（含图标按钮、复制按钮、AlertDialog 的确认按钮）用波纹与 Spinner，Switch 的滑块里转圈，勾选、标签、输入框、分页、步骤用过渡；Alert、Toast 的 `loading` 把图标换成 Spinner（正文已在，只表示进行中）；LoadingOverlay 盖在已有内容上转圈；Tree 懒加载展开、Timeline 的进行中是行内状态，转圈；Upload 有进度条；Avatar 先显示首字母，比骨架信息多。
- **容器占位**（内容还没有，要先勾出它将来的布局）用骨架：Card 正文（`loading`）、Stat 的数值与变化量、DataTable 的骨架行、VirtualList、Listbox（Select、Combobox、TagsInput 的选项列表）、图表绘图区、文章与段落、头像列表、表单整体加载。
- 骨架统一用 Skeleton / SkeletonText 与 `utils/style/shimmer.ts`，不各写一份：
  - 形状预设 `variant`：text、heading、circle、button、image；多行用 SkeletonText（最后一行短）。按真实布局拼，不要一整块灰。
  - 扫光：光带从起始边扫到结束边，RTL 反向，减少动态效果时停（`animation-name: none`，静止的占位已经说明在加载）。多块骨架用 `delay`（`SHIMMER_STAGGER` 的整数倍）依次错开，像一道波从上往下推；表格、列表的骨架行按行号错开。
  - 颜色：底色与光带都是半透明的正文色（`color-mix(… _colors.text 9%, transparent)`），叠在任何表面上都比表面深一档（暗色主题里浅一档），各主题不必单独调。
  - 骨架换成内容（或反过来）时用 `shimmerStyles.reveal` 淡入，不硬切；只在切换的那一刻加样式，一开始就有内容时不播。
- 读屏：骨架一律 `aria-hidden`（受管，不进部件属性的类型）；整块区域加载时 `aria-busy` 由组件管理。视觉上的骨架、进度条用 `useDelayedLoading` 防闪烁，`aria-busy` 与点击拦截按真实的 `loading` 立即生效。

## 5. 无障碍与交互

- 每个组件按 WAI-ARIA Authoring Practices 的对应模式实现：角色、状态属性、键盘操作，文档里列出键盘映射。
- 关联 id 用 Vue 3.5 的 `useId()` 生成；使用方传了 `id` 时以使用方为准。
- 中文输入法：输入类组件在 `compositionstart`/`compositionend` 之间不触发校验、搜索与格式化。
- 弹层类组件的触发器用渲染函数 `trigger={(props) => <Button {...props} />}`；`ref` 落在组件上拿到的是实例，用 `toElement` 解析成根元素。
- 弹层用原生 `popover`（非模态）与 `<dialog>.showModal()`（模态），floating-ui 只负责定位。顶层渲染、Esc、点击外部、嵌套弹层的关闭顺序、模态时背景 `inert` 都交给浏览器；这些依赖写成了三大浏览器上的回归测试（`apps/host-demo/test/native-overlay.browser.test.ts`），所以**不另建 JS 弹层栈**。
- 浏览器不做或做得不一致的，由 `utils/dom/overlay` 补上，弹层组件都要用：
  - `focusOrigin()` 在打开前记下焦点来源，关闭后 `returnFocus(弹层, 来源)` 把焦点还回去（WebKit 关闭原生弹层后会把焦点留在弹层里；Safari 点击按钮不聚焦它，`focusOrigin` 会取最近按下的元素）；
  - 打开时 `focusFirst(弹层)`；模态里 `trapFocus(弹层)` 做焦点循环（原生不循环）；
  - 模态打开时 `lockScroll()`，可叠加，最后一个解锁时恢复，并补上滚动条宽度避免页面跳动；
  - 带关闭、移除按钮的组件（Tag、Alert、Toast）在调用回调前 `focusAfterRemoval(元素)`：元素真被移除、焦点掉到 body 上时，交给同组的下一个（没有就上一个）可聚焦元素（同 React Aria TagGroup）。
- 锚定在触发器上的浮层（Popover、Tooltip、Menu、Select）用 `utils/dom/floating` 的 `anchorFloating(锚点, 浮层, { placement, matchWidth, fitHeight })` 定位，浮层样式加 `floatingStyles.anchored`：第一次定位前隐藏、翻转与贴边、持续跟随，最终方向写到 `data-side` / `data-align`，缩放原点朝向锚点；`ready` 完成后浮层可见，才能移入焦点。
- 弹层要用点击等用户操作打开：没有用户操作就打开的弹层会被浏览器并成一组，一次 Esc 全部关闭。

---

## 6. Provider：主题与语言配置

### 6.1 两种用法

```tsx
// 宿主入口（普通 TS）：应用级配置，所有 TSX 页面共享，不用逐页包裹
app.use(createUi({ theme: lightTheme, lang: zhCN }));

// TSX 页面或局部：覆盖上层配置，可以嵌套
<Provider theme={darkTheme} lang={{ timeZone: 'America/New_York' }}>
  <Report />
</Provider>;
```

- 嵌套时**按字段合并**：内层只写要改的部分，其余继承外层。
- 没有任何配置时，组件使用内置默认值（`zhCN` + `lightTheme`），单独使用也能工作。
- 配置是响应式的：切换主题、语言、时区，已渲染的组件立即更新。
- Provider 不产生盒子、不画背景：主题区域需要自己用 `colors.background` 铺底色。

### 6.2 主题 `theme`

主题是一组设计 tokens，定义在 `packages/ui/src/config/theme/tokens.stylex.ts`，使用方从 `@vue-tsx-pro/ui/tokens.stylex` 导入。分组参考 Radix Themes（取值）、Ant Design（语义分层）、Material 3（动效）取舍：

| 组               | 档位                                                                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors`         | 语义命名，不分档：背景与表面、中性填充（常态/悬停/按下）、文字四级、边框三级、品牌色与危险色（实色/悬停/实色上的文字/文字/浅底/浅底悬停/边框）、成功/警告/信息（文字/浅底/边框）、反色表面、焦点环、遮罩 |
| `fonts`          | `sans`、`serif`、`mono`、`heading`（标题，默认同 `sans`）                                                                                                                                                |
| `fontSizes`      | `xs`–`xl`（12/13/14/16/18px，界面文字与组件 size 档位）、`xxl`、`xxxl`（标题）                                                                                                                           |
| `fontWeights`    | `light`、`normal`、`medium`、`semibold`、`bold`                                                                                                                                                          |
| `lineHeights`    | `none`、`tight`、`snug`、`normal`、`relaxed`（不带单位）                                                                                                                                                 |
| `letterSpacings` | `tighter`、`tight`、`normal`、`wide`、`wider`（em）                                                                                                                                                      |
| `space`          | `none`、`xs`–`xl`（0.25/0.5/0.75/1/1.5em）                                                                                                                                                               |
| `sizes`          | `control`（单行控件高度，em）、`minTarget`（最小可点击尺寸 24px）、`xs`–`xl`（容器宽度 30/40/48/64/80rem）、`full`                                                                                       |
| `radii`          | `none`、`xs`–`xl`（em）、`full`；整体改直角或更圆时覆盖这一组                                                                                                                                            |
| `borderWidths`   | `none`、`xs`–`xl`（1/2/3/4/6px）：边框、分隔线、焦点环宽度与间隔                                                                                                                                         |
| `shadows`        | `none`、`xs`–`xl`（Radix Themes 第 2–6 级，暗色主题另有一套）                                                                                                                                            |
| `opacities`      | `disabled`                                                                                                                                                                                               |
| `strokeWidths`   | `xs`–`xl`（1/1.5/2/2.5/3，图标线宽，Icon 默认 `md`）                                                                                                                                                     |
| `durations`      | `none`、`xs`–`xl`（75/120/200/300/500ms）                                                                                                                                                                |
| `easings`        | `standard`、`enter`、`exit`                                                                                                                                                                              |

- 分档规则：一般 `xs`–`xl` 五档，需要时加 `none`（去掉）与 `full`（全圆）；样式里写 `padding: '_md'`、`borderRadius: '_full'`（§4），计算时写 `'calc(_md * 2)'`；只有运行时的值才 import 后写 `space.md`。
- 字符串写法的类型由 `pnpm css-docs` 根据 tokens 生成（`token-names.ts`，CI 检查是否过期），改了 tokens 要重新生成。
- 不设 z-index：弹出层、对话框用原生 popover / dialog，在顶层（top layer）渲染；只有 AppShell 的粘性顶栏（10）与 SkipLink（100）写了层级。断点是编译期常量 `breakpoints`（`tokens.stylex.ts` 的 `defineConsts`，`sm` / `md` / `lg` / `xl` 与 `sizes` 的容器宽度一致：40/48/64/80rem）：媒体查询不能用 CSS 变量，常量在编译时内联，样式里写 `[breakpoints.lg]: …`，运行时去掉 `@media ` 前缀交给 `useMediaQuery`。同一个属性写几个断点时，除最后一档外用不重叠的 `smOnly` / `mdOnly` / `lgOnly`：常量写的媒体查询 StyleX 不按宽度排序（`defineConsts` 不支持 `enableMediaQueryOrder`），重叠时可能窄的那档盖住宽的。组件仍优先用容器查询；断点只给整页骨架（AppShell）、命令面板的触发器与页面级布局，不再各写各的数值。
- 主题文件：`theme.ts`（类型、`defineTheme`）、`light.ts`（默认，即 tokens 的默认值）、`dark.ts`（覆盖颜色与阴影）、`paper.ts`（纸张：米黄纸色、深棕墨色文字、墨蓝品牌色，覆盖颜色、阴影与字体，标题用衬线）。
- 实现：tokens 用 StyleX `defineVars` 定义；内置主题（`lightTheme`、`darkTheme`、`paperTheme`）用 `createTheme` 在编译期生成，运行时没有开销。
- 自定义主题：`defineTheme(lightTheme, { colors: { brand: … } })` 基于已有主题局部修改；运行时把差异写成 CSS 变量，设在 Provider 的容器上（编译后的 token 在运行时是 `var(--x…)`，取出变量名即可覆盖），应用级配置则设在页面根元素上。
- 跟随系统：`theme={{ light: lightTheme, dark: darkTheme }}` 按 `prefers-color-scheme` 切换；宿主自己控制明暗时，直接传当前主题即可（响应式）。
- 让用户选主题并记住：`createThemePreference({ themes })` 记录“跟随系统”或某一套（localStorage，多个标签页同步），`app.use(createUi({ theme: () => preference.theme, paintDocument: true }))` 让页面根元素也用主题的底色；`preference.set('paper', { origin })` 从点击处圆形展开（`revealTransition`，View Transitions API，不支持或减少动态效果时直接切换）。防闪烁：把 `themeBootScript({ themes: 各主题的底色、文字色、配色方案 })` 生成的脚本内联进 HTML 的 `<head>`。切换界面用 `<ThemeSwitcher preference={preference} />`（图标按钮 + 单选菜单，从按钮处圆形展开）。定制品牌色、中性色、圆角、缩放、字体、动效用 `customizeTheme(preference.theme, settings)`（子路径 `@vue-tsx-pro/ui/theme-customize`，要用颜色库，用到时再导入），界面是 `ThemeCustomizer`（§10.19）。`paintDocument` 时页面根元素也用主题的字体与行高（字号不设，留给 rem 的基准）。
- 作用范围：Provider 渲染一个不产生盒子的容器（`display: contents`），主题变量挂在它上面，只影响内部；应用级配置挂在页面根元素上。变量名经过 StyleX 哈希，不会和宿主冲突。
- 色板：Radix Colors（slate 中性色、indigo 品牌色，红/绿/琥珀表示危险/成功/警告），按 Radix 12 级的用途约定映射到语义 token（1–3 背景与表面，4 悬停，7–8 边框，9–10 实色，11–12 文字）。StyleX 要求取值是字面量，色值写死在 tokens 里，`packages/ui/src/config/.test/palette.test.ts` 对照 `@radix-ui/colors`（开发依赖）校验。偏离色阶的都是为了对比度：焦点环用 9 级（7–8 级在亮色下不到 3:1）；实色的悬停态比实色更深（白字才到 4.5:1）；个别文字比 11 级深一点，测试里单独列出。纸张主题的中性色是自定的暖色 12 级。
- 对比度：`pnpm themes:check`（`scripts/themes/check.mjs`，CI 静态检查）按 token 的用途把三套主题里的文字与背景、实色上的文字、悬停态、提示条、代码高亮、焦点环逐对检查 WCAG AA；演示页的 axe 检查依次跑三套主题。改颜色前后都跑一遍。
- 代码高亮用专门的一组颜色（`codeKeyword`、`codeString`、`codeNumber`、`codeFunction`、`codeType`、`codeComment`、`codeTag`、`codeAttribute`，diff 的 `codeInserted`、`codeDeleted`），Shiki 适配器映射到它们；另有选中文字的 `selection`、高亮标记的 `highlight`、吸顶顶栏用的 `surfaceTranslucent`；字体加了 `serif` 与 `heading`（标题，默认同正文）。

### 6.3 语言 `lang`：地区、时间、文案平铺在一个对象里

```ts
const lang = useLang();
lang.timeZone; //            'Asia/Shanghai'
lang.confirm; //             '确定'
lang.paginationTotal(42); // '共 42 条'
```

```ts
interface Lang {
  // 地区与格式：固定的少数几个字段
  /** BCP 47 语言标签，决定 Intl 格式化规则，如 'zh-CN' */
  code: string;
  direction: 'ltr' | 'rtl';
  /** 时区，如 'Asia/Shanghai'；不写时取浏览器时区 */
  timeZone?: string;
  /** 日历系统，如 'gregory'、'chinese'（由 @internationalized/date 支持） */
  calendar: string;
  /** 一周的第一天，0 表示周日；不写时按地区惯例 */
  firstDayOfWeek?: number;
  /** 12 / 24 小时制；不写时按地区惯例 */
  hourCycle?: 'h12' | 'h23';
  /** 金额组件的默认币种，如 'CNY' */
  currency?: string;

  // 文案：平铺，没有 messages 对象
  /** 确认按钮，默认“确定” */
  confirm: string;
  cancel: string;
  clear: string;
  loading: string;
  /** 下拉框没有选项时的提示，默认“没有选项” */
  selectEmpty: string;
  selectPlaceholder: string;
  paginationTotal: (total: number) => string;
  formRequired: (label: string) => string;
}
```

- **命名**：通用文案不加前缀（`confirm`、`cancel`）；组件文案用组件名作前缀（`selectEmpty`、`datePickerToday`），键入 `lang.select` 即可筛出；同一接口内重名由 TypeScript 直接报错。需要插值的文案写成函数。
- **注释**：每个键都写 JSDoc（用途 + 中文默认值）；`lang.xxx` 是属性访问，悬停能正常显示。
- **合并**：扁平结构只需浅合并：`defineLang(zhCN, { selectEmpty: '暂无数据', timeZone: 'Asia/Tokyo' })`；嵌套的 Provider 同样按字段浅合并。
- **预设**：`zhCN`、`enUS` 从主入口导出；包是纯 ESM 且 `sideEffects: false`，没用到的语言会被摇树去掉，不再单独开入口。
- **格式化**：`useFormat()` 从当前 `lang` 派生：数字与金额（`Intl.NumberFormat`，精确运算用 decimal.js）、日期时间（`@internationalized/date` 的 `DateFormatter`，带上时区与日历），格式化器按语言缓存。一周第一天、小时制等地区惯例由 `@internationalized/date` 提供。

### 6.4 Provider 的其他配置

| 配置      | 说明                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `overlay` | 弹层的挂载容器与层级基准；用原生最顶层时一般不需要，宿主有自己的弹层体系时用来协调 |

尺寸基准属于主题（基准字号），不单独设配置项。

---

## 7. 现状、依赖与待办

**目录**：组件平铺在 `packages/ui/src/<分类>/<Name>.tsx`（base、layout、display…），共用工具在 `utils/`，配置在 `config/`；测试集中在各目录下的 `.test/`（挂载工具 `utils/.test/mount.ts`）。TypeScript 的 `include` 不匹配以点开头的目录，tsconfig 里单独列了 `src/**/.test/**/*`。

**已完成的基础设施**（`packages/ui`、`packages/tsx/src/stylex`）：StyleX 类型入口与注释数据、tokens 与明暗主题、tokens 的字符串写法（§4）、Provider / createUi、语言与 useFormat、mergeProps 与部件类型、弹层工具（`utils/dom/overlay`）、过渡与 JS 动画（`utils/style/transitions`、`utils/motion/animation`）、虚拟滚动核心（`utils/virtual/virtualizer`）、代码高亮注入（`highlighter` 与 `@vue-tsx-pro/ui/shiki`）、注释检查（`scripts/doc-comments`）；正式组件见 §10.2。

**试点组件**（原 `apps/host-demo/src/pilot`：Button、TextField、Popover、Dialog）已全部转正并删除，`/pilot` 页面改用正式组件。试点阶段在 Chromium、Firefox、WebKit 中验证过：em 尺寸缩放、部件与主元素透传、受控 `_bind`、Provider 嵌套与切换、原生 popover + floating-ui 定位与焦点进出、模态对话框（焦点循环、锁定滚动、对话框里再开弹层的 Esc 顺序）、中文输入法、axe 无违规。

**StyleX 相关的坑**（已在基础设施里解决，写新代码时仍要知道）：

- StyleX 插件用 lightningcss 输出 CSS，默认按旧浏览器把 `:dir(rtl)` 降级成 `:lang(ar, he, …)`，镜像就只认 `lang` 属性；预设关掉了这项降级（`Features.DirSelector`），`dir="rtl"` 才生效。有方向的图标用 Icon 的 `flipInRtl`。
- StyleX 里长属性总是优先于简写：`borderColor` 盖不过别处的 `borderBottomColor`，`gap: 0` 盖不过 `columnGap`，要覆盖就写同一个长属性。
- 只画一两条边时，线型也写那几条边的长属性（`borderBlockStartStyle: 'solid'`）：写 `borderStyle: 'solid'` 会让没给宽度的边按默认的 medium（3px）画出来。

- StyleX 只认以 `.stylex` 结尾的导入路径，所以 tokens 从 `@vue-tsx-pro/ui/tokens.stylex` 导入，主入口不导出。
- 变量名按“包名:文件路径”算哈希；预设用自定义模块解析，把 `src/` 与 `dist/` 下的同一模块规范成同一个名字。
- 组件库构建保留源码文件结构（`preserveModules`），`*.stylex.ts` 不能被打进 index.js。
- `stylex.create` / `createTheme` 的结果必须赋给变量；只用一次的常量会被打包工具内联，使用方编译 dist 时报错，所以这类常量要么被多处使用，要么 `export`（`dark.ts` 就是这样）。`pnpm test:consumer` 会发现这类问题。

**依赖**：算法与数据用成熟库，组件自己写；不用无样式组件库（它们本身就是组件逻辑）。构建时全部外置，`packages/ui/src/utils/.test/dependencies.test.ts` 逐一验证。使用方直接导入的（图标）是 peer 依赖；只有部分组件才用的重型库（图表、3D）是可选 peer 依赖：组件库开发时装在 devDependencies，以后封装成组件时放在子路径，主入口不导入，使用方用到才安装；其余是普通依赖。

| 用途     | 选择                                | 说明                                                                                                                             |
| -------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 浮层定位 | `@floating-ui/dom`                  | 只算位置；弹层本身用原生 Popover API / `<dialog>`                                                                                |
| 图标     | `@lucide/icons`（peer，使用方安装） | 只有图标数据，按名导入可摇树；渲染用 `Icon`（`base/Icon.tsx`）                                                                   |
| 日期     | `@internationalized/date`           | 日历运算、时区、地区周起始日、非公历                                                                                             |
| 精确数字 | `decimal.js`                        | 数字输入、金额                                                                                                                   |
| 焦点     | `tabbable`                          | 找出可聚焦元素；焦点陷阱自己写，配合原生 `inert`                                                                                 |
| 校验     | `zod`（peer，使用方安装）           | `useForm` 的 schema；从 `zod/v4/core` 导入，zod 与 zod/mini 都能用；字段约束经 `toJSONSchema` 推出（`form/form-constraints.ts`） |
| 动画     | `animejs`（MIT）                    | animate、时间线、弹簧、stagger、拖拽、布局动画；主题接入见 `utils/motion/animation`                                              |
| 图表     | `@unovis/ts`（可选 peer）           | 子路径 `@vue-tsx-pro/ui/charts`（BarChart、LineChart，§10.21）；SVG，外观靠 `--vis-*` 变量接到 tokens，明暗切换不用重画          |
| 3D       | `three`（可选 peer）                | 子路径 `@vue-tsx-pro/ui/three`（ThreeCanvas、useThree、主题色、效果，§10.22）；实例放普通变量或 `_state.raw`，不进深层响应式     |
| 代码高亮 | `shiki`（可选 peer）                | 子路径 `@vue-tsx-pro/ui/shiki`，经 `highlighter` 配置交给 CodeBlock（§10.4）                                                     |
| 路由     | `vue-router`（可选 peer）           | 子路径 `@vue-tsx-pro/ui/vue-router` 的 `vueRouterAdapter(router)`；组件只依赖 `UiRouter` 接口（§10.9）                           |
| 共享状态 | `pinia`（可选 peer）                | 需要跨组件、跨页面共享状态的组件出现时再用；组件内部状态仍用符文                                                                 |
| 色板     | `@radix-ui/colors`（开发依赖）      | 只用于校验 tokens 取值                                                                                                           |
| 虚拟滚动 | 自己实现                            | 参考 `@tanstack/virtual-core` 的算法                                                                                             |
| 拖拽排序 | 自己实现                            | 需要时参考成熟实现（如 Atlassian Pragmatic drag and drop、dnd-kit 的算法）                                                       |
| 手势     | 自己实现                            | 基于 Pointer Events；带物理效果的自由拖动用 Anime.js 的 `createDraggable`                                                        |

**待办**：

- 文档页的 props 表生成。
- 双指缩放、旋转等手势：图片预览组件出现时在 `utils/dom/move.ts` 旁边加。拖动工具已完成（§10.8）。
- 下一批：日期选择（Calendar、DateField、DatePicker，`@internationalized/date`）；表格的单元格编辑、多级表头、横向虚拟化按需再加。
- 验证覆盖：演示页的 axe 检查跑亮、暗两套主题与三种浏览器；从右到左排版有单独的浏览器测试（`apps/host-demo/test/rtl.browser.test.tsx`）；窄屏横向溢出有回归测试。

## 8. 正式组件的完成标准（供之后使用）

1. API 符合 §1、§2，部件名与键盘映射写进文档。
2. 运行时测试（Vitest + happy-dom）覆盖受控、只传值、不传三种用法。
3. 浏览器测试（Vitest 浏览器模式 + Playwright）覆盖键盘、焦点、输入法；axe-core 无违规。
4. 类型测试：部件 props、`_bind` 的类型约束。
5. 文档页：演示、部件列表、props 表（从 TS 类型生成）、键盘映射。
6. 在宿主示例里能用；明暗主题、两种语言下截图核对。

## 9. StyleX 的类型提示与注释

### 9.1 原因（实测）

StyleX 的 `CSSProperties` 是类型别名，不能用声明合并补注释；更关键的是 `stylex.create` 的参数整体是泛型。TypeScript 悬停时显示“实例化后的上下文类型”里的属性，参数整体泛型时就是字面量本身，所以写好的属性看不到注释，跳转也落到没有注释的声明。只要属性值所在的位置不参与泛型推导，悬停、补全、跳转就都显示注释——这是 TypeScript 的标准行为，**不自研 TS 插件**。

### 9.2 方案：fork 类型声明，运行时不动

- 新入口 `@vue-tsx-pro/tsx/stylex`：运行时原样 `export * from '@stylexjs/stylex'`；类型上 fork StyleX 的公开声明，只改写 `create`（含动态样式函数）：**样式组名保留泛型推导，组内属性值的上下文类型固定为生成的 `DocumentedStyles`**。
- `DocumentedStyles` 由脚本生成：属性集合读自 StyleX 的 `StyleXCSSTypes.d.ts`；每个属性的值类型用索引访问**直接引用 StyleX 自己的类型**，语义不变（`stylex.test-d.ts` 逐个属性校验与原版互相可赋值）；每个属性带中文 JSDoc；伪元素嵌套递归引用 `DocumentedStyles`。
- StyleX API（`create`、`props`、`attrs`、`defineVars`、`createTheme`、`firstThatWorks`、`keyframes` 等）在 fork 的声明上写中文 JSDoc。
- 预设给 StyleX 编译器配置 `importSources`，识别新入口。写样式统一从这个入口导入。
- **代价**：不再精确推导每个样式组用了哪些属性，`StyleXStyles<{ color?: … }>` 这类受限类型无法校验；本库的 `sx` 本来不加限制，确需受限类型时用原版 `create`。
- **一致性测试**：同一组“应通过 / 应报错”的写法，分别用新入口与原版做类型检查，结果必须一致（受限类型一项除外）；StyleX 升级时先跑这组测试。
- 属性值关键字：字面量联合成员上的注释不会显示，但 WebStorm 会把字符串字面量解析到 `keyof` 接口的键上。所以有关键字说明的属性，值类型写成 `KeywordValue<DisplayKeywords, CSSProperties['display']>`：`DisplayKeywords` 每个键带注释，整体接受的值与 StyleX 相同（含 `string` 时改写为 `string & {}`，避免关键字被吸收）。WebStorm 悬停 `'inline-flex'` 显示该值的说明；TypeScript 官方语言服务（VS Code）对字符串字面量不提供悬停，只能看属性注释正文里的“常用值”。生成器会校验每个关键字都被 StyleX 的类型接受，不接受的从数据里删掉，以免提示一个写了会报错的值。

### 9.3 注释数据：理清来源，修订完善

| 内容                                                 | 来源                                                            | 说明                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| 覆盖哪些属性、值类型                                 | StyleX 类型声明（MIT）                                          | 决定注释范围                                                |
| 语法、初始值、是否继承、动画类型、适用元素、MDN 链接 | `mdn-data`（CC0）                                               | 一手数据，脚本填充，不手写                                  |
| 浏览器支持（Baseline 等级与年份）                    | `web-features`（Apache-2.0）                                    | 新增                                                        |
| 中文说明、常用值、适用场景                           | 以 zerodep-js 的 `css-author-docs.json` 为起点修订（自有，MIT） | 用自己的话写，不复制 MDN 正文（CC-BY-SA），只用 `@see` 链接 |

- 修订与完善：事实字段改由脚本从数据包填充；新增 Baseline；新增 StyleX 专属说明（数字值是否自动加 px、简写规则、物理方向属性提示改用逻辑属性）；逐条复核中文说明，常用属性补“常用值”和“适用场景”。
- 校验：StyleX 的每个属性都必须有中文说明；事实字段必须能在数据包中查到；升级数据包或 StyleX 时列出新增、删除、变化的属性。
- 生成格式：说明 → 常用值 → StyleX 注意事项 → 初始值 / 继承 / Baseline → `@see` MDN。
- 数据以本仓库 `scripts/css-docs/` 为唯一来源，以后需要时再抽成与 zerodep-js 共用的数据包。
- 主题 tokens 用 `defineVars` 定义时每个变量写 JSDoc（用途 + 明暗取值），属性访问悬停即可看到。

## 10. 各批组件的设计与取舍

上层组件（表单、弹层、数据展示）都建在这一层上，所以先把基础设施与基础组件做扎实：上层组件只组合它们，不再各写一遍布局、文字、动效。

### 10.1 基础设施

| 项           | 位置                            | 内容                                                                                                                                                                                                                 |
| ------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 档位类型     | `utils/style/styles.ts`         | `Size = 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`、`Space = 'none' \| Size` 等，组件的档位 prop 都用它们                                                                                                                 |
| 共享样式表   | `utils/style/styles.ts`         | “档位 → token”的 StyleX 样式表（`gap`、`padding` 等），被多个组件复用的才放这里                                                                                                                                      |
| 减少动态效果 | `config/theme/tokens.stylex.ts` | `durations` 用条件取值，`prefers-reduced-motion: reduce` 时自动为 0；组件不再各写媒体查询                                                                                                                            |
| 一元素一组件 | `base/Text.tsx`、`layout/*`     | 工厂生成各元素的组件：实现按几种标签共有的属性写，对外类型是 `TsxComponent<PartProps<Tag> & 选项>`；布局工厂 `createFlex` / `createGrid` / `createContainer` 导出，标签限于 `LayoutTag`                              |
| 过渡预设     | `utils/style/transitions.ts`    | `fade`、`scale`、`backdrop` 三套 StyleX 样式：进场用 `@starting-style`，离场用 `transition` 的 `allow-discrete`，纯 CSS；`await afterTransitions(元素)` 等元素与子元素的过渡结束（没有过渡、减少动态效果时立即完成） |
| JS 动画      | `utils/motion/animation.ts`     | Anime.js + `themeTransition`：时长、缓动、弹簧取主题 tokens                                                                                                                                                          |
| 演示页       | `apps/host-demo` 的 `/base`     | 文档站暂缓，按分类演示这批组件；页面带 axe 检查                                                                                                                                                                      |

### 10.2 组件

| 分类          | 组件                                                               | 要点                                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base/`       | `VisuallyHidden`                                                   | 只给读屏器看的文字                                                                                                                                                                                                                                |
| `base/`       | `Text`                                                             | `size`、`weight`、`tone`（`muted`、`accent`、`danger`、`success`、`warning`、`info`）、`align`、`truncate`、`lineClamp`、`wrap`；Text（span）、Paragraph（p，去外边距、pretty 换行）、Strong（semibold）、Em、Small（xs）；label 留给表单的 Label |
| `base/`       | `H1`–`H6`                                                          | 级别决定标签与默认字号，`size` 可单独改；紧凑行高、`text-wrap: balance`                                                                                                                                                                           |
| `base/`       | `Link`                                                             | `tone`、`underline`；`external` 自动加 `rel` 与读屏提示（语言文案）                                                                                                                                                                               |
| `base/`       | `Code`、`Kbd`                                                      | 行内代码、按键                                                                                                                                                                                                                                    |
| `base/`       | `CodeBlock`                                                        | `code`、`lang`、`wrap`、`propsCode`；高亮器经配置注入，可选，见 10.4                                                                                                                                                                              |
| `base/`       | `Spinner`                                                          | 加载指示，见 10.9                                                                                                                                                                                                                                 |
| `base/`       | `Button` 家族                                                      | Button、LinkButton、IconButton、CloseButton、ClearButton，见 10.9                                                                                                                                                                                 |
| `layout/`     | `Flex`                                                             | `direction`、`align`、`justify`、`wrap`、`gap`、`inline`；只做这一个，不拆 Stack / Group                                                                                                                                                          |
| `layout/`     | `Grid`                                                             | `columns`（1–12）、`minItemWidth`（`auto-fill` 自动换列）、`gap` / `rowGap` / `columnGap`、`align`、`justify`、`flow`                                                                                                                             |
| `layout/`     | `Container`                                                        | `size`（`xs`–`xl`，取 `sizes` 的容器宽度）、`padding`；居中、限制最大宽度                                                                                                                                                                         |
| `layout/`     | `Separator`                                                        | `orientation`；有语义时 `role="separator"`，装饰性时对读屏隐藏                                                                                                                                                                                    |
| `display/`    | `Collapse`                                                         | 高度动画（`grid-template-rows: 0fr ↔ 1fr`，各浏览器可用；`interpolate-size` 只有 Chromium）；收起后 `hidden="until-found"`：页内搜索命中时自动展开并写回 `open`，不支持的浏览器用 `inert`；`lazy` 第一次展开才渲染内容（同 Ark UI 的 lazyMount）  |
| `display/`    | `Collapsible`                                                      | 触发器（渲染函数，带 `aria-expanded` / `aria-controls`，`disabled` 时带 `disabled`）+ `Collapse`；以后的 Accordion 建在它上面                                                                                                                     |
| `layout/`     | `ScrollArea`                                                       | 浮层滚动条，见 10.8                                                                                                                                                                                                                               |
| `input/`      | `Slider`                                                           | 滑块，见 10.8                                                                                                                                                                                                                                     |
| `input/`      | `SlideVerify`                                                      | 拖动验证（滑块 / 拼图验证码），见 10.8                                                                                                                                                                                                            |
| `base/`       | `Badge`、`Tag`                                                     | 见 10.10                                                                                                                                                                                                                                          |
| `display/`    | `Card`、`Avatar`                                                   | 见 10.10                                                                                                                                                                                                                                          |
| `feedback/`   | `Progress`、`Skeleton`、`Alert`                                    | 见 10.10                                                                                                                                                                                                                                          |
| `navigation/` | `Toolbar`、`Tabs`、`Steps`、`Breadcrumbs`、`Pagination`、`NavList` | 见 10.10                                                                                                                                                                                                                                          |
| `display/`    | `VirtualList`                                                      | 虚拟列表，见 10.7；以后的表格、长下拉列表建在 `Virtualizer` 上                                                                                                                                                                                    |

FlexList、GridList 是 ul：去掉圆点与缩进并补上 `role="list"`。工厂可用的标签（`LayoutTag`）：`div`、`section`、`article`、`ul`、`ol`、`li`、`nav`、`header`、`footer`、`main`、`aside`、`form`，ol 同样按列表处理。VisuallyHidden 只渲染 span，Collapse 只渲染 div（要分区语义时在外面包 section）。

不做：`Box`（就是 `div` + `sx`）、`AspectRatio`（`sx` 里写 `aspectRatio`）、`Spacer`。响应式这批不做：`Grid` 的 `minItemWidth` 已覆盖最常见的自动换列，其余用 `sx` 加容器查询；以后需要时用容器查询实现；页面级布局用 `breakpoints`（§6.2）。

### 10.3 取舍依据

- `Collapsible` 不用原生 `<details>`：`<summary>` 必须是第一个子元素，触发器不能放在别处；动画要 `::details-content`（2025 年起才各浏览器可用）。
- 进场、离场动画用 CSS（`@starting-style`、`allow-discrete`，2024 年起三大浏览器都支持），不依赖 Vue 的 `<Transition>`；列表增删这类需要 JS 协调的动画以后再加。
- 不用 `text-box` 裁掉文字的上下行距（Firefox 不支持）；多行截断用带 `-webkit-` 前缀的 `line-clamp`（标准写法尚无浏览器支持）。

### 10.4 代码高亮：Shiki 作为可选依赖（已完成）

- `CodeBlock` 本身不依赖 Shiki：没有高亮器、或没给 `lang` 时渲染普通的 `<pre><code>`。
- 高亮器通过配置注入：`createUi({ highlighter })` 或 `<Provider highlighter={…}>`，接口 `Highlighter` 是“代码 + 语言 → 行内 HTML”的异步函数（只含 span 与 br，外层的 pre、code 由 CodeBlock 渲染）。
- 子路径 `@vue-tsx-pro/ui/shiki`（`src/config/shiki.ts`，构建时是单独的入口）提供 `createShikiHighlighter()`。只有它导入 `shiki`，主入口不导入；`shiki` 是可选的 peer 依赖，不用高亮的使用方不需要安装。
- JavaScript 正则引擎（`forgiving`，不加载 wasm）；语言按需 `loadLanguage`，同一种语言只加载一次，下载失败不缓存；不认识的语言按 `text` 输出；`codeToHtml` 用 `structure: 'inline'`。
- 颜色：Shiki 的 CSS 变量主题，`variableDefaults` 直接指向颜色 tokens（`var(--shiki-token-keyword, var(--accentText 的变量))`），切换明暗主题不需要重新高亮，使用方仍可用 `--shiki-*` 单独调整。没有在 CodeBlock 根元素上写 `--shiki-*`：StyleX 的类型不收自定义属性，默认值的写法也让高亮器脱离 CodeBlock 单独使用时颜色正确。
- 高亮是异步的：先显示纯文本，结果到了再替换（等宽字体下排版相同）；代码或语言变了先回到纯文本，晚到的旧结果丢弃；高亮失败保留纯文本并 `console.error`。
- 背景用 `surface` 加 `borderMuted` 边框而不是 `fill`：亮色主题的 `successText`、`infoText` 在 `fill` 上对比度不到 4.5:1。
- 横向可滚动，`pre` 加 `tabindex=0` 与焦点环（键盘可滚动，axe 的 scrollable-region-focusable）；`wrap` 时长行自动换行。

### 10.5 主题变量的字符串写法（已完成）

规则见 §4。实现：

- **对照表**：`packages/tsx/src/stylex/token-map.ts`，属性 → token 组，覆盖全部 token 组。原来的 `controls` 单位与用途不统一，已拆进 `sizes`、`borderWidths`、`opacities`、`strokeWidths`。
- **类型**：`scripts/css-docs` 生成 `DocumentedStyles` 时给表里的属性加上 `keyof FontSizesTokens` 这类取值，每组一个接口；ui 的 `token-names.ts` 由同一脚本根据 tokens 生成，用 `declare module` 填入 token 名与注释。每组单独一个接口，而不是 `keyof 总接口[组名]`：后者在 WebStorm 里会把各组同名的 `_xs` 都列为跳转目标。
- **编译**：`compiler/tokens.ts`（Babel），由 Vite 预设的 `vue-tsx-pro:tokens` 插件在 StyleX 之前运行；token 名从 token 模块的源码（或产物）读出，用来报错。与 `stylex` 选项无关，组件库构建也改写：同包的文件用相对路径导入，其他包用选项里的包名（默认 `@vue-tsx-pro/ui/tokens.stylex`）。
- **与原计划的出入**：带组名的写法不进补全。原计划让不进表的组（当时的 controls）的带组名写法出现在所有属性的补全里，实际 `position`、`display` 的补全里也会出现 `_controls.height`，噪音太大。
- **顺手修复**：`KeywordValue` 里的 `string & {}` 在泛型实例化时被 TypeScript 6 化简成 `string`，取值含任意字符串的属性在 tsserver（VS Code）里一直没有关键字补全；改用具名别名 `OpenString`。

### 10.7 虚拟滚动（为表格准备）

参考 `@tanstack/virtual-core` 的算法自己实现（§7 依赖表），分两层：

- **核心 `utils/virtual/virtualizer.ts`**：不依赖 Vue 的 `Virtualizer` 类，表格、树、下拉列表以后都建在它上面。
  - 位置表：每项的 `start / size / end`，大小先用 `estimateSize(index)` 估计，渲染后用 ResizeObserver 测量真实大小（border-box），按 key 缓存，数据重排后测量结果仍然对得上。
  - 可见范围：二分查找第一个 `end > 滚动位置` 的项，向后找到填满视口为止，再前后各加 `overscan` 项。`rangeExtractor` 可以改写最终渲染哪些项，吸顶行、固定行从这里接入（同 TanStack）。
  - 滚动容器：元素或 window；列表不在滚动内容的开头时用 `scrollMargin`（函数，每次滚动时读取，列表上方的内容变高也不会错位）。横向与纵向两种方向。
  - 测量到可视区上方的项变大或变小时同步调整滚动位置，可见内容不跳；容器与列表关掉浏览器自己的 `overflow-anchor`，避免重复调整。
  - `scrollToIndex(index, { align: start | center | end | auto })`、`scrollToOffset`：动态大小下滚过去后周围的项才被测量，位置会变，下一帧重新对准直到稳定（`smooth` 时不重试）。
  - 只在渲染范围或总大小变化时通知（`onChange`），滚动本身不触发重新渲染。
- **组件 `display/VirtualList`**：
  - `items` + 渲染函数子节点 `{(item, index) => …}`，`itemKey`、`estimateSize`（数字或函数）、`overscan`、`horizontal`。
  - `scroll="container"`（默认，组件自己是滚动容器，高度由使用方给）或 `"window"`（随页面滚动）。
  - 无障碍：列表 `role="list"`，每项 `role="listitem"` 带 `aria-setsize` / `aria-posinset`（读屏知道总数与位置）；容器模式下可聚焦（键盘滚动，方向键、Page Up/Down、Home/End 都是浏览器原生行为）。
  - `empty`：没有数据时显示的内容。
  - `handle`：拿到 `scrollToIndex`、`scrollToOffset`；`onRangeChange`：可见范围变化时报告，接近末尾时加载更多。
  - Vue 接入：虚拟化实例是普通变量，渲染所需的“渲染项 + 总大小”放在 `_state.raw`（滚动本身不触发渲染）；选项同步与挂载用 Vue 的 `watch` 而不是 `_effect`：它们会调用使用方的 `estimateSize`、`onRangeChange`，其中读到的响应式变量不该变成依赖。
- **暂不做**：从右到左排版下的横向滚动（`scrollLeft` 为负）、网格（两个方向同时虚拟化，表格需要时在核心上加）、`gap` 与内边距选项（项自己的内边距即可；容器的内边距已由 `scrollMargin` 自动算进去）。
- **已完成**：核心与组件、单元测试（`utils/.test/virtualizer.test.ts`、`display/.test/VirtualList.test.tsx`）、`/base` 演示（一万行、行高不固定、跳到第 5001 行）与浏览器测试。

### 10.8 拖动：工具、浮层滚动条、滑块、拖动验证（已完成）

- **拖动工具 `utils/dom/move.ts`**：`startMove(pointerdown 事件, { onMove, onEnd, threshold })`，参考 React Aria 的 useMove，基于 Pointer Events：指针捕获（移出元素、窗口也能继续）、`pointercancel` 与失去捕获按取消处理、拖动期间禁止选中文字、超过阈值后吞掉随后的 click、只响应主按钮。元素自己设 `touch-action`，组件自己提供键盘替代。三个组件都用它。
- **`layout/ScrollArea`**（参考 Radix ScrollArea）：滚动仍是原生的，原生滚动条用 `scrollbar-width: none` 与 `::-webkit-scrollbar` 隐藏；自绘的滚动条绝对定位、半透明（`color-mix` 的 textMuted），浮在内容上方，出现与消失只改透明度，不改变布局尺寸。
  - `axis`：y（默认）/ x / both；`type`：hover（默认，指针在上方或滚动时显示）/ scroll / always；`hideDelay`。
  - 滑块长度按可见比例（至少 20px），拖动滑块按比例滚动，点击轨道翻一页，滚轮落在滚动条上转交给视口；从右到左排版下横向方向反过来。
  - 滚动条是单独的内部组件，滑块位置随滚动直接写到元素上：滚动、悬停不会让内容重新渲染。
  - 视口可聚焦（键盘滚动），滚动条对读屏隐藏；外层是纵向 flex，使用方只给 `max-height` 也能限制住视口。
- **`input/Slider`**（WAI-ARIA Slider，参考 Radix / React Aria）：`value`（可双向绑定）、`min`、`max`、`step`、`bigStep`、`orientation`、`disabled`、`size`、`valueText`（aria-valuetext）、`name`（隐藏 input 随表单提交）、`onValueCommit`（松手或按键后一次）。点击轨道跳过去并接着拖；方向键、Page 键、Home/End；从右到左排版下横向方向键反过来；小数步长没有浮点误差。未声明的属性落到滑块（主元素）上，外层用 `propsRoot`。
- **`input/SlideVerify`**（滑块验证码）：只负责交互，判定交给服务端。`target="end"` 拖到头才算（没到头弹回），`"free"` 任意位置松手（拼图：服务端生成图片与缺口，应用按 `position` 画拼图块）。`onRelease` 交出位置、拖动轨迹（时间 + 位置序列）与用时，发给服务端校验；`status`（idle / verifying / success / error）由应用控制，设回 idle 时回到起点。
  - 前端的滑块本身挡不住脚本，必须服务端校验；
  - 无障碍：滑块是 role="slider"，←/→、Home/End 移动，Enter 或空格松手；状态经 aria-live 播报。这类验证对读屏与运动障碍用户仍不友好，应用应另外提供其他验证方式。
- **顺手修复**：组件单独解构的 `children` 原来经 computed 缓存，父级传入渲染时算好的值（插槽里没有响应式读取）时子组件停在旧内容（如 `<VisuallyHidden>{text}</VisuallyHidden>`），改为不缓存的只读访问器 `childrenProp`；表外属性用了短写时，报错信息改为列出真正有这个 token 的组（原来固定举例 `_space.x`，会误导）。

### 10.9 按钮家族与交互基础设施（已完成）

- **按钮家族**（一个元素一个组件，共用 `base/button-core.ts` 的样式表、选项类型与内容排布）：
  - **Button**（button）：`variant` solid / soft / surface / outline / ghost / link × `tone` accent / neutral / danger × `size`（字号档位，em 缩放）× `radius` none / sm / md / full；`icon` / `iconEnd`、`fullWidth`；`loading`（Spinner 盖在内容上，内容透明但保留宽度与读屏名称，`aria-busy`，焦点保留，点击与表单提交被拦下）；`disabled` 用原生属性，`focusableWhenDisabled` 改用 `aria-disabled`；`type` 默认 button。
  - **LinkButton**（a）：外观同 Button，站内链接经路由适配跳转；`external`；不可用时去掉 href，保留 `role="link"` 与 `aria-disabled`。
  - **IconButton**：方形，类型上必须有 `aria-label`，默认 ghost。
  - **CloseButton / ClearButton**：同一个工厂生成的预设，图标来自 Lucide（X、CircleX），名称取语言包。
  - 部件：`propsContent`、`propsIcon`、`propsIconEnd`、`propsSpinner`。
  - 实底按钮悬停时混入黑色加深（不用 accentHover / dangerHover），白字对比度只升不降。
- **组件默认值** `config/defaults.ts`：`createUi({ defaults })` / `<Provider defaults>`，优先级：显式 prop > 最近的 Provider > createUi > 组件自己的默认；只收外观类选项。按钮家族经 `useButtonAppearance` 统一合并。
- **路由适配** `UiRouter`（参考 React Aria 的 RouterProvider）：`navigate(href)`、`isActive(href)`；组件渲染真正的 `<a href>`，只拦普通左键点击的同源链接（`utils/dom/link.ts` 的 `useRouterLink`）。vue-router 用子路径 `@vue-tsx-pro/ui/vue-router` 的 `vueRouterAdapter(router, { match })`。
- **波纹** `utils/dom/ripple.ts`：按下处扩散、松开淡出，键盘 Enter / 空格从中心扩散，纯 CSS 动画，时长取 durations（减少动态效果时没有扩散过程）。默认开启，`createUi({ ripple })` / `<Provider ripple>` 全局开关，组件的 `ripple` prop 单独覆盖（`useRipple`）。
- **Spinner**：Lucide 的 LoaderCircle 加旋转；有 `label` 时 `role="status"`。旋转不随 durations 变为 0（它本身就是信息），减少动态效果时转慢。
- **分页计算** `utils/data/pagination.ts`：`paginationItems`（算法同 MUI），页数够多时项数固定。
- **编译器** `_untrack(x)`：只取当前值不追踪；组件函数体里写表示有意只要初始值，不警告（Collapse 已改用）。
- **主题修正**：`danger` 实色配白字原来只有 3.91:1，改为亮色 red 11、暗色 red 8。
- **已有组件的部件属性补齐**：Spinner、Link（`propsIcon`），ScrollArea（`propsContent`、`propsScrollbar`、`propsThumb`），Slider（`propsTrack`、`propsRange`），SlideVerify（`propsFill`、`propsHint`、`propsHandle`、`propsIcon`），VirtualList（`propsList`、`propsItem`）。试点 Button 删除，演示改用正式的 Button / LinkButton；试点 TextField 的清除按钮改用 ClearButton。

### 10.10 标记、反馈与导航（已完成）

- **状态色调** `utils/style/tone-styles.ts`：solid / soft / surface / outline × neutral / accent / info / success / warning / danger，Badge、Tag、Alert 共用。实底用该色调的文字色作底、页面背景色作字（success、warning、info 没有专门的实底色），两套主题都满足 4.5:1。
- **base/**：Badge（只展示）、Tag（外观同 Badge，可带移除按钮，名称是“移除 + 标签文字”，取文字用 `utils/data/text.ts` 的 `plainText`）。
- **feedback/**（Progress、Skeleton、Alert）与 **display/**（Card、Avatar）：
  - Progress：有值时完成比例，没值时不确定进度（循环动画不随 durations 变为 0，减少动态效果时变慢）；`valueText`；`data-state` 为 indeterminate / loading / complete。
  - Skeleton：包着内容时与内容一样大（内容 `visibility: hidden`、整块 `inert` 与 `aria-hidden`），加载完布局不跳；扫光与形状预设见 §4.1。
  - Alert：图标按色调自动选（Lucide），`live` 为 off / polite（status）/ assertive（alert），`action`、`onClose`。
  - Card：页头、正文、页脚，`variant` surface / outline / elevated / ghost，`padding`。
  - Avatar：图片加载完才显示，失败或没有图片时显示首字母（中文取最后一个字）或人像图标；有 `name` 时 `role="img"`，没有时是装饰性的。
- **漫游焦点** `utils/dom/roving-focus.ts`：一组只有一个 Tab 进入点，方向键 / Home / End，循环、横竖、从右到左；跳过不可用、隐藏、inert 的项；直接管理各项的 tabindex（组件不再写），选中项或 DOM 变化时自动重算。
- **navigation/**：
  - Toolbar：`role="toolbar"`，用漫游焦点，输入框不参与方向键移动。
  - Tabs / TabList / Tab / TabPanel：复合组件，状态经 createContext 共享；`activation` automatic / manual、横竖、`variant` line / soft、`lazy`、波纹；面板本身可聚焦。
  - Steps：按 `items` 渲染（步骤是展示数据，用不着复合写法），`aria-current="step"`，已完成显示对勾、出错显示警示图标，`onStepChange` 可点回已完成的步骤。
  - Breadcrumbs：nav > ol，链接用 Link（经路由适配），当前页 `aria-current="page"`，分隔符可换，`maxItems` 折叠中间部分、点开显示完整路径。
  - Pagination：页码序列用 `paginationItems`，按钮用 Button / IconButton，`href` 时渲染为链接；文案进语言包（分页、上一页、下一页、第 n 页）。页码之间用 Tab 而不是漫游焦点：分页没有 ARIA 复合角色，键盘用户也习惯逐个 Tab。
  - NavList / NavItem / NavGroup：当前页按路由适配的 `isActive`（或 `active`），含当前页的分组自动展开；分组用 Collapsible。
- **迁移到新基础设施**：Link 的站内链接改经路由适配跳转；CodeBlock 加复制按钮（IconButton，Lucide 的 Copy / Check，“已复制”经 aria-live 播报，外层改为包着 pre 与按钮的 div，`...rest` 仍落到 pre，外层用 `propsRoot`）；Collapse 输出 `data-state`（open / closed），Slider 输出 `data-orientation`。
- **选择模型** `utils/data/selection.ts`：`toggleSelection(selected, key, { mode, required })`，单选 / 多选；第一个使用者是 ToggleGroup。
- **input/ToggleGroup / ToggleItem**：复合组件，`selectionMode` single / multiple（与 Listbox、Select、DataTable 同名），`required`，整组 `disabled`，横竖，`aria-pressed` 表示选中，漫游焦点的进入点落在选中项上（漫游焦点改为也认 `aria-pressed` / `aria-checked`）；外观复用按钮家族的样式表（选中 surface accent，其余 ghost neutral）。

### 10.11 浮层、反馈、输入与表单（已完成）

**目录整理**：`integrations/` 删除，Shiki 与 vue-router 的适配移到 `config/`（它们实现 `config/context.ts` 里的 `Highlighter`、`UiRouter`，子路径名不变）；新增 `feedback/`（Alert、Progress、Skeleton 从 display 移入）、`overlay/`、`input/`（Slider、ToggleGroup、SlideVerify 从 form 移入，表单结构与校验 Field、Form、useForm 也放在这里，`form/` 删除）。Spinner 留在 base：Button 的 loading 依赖它。

**基础设施**（上层组件只组合它们）：

| 项             | 位置                         | 内容                                                                                                                                                                                                                                                 |
| -------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 锚定浮层       | `utils/dom/floating.ts`      | `anchorFloating`（第一次定位前隐藏、flip / shift、autoUpdate、`matchWidth` / `fitHeight`、`data-side`、缩放原点）；`createAnchoredLayer`（显示 → 定位 → 关闭时停止、归还焦点，Popover / Menu / Tooltip 共用）；`floatingStyles.anchored` / `surface` |
| 模态登记       | `utils/dom/overlay.ts`       | `trackModal` / `topModal`：模态打开时外面连顶层的 manual popover 也是 inert（三大浏览器实测，写进 native-overlay 的回归测试），Toaster 据此移进最上层的模态                                                                                          |
| 移除后的焦点   | `utils/dom/overlay.ts`       | `focusAfterRemoval`：关闭、移除按钮所在的元素真被移除时，焦点交给同组的下一个 / 上一个（同 React Aria TagGroup）；Tag、Alert、Toast 用                                                                                                               |
| 状态图标       | `utils/style/tone-styles.ts` | `statusIcons`：Alert、Toast、Steps、Field 的错误信息共用                                                                                                                                                                                             |
| 类型搜索       | `utils/dom/typeahead.ts`     | `createTypeahead`：连续输入拼词、同一字母轮换；`rovingFocus` 的 `typeahead` 选项用它，以后的 Listbox 也用                                                                                                                                            |
| 步长对齐       | `utils/data/layout.ts`       | `snapToStep`：Slider、NumberField 共用，按 step 与 min 的小数位取整                                                                                                                                                                                  |
| 传送内容的配置 | `config/Provider.tsx`        | `ConfigScope`：Teleport 出去的内容重新带上主题、lang、dir                                                                                                                                                                                            |
| 输入框外壳     | `input/control.tsx`          | `controlSx` / `controlStyles` / `useControlAppearance` / `controlIcon`：surface / soft、em 尺寸、`:focus-within` 焦点环、出错 / 不可用 / 只读；`defaults.Input`                                                                                      |
| 勾选类控件     | `input/choice-styles.ts`     | label > 叠放层（原生 input 画成方框 / 圆 / 轨道 + 不接收指针的标记）> 文字；复选组、单选组的排列                                                                                                                                                     |
| 字段           | `form/Field.tsx`             | `Field` 经上下文给控件 id、标签 id、说明与错误的 id 及状态，控件用 `useFieldControl` 读取（显式写的优先）；`Label`                                                                                                                                   |

**组件**：

- **feedback/**：
  - Dialog / Drawer / AlertDialog 共用一个模态内核（原生 `showModal` + utils/dom/overlay），部件复用 H2、CloseButton、Paragraph、ScrollArea（只滚正文）、Flex；Dialog 宽度档位同 Container；Drawer 四个方向（逻辑方向，进场滑入、离场淡出）；AlertDialog 不能点遮罩关闭，焦点先落在取消上，`onConfirm` 返回 Promise 时确认按钮加载中、Esc 暂不可用。
  - Toast：`createToaster()` 控制器（组件外也能用）+ `<Toaster>` 区域；每条就是 Alert（Alert 新增 `loading`）；悬停、聚焦、页面隐藏时暂停计时；`promise()`；区域是带名称的 landmark，F8 跳到它，列表 `aria-live="polite"`；顶层 manual popover，模态打开时移进模态；离场用 Collapse 收起高度。
- **overlay/**：Popover（试点转正）；Tooltip（悬停延迟、在一排触发器间移动不再等待、键盘聚焦立即显示、Esc 只关提示、可移到提示上、触屏不显示，manual popover 不会关掉打开着的菜单）；Menu（菜单按钮模式：MenuItem、MenuLinkItem、MenuCheckboxItem、MenuRadioGroup / MenuRadioItem、MenuGroup，漫游焦点 + 类型搜索，↑ 打开时落在最后一项，Tab 关闭且焦点继续往后）。Breadcrumbs 的折叠改为菜单。
- **input/**：TextField（试点转正：图标、清空、显示密码的切换按钮名称不变而用 `aria-pressed`）、Textarea（随内容增高，`rows`–`maxRows`）、NumberField（`role="spinbutton"`，按语言解析、认全角数字，提交时夹到范围并对齐步长，步进按钮不进 Tab 顺序）、Checkbox / CheckboxGroup、RadioGroup / Radio（同名原生 radio，方向键是浏览器的）、Switch（`role="switch"`）。
- **input/ 的表单部分**：Field、Label、Form（`novalidate`，提交失败时聚焦第一个出错的控件，原生 reset 回到初始值）、`useForm`（zod schema 校验，值的类型取自 schema 的输入、`onSubmit` 拿到解析后的输出，可加 `validate` 函数；schema 推出字段约束：必填标记、`maxlength`、NumberField 的范围；`form.Field` 的 `name` 带类型；失焦后才显示该字段的错误，提交过之后随输入更新；`setError` 写服务端错误）。

**取舍**：

- 点击遮罩关闭仍用 `dismissOnBackdrop`：原生 `closedby="any"` 到 2026 年 Safari 仍不支持。
- Toaster 不用 z-index：没有层级 token，顶层渲染才盖得住非模态浮层；模态打开时移进模态而不是另建弹层栈。
- Drawer 离场原先淡出而不是滑回（当时的 StyleX 不允许同一属性里 `:dir(rtl)` 出现两次）；§10.16 起改为滑回：关闭状态的 translate 移出到所在一侧，三种浏览器、两种排版方向实测通过。离场过渡仍只有 Chromium 支持。
- Tooltip 用 `popover="manual"` 而不是 `hint`：`hint` 只有 Chromium 支持。
- 勾选类控件用原生 input 而不是 `button` + role：键盘、表单提交与重置、label 点击都由浏览器负责。
- Textarea 用 JS 自动增高：`field-sizing` Firefox 不支持，StyleX 的类型里也没有。
- 控制器（Toast、Form）都是普通对象，不经 Provider 注入，组件外也能用（§1 的“命令式能力”）。

**暂不做**：Select / Combobox / Listbox、日期选择、子菜单、Toast 滑动关闭、环形进度、空状态、Popconfirm 与命令式的 `confirm()`。

### 10.12 选择类控件与已有组件的完善（已完成）

**选择类控件**分三层（参考 React Aria 的 useListState / useListBox / useSelect / useComboBox）：

| 层   | 位置                                 | 内容                                                                                                                                                                                   |
| ---- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 状态 | `input/list-state.ts`                | `useListState`：选项按分组排序、高亮项、已选项（`toggleSelection`）、跳过不可用项的移动、类型搜索（`createTypeahead`）；不碰 DOM。`handleListKeydown` 按宿主开关空格、字母、Home / End |
| 渲染 | `input/Listbox.tsx` 的 `ListboxView` | 选项、分组（`role="group"` 加标题）、已选标记、空状态（Empty）；指针悬停高亮、点击选中，按下时不抢焦点；高亮项滚进可见范围                                                             |
| 组件 | `Listbox`、`Select`、`Combobox`      | 各自决定焦点在哪：列表自己、触发按钮、输入框；高亮项都经 `aria-activedescendant` 告诉读屏                                                                                              |

- 选项是数据：`{ value, label, disabled?, description?, icon?, group? }`，需要自定义内容时传渲染函数。虚拟化与过滤都需要数据，所以不做 `<Option>` 子组件。
- **Select**（select-only combobox）：外壳用 `controlSx`，主元素是 `button role="combobox"`；弹出层 `useAnchoredPopover`（`floating: { matchWidth, fitHeight }`）；关闭时按字母直接选中（同原生 select）；多选时触发框里是 Tag；`name` 用隐藏的 input 随表单提交。占位文字是真正的文字（不是原生 placeholder），用 textMuted 满足 4.5:1。
- **Combobox**：输入框是 `role="combobox"`、`aria-autocomplete="list"`；本地过滤用 `Intl.Collator`（忽略大小写与重音），`filter={false}` 时由调用方按 `inputValue` 换数据（配合 `loading`）；过滤跟着 v-model 的值走，输入法组合期间不会拿拼音过滤；失焦时文字不是选项则恢复（`allowCustomValue` 除外）；Home / End 留给光标。
- **Empty**（feedback/）：图标 + 标题 + 说明 + 操作；ListboxView 的空状态用它，表格、VirtualList 也可以用。

**已有组件的完善**：

- Slider、ToggleGroup 接入 Field（`useFieldControl`）：标签作为名称、关联说明与错误、沿用不可用。
- NumberField：按住步进按钮连续加减（停 400ms 后每 60ms 一步，同 React Aria）。
- Progress：`size` 档位。
- `useConfirm()`：建在 AlertDialog 上的命令式确认。对话框挂在组件树之外，所以在 setup 里记下配置与应用上下文，再用 ConfigScope 带上主题；关闭后卸载。
- Toast：横向滑动超过宽度的 35% 关闭，否则弹回（`startMove`）。

**暂不做**：选项列表的虚拟化（要让 `aria-activedescendant` 指向的高亮项始终渲染，在 `Virtualizer` 的 `rangeExtractor` 上加）、Combobox 多选（TagsInput）、子菜单、环形进度。

### 10.13 审核整理、虚拟化与表格（已完成）

**审核后的整理**（行为不变，各自单独提交）：

| 项         | 改动                                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 焦点工具   | `utils/dom/overlay.ts` 里的焦点函数拆到 `utils/dom/focus.ts`（focusFirst、focusOrigin、returnFocus、trapFocus、focusAfterRemoval）；overlay 只留 toElement、遮罩、模态登记、锁滚动 |
| 浮层同步   | `useAnchoredPopover(read, { close, shown })`：open ↔ 显示 / 隐藏、浏览器 light dismiss 写回、卸载时收起。Popover、Menu、Select、Combobox 原来各写一份                              |
| 输入框外壳 | `input/control-styles.ts` 改名为 `input/control.ts`，加 `focusOnShell()`（点外壳空白处聚焦主元素）                                                                                 |
| 表单值     | `FormValue`：Slider、Select、Combobox 的隐藏 input                                                                                                                                 |
| 列表行     | `utils/style/item-styles.ts` 的 `itemStyles`：Menu、ListboxView、NavList 的行外观与状态色只在这里定义，表格行用同一套状态                                                          |
| 文字比较   | `utils/data/collation.ts`：`createMatcher`（忽略大小写与重音的包含，Combobox 用）、`createComparer`（数字、日期、按语言的文字，空值在后，表格排序用）                              |
| 虚拟化接线 | `utils/virtual/use-virtualizer.ts` 的 `useVirtualizer(read)`：Virtualizer 的选项同步、挂载、渲染状态；VirtualList、ListboxView、DataTableView 共用                                 |

**样式补齐**：输入框外壳加 `radius`（none / sm / md / full，同按钮，经 defaults.Input）；Select / Combobox 的弹层按同一个 `size` 设字号（弹层不是外壳的后代，原来不继承）；Checkbox、RadioGroup、Switch 读 `defaults.Choice.size`。

**虚拟化**：选项列表与表格始终虚拟滚动，不另做非虚拟的版本。

- ListboxView：行 = 分组标题 + 选项，绝对定位在撑开总高度的容器里；高亮项经 `rangeExtractor` 始终渲染，键盘移动时滚进可见范围；选项带 `aria-setsize` / `aria-posinset`。各行独立定位后分组没法用 `role="group"` 包住选项，标题只是视觉上的一行，组名经 `aria-describedby` 交给组里的每个选项。Select、Combobox 把弹出层作为滚动容器传入，单独的 Listbox 自己滚动（最高 20em）。
- 性能：选项展开成行原来每个选项都回头找分组标题（O(n²)，一万个选项时演示页挂载 5–10 秒），改为在循环里记住；列表状态的分组排序、值集合、已选集合用 computed 缓存。演示页有“2 秒内挂载完”的回归测试。

**表格**（`table/`）：

| 层              | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columns.ts`    | 列定义 `DataTableColumn`（key、header、cell、value、width、minWidth、align、sortable、sticky、resizable、wrap）、`nextSort`、`sortRows`                                                                                                                                                                                                                                                                                                                   |
| `DataTableView` | 渲染层：原生 table + `table-layout: fixed` + colgroup；外层 ScrollArea 两个方向滚动；虚拟滚动用上下两行占位撑出高度（各列仍在同一张表里对齐），`aria-rowcount` / `aria-rowindex`；表头吸顶与固定列用 sticky（逻辑方向，偏移按列宽累加，固定列单元格继承行的不透明底色）；排序按钮与 `aria-sort`；勾选列（Checkbox，全选有部分选中）；列宽手柄可拖动或用方向键调整（`role="separator"`）；外层 `contain: inline-size`，宽表格不撑宽外面的 grid / flex 容器 |
| `DataTable`     | 平铺的数据：本地排序（`manualSort` 时交给调用方）、单选 / 多选、`columnWidths` 可双向绑定、`leading` 给第一列前加内容；外观 `defaults.DataTable`（density compact / standard / comfortable、variant surface / ghost、striped）                                                                                                                                                                                                                            |
| `TreeDataTable` | 建在 DataTable 上：按展开状态把树展开成行（同级之间排序），第一列加缩进与展开按钮（名称固定、`aria-expanded` 表示状态），`hasChildren` + `loadChildren` 懒加载（按钮显示加载中）。仍是 table 语义（treegrid 要求逐个单元格的方向键导航）                                                                                                                                                                                                                  |

工具栏不内置，用现有组件组合：搜索 TextField（`radius="full"`）、列显示开关 Menu + MenuCheckboxItem、刷新 Button（`loading`）、批量操作 Toolbar、分页 Pagination。演示页有一万行订单表与懒加载的组织架构树。

**加载状态统一**：会异步取数据的组件都有 `loading`，规则一致——没有数据时显示骨架行（Skeleton），已有数据（刷新、加载更多）时在顶部显示一条进度条（Progress，对读屏隐藏），容器带 `aria-busy`：ListboxView（Select、Combobox）、DataTable / TreeDataTable、VirtualList。按钮、Alert、Toast 的加载中沿用各自已有的 Spinner。

**暂不做**：单元格编辑与 treegrid 键盘导航、列拖动排序、行拖动排序、表头分组（多级表头）、列筛选弹层（用工具栏组合）、横向虚拟化（列很多时）。

### 10.14 导出、默认值、选择模型、zod 与动画（已完成）

第二轮架构审核后的整理与改进，每块单独提交：

| 项     | 改动                                                                                                                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 目录   | utils 按职责分成 `style/`、`dom/`、`data/`、`virtual/`（之后又加了 `motion/`）；Dialog.tsx 拆成 Modal、Dialog、Drawer；DataTableView 的列宽计算挪到 columns.ts，列宽手柄成为 ColumnResizer；`button-styles.ts` 改名 `button-core.ts` |
| 导出   | 工具全部导出、名字全局唯一（§2.5、§4）；入口由 `pnpm exports` 生成并进 CI；重复的 `DataTable<K>` 类型、`toArray`、`isWindow` 合并                                                                                                    |
| 默认值 | `useDefaults(name, read, fallback)` 一次合并，去掉散落的约 30 处 `x ?? defaults.x ?? '…'`                                                                                                                                            |
| 按钮   | `useButtonBehavior`：Button、IconButton、LinkButton 共用不可用、加载中、拦截点击、波纹与 data 属性                                                                                                                                   |
| 选择   | `selectionMode` 统一命名、`SelectionProps` 合并三份单选 / 多选 props；Listbox、Select、Combobox 的 `toOption`；列表状态缓存 值 → 位置                                                                                                |
| 表单   | zod 成为 peer 依赖；值的类型取自 schema、`onSubmit` 拿到解析后的输出；schema 推出约束交给 Field 与控件；`FieldPath` 与 `form.Field`；演示页加了表单一节                                                                              |
| 动画   | `useAnimate`；Toast 滑动弹回 / 滑出、SlideVerify 弹回与失败晃动、Tabs 下划线滑动（TabList 的指示条）                                                                                                                                 |
| 性能   | DataTable 全选、TreeDataTable 展开、Select 已选项的 O(n²) 改为集合查找，补交互性能测试                                                                                                                                               |

**没有按原方案做的**：`useListState` 仍按字段给读取函数（一个 `read` 会让选择变化也重新整理上万个选项）；三处 `SKELETON_ROWS` 取值不同，留在各自组件里；overlay 组件依赖原生 popover，happy-dom 没有，行为仍在浏览器测试里测（补了 Popover 的焦点用例）。

### 10.15 动效、反馈与交互组件（已完成）

三个阶段一起做，加上与用户讨论后确定的已有组件整理（A–E），每块单独提交：

| 项       | 改动                                                                                                                                                                                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 动效基础 | `useTween` / `useSpring`、`usePresence`（Toast、Tag、Alert 的离场）、`useLayoutAnimation`（Anime.js createLayout）、`useActiveIndicator`（Tabs、ToggleGroup）、`useReducedMotion`、`useDelayedLoading`（Button、DataTable、ListboxView、VirtualList）；取主题时长，减少动态效果时直接到位 |
| 交互基础 | `useHotkeys`（Menu 的快捷键真正触发）、`useClipboard`（CopyButton、CodeBlock）、`useSortable`（指针拖动实时重排、边缘自动滚动、键盘拿起 / 移动 / 放下 / 取消与读屏播报）、`useLeaveConfirmation`；`utils/data/tree.ts`（展开成行、勾选联动与半选、懒加载，Tree 与 TreeDataTable 共用）    |
| 新组件   | AnimatedNumber、LoadingOverlay、CopyButton、Result、Icon 的 `draw`、HoverCard、Accordion、ContextMenu、MenuSub、TagsInput、PageSizeSelect / PageJump、AvatarGroup、Indicator、Descriptions、Timeline、Tree、FileDrop / Upload、Sortable、Marquee、Tour                                    |
| 组件增强 | Toast 的 `stack` 与剩余时间、ToggleGroup 滑块、Tag 移除动画、Progress 数值过渡、Checkbox 描线；TextField / Textarea 前后缀与计数、Switch 的 loading 与内部文字、Slider 范围与刻度、Popover / Tooltip 箭头                                                                                 |
| 表单     | `form.array`（稳定 key、错误随下标移动）、`form.dirty` / `isDirty`、`fields` 单字段异步校验（防抖、只采用最后一次、提交时等待、`validating`）                                                                                                                                             |
| 整理     | DataTable / TreeDataTable 的 `size` 改名 `density`（compact / standard / comfortable）；variant 词表写进 §1，输入框的 `outline` 改名 `surface`；`useFormat` 加 `fileSize`；`anchorFloating` 加 `crossAxisFallback`                                                                        |
| 顺手修的 | 虚拟滚动只在元素第一次出现时同步测量（浮层进场的 scale 让每次渲染量出不同的值，WebKit 下 ListboxView 递归更新）；Menu 的 Esc 显式关闭（Firefox 偶尔不关）；几个浏览器测试开始前把指针移开（指针停在原处时 hover 不产生移动）                                                              |

**没有按原方案做的**：Sortable 没接上 DataTable 的列顺序（API 已能接：把手放在表头里用 `useSortable`），留作下一步；Tree 的焦点用 aria-activedescendant（与 Listbox 一致，虚拟滚动下不用移动 DOM 焦点）而不是逐项 tabindex；Tour 的目标在模态打开期间不可交互（整页 inert），只做展示与说明；Marquee 的速度按 px/s 换算，内容变化时由 ResizeObserver 重新量。

### 10.16 性能、类型与基础设施整理（已完成）

先实测再决定做不做（Chromium + 生产版 Vue，探针统计组件更新次数与刷新耗时），每块单独提交：

| 项                   | 改动                                                                                                                                                                       | 实测                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 类型                 | `stylex.create` 返回具名的 `CompiledStyles`，删掉 143 处 `StyleTable<'a' \| 'b'>` 标注（声明文件照样生成）                                                                 | —                                                          |
| 部件合并             | `mergeAttrs<'tag'>` 合并 `elementProps(mergeProps(…))`（216 处）；`mergeProps` 只有默认层时原样返回、事件名不用正则；单个静态样式缓存编译结果                              | 单元格合并 1.1µs → 0.36µs，按钮类挂载快约 20%              |
| 目录与工具           | 表单结构拆到 `form/`，对话框一族移到 `overlay/`；`data/layout` 拆成 `data/number` 与 `dom/direction`；`useResizeObserver`；Toast 的 F8 用 `useHotkeys`；`useDefaults` 缓存 | —                                                          |
| Virtualizer          | 位置表只从变了大小的项往后重排，一批测量合并成一次通知                                                                                                                     | 纯文本表格滚动每步 10.0ms → 3.8ms                          |
| 表格                 | 行拆成 `DataTableRow`，全选状态改为派生；TreeDataTable 交给 DataTable 的行与 `rowKey` 保持同一个引用                                                                       | 勾选一行 4.4ms / 63 次更新 → 1.4ms / 8 次                  |
| 浮层                 | 内容第一次打开时才渲染（Popover、HoverCard、Menu、对话框与抽屉），统一成 `useLazyContent`                                                                                  | 一百个关闭的十项菜单挂载 118.6ms → 15.2ms，节点 5301 → 301 |
| 图标与列表项         | Icon 用缓存的 SVG 标记作 innerHTML；Listbox 选项行用 `withMemo`                                                                                                            | 一千个图标挂载 39ms → 19ms；方向键的组件更新 31.9 → 4.5 次 |
| 编译器               | 第 6 步渲染优化：组件子节点的插槽标 `$stable`，JSX 属性里的函数与常量按实例缓存，组件上的 `_bind` 写出可缓存的回调（RUNES §9）                                             | 父组件更新的级联 5.2ms / 203 次 → 0.0ms / 1 次             |
| 合计（带勾选的表格） |                                                                                                                                                                            | 滚动每步 17.2ms → 6.6ms                                    |

**试过但不做的**：prop 访问器延迟创建（每次读取要多穿两层 Proxy、重新追踪，滚动反而 17ms → 43ms，挂载不变）；无状态叶子组件改成函数式组件（每个只省约 4µs，还丢掉“props 没变就跳过”）；每帧的数值动画直接写 DOM（700ms 里只省约 3ms，留给逐个组件审查时顺手改）。

**行为变化**：浮层的内容关闭时不在 DOM 里（`lazy={false}` 恢复）；带快捷键的菜单照常渲染；使用方传 `onClick={undefined}` 不再盖掉组件默认层的处理；界面要读响应式数据（RUNES §9）。

### 10.17 文档站的准备：主题、排版、外壳与组件整理（已完成）

文档站不用 Markdown，是用组件库自己写的 TSX 网站；它要用的组件都进组件库、按通用组件设计。先补主题与基础设施，再逐类检查已有组件有没有用好基础组件，最后补文档站专用的几类组件，每块单独提交：

| 项       | 改动                                                                                                                                                                                                                                                                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主题     | 第三套内置主题 `paperTheme`（米黄纸色、深棕墨色、墨蓝品牌色、衬线标题）；新 tokens：`selection`、`highlight`、`surfaceTranslucent`、代码高亮 `code*`、`fonts.serif` / `heading`；`pnpm themes:check` 逐对检查三套主题的 WCAG AA 对比度（CI）                                                                                                   |
| 主题切换 | `createThemePreference`（跟随系统或某一套，localStorage 记住、多标签页同步，`names` 列出可选主题）、`themeBootScript`（防闪烁）、`revealTransition`（从一点圆形展开，View Transitions API）、`paintDocument`（页面根元素用主题的底色、文字色、字体与行高）；`ThemeSwitcher` 是现成的切换界面                                                   |
| 基础组件 | `ButtonBase`（无外观的按钮）：菜单项、标签页、折叠标题、步骤、排序按钮、拖动把手、导航分组都建在它上面；过渡写法抽成 `interactionTransitions` / `disclosureStyles` / `presenceStyles`；8 处手写的 ul / ol 改用 `FlexList` / `FlexOrderedList` / `GridList`                                                                                     |
| 改名     | 虚拟滚动表格 `Table` / `TreeTable` → `DataTable` / `TreeDataTable`，`Table` 留给静态表格；列表状态的类型 `ListItem` → `ListStateEntry`（`ListItem` 是列表项组件）                                                                                                                                                                              |
| 正文排版 | 静态表格 `Table` 家族（与 DataTable 共用样式表）、`List` / `OrderedList` / `ListItem`、`Blockquote`、`Mark`、`Prose`（长文容器：阅读宽度、宽松行高）；标题的 `anchor`（悬停或聚焦时显示的 # 链接，`stylex.when.ancestor` + `headingMarker`）                                                                                                   |
| 代码展示 | `CodeBlock` 的标题栏、行号、行高亮、diff 的增删行、`maxLines` 折叠；`CodeGroup`（标签页切换几段代码）；`CodePreview`（效果 + 可收起的源码 + 复制，`actions` 往工具栏加按钮；示例组件与 `?raw` 源码由使用方各自导入，两者永远一致）                                                                                                             |
| 页面外壳 | `AppShell`（粘性半透明顶栏、左侧栏、正文、右侧栏；64rem 以下左侧栏收进抽屉，80rem 以下隐藏右侧栏；自带 `SkipLink`）、`TableOfContents`（`useScrollSpy` 滚动高亮，`collectHeadings` 收集标题）、`CommandPalette`（Mod+K，Dialog + `useListState` + `ListboxView`）、`Pager`（上一篇 / 下一篇）、`ColorSwatch`（色块，token 按当前主题读出取值） |
| 基础设施 | `useMediaQuery`（`usePrefersDark`、`useReducedMotion` 并入 `utils/dom/media-query.ts`）；`layoutVars.stickyOffset`（`utils/style/vars.stylex.ts`：AppShell 设为顶栏高度，标题的 `scroll-margin` 与粘性侧栏据此让开）；抽屉关闭时滑回所在一侧；AnimatedNumber 每帧直接改文字                                                                    |

**设计取舍**：

- 文档站专用的组件都按通用组件设计：数据由使用方给（CommandPalette 的 `items` 与 `onAction`、TableOfContents 的 `items`），不绑定路由、搜索索引或页面结构。
- AppShell 的响应式用断点常量 `breakpoints.lg` / `xl`（§6.2）；顶栏高度固定 3rem，经 `layoutVars.stickyOffset` 交给里面的标题与侧栏。
- 本页目录的阅读线取标题自己的 `scroll-margin-top`：点目录跳过去后，高亮的正好是跳到的那一节；滚到底时高亮视口里的最后一节。
- 命令面板的焦点一直在输入框上（aria-activedescendant 指向高亮项），与 Combobox 相同；面板不记选择，选中就是执行，所以回调叫 `onAction`（与 MenuItem 一致，也避开原生 select 事件）。

**行为变化**：`paintDocument` 时页面根元素的字体与行高也由主题决定；`usePrefersDark`、`useReducedMotion` 的导出名不变，模块路径改为 `utils/dom/media-query.ts`。

### 10.18 文档站的框架（已完成，组件逐类迁移中）

**分工**：ui 包只放组件源码（平铺，如 `base/Button.tsx`）与行为单元测试（分类的 `.test/`）；示例、文档页、基于示例的测试与真实浏览器测试都在文档站 `apps/docs/src/components/<分类>/<Name>/`：

```
apps/docs/src/components/base/Button/
  docs.tsx          文档页：export const meta = { title, description, order } 与页面组件
  demo/Basic.tsx …  示例：完整的小组件，从 '@vue-tsx-pro/ui' 导入，源码原样显示
  test/demos.test.tsx  用示例测：文档里展示的用法本身就是被测对象
```

| 机制   | 做法                                                                                                                                                                                                                                                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 开发   | `pnpm dev:docs`（端口固定 5174）；Vite 按 `@vue-tsx-pro/source` 条件解析各包源码，改组件、示例、文档页都热更新；配置文件经 `pnpm-workspace.yaml` 的 `nodeOptions` 与 `--configLoader native` 也走源码，不用先构建                                                                     |
| 示例   | `import Basic from './demo/Basic.tsx?demo'` 一次拿到 `{ component, source }`（`build/demo.ts`）；`Example` 渲染标题、说明与 CodePreview，`Examples` 在宽屏时分两列                                                                                                                    |
| 路由   | `virtual:doc-pages`（`build/pages.ts`）收集所有 `docs.tsx`，构建时静态读出 meta：侧栏、命令面板、翻页都来自它，页面本身按需加载                                                                                                                                                       |
| API 表 | `virtual:api/ButtonProps`（`build/api.ts`）用 TypeScript 检查器读组件库的类型与 JSDoc：说明、类型、必填、默认值（`@default` 优先，其次组件参数解构的默认值）、`_bindable`、档位类型展开成带注释的可选值；`ApiReference` 按属性、事件、内容、部件属性分表，渲染用组件库的 `PropsTable` |
| 测试   | 通用测试自动覆盖新示例：每个示例都能渲染且没有警告、每个文档页能渲染且锚点不重复；三套主题下所有示例跑 axe（三种浏览器）                                                                                                                                                              |

**写注释就是写文档**：API 表直接来自 JSDoc，prop、档位接口的每个键都要有注释；默认值来自 `useDefaults` 或共用选项、不在参数解构里的，写 `@default` 标签（共用选项的默认值因组件而异时，在组件自己的 Props 里重新声明并写 `@default`，如 IconButton 的 `variant`）。

**顺手的组件库改动**：`PropsTable`（API 表格，数据类型 `ComponentApi`、`ApiProp`、`ApiValue`）、`IconLinkButton`（只有图标的链接）、Icon 的 `tone`、`@vue-tsx-pro/ui/theme-boot`（Node 可用的防闪烁脚本与内置主题底色）、静态 Table 的列宽按内容分配（`table-layout: auto`）、`scripts/structure/move.mjs`（移动文件并改写导入）。

### 10.19 浮层滚动条铺开与主题编辑器（已完成）

**浮层滚动条**：滚动条半透明、浮在内容上，出现与消失都不占位（滚动仍是原生的）。

| 项              | 做法                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 公共部件        | `OverlayScrollbar`（从 ScrollArea 抽出）：视口可以是元素，也可以是整页（`document.scrollingElement`，滚动事件在 window 上）                                                          |
| 整页            | `PageScrollbar`：窗口照常滚动（前进后退恢复位置、手机收起地址栏、粘性定位都不变），只隐藏页面的原生滚动条，换成固定在视口一侧的浮层滚动条；指针移到窗口边缘时显示。AppShell 默认开启 |
| 改用 ScrollArea | AppShell 两侧栏、CodeBlock 的横向滚动、静态 Table、CodePreview 的效果区                                                                                                              |
| 列表与树        | ListboxView（自己滚动时）、Tree、VirtualList（容器模式）：列表元素就是 ScrollArea 的视口（`focusable={false}`），焦点与 aria-activedescendant 不变                                   |
| 弹出层          | Select、Combobox、TagsInput、Menu、MenuSub：`floatingStyles.scrollPanel` + `scrollArea`，虚拟滚动的滚动容器是视口；顺带去掉原生 popover 默认的 0.25em 内边距                         |
| 不改            | Textarea（滚动条属于原生元素）、Sortable 的横向列表（拖动时的边缘自动滚动直接驱动列表元素）                                                                                          |

**主题编辑器**：

| 项         | 做法                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 颜色工具   | `utils/data/color.ts`（culori，按函数引入）：解析、#hex、半透明叠加、WCAG 对比度、实色上的文字色（白字够 4.5:1 用白字，否则对比度更高的那个）、`withAlpha`                                                         |
| 色阶规则   | `config/theme/palette.ts`：每个颜色 token 取 Radix 色阶的哪一级（从测试里提升成库代码），`paletteColors` 按选中的品牌色、中性色整组生成；内置主题由 palette.test 核对                                              |
| 对比度规则 | `config/theme/contrast.ts`：要检查的颜色组合与 `checkContrast`，`pnpm themes:check` 与编辑器共用                                                                                                                   |
| token 清单 | `config/theme/token-catalog.ts`（`pnpm css-docs` 从 tokens.stylex.ts 生成）：每个 token 的默认值与说明                                                                                                             |
| 定制逻辑   | `config/theme/customize.ts`：`ThemeSettings`（品牌色、中性色、圆角、缩放、字体、动效）→ `themeSettingsOverrides` → `customizeTheme(base, settings)`；`themeSettingsCode` 生成可以粘贴的 `defineTheme(…)`           |
| 入口       | 色阶、对比度、token 清单、定制逻辑由子路径 `@vue-tsx-pro/ui/theme-customize`（`config/theme-customize.ts`）导出：它们要用 culori 与 Radix 色板，主入口不带，应用只在真要套用设置时导入；`ThemeCustomizer` 在主入口 |
| 界面       | `ThemeCustomizer`：色块单选与分段选项（ToggleGroup）、实时对比度提示（读页面上实际生效的颜色）、导出代码、恢复默认；新输入组件 `ColorField`（色块 + 文字输入，接入 Field）                                         |
| 文档站     | “主题定制”指南页：左边编辑器，右边样板间；设置记在本地，与明暗偏好叠加生效                                                                                                                                         |

**取舍**：运行时覆盖写在根元素的行内样式上，会盖过“减少动态效果时为 0”的媒体查询，所以用户开启减少动态效果时动效旋钮不覆盖时长。中间亮度的色阶（如 crimson、teal）上白字与深色字都可能到不了 4.5:1，编辑器如实提示。逐个 token 编辑、任意颜色生成色阶（OKLCH）留到第二期。

### 10.20 代码演练场：Web Worker 里编译，独立应用里预览

目标：用户在文档站改示例代码、立即看到效果，不打开 StackBlitz。页面 `/playground`（侧栏“指南”里），页面在 `apps/docs/src/pages/Playground.tsx`，其余代码在 `apps/docs/src/playground/`。先做试点验证可行，再正式化。

| 环节      | 做法                                                                                                                                                                                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 编译      | `compile.ts`：与 Vite 预设同一套 Babel 插件——token 字符串写法（`compileTokens`）→ 去类型 → 符文 → StyleX → Vue JSX，最后把 import 改成从模块表取；在 Worker 里跑（`compile.worker.ts`），打字不卡页面                                                                              |
| 样式      | StyleX 的规则从 metadata 取出转成 CSS，主线程写进一个 `<style data-playground>`；模块解析与站点构建用同一个规范名（`@vue-tsx-pro/ui:config/theme/tokens.stylex`），`'_md'` 与 `colors.accent` 编译出组件库的同一个 CSS 变量                                                        |
| 执行      | `run.ts`：`new Function` 执行，import 从模块表取（vue、tsx、stylex、ui、tokens、按需加载的图标），复用页面已加载的模块，不再下载                                                                                                                                                   |
| Node 替身 | `node-shims/`：`process`、`path` → pathe、`fs`（不存在）、`assert`（CommonJS 写法，调用方 `require` 要直接拿到函数）、StyleX 浏览器版要的 `@babel/standalone`（转交 parser/traverse/types）；依赖预构建见 vite.config.ts                                                           |
| 编辑器    | `editor.ts`：CodeMirror 6 + TSX 语法（括号补全与匹配、折叠、搜索、撤销）；颜色、字体全取主题 token（`colors.code*` 与 Shiki 代码块同一套），明暗用 Compartment 切换。`CodeEditor.tsx` 挂载后才 `import()` 它，外壳复用输入框的 `controlShellStyles`；Tab 缩进，Esc 后 Tab 移出焦点 |
| 预览隔离  | `preview.ts`：用户组件挂在独立的 Vue 应用里，与页面共用 `ConfigContext`（主题、语言跟着站点变）；根组件是错误边界（`onErrorCaptured`），setup、渲染、事件处理、侦听器里的错误只在预览区报“运行出错”，可“重新运行”；每次编译成功先卸载旧应用                                        |
| 分享      | `share.ts`：代码 deflate-raw 压缩、base64url 后放进 hash（`/playground#code=…`），停止输入 300 ms 后 `history.replaceState` 写入（不新增历史记录）；起始示例不写 hash；链接损坏时提示并显示起始示例。路由的 `scrollBehavior` 遇到不是页内锚点的 hash 回到顶部                      |
| 编辑按钮  | `CodePreview` 新增 `actions`（工具栏最前面的额外操作）；文档站的 `EditInPlayground` 是一个链接按钮，`Example` 与首页的示例卡片都带它，点开即带着源码进演练场                                                                                                                       |
| 测试      | `compile.test.ts`：Node 里跑同一套编译，执行、挂载、点击；核对 token 变量与组件库一致；语法与 token 写错时报错带代码帧。`share.test.ts`：往返、损坏链接。`preview.test.tsx`：共用配置、渲染与事件里出错只报告                                                                      |

**代价（生产构建，本机）**：Worker 2.2 MB，gzip 588 KB / brotli 413 KB，只在进入演练场时下载；页面块 66 KB（gzip，含整个组件库的模块表）；编辑器块 476 KB，gzip 160 KB，同样只在演练场加载。首次出效果约 0.8 s（含 Worker 下载、Babel 初始化与第一次编译约 135 ms），之后每次编译 5–15 ms，执行约 1 ms。

**遇到的坑**：StyleX 浏览器版的运行时注入要插 import，它精简过的 Babel types 缺函数，改为从 metadata 取 CSS；它默认读 package.json 算调试路径，用 `debugFilePath` 跳过；替身源码改了要删 `node_modules/.vite` 重新预构建（替身被打进了预构建的依赖）。

**限制**：没有类型检查（`colors.typo` 这类写错的变量 StyleX 不报错，编译成一个不存在的 CSS 变量）；只能导入模块表里的包；单文件。预览与页面同一个线程、同一个文档：死循环会卡住页面，定时器与 Promise 里的错误不经过 Vue，只出现在控制台（真正的隔离要 iframe，代价是另加载一份 Vue 与组件库）。

**以后再定**：类型检查与补全（在 Worker 里跑 TypeScript，再多约 3 MB）；编辑器若别处也要用，再收进组件库（CodeMirror 作可选 peer 依赖，同 Shiki）。

### 10.21 图表与统计数值（已完成第一批）

子路径 `@vue-tsx-pro/ui/charts` 封装 `@unovis/ts`（可选 peer），主入口不导入：没用到图表的应用不打包 Unovis。柱状 + 折线按需打包约 77 KB（gzip，含 d3 与 emotion）。

| 项         | 做法                                                                                                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 公共部分   | `charts/XYChart.tsx`（内部）：图例（按钮，`aria-pressed`，隐藏的系列可 `_bind`）、单位、绘图区、十字线与提示框（内容用 Vue 渲染进 Unovis 的提示框）、空与加载状态、给读屏的数据表；各种图只给出要画的 Unovis 组件 |
| 生命周期   | Unovis 组件实例只建一次（`instance(key, create)`），数据与属性变化时 `setConfig` + `container.update`，卸载时 `destroy`，更新才有过渡动画                                                                         |
| 外观       | 根元素上把 `--vis-*` 变量（坐标轴、网格、十字线、提示框、字体）指到 tokens；系列颜色是 CSS 变量；动画时长取 `durations.lg`（`themeTransition` 解析，减少动态效果时为 0）                                          |
| 色板       | 新 tokens `colors.chart1–chart8`：Radix 各色阶里能在背景上到 3:1（WCAG 图形对比度）的最浅一级；`chart1` 跟随品牌色（palette 的 ACCENT_STEPS），亮、暗、纸张三套主题都进 `themes:check`                            |
| 组件       | `BarChart`（分组 / 堆叠、竖向 / 横向、圆角）、`LineChart`（直线 / 平滑 / 阶梯、实心或空心数据点、空值断开）；`series` 的 `key` 只接受数值字段（`NumericKey<T>`）                                                  |
| Stat       | 主入口的 `Stat`（`display/Stat.tsx`）：`dl` 结构的指标名、数值（AnimatedNumber）、单位、图标、变化量（`invertChange` 用于越低越好）                                                                               |
| 文档站     | “图表”分类：统计看板示例（筛选、指标卡、两张图、明细表、导出 CSV）、BarChart、LineChart；Stat 在“展示”                                                                                                            |
| 顺带的基础 | StyleX 类型支持自定义属性（`'--x': …`，scripts/css-docs 生成）；API 表能读子路径导出的类型；`prebundle.config.ts` 加上 `@unovis/ts`                                                                               |

**Unovis 的坑**：每个 XYContainer 都插一个 id 固定为 `saturate` 的滤镜，一页多张图时 id 重复，创建后改成各自的 id（`useId`）；GroupedBar 默认给空值画 2px 的最小高度，设为 0；happy-dom 没有 SVG 的 `transform.baseVal.consolidate`，时长为 0 时不走 d3 的过渡，单元测试不受影响；绘制在动画帧里，页面在后台（标签页隐藏）时暂停，回到前台才画。

**第二期**：面积图、环形图、堆叠与分组混合、双数值轴、框选缩放、Stat 里的迷你折线、用键盘逐点浏览。

### 10.22 3D 与视觉效果（进行中）

子路径 `@vue-tsx-pro/ui/three` 封装 three（可选 peer），主入口不导入。不依赖 three 的效果（TiltCard、SpotlightCard、BorderBeam）在主入口。

| 项       | 做法                                                                                                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 生命周期 | `three/core/renderer.ts` 的 `useThree`：第一次进入视口才建渲染器；共用一个动画帧循环；滚出视口、标签页隐藏、`paused` 时停；卸载、被回收时释放几何体、材质、纹理与渲染器并 `forceContextLoss` |
| 静止     | 系统要求减少动态效果，或主题时长为 0（主题编辑器关掉动效）时只画一帧，尺寸、主题变化时重画                                                                                                   |
| 上下文   | 同时最多 8 个（`setMaxThreeContexts`）：满了回收最久没在视口里的，它回来时换一块新 canvas 重建（`generation` 作 key）；都在视口里时排队；上下文丢失三次后降级                                |
| 主题色   | `context.themeColors` / `useThemeColors`：探针元素让浏览器解析 token（color-mix、light-dark 都行），culori 转成 `THREE.Color`；换主题时按 lg 时长原地过渡，材质直接引用同一个对象            |
| 画质     | `quality`：auto / low / medium / high → 像素比上限、密度系数、抗锯齿；auto 看触屏、核数、内存、省流量                                                                                        |
| 降级     | 没有 WebGL 时显示主题色的柔和渐变（可换）；默认 `aria-hidden`，有 `aria-label` 时 `role="img"`；状态写在 `data-state`                                                                        |
| 公共片段 | `shaderChunks`：simplex 噪声、fbm、主题色板 `themePalette`；`usePointer`：指针相对元素的位置，useSpring 阻尼                                                                                 |

### 10.6 顺序

基础设施 → 主题变量的字符串写法（10.5）→ 折叠与过渡 → 布局 → 文本（含“一个元素一个组件”的拆分）→ 代码块与 Shiki（10.4）→ 虚拟滚动（10.7）→ 拖动与浮层滚动条（10.8）→ 按钮家族与交互基础设施（10.9）→ 标记、反馈与导航（10.10）→ 浮层、反馈、输入与表单（10.11）→ 选择类控件与已有组件的完善（10.12）→ 审核整理、虚拟化与表格（10.13）→ 导出、默认值、选择模型、zod 与动画（10.14）→ 动效、反馈与交互组件（10.15）→ 性能、类型与基础设施整理（10.16）→ 文档站的准备（10.17）→ 文档站的框架（10.18）→ 浮层滚动条铺开与主题编辑器（10.19）→ 代码演练场（10.20）→ 图表与统计数值（10.21），均已完成，每步单独提交。下一批：按分类迁移其余组件的示例、文档页与浏览器测试到文档站，之后是日期选择。正式组件按 §8 验收。
