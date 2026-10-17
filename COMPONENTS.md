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

## 7. 实施范围与顺序

**本轮只做组件库的基础设施**；正式组件暂不纳入规划。为了提前扫清障碍，在宿主示例 `apps/host-demo` 里写几个**试点组件**：按本规范写，但只是页面内的组件，不进 `@vue-tsx-pro/ui`，也不承诺 API；发现的问题回到规范或基础设施里解决。

| 阶段 | 位置             | 内容                                                                                   | 要扫清的障碍                                                                        |
| ---- | ---------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1    | `packages/tsx`   | StyleX 类型入口 `@vue-tsx-pro/tsx/stylex` 与注释数据（§9）                             | `importSources` 能否识别新入口；注释覆盖层与原版类型一致                            |
| 2    | `packages/ui`    | tokens（带注释）、`lightTheme` / `darkTheme`、`defineTheme`                            | StyleX 运行时能否给主题变量赋动态值（§6.2 待验证）                                  |
| 3    | `packages/ui`    | `Provider`、`createUi`、`Lang`、`zhCN` / `enUS`、`defineLang`、`useLang` / `useFormat` | 嵌套合并、响应式切换、应用级与局部配置并存                                          |
| 4    | `packages/ui`    | `mergeProps`、部件 props 类型                                                          | 事件先后与 `preventDefault`、类型上去掉受管属性                                     |
| 5    | `apps/host-demo` | 试点 Icon、Button、TextField、Popover                                                  | em 尺寸、部件透传、主元素透传、输入法、原生 popover + floating-ui、弹层栈与焦点恢复 |
| 6    | 仓库             | Vitest 浏览器模式 + Playwright + axe-core；宿主示例接入 `createUi` 与局部 `Provider`   | 浏览器测试链路在 Windows 与 CI 上可用                                               |

### 7.1 实施结果（2026-10-18）

阶段 1～6 已完成：StyleX 类型入口与注释数据、tokens 与明暗主题、Provider / createUi / Lang / useFormat、mergeProps 与部件类型、宿主示例里的试点组件（Icon、Button、TextField、Popover，`apps/host-demo/src/pilot`）、Vitest 浏览器模式 + Playwright + axe-core。

### 7.2 试点结论

**已验证可行**（真实 Chromium 中有自动化测试）：

- em 尺寸：根元素定字号、内部全用 em，`size` 档位与继承上下文字号都等比缩放，图标 `1em` 跟随。
- 部件透传：`propsIcon`、`propsRoot`、`propsClear` 落到对应部件；`...rest` 落到主元素（TextField 的 input）。
- 受控 `_bind` 与 `_bindable`；Provider 嵌套合并与页面内切换主题、语言；`createUi` 应用级配置。
- 弹层：原生 `popover="auto"` 自带 Esc 与点击外部关闭（把结果写回 `open` 即可），floating-ui 只负责定位；打开时用 tabbable 把焦点移入，关闭后焦点回到触发器。
- 中文输入法：`_bind` 编译为 v-model，组合输入期间不写回、结束才写回。
- axe-core 对试点页面没有违规。

**试点暴露、已在基础设施里解决的问题**：

1. **StyleX 只认以 `.stylex` 结尾的导入路径**：主入口再导出的 tokens 不能用在 `stylex.create` 里。tokens 改为从 `@vue-tsx-pro/ui/tokens.stylex` 导入，主入口不再导出。
2. **StyleX 的变量名与“从源码还是产物编译”有关**：它按“包名:文件路径”算哈希，仓库内编译源码、解析导入却找到 dist，颜色全部失效。预设改用 custom 模块解析，把 `src/` 与 `dist/` 下的同一模块规范成同一个名字。
3. **组件库构建会把 `*.stylex.ts` 打包进 index.js**，使用方编译时 StyleX 不再认得：构建改为保留源码文件结构（`preserveModules`）。
4. **禁用状态与“使用方事件先执行”冲突**：禁用的链接按钮（没有原生 disabled）仍会触发使用方回调。规则补充：组件不可用时先拿掉使用方的交互回调。
5. `useLang()` 的转发对象展开为空：补齐 Proxy 的 `ownKeys` 等陷阱。

**规范要补充的地方**：

