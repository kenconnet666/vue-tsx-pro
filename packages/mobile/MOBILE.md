# 移动端组件库规范

适用于 `@zerodep-dev/vue-tsx-pro-mobile`：以移动 Web（H5）为主，同一套组件经 `@zerodep-dev/vue-tsx-pro-mini` 跑在微信、支付宝小程序里。
写法基础见 [RUNES.md](../tsx/RUNES.md)，路线与进度见 [ROADMAP.md](../../ROADMAP.md) 的阶段 17，小程序运行时的做法与踩过的坑见 [packages/mini/README.md](../mini/README.md)。

与桌面组件库（`-ui`）的关系：同一个设计语言（配色取自同一套 Radix 色板、API 约定一致），但代码独立——只依赖 vue 与 `-tsx`，
不导入 `-ui`，也不从 `-ui` 抽公共部分（`pnpm layers:check` 检查）。

---

## 1. API 约定

| 项           | 约定                                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 可绑定的状态 | `_value`（输入类）、`_checked`（开关类）、`_open`（弹层类），子组件用 `_bindable` 声明，父组件写 `_value={x}`                                        |
| 内容         | 默认内容用 `children`；具名内容是 JSX prop（`title`、`description`、`footer`）；与原生属性重名的（`title`、`lang`）在部件属性类型里去掉              |
| 外观档位     | `variant`（样式）、`tone`（色调）、`size`（尺寸：xs / sm / md / lg，对应 24 / 32 / 44 / 50 px 高）、`radius`（圆角）；共用的档位在 `utils/scales.ts` |
| variant 词表 | 同桌面组件库：`solid` 实底、`soft` 浅色底、`outline` 描边、`ghost` 无底无边（按下时才有底）                                                          |
| 禁用与加载   | `disabled` 同时作用于交互与样式；`loading` 拦下点击（使用方的回调不调用）但不设 disabled，保持外观与焦点，读屏得知 `aria-busy`                       |
| 状态标记     | 状态写成主元素上的 `data-*`（`data-disabled`、`data-loading`、`data-status`），组件自己的状态样式按它取，使用方的 `sx` 也能按它定制                  |
| 注释         | 导出的组件、prop、类型、函数都写 JSDoc；枚举类取值写成带注释接口的 `keyof`（`variant?: keyof ButtonVariants`）                                       |

## 2. 部件与透传

规则同桌面组件库（COMPONENTS.md §2），实现在 `utils/props.ts`：

- 组件上未声明的属性落到**主元素**（承载语义与点击的那个）；每个内部节点都是部件，有自己的 `propsXxx`（`propsContent`、`propsIcon`）。
- 合并：`sx` 与 `class` 按"组件默认、使用方、受管"排成数组；事件**使用方先执行**，调用了 `preventDefault()` 就跳过组件自己的；
  受管属性（`role`、`aria-*` 状态、`disabled`）以组件为准，并在类型上去掉。
- 小程序里没有 `Event` 全局：取消与否看事件对象上的 `defaultPrevented`，不用 `instanceof Event`。

## 3. 尺寸

- 组件根元素决定字号，**内部尺寸用 em**（内边距、间距、高度、圆角、图标 `1em`），整体随字号缩放。
- 字号按 375 宽的设计稿：正文 14、按钮 16、标题 16–20；边框宽度用 px，单元格分隔线用 0.5px 的细线（`_hairline`）。
- 触控目标不小于 44px 的控件用 `md` 及以上；`xs` / `sm` 只用在行内、卡片里的次要操作。

## 4. 样式

样式由运行时引擎生成（`css.create`、`css.recipe`，写法同桌面组件库），值直接写主题 token（`'_accent'`、`'_md'`），
不加色调变量这类间接层。token 定义在 `theme/tokens.ts`（变量前缀 `--vtm-`），暗色主题与"跟随系统"在 `theme/dark.ts`。

小程序不能在运行时插样式规则：渲染运行时把组合类按节点状态**展开成行内样式**。所以条件只能用运行时判定得了的那些
（`pnpm layers:check` 里的 `mobile-rules.mjs` 检查）：

