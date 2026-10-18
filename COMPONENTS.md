# 组件库规范

适用于 `@vue-tsx-pro/ui`。写法基础见 [RUNES.md](RUNES.md)，工程规划见 [PLAN.md](PLAN.md)。

> 状态：基础设施与试点已完成，正式组件尚未开始（§7）。

---

## 1. 组件 API 约定

| 项           | 约定                                                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 可绑定的状态 | 统一用 `value`（输入类）、`checked`（开关类）、`open`（弹层类），子组件用 `_bindable` 声明，父组件写 `属性={_bind(x)}`                                                |
| 变化回调     | 需要附带原因或细节时才提供，形如 `onOpenChange(open, { reason: 'escape' \| 'outside' \| 'trigger' })`；只是值变化时不额外提供                                         |
| 内容         | 默认内容用 `children`；具名内容是 JSX prop（`header`、`footer`）；需要参数的内容是渲染函数（`<List>{(item) => …}</List>`）                                            |
| 命令式能力   | 不用 expose：父级用组合式函数创建控制器对象（状态 + 方法）传入，如 `const form = useForm()` → `<Form controller={form}>`，两边用同一份数据（[RUNES.md](RUNES.md) §7） |
| 状态标记     | 各部件带 `data-state="open \| closed \| checked \| …"`、`data-disabled` 等，供宿主 CSS 与测试定位，组件内部样式不依赖它们                                             |
| 多态         | 不做通用的 `as`；个别组件按需处理（如 Button 传 `href` 时渲染为 `<a>`）                                                                                               |
| 禁用         | `disabled` 同时作用于交互与样式；只读用 `readonly`；加载中用 `loading`                                                                                                |
| 尺寸与外观   | `size`（见 §3）、`variant`（外观变体）、`sx`（外部样式覆盖）三个通用 prop                                                                                             |

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

输入 `props` 时，所有部件的配置在补全列表里排在一起；也不会和内容类 prop 撞名（`icon` 是图标内容，`propsIcon` 是图标节点的属性）。

### 2.2 部件 props 的类型

- 原生元素部件：该元素的属性类型 + `sx`，去掉组件内部管理的属性（见 §2.3），形如 `PartProps<'input', 'value' | 'aria-invalid'>`。
- 本库组件部件：该组件的 props（全部可选），形如 `Partial<IconProps>`。
- 部件 props 不能改内容：`children` 不在部件 props 里，内容走组件自己的 prop。
- 组件 props 接口 `extends PartProps<'主元素', 受管属性>`，`...rest` 才有补全与类型检查。

### 2.3 合并规则

组件内部给部件的属性与使用方传入的属性用同一个 `mergeProps(内部, 使用方)` 合并：

| 属性                                                                                  | 规则                                                                                                                         |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `sx`                                                                                  | 内部在前、使用方在后；StyleX 后者覆盖前者，按 CSS 属性逐个生效                                                               |
| `class`                                                                               | 依次排列成数组交给 Vue 处理（可能是字符串、数组或对象）。只给宿主留后门（例如宿主用 Tailwind）；组件内部只用 `sx`            |
| 事件 `onXxx`                                                                          | **使用方先执行**；使用方调用了 `event.preventDefault()` 就跳过内部处理，可以完全接管交互。组件不可用时先拿掉使用方的交互回调 |
| `ref`                                                                                 | 内部与使用方都拿到元素                                                                                                       |
| 状态类属性（`role`、`aria-expanded`、`aria-checked`、`aria-selected`、`tabindex` 等） | 以内部为准，并在类型上去掉，避免意外破坏无障碍语义                                                                           |
| 静态属性（`id`、`aria-label`、`title`、`data-*` 等）                                  | 以使用方为准                                                                                                                 |

## 3. 尺寸：字号 + em

- 组件根元素决定字号，**内部所有尺寸用 em**：内边距、间距、高度、圆角、图标（`1em`），整体等比缩放。
- **默认继承上下文字号**；`size` 只用来覆盖，取值为五档 `'xs' | 'sm' | 'md' | 'lg' | 'xl'`（对应主题的 `fontSizes` 同名档位）或具体像素数字。
- 只有组件根元素设字号，内部部件不再改字号，避免 em 层层嵌套后越缩越小；部件需要不同字号时用主题里的比例变量。
- 例外用 px：边框宽度、焦点环宽度、分隔线。
- 可点击区域不小于 24px（WCAG 2.5.8）：如 `min-height: max(2em, 24px)`。
- 行高不带单位。