- **主元素的属性类型**：组件 props 接口要 `extends PartProps<'主元素', 受管属性>`，`...rest` 才有补全与类型检查。
- **触发器与 ref**：把 `ref` 交给组件时拿到的是组件实例，需要取 `$el`。弹层类组件的触发器统一用渲染函数 `trigger={(props) => <Button {...props} />}`，由组件把实例解析成元素（Popover 里的 `toElement`）；正式组件库应把它做成公共工具。
- **Provider 不画背景**：它不产生盒子，主题区域需要自己用 `colors.background` 铺底色。
- **动态标签**：标签名来自数据（如图标的 path、circle）时类型上只是 `string`，TSX 没有属性类型，用 Vue 的 `h()` 渲染。
- **动态样式单独写一个 create**：含动态样式函数的 create 走第二个类型签名，组内属性没有中文悬停提示。

**基础设施还缺的**：

- 公共的 `toElement`（实例 → 元素）、弹层栈（嵌套弹层与模态的 Esc 顺序、滚动锁定、`inert`）、焦点陷阱（模态对话框）。
- 发布产物验证（`tests/consumer`）：用 `pnpm pack` 的产物在独立应用里编译 StyleX，确认 dist 下的 `*.stylex.js` 与规范化哈希在使用方也成立。
- 浏览器测试目前只有 Chromium；Firefox、WebKit 可在需要时加入 `instances`。

**完成标准（§8）是否可行**：可行。运行时测试、浏览器测试（键盘、焦点、输入法、axe）、类型测试都已有可复用的写法；文档页的 props 表生成尚未实现。

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
- `DocumentedStyles` 由脚本生成：属性集合读自 StyleX 的 `StyleXCSSTypes.d.ts`；每个属性的值类型用索引访问**直接引用 StyleX 自己的类型**，语义不变；每个属性带中文 JSDoc；伪元素嵌套递归引用 `DocumentedStyles`。
- StyleX API（`create`、`props`、`attrs`、`defineVars`、`createTheme`、`firstThatWorks`、`keyframes` 等）在 fork 的声明上写中文 JSDoc。
- 预设给 StyleX 编译器配置 `importSources`，识别新入口。写样式统一从这个入口导入。
- **代价**：不再精确推导每个样式组用了哪些属性，`StyleXStyles<{ color?: … }>` 这类受限类型无法校验；本库的 `sx` 本来不加限制，确需受限类型时用原版 `create`。
- **一致性测试**：同一组“应通过 / 应报错”的写法，分别用新入口与原版做类型检查，结果必须一致（受限类型一项除外）；StyleX 升级时先跑这组测试。
- 属性值关键字（`center`、`stretch`）不能单独悬停（字面量联合成员不能带注释），说明写进属性注释正文的“常用值”。

### 9.3 注释数据：理清来源，修订完善

| 内容                                                 | 来源                                                            | 说明                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| 覆盖哪些属性、值类型                                 | StyleX 类型声明（MIT）                                          | 决定注释范围                                                |
| 语法、初始值、是否继承、动画类型、适用元素、MDN 链接 | `mdn-data`（CC0）                                               | 一手数据，脚本填充，不手写                                  |
| 浏览器支持（Baseline 等级与年份）                    | `web-features`（许可待核实）                                    | 新增                                                        |
| 中文说明、常用值、适用场景                           | 以 zerodep-js 的 `css-author-docs.json` 为起点修订（自有，MIT） | 用自己的话写，不复制 MDN 正文（CC-BY-SA），只用 `@see` 链接 |

- 修订与完善：事实字段改由脚本从数据包填充；新增 Baseline；新增 StyleX 专属说明（数字值是否自动加 px、简写规则、物理方向属性提示改用逻辑属性）；逐条复核中文说明，常用属性补“常用值”和“适用场景”。
- 校验：StyleX 的每个属性都必须有中文说明；事实字段必须能在数据包中查到；升级数据包或 StyleX 时列出新增、删除、变化的属性。
- 生成格式：说明 → 常用值 → StyleX 注意事项 → 初始值 / 继承 / Baseline → `@see` MDN。
- 数据以本仓库 `scripts/css-docs/` 为唯一来源，以后需要时再抽成与 zerodep-js 共用的数据包。
- 主题 tokens 用 `defineVars` 定义时每个变量写 JSDoc（用途 + 明暗取值），属性访问悬停即可看到。
