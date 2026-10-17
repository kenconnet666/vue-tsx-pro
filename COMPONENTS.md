# 组件库规范（草案）

日期：2026-10-18。适用于 `@vue-tsx-pro/ui`。写法基础见 `RUNES.md`，工程规划见 `PLAN.md`。

> 状态：规划稿，尚未实现。标“待验证”的条目要在试点组件中实测后再定。

---

## 1. 组件 API 约定

| 项           | 约定                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 可绑定的状态 | 统一用 `value`（输入类）、`checked`（开关类）、`open`（弹层类），子组件用 `_bindable` 声明，父组件写 `属性={_bind(x)}`        |
| 变化回调     | 需要附带原因或细节时才提供，形如 `onOpenChange(open, { reason: 'escape' \| 'outside' \| 'trigger' })`；只是值变化时不额外提供 |
| 内容         | 默认内容用 `children`；具名内容是 JSX prop（`header`、`footer`）；需要参数的内容是渲染函数（`<List>{(item) => …}</List>`）    |
| 命令式能力   | 不用 expose；需要时由父级创建控制器对象传入（如 Dialog 的 `controller`）                                                      |
| 状态标记     | 各部件带 `data-state="open \| closed \| checked \| …"`、`data-disabled` 等，供宿主 CSS 与测试定位，组件内部样式不依赖它们     |
| 多态         | 不做通用的 `as`；个别组件按需处理（如 Button 传 `href` 时渲染为 `<a>`）                                                       |
| 禁用         | `disabled` 同时作用于交互与样式；只读用 `readonly`；加载中用 `loading`                                                        |
| 尺寸与外观   | `size`（见 §3）、`variant`（外观变体）、`sx`（外部样式覆盖）三个通用 prop                                                     |

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

### 2.3 合并规则

组件内部给部件的属性与使用方传入的属性用同一个 `mergeProps(内部, 使用方)` 合并：

| 属性                                                                                  | 规则                                                                                     |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `sx`                                                                                  | 内部在前、使用方在后；StyleX 后者覆盖前者，按 CSS 属性逐个生效                           |
| `class`                                                                               | 拼接。只给宿主留后门（例如宿主用 Tailwind）；组件内部只用 `sx`                           |
| 事件 `onXxx`                                                                          | **使用方先执行**；使用方调用了 `event.preventDefault()` 就跳过内部处理，可以完全接管交互 |
| `ref`                                                                                 | 内部与使用方都拿到元素                                                                   |
| 状态类属性（`role`、`aria-expanded`、`aria-checked`、`aria-selected`、`tabindex` 等） | 以内部为准，并在类型上去掉，避免意外破坏无障碍语义                                       |
| 静态属性（`id`、`aria-label`、`title`、`data-*` 等）                                  | 以使用方为准                                                                             |

## 3. 尺寸：字号 + em

- 组件根元素决定字号，**内部所有尺寸用 em**：内边距、间距、高度、圆角、图标（`1em`），整体等比缩放。
- **默认继承上下文字号**；`size` 只用来覆盖，取值为预设档位（`'sm' | 'md' | 'lg'`，由主题定义对应字号）或具体数值。
- 只有组件根元素设字号，内部部件不再改字号，避免 em 层层嵌套后越缩越小；部件需要不同字号时用主题里的比例变量。
- 例外用 px：边框宽度、焦点环宽度、分隔线。
- 可点击区域不小于 24px（WCAG 2.5.8）：如 `min-height: max(2em, 24px)`。
- 行高不带单位。

## 4. 样式

- 每个组件文件顶部一个 `stylex.create`，按布局、尺寸、文字、外观、状态分组。
- 颜色、圆角、字体、阴影、动效只来自主题 tokens（§6.2），组件里不写裸值。
- 使用方的覆盖只走 `sx`（组件级）与 `propsXxx.sx`（部件级）。
- 尊重 `prefers-reduced-motion`；焦点样式用 `:focus-visible`；方向相关的属性一律用逻辑属性（`paddingInline`、`marginBlockStart`），支持从右到左排版。

## 5. 无障碍与交互

- 每个组件按 WAI-ARIA Authoring Practices 的对应模式实现：角色、状态属性、键盘操作，文档里列出键盘映射。
- 关联 id 用 Vue 3.5 的 `useId()` 生成；使用方传了 `id` 时以使用方为准。
- 中文输入法：输入类组件在 `compositionstart`/`compositionend` 之间不触发校验、搜索与格式化。
- 弹层优先用原生 Popover API 与 `<dialog>`（处在浏览器最顶层、Esc、焦点恢复），floating-ui 只负责定位。另有一个弹层栈：Esc 只关最上层；点击外部关闭能识别嵌套弹层；打开模态时锁定滚动、其余内容设 `inert`。

---

## 6. Provider：主题与地区配置

### 6.1 两种用法

```tsx
// 宿主入口（普通 TS）：应用级配置，所有 TSX 页面共享，不用逐页包裹
app.use(createUi({ theme: lightTheme, locale: zhCN }));

// TSX 页面或局部：覆盖上层配置，可以嵌套
<Provider theme={darkTheme} locale={{ timeZone: 'America/New_York' }}>
  <Report />
</Provider>;
```

- 嵌套时**按字段合并**：内层只写要改的部分，其余继承外层。
- 没有任何配置时，组件使用内置默认值（`zhCN` + `lightTheme`），单独使用也能工作。
- 配置是响应式的：切换主题、语言、时区，已渲染的组件立即更新。

### 6.2 主题 `theme`

主题是一组设计 tokens：