## 4. 样式

- 每个组件文件顶部一个 `stylex.create`，按布局、尺寸、文字、外观、状态分组。
- 颜色、字体、间距、圆角、阴影、动效只来自主题 tokens（§6.2），组件里不写裸值。
- 使用方的覆盖只走 `sx`（组件级）与 `propsXxx.sx`（部件级）。
- 尊重 `prefers-reduced-motion`；焦点样式用 `:focus-visible`；方向相关的属性一律用逻辑属性（`paddingInline`、`marginBlockStart`），支持从右到左排版。
- 含动态样式函数的 `stylex.create` 单独写一个：它走另一个类型签名，组内属性没有中文悬停提示。
- 标签名来自数据时（如图标的 path、circle）TSX 没有属性类型，用 Vue 的 `h()` 渲染。

## 5. 无障碍与交互

- 每个组件按 WAI-ARIA Authoring Practices 的对应模式实现：角色、状态属性、键盘操作，文档里列出键盘映射。
- 关联 id 用 Vue 3.5 的 `useId()` 生成；使用方传了 `id` 时以使用方为准。
- 中文输入法：输入类组件在 `compositionstart`/`compositionend` 之间不触发校验、搜索与格式化。
- 弹层类组件的触发器用渲染函数 `trigger={(props) => <Button {...props} />}`；`ref` 落在组件上拿到的是实例，由组件解析成根元素（`$el`）。
- 弹层优先用原生 Popover API 与 `<dialog>`（处在浏览器最顶层、Esc、焦点恢复），floating-ui 只负责定位。另有一个弹层栈：Esc 只关最上层；点击外部关闭能识别嵌套弹层；打开模态时锁定滚动、其余内容设 `inert`。

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