| 可以用                                                                                       | 不能用（小程序里展开不了）                                                 |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 状态别名：`_active`、`_disabled`、`_selected`、`_checked`、`_pressed`、`_expanded`、`_open`… | `:hover`、`:focus`、`:focus-visible`（触屏没有悬停；焦点环只在 H5 有意义） |
| 属性选择器条件：`'[data-loading]'`、`'[data-status="error"]'`，以及 `:not(…)`、`:is(…)`      | 伪元素 `::before`、`::after`、`::placeholder`                              |
| 结构伪类：`:first-child`、`:last-child`、`:only-child`（只数元素兄弟）                       | 其他结构伪类（`:nth-child`、`:empty`）、兄弟与后代组合符                   |
| `:active`（按压反馈，运行时按 touchstart / touchend 判定）                                   |                                                                            |
| `@media` 宽度条件；`_reducedMotion`（小程序里不成立，H5 照常）                               | 其他 `@media` 能力                                                         |

- 需要"线"的地方不用伪元素：单元格分隔线是底边的 `linear-gradient` 背景（`:last-child` 时去掉），见 `display/Cell.tsx`。
- 按压反馈统一用 `:active` / `_active`，禁用时不加：`':active:not([data-disabled])'`。
- 动效：CSS 过渡与关键帧（关键帧在构建时收集进小程序的 app 样式表）；尊重 `prefers-reduced-motion`。

## 5. 平台能力：宿主约定

组件不直接碰 DOM 与 `window`，平台能力都经 `useHost()`（`utils/host.ts`）：测量（异步）、窗口大小、页面滚动、等下一帧画完、锁滚动、浮层根、
震动、剪贴板、选图。H5 用这里的 Web 实现；小程序由渲染运行时在每个页面的应用上 provide 自己的实现，两边约定同一个
`Symbol.for('vue-tsx-pro.host')`，互不导入。

- 测量在小程序里只能异步：需要尺寸的组件（浮层定位、滑块、吸顶）按 `await host.measure(元素)` 写。
- 安全区用 CSS 的 `env(safe-area-inset-bottom)`，两端都支持，不经宿主。
- 不直接用 `requestAnimationFrame`：微信的逻辑层里它不可用，而且逻辑层的一帧不代表视图层画好了。进场动画经 `host.nextFrame`（`utils/presence.ts`）。

## 6. 元素与浮层

- **元素**只用 `div`、`span`、`button`、`img`、`input`、`textarea`、`svg`（运行时按标签选小程序模板；图标的 svg 画成遮罩）。
  `button` 的默认显示方式是行内块，`span` 等是行内（运行时补上浏览器的默认值）。
- **滚动锁**：遮罩节点写 `data-scroll-lock`，小程序里换成 catch 掉 touchmove 的模板；H5 由 `host.lockScroll()` 锁 body。
- **手势**：要收 touchmove 的节点写 `data-touch-move`（普通节点不绑 touchmove，滚动时不往逻辑层发事件）。
- **浮层**：Teleport 到 `host.overlayRoot()`（H5 是 body，小程序是页面根节点下的浮层节点），层级写字面量：吸顶 100、导航栏与标签栏 1000、回到顶部 1500、弹出层 2000、轻提示与通知 3000（zIndex 的类型不收 var()，也没有主题化的需要）；
  不用原生 popover / dialog（小程序没有顶层）。

## 7. 事件

- 点击用 `onClick`（小程序的 tap 转成 click，冒泡由运行时按节点树做）；按压、手势用 `onTouchstart` / `onTouchmove` / `onTouchend`；
  不用 pointer 事件。
- 浏览器不给禁用的表单控件派发 click，运行时照做；组件里不必再判断。

## 8. 无障碍

- H5 按 WAI-ARIA 的对应模式写角色与状态；可点击的非按钮元素给 `role="button"`。
- 装饰性的图标 `aria-hidden`，有名称的图标 `role="img"` + `aria-label`；关闭、清除这类只有图标的按钮用语言包里的名称。

## 9. 完成标准