| 分组 | 内容                                                                         |
| ---- | ---------------------------------------------------------------------------- |
| 颜色 | 中性色与品牌色色阶、语义色（成功、警告、危险、信息）、文字、边框、背景、遮罩 |
| 字号 | 基准字号，以及 `sm` / `md` / `lg` 档位与部件字号比例                         |
| 形状 | 圆角档位（em）                                                               |
| 字体 | 字体族、字重                                                                 |
| 阴影 | 浮层阴影档位                                                                 |
| 动效 | 时长、缓动曲线                                                               |

- 实现：tokens 用 StyleX `defineVars` 定义；内置主题（`lightTheme`、`darkTheme`）用 `createTheme` 在编译期生成，运行时没有开销。
- 自定义主题：`defineTheme(lightTheme, { colors: { brand: … } })` 基于已有主题局部修改；运行时把差异写成 CSS 变量。**待验证**：StyleX 能否在运行时给 `defineVars` 的变量赋动态值，不能的话改为在 Provider 的容器元素上直接设置变量。
- 跟随系统：`theme={{ light: lightTheme, dark: darkTheme }}` 按 `prefers-color-scheme` 切换；宿主自己控制明暗时，直接传当前主题即可（响应式）。
- 作用范围：Provider 渲染一个不产生盒子的容器（`display: contents`），主题变量挂在它上面，只影响内部；应用级配置挂在页面根元素上。变量名经过 StyleX 哈希，不会和宿主冲突。
- 色板基础：候选 Radix Colors 的 12 阶色阶（明暗两套、对比度有设计保证），写入 tokens 时转成静态值。

### 6.3 地区 `locale`：地区、时间、多语言放在一个对象里

```ts
interface Locale {
  /** BCP 47 语言标签，决定 Intl 格式化规则与默认文案，如 'zh-CN' */
  code: string;
  /** 文字方向 */
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
  /** 组件文案，按组件分组；需要插值的文案写成函数，类型安全，不需要解析模板语法 */
  messages: Messages;
}

// 文案示例
const messages = {
  common: { confirm: '确定', cancel: '取消', clear: '清空', loading: '加载中' },
  select: { empty: '没有选项', placeholder: '请选择' },
  pagination: { total: (n: number) => `共 ${n} 条` },
  form: { required: (label: string) => `请填写${label}` },
};
```

- 预设：`zhCN`、`enUS` 等，每种语言一个单独入口（`@vue-tsx-pro/ui/locale/zh-CN`），按需引入。
- 局部修改：`defineLocale(zhCN, { messages: { select: { empty: '暂无数据' } } })` 深度合并，不用手写多层展开。
- 组件里通过 `useLocale()` 读取；格式化统一用 `useFormat()`：数字与金额（`Intl.NumberFormat`，精确运算用 decimal.js）、日期时间（`@internationalized/date` 的 `DateFormatter`，自动带上时区与日历），格式化器按地区缓存。
- 一周第一天、小时制等地区惯例由 `@internationalized/date` 提供，不依赖各浏览器对 `Intl.Locale` 新接口的支持程度。

### 6.4 Provider 的其他配置

| 配置      | 说明                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `overlay` | 弹层的挂载容器与层级基准；用原生最顶层时一般不需要，宿主有自己的弹层体系时用来协调 |

尺寸基准属于主题（基准字号），不单独设配置项。

---

## 7. 实施范围与顺序

**本轮只做组件库的基础设施**；正式组件暂不纳入规划。为了提前扫清障碍，在宿主示例 `apps/host-demo` 里写几个**试点组件**：它们按本规范写，但只是页面内的组件，不进 `@vue-tsx-pro/ui`，也不承诺 API；发现的问题回到规范或基础设施里解决。

| 阶段 | 位置             | 内容                                                                                 | 要扫清的障碍                                                 |
| ---- | ---------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 1    | `packages/ui`    | tokens、`lightTheme` / `darkTheme`、`defineTheme`                                    | StyleX 运行时主题变量能否赋动态值（§6.2 待验证）             |
| 2    | `packages/ui`    | `Provider`、`createUi`、`zhCN` / `enUS`、`defineLocale`、`useLocale` / `useFormat`   | 嵌套合并、响应式切换、应用级与局部配置并存                   |
| 3    | `packages/ui`    | `mergeProps`、部件 props 类型                                                        | 事件先后与 `preventDefault`、类型上去掉受管属性              |
| 4    | `apps/host-demo` | 试点 Icon、Button                                                                    | em 尺寸、部件透传、`href` 渲染为链接、`class` 后门           |
| 5    | `apps/host-demo` | 试点 TextField                                                                       | 主元素透传、输入法、部件 props 的类型提示                    |
| 6    | `apps/host-demo` | 试点 Popover                                                                         | 原生 popover + floating-ui、弹层栈、焦点恢复、与宿主弹层共存 |
| 7    | 仓库             | Vitest 浏览器模式 + Playwright + axe-core；宿主示例接入 `createUi` 与局部 `Provider` | 浏览器测试链路在 Windows 与 CI 上可用                        |

试点结束时产出一份结论：规范要改的地方、基础设施缺的能力、正式组件的完成标准（§8）是否可行。

## 8. 正式组件的完成标准（供之后使用）

1. API 符合 §1、§2，部件名与键盘映射写进文档。
2. 运行时测试（Vitest + happy-dom）覆盖受控、只传值、不传三种用法。
3. 浏览器测试（Vitest 浏览器模式 + Playwright）覆盖键盘、焦点、输入法；axe-core 无违规。
4. 类型测试：部件 props、`_bind` 的类型约束。
5. 文档页：演示、部件列表、props 表（从 TS 类型生成）、键盘映射。
6. 在宿主示例里能用；明暗主题、两种语言下截图核对。