| 组            | 档位                                                                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors`      | 语义命名，不分档：背景与表面、中性填充（常态/悬停/按下）、文字四级、边框三级、品牌色与危险色（实色/悬停/实色上的文字/文字/浅底/浅底悬停/边框）、成功/警告/信息（文字/浅底/边框）、反色表面、焦点环、遮罩 |
| `fonts`       | `sans`、`mono`                                                                                                                                                                                           |
| `fontSizes`   | `xs`–`xl`（12/13/14/16/18px，界面文字与组件 size 档位）、`xxl`、`xxxl`（标题）                                                                                                                           |
| `fontWeights` | `light`、`normal`、`medium`、`semibold`、`bold`                                                                                                                                                          |
| `lineHeights` | `none`、`tight`、`snug`、`normal`、`relaxed`（不带单位）                                                                                                                                                 |
| `space`       | `none`、`xs`–`xl`（0.25/0.5/0.75/1/1.5em）                                                                                                                                                               |
| `radii`       | `none`、`xs`–`xl`（em）、`full`；整体改直角或更圆时覆盖这一组                                                                                                                                            |
| `shadows`     | `none`、`xs`–`xl`（Radix Themes 第 2–6 级，暗色主题另有一套）                                                                                                                                            |
| `durations`   | `none`、`xs`–`xl`（75/120/200/300/500ms）                                                                                                                                                                |
| `easings`     | `standard`、`enter`、`exit`                                                                                                                                                                              |
| `controls`    | 单行控件高度、最小可点击尺寸、边框宽度、焦点环宽度与间隔、不可用的不透明度、图标线宽                                                                                                                     |

- 分档规则：一般 `xs`–`xl` 五档，需要时加 `none`（去掉）与 `full`（全圆）；用法是 `组.档位`，如 `space.md`、`radii.full`。
- 不设 z-index：弹出层、对话框用原生 popover / dialog，在顶层（top layer）渲染。不设断点：StyleX 的媒体查询不能引用变量，组件优先用容器查询。
- 主题文件：`theme.ts`（类型、`defineTheme`）、`light.ts`（默认，即 tokens 的默认值）、`dark.ts`（覆盖颜色与阴影）。
- 实现：tokens 用 StyleX `defineVars` 定义；内置主题（`lightTheme`、`darkTheme`）用 `createTheme` 在编译期生成，运行时没有开销。
- 自定义主题：`defineTheme(lightTheme, { colors: { brand: … } })` 基于已有主题局部修改；运行时把差异写成 CSS 变量，设在 Provider 的容器上（编译后的 token 在运行时是 `var(--x…)`，取出变量名即可覆盖），应用级配置则设在页面根元素上。
- 跟随系统：`theme={{ light: lightTheme, dark: darkTheme }}` 按 `prefers-color-scheme` 切换；宿主自己控制明暗时，直接传当前主题即可（响应式）。
- 作用范围：Provider 渲染一个不产生盒子的容器（`display: contents`），主题变量挂在它上面，只影响内部；应用级配置挂在页面根元素上。变量名经过 StyleX 哈希，不会和宿主冲突。
- 色板：Radix Colors（slate 中性色、indigo 品牌色，红/绿/琥珀表示危险/成功/警告），按 Radix 12 级的用途约定映射到语义 token（1–3 背景与表面，4 悬停，7–8 边框，9–10 实色，11–12 文字）。StyleX 要求取值是字面量，色值写死在 tokens 里，`packages/ui/test/palette.test.ts` 对照 `@radix-ui/colors`（开发依赖）校验。唯一偏离：焦点环用 9 级而不是 Radix 建议的 7–8 级，因为亮色下后者对比度不到 3:1。

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

**已完成的基础设施**（`packages/ui`、`packages/tsx/src/stylex`）：StyleX 类型入口与注释数据、tokens 与明暗主题、Provider / createUi、语言与 useFormat、mergeProps 与部件类型。

**试点组件**（`apps/host-demo/src/pilot`：Icon、Button、TextField、Popover）按本规范写，但不进组件库、不承诺 API。真实 Chromium 中已验证：em 尺寸缩放、部件与主元素透传、受控 `_bind`、Provider 嵌套与切换、原生 popover + floating-ui 定位与焦点进出、中文输入法、axe 无违规。

**StyleX 相关的坑**（已在基础设施里解决，写新代码时仍要知道）：

- StyleX 只认以 `.stylex` 结尾的导入路径，所以 tokens 从 `@vue-tsx-pro/ui/tokens.stylex` 导入，主入口不导出。
- 变量名按“包名:文件路径”算哈希；预设用自定义模块解析，把 `src/` 与 `dist/` 下的同一模块规范成同一个名字。
- 组件库构建保留源码文件结构（`preserveModules`），`*.stylex.ts` 不能被打进 index.js。

**依赖**：算法与数据用成熟库，组件自己写；不用无样式组件库（它们本身就是组件逻辑）。构建时全部外置，`packages/ui/test/dependencies.test.ts` 逐一验证。使用方直接导入的（图标）是 peer 依赖，其余是普通依赖。

| 用途     | 选择                                | 说明                                                       |
| -------- | ----------------------------------- | ---------------------------------------------------------- |
| 浮层定位 | `@floating-ui/dom`                  | 只算位置；弹层本身用原生 Popover API / `<dialog>`          |
| 图标     | `@lucide/icons`（peer，使用方安装） | 只有图标数据，按名导入可摇树；渲染用 `Icon`（`base/Icon`） |
| 日期     | `@internationalized/date`           | 日历运算、时区、地区周起始日、非公历                       |
| 精确数字 | `decimal.js`                        | 数字输入、金额                                             |
| 焦点     | `tabbable`                          | 找出可聚焦元素；焦点陷阱自己写，配合原生 `inert`           |
| 校验     | `@standard-schema/spec`（接口）     | 表单只依赖接口，使用方可选 zod、valibot 等                 |
| 色板     | `@radix-ui/colors`（开发依赖）      | 只用于校验 tokens 取值                                     |
| 虚拟滚动 | 自己实现                            | 参考 `@tanstack/virtual-core` 的算法                       |

**待办**：

- 公共的 `toElement`（组件实例 → 根元素）、弹层栈（嵌套弹层与模态的 Esc 顺序、滚动锁定、`inert`）、模态焦点陷阱。
- 发布产物验证 `tests/consumer`：确认 dist 下的 `*.stylex.js` 与规范化哈希在使用方也成立。
- 文档页的 props 表生成；浏览器测试按需加入 Firefox、WebKit。

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