一个组件算完成：API 对照 Vant 4、NutUI、TDesign Mobile、antd-mobile 取舍过（写在 §11）；三端（H5、微信、支付宝）截图一致；
有单测（H5，happy-dom）与小程序渲染测试（`@zerodep-dev/vue-tsx-pro-mini/testing` 的 `mountPage`）；亮暗两套主题都看过；演示页示例饱满。
靠排版与真实触摸的行为（浮层贴边、滑动按量出的尺寸停住、滚轮按行高对齐）放在 `apps/mobile-demo/test/*.browser.test.tsx`
（Chromium 与 WebKit，手机视口、触摸屏，`pnpm --filter @vue-tsx-pro/mobile-demo test:browser`）。
截图：`apps/mobile-demo` 里 `node screenshots.ts [h5|wx]`（H5 用 Playwright，微信用开发者工具的 wechatide CLI；支付宝手动截）。

## 10. 已知限制

- token 短写（`'_md'`）是全局登记的：同一个页面里不要同时用桌面组件库与移动端组件库（后登记的一套为准）。
  文档站的移动端示例放在手机外框的 iframe 里，天然隔开。
- 小程序里拿不到同步的布局信息；`getBoundingClientRect` 返回零值，要尺寸时用宿主的异步测量。

## 11. 各组件的取舍

- **Button**：样式 × 色调 × 尺寸 × 圆角写在一个配方里，色调与样式的组合逐项写 token（不经变量）；按下变深一档；`loading` 用 `loadingText` 换文字。
- **Cell / CellGroup**：标题、说明、值、图标、箭头；有 `onClick` 或箭头时自动可点击（`role="button"`）；`inset` 是浮在灰底上的圆角卡片。
- **Tag**：`closable` 的关闭按钮阻止冒泡（标签常放在可点击的单元格里）。
- **Badge**：内容是 0 时默认隐藏（`showZero`），`max` 截断成 `99+`；没有子内容时单独显示。
- **Image**：`fit` 同 object-fit，小程序里换成 image 的 `mode`；加载中与失败各有占位。

- **Overlay / Popup / ActionSheet / Dialog**：渲染到宿主的浮层根；进场等宿主的 `nextFrame`；关闭原因（遮罩、关闭按钮、选中、取消）随 `onOpenChange` 给出；命令式的 `showDialog` 返回 Promise。
- **Toast / Notify**：命令式为主，同一时间一个、后一个替换前一个；出口在最外层的 ConfigProvider 里。
- **SwipeCell / PullRefresh / Slider**：只接管自己方向的手势（H5 靠 `touch-action`，小程序拖动期间把 touchmove 换成 catch），竖滑照常滚动页面。
- **Form / FormItem / Field**：不渲染原生 form（小程序没有）：Form 认出 `type="submit"` 的按钮与输入框里的确认键；
  规则是 `{ required, pattern, validator, message, trigger }`，校验器可以是异步的；值变了时已报错的项整个重查，改对了消息就消失。
  输入框之外的控件放进 FormItem（`name` + `value` 参与提交与校验）。
- **Field**：数字用文本框加 `inputmode`（不出现上下箭头）；拼音组字中不写回；清除按钮在聚焦时出现，失焦稍后才藏（小程序里点它会先失焦）。
- **Checkbox / Radio**：同一套外观（圆框里打勾，`shape="square"` 是方框），按钮元素加 `role`；组的 `max` 选满后其余禁用。
- **Stepper**：按住连续加减；输入的数失焦时按范围与小数位修正。**Rate** 可半颗、可在星上滑动，再点当前分数清零。
- **Uploader**：只管选图与展示，上传在 `onRead` 里做；文件对象是响应式的，改 `status` 显示上传中、失败。

- **Picker**：滚轮拖动带惯性、松手对齐、跳过禁用项；columns 一种写法三种用途（一列、几列、选项带 children 的联动），联动时上一级变了下一级回到第一个可选的。
  DatePicker、TimePicker 建在它上面（换月份时日子按天数修正）。放进底部的 Popup 用，不自带弹出层。
- **Cascader**：一级级的标签加选项列表（同 Vant），选到没有下一级的项时完成；Calendar 的选择过程在组件里，确认才写回。
- **DropdownMenu**：展开的面板与遮罩渲染到浮层根，从菜单这一排的下沿开始（宿主测量），遮罩只盖下面。
- **省市区**：单独的子路径 `-mobile/area`（约 100 KB），数据取自 @vant/area-data（MIT），直辖市补上市一级。
