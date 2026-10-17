# Vue TSX 自然写法研究

研究日期：2026-10-17（Asia/Singapore）
范围：**只做 Vue 虚拟 DOM（VDOM）**，**只写 TSX，不兼容 SFC 模板**。
续篇：符文（`_state`/`_derived`/`_bindable`）编译到 Vue Ref 的研究见 [RUNES.md](RUNES.md)；工程规划见 [PLAN.md](PLAN.md)。
关系：`zerodep-js/VUE_TSX_RESEARCH.md`（2026-10-13）只作背景参考，本文按"写起来自然、读起来一眼能懂"重新评估，结论以本文和 `research/probe` 的实测为准。

> **原型已清理（2026-10-17）**：文中引用的 `research/probe` 已从仓库删除，完整代码保留在提交 `7ad76fb` 中（例如 `git show 7ad76fb:research/probe/src/component.ts`）；已经迁入正式包的部分见 `packages/tsx`。

> **底座更新（2026-10-17）**：vue-jsx 已移除，改为 Vue 3.5.44 + 官方 `@vitejs/plugin-vue-jsx`（原因：vue-jsx 3.3 RC 要求 Vue 3.6 RC，且其虚拟模块在 Windows 上让 Vitest 崩溃）；定位收窄为"在已有 Vue 3.5 项目中用 TSX 写独立页面"。本文中关于 vue-jsx 工具链与宏的内容是当时的研究记录，现行方案见 [PLAN.md](PLAN.md)。

> **更新（2026-10-17）**：组件边界改为 `_component`，并且不再借用 vue-jsx 的 `defineComponent` 宏。props 的响应式解构与默认值改由我们的编译器按 Svelte 5 的方式处理（详见 `RUNES.md` §2.3）：默认值可以是任意表达式、按实例惰性求值、可以引用前面的 prop。下文与宏、补丁、Ref prop 默认值相关的内容是当时的记录。

---

## 1. 结论速览

| 问题                  | 结论                                                                                                    | 依据                      |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------- |
| 基础工具链            | `vue-jsx`（Vue 官方组织下的 Rust/Oxc JSX 编译器）+ 它的 `defineComponent` 宏                            | 实测通过                  |
| 组件边界              | 一个 `_component()`：参数解构写 props 和默认值，函数体只执行一次，`return () => JSX` 是渲染             | 实测通过                  |
| 共享可写状态          | 直接传 `Ref<T>`，子组件直接改 `.value`；默认值写 `checked = ref(false)`                                 | 实测通过（需 1 行宏补丁） |
| emit                  | 不用。通知用普通函数 prop `onXxx`                                                                       | 实测通过                  |
| v-model / defineModel | 组件层不用，传 Ref 即可；原生 `<input>` 仍用 `v-model={x.value}` 复用 Vue 的输入处理                    | 实测通过                  |
| slot                  | 作者层不用。默认插槽映射成 `children` prop；具名内容直接传 JSX prop；需要参数的用函数 prop              | 实测通过                  |
| expose                | 不用。父级持有状态/控制器对象并传入子组件                                                               | 设计约定                  |
| attrs 透传            | 显式 `...rest` 展开到目标元素（vue-jsx 默认 `inheritAttrs: false`）                                     | 实测通过                  |
| CSS                   | **推荐 StyleX**：`stylex.create` 对象样式、`sx` prop 覆盖、动态值自动变 CSS 变量，全在编译期            | 实测通过                  |
| Vue 版本              | 上游声明需要 Vue 3.6 RC；组件探针（Ref、children、v-model）在稳定版 3.5.44 下也全部通过，但属非官方支持 | 实测                      |

一句话：**不需要自造响应式、样式引擎或大范围 fork**。vue-jsx 已经把 VDOM 的编译优化、宏、类型推导做好了；我们要做的只有一个很薄的 `_component()`、一行宏补丁、一套约定，再配 StyleX。

---

## 2. 推荐写法全貌

以下代码即 `research/probe/src` 中的实测版本。

```tsx
import { ref, type Ref } from 'vue';
import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { NodeChild } from 'vue-jsx';
import { _component } from './component';

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    paddingBlock: '0.5em',
    paddingInline: '1em',
    color: { default: 'navy', ':hover': 'white' },
    backgroundColor: { default: 'transparent', ':hover': 'navy' },
  },
  on: { color: 'white', backgroundColor: 'navy' },
});

interface ToggleProps {
  checked?: Ref<boolean>; // 共享可写状态：传 Ref
  disabled?: boolean; // 单向配置：传普通值
  onChange?: (checked: boolean) => void; // 通知：函数 prop
  sx?: StyleXStyles; // 外部样式覆盖
  children?: NodeChild; // 内容
}

export const Toggle = _component(
  ({ checked = ref(false), disabled = false, onChange, sx, children }: ToggleProps) => {
    // 这里只执行一次
    function toggle() {
      if (disabled) return;
      checked.value = !checked.value;
      onChange?.(checked.value);
    }

    // 这里每次依赖变化都执行
    return () => (
      <button
        disabled={disabled}
        aria-pressed={checked.value}
        {...stylex.attrs(styles.base, checked.value && styles.on, sx)}
        onClick={toggle}
      >
        {children}
      </button>
    );
  },
);

// 使用方
const App = _component(() => {
  const notify = ref(true);
  return () => (
    <Toggle checked={notify} onChange={(v) => console.log(v)}>
      通知：{notify.value ? '开' : '关'}
    </Toggle>
  );
});
```

作者只需要记住三件事：

1. **参数里写 props**，默认值就写在解构里；宏会把解构改写成 `__props.xxx`，所以在 render、computed、事件里读都是实时的。
2. **函数体执行一次，`return () => …` 每次重渲染执行**。这是 Vue VDOM 的真实模型，箭头不藏起来，读代码时一眼能分清。
3. **数据流只有 props**：要共享就传 Ref，要通知就传函数，要放内容就传 children / JSX。

### 2.1 为什么保留 `return () => JSX` 而不是直接 `return JSX`

VDOM 中 setup 必须返回渲染函数。若自己写宏把 `return <div/>` 改成 `return () => <div/>`，代码看起来像"只渲染一次"，与真实行为不符，还要多维护一个转换和它的 source map / HMR。多写 `() =>` 三个字符，换来零魔法、上游原样可用，划算。

### 2.2 `_component()` 做了什么

`research/probe/src/component.ts`，约 20 行：

- 直接复用 vue-jsx 的 `defineComponent`，类型也原样复用（`typeof defineComponent`）。
- 用 Proxy 只拦截 `children`：读到它时才执行 `slots.default()`。读取发生在子组件 render 内，所以内容惰性、依赖归属子组件，父级不需要跟着重渲染（探针 `setup 只执行一次，内容随父级更新`）。
- 在 `vite.config.ts` 把 `'component'` 注册为 `defineComponent` 宏的别名，于是参数解构、默认值、`...rest` 都生效。

类型侧不需要任何编辑器插件：`<Card>正文</Card>`、`<Card header={<b/>} />` 在 TS6 普通 `tsc` 下就能检查（`research/probe/types-probe/usage.tsx`）。

---

## 3. 各项 Vue 概念的替代

| Vue 惯用法                | 本方案写法                                    | 说明                                                                       |
| ------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `defineProps`             | 参数解构 + interface                          | 宏自动生成 props 选项                                                      |
| `withDefaults`            | 解构默认值 `size = 'md'`                      | 字面量、对象、数组、函数、`ref()` 均可（`ref()` 需补丁）                   |
| `emit('change', v)`       | `onChange?.(v)`                               | 函数 prop，类型就是函数签名                                                |
| `v-model` / `defineModel` | `value?: Ref<T>`，直接改 `.value`             | 父级 `value={name}` 传 Ref 本身                                            |
| 原生 `v-model`            | 保留 `<input v-model={value.value} />`        | 复用 Vue 的输入法组合、checkbox/radio/select 处理，不自己写 `onInput`      |
| 默认插槽                  | `children`                                    | 只在 render 里读（见 §6）                                                  |
| 具名插槽                  | `header={<b>…</b>}`                           | 普通 prop，类型 `NodeChild`                                                |
| 作用域插槽                | `renderItem={(item) => <li>{item.name}</li>}` | 普通函数 prop；泛型能否从 `items` 推导到参数，留到 Select 原型验证         |
| `defineExpose` + 模板 ref | 父级持有状态或控制器对象再传入                | 例：`const dialog = useDialog(); <Dialog state={dialog} />; dialog.open()` |
| attrs 自动透传            | `...rest` 显式展开                            | vue-jsx 默认 `inheritAttrs: false`，透传到哪个元素一目了然                 |
| `class` 透传覆盖          | `sx` prop（StyleX 样式）                      | 编译期确定覆盖结果，见 §4                                                  |
| provide / inject          | 保留                                          | 用于主题、表单上下文等跨层数据，不属于本次要去掉的东西                     |

**为什么"直接传 Ref"是合理的，而不是反模式**：Vue 官方文档强调单向数据流，不建议修改 props 本身；但传入的是一个 Ref 对象，props 引用从未被改，子组件改的是共享容器里的值，这正是"显式共享状态"。同类设计在其他框架里都是一等公民：Svelte 5 的 `$bindable`、Angular 的 `model()` 信号输入、Solid 中把 signal 的 getter / setter 作为 props 传给子组件也是常见做法。Svelte 文档同时提醒这类双向绑定要克制使用——本方案的对应约定是：只有确实需要共享写入的 prop 才用 Ref（§6）。vue-jsx 迁移文档也把"直接传 Ref"列为解构 props 保持响应式的方案之一。

---

## 4. CSS 方案

### 4.1 对比

| 方案                                  | 写在哪                         | 运行时                 | 跨组件覆盖                  | 动态值                           | 类型         | 评价                                         |
| ------------------------------------- | ------------------------------ | ---------------------- | --------------------------- | -------------------------------- | ------------ | -------------------------------------------- |
| **StyleX**                            | 同一 `.tsx` 内 `stylex.create` | 几乎为零（合并原子类） | `sx` prop，按属性整体替换   | 函数样式 → CSS 变量              | 完整         | **推荐**                                     |
| vanilla-extract                       | 单独 `.css.ts` 文件            | 零                     | 只能拼 class，靠书写顺序    | `createVar` + `assignInlineVars` | 完整         | 成熟，但样式与组件分文件，变体要配 `recipes` |
| vue-jsx `defineStyle`                 | `.tsx` 内 CSS 字符串           | 零                     | scoped + `:deep`            | 插值                             | 弱（字符串） | **当前有 bug**，见 §5.2                      |
| CSS Modules                           | 单独 `.module.css`             | 零                     | 拼 class                    | 手写 CSS 变量                    | 需插件       | 稳妥但覆盖语义靠层叠顺序                     |
| Panda / UnoCSS / Tailwind             | 原子类或 `css()`               | 零                     | 拼 class，冲突需 merge 工具 | 有限                             | 中           | 适合业务页面，不适合做组件库的覆盖契约       |
| 自研运行时 CSS（旧 zerodep-css 方向） | 任意                           | 有                     | 自定义                      | `bx`                             | 自定义       | 需长期维护规则生成、SSR 收集、清理，不必要   |

### 4.2 为什么选 StyleX

旧方案想要的三件事，StyleX 都在**编译期**原生提供：

| 旧方案诉求                           | StyleX 对应                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| StyleX 风格对象 API、按用途分组      | 本来就是 `stylex.create`                                                                     |
| class 隐式携带、跨组件合并，后者覆盖 | `stylex.attrs(styles.base, cond && styles.on, sx)`，同属性后者整体替换（含 `:hover` 等条件） |
| `bx` 显式变量绑定                    | 函数样式 `width: (px: number) => ({ width: px })`，编译成 `var(--x-width)` + 行内 style      |
| 主题变量                             | `stylex.defineVars` / `stylex.createTheme`                                                   |

实测要点（`test/components.test.tsx` 与生产构建产物）：

- 外部 `sx={page.danger}` 覆盖后，base 的 `color` 和 `:hover` 背景类**被整体替换，没有残留**，正是旧记录里担心的"覆盖默认色后残留子级旧 hover"。
- `width={120}` 产出 `style="--x-width: 120px"`，CSS 里是 `@property --x-width` + `width: var(--x-width)`。
- `stylex.attrs()` 直接返回 `{ class, style }`，在 Vue JSX 里展开即可，不需要任何适配层。
- 插件顺序：`stylex.vite()` 放在 `vueJsx()` 之前。

### 4.3 StyleX 需要接受的约束

- 样式必须是可静态分析的对象字面量，不能在运行时拼对象；动态部分只能走函数样式。
- 不支持任意后代选择器（这也是它覆盖语义可预测的原因）；需要时用 `stylex.when.*` 或 `defineMarker`。
- 组件对外只暴露 `sx` 一个覆盖口，不接受任意字符串 class 参与覆盖计算（字符串 class 仍可放在原生元素上，但不保证覆盖顺序）。
- 开发态需要在 HTML 注入 `virtual:stylex.css`（见 `@stylexjs/unplugin` README），探针只验证了构建与测试环境。

---

## 5. 发现的上游问题

### 5.1 宏丢弃函数调用形式的默认值（已给出补丁）

> **更新（2026-10-17）**：仓库不再打这个补丁。改为由符文编译器在编译期对 vue-jsx 会丢弃的参数默认值（函数调用、负数、模板字符串等）直接报错并给出改法；双向状态改用 `_bindable`。一行修复仍建议提交给上游。

`vue-jsx@3.3.0-rc.3` 的宏处理解构默认值时，只识别字面量、对象、数组、函数、标识符、`null`。其余表达式全被丢弃：

```tsx
({ checked = ref(false) }) => …
// 编译结果：props: { checked: null }   ← 默认值消失，不传 checked 时 .value 处报错
```

`ref(false)`、`shallowRef(0)`、`new Map()`、模板字符串都会命中。源码位置：`packages/macros/src/core/define-component/index.ts` 的 `getTypeAndValue` 的 `default` 分支。

补丁只有一行：其余表达式一律包成工厂函数。Vue 对未声明 `type` 且默认值为函数的 prop 会按工厂调用，因此每个实例各自 `ref(false)`：

```diff
 		} else if (node.type === "NullLiteral") value = "null";
+		else value = `() => (${s.slice(node.start, node.end)})`;
```

`research/probe/patches/` 已按 pnpm `patchedDependencies` 格式提供。**建议向上游提 PR**，合入后即可删掉补丁，不需要 fork。

### 5.2 `defineStyle` 引用解构 prop 时生成错误代码

```tsx
_component(({ color = 'red' }) => {
  defineStyle(`.card { color: ${color}; }`)
  …
})
```

- 不赋值（全局/scoped）：运行时 `ReferenceError: color is not defined`。
- 赋值为 CSS Modules：生成 `const styles = style0__props.color;` 这种非法拼接。
- `v-bind(color)` 写法：生成了 `var(--hash-color)`，但组件里没有任何代码设置这个变量。

结论：`defineStyle` 暂不作为方案。`test/upstream-issues.test.tsx` 断言了当前的错误行为，上游修好后它会变红提醒更新结论。

---

## 6. 约定与坑

**持有 Ref 的容器**（`test/pitfalls.test.ts`）

- `ref(existingRef)`、`shallowRef(existingRef)` 都会**原样返回同一个 Ref**，不能用它们"装"一个 Ref。
- `reactive({ on: ref(false) })` 会自动解包，`state.on` 读出来是 `boolean`，再传给组件就不是 Ref 了。
- 要把多个 Ref 组织在一起，用普通对象或 `shallowReactive`：`const form = { name: ref(''), agree: ref(false) }`。

**解构的读取时机**

- 宏会把解构改写为 `__props.x`，所以 render、`computed`、事件处理里读都是实时的。
- `const initial = disabled` 是一次快照，符合普通 JS 直觉，不是 bug。
- `children` 只在 render 里读。在函数体顶层读会在 setup 期执行插槽，既不响应也会触发 Vue 警告。

**只读来源**

- `computed(() => …)`、`readonly(ref)`、`toRef(() => …)` 都能通过 `Ref<T>` 类型检查（TS 的 `readonly` 不影响可赋值性），写入时只有 Vue 运行时警告。约定：可写 prop 只接 `ref()` / 可写 `computed({ get, set })`，需要把关的话用 lint 规则补。

**一个 prop 一种形态**

- 可写状态 prop 只接受 `Ref<T>`，不接受 `T | Ref<T>`，否则传普通值时"改了改哪儿"说不清。
- 单向配置 prop 只接受普通值，不强迫 `size={ref('md')}`。

**字符串键的 prop**

- 宏只处理标识符键，`{ 'aria-label': label }` 不会声明成 prop。这类属性放在 `...rest` 里透传即可。

---

## 7. 版本与实测环境

| 包                          | 版本                   | 备注                                                                             |
| --------------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| vue                         | 3.6.0-rc.12            | npm `latest` 仍为 3.5.44；另在 3.5.44 下重跑组件探针（不含 StyleX），全部通过    |
| vue-jsx / @vue-jsx/*        | 3.3.0-rc.3             | 仍为 RC；runtime/macros 的 peer 声明 `vue ^3.6.0-rc.10`                          |
| typescript                  | 6.0.3                  | npm `latest` 已是 7.0.2；vue-jsx 文档称普通类型推导对 TS7 原生版也可用，本轮未测 |
| @stylexjs/stylex / unplugin | 0.19.1                 |                                                                                  |
| vite / vitest / happy-dom   | 7.3.7 / 3.2.7 / 21.0.3 |                                                                                  |

复现：

```bash
cd research/probe
pnpm install      # 自动应用 patches/ 中的宏补丁
pnpm test         # 13 项
pnpm typecheck    # 只应在 types-probe/usage.tsx 标注“应报错”的 3 行报错
pnpm build        # 产出 StyleX 合并后的 CSS
```

探针覆盖：

| 测试                                                   | 结果                      |
| ------------------------------------------------------ | ------------------------- |
| 默认 Ref 每实例独立                                    | 通过（补丁后）            |
| 子组件改父级 Ref，父级同步                             | 通过                      |
| 父级改传另一个 Ref，子组件跟随，旧 Ref 不受影响        | 通过                      |
| 普通值 prop 响应；回调 prop 取代 emit                  | 通过                      |
| 默认插槽 → children，setup 只执行 1 次，内容随父级更新 | 通过                      |
| 具名内容以 JSX prop 传入                               | 通过                      |
| 原生 v-model 写回 prop Ref；`...rest` 透传 aria-label  | 通过                      |
| StyleX `sx` 逐属性替换，无旧 `:hover` 残留             | 通过                      |
| StyleX 动态值 → CSS 变量                               | 通过                      |
| Ref 容器的三个坑                                       | 通过（记录 Vue 原生行为） |
| defineStyle 已知问题                                   | 通过（断言当前错误行为）  |
| 类型：Ref 类型约束、children/JSX prop 类型             | 符合预期                  |

未验证：浏览器真实输入法、SSR 与接管、HMR 实际体验、WebStorm 内的补全与诊断、TS7 原生版、StyleX 开发态 HTML 注入。

---

## 8. 待决与下一步

1. **向 vue-jsx 提 PR**：§5.1 的一行修复，附最小复现。合入前用 pnpm patch。
2. **Vue 版本**：跟随上游用 3.6 RC，还是先用 3.5.44（实测可用但非官方支持）。建议跟随上游，3.6 正式版发布后自然收敛。
3. **`_component()` 是否还要做更多**：目前只映射 children。可以考虑但还没做的：泛型组件的 `renderItem` 推导样例、`For` 列表组件的用法约定。建议等写到泛型 Select 时再定，不提前加。
4. **StyleX 主题**：用 `defineVars` 建一套 token，验证 `createTheme` 在嵌套区域切换主题。
5. **三个原型按顺序做实**：Input（已有雏形）→ ToggleButton（已有雏形）→ 泛型 Select（验证函数 prop 的泛型推导和列表身份）。
6. **编辑器**：普通 `tsc` 已能检查；在 WebStorm 里确认 JSX 补全、跳转与报错位置。

---

## 参考

- vue-jsx 文档：组件、宏、类型、VDOM 编译说明 — https://vuejsx.dev ；源码 https://github.com/vuejs/vue-jsx-vapor （`minor` 分支，读取于提交 `81693b0`）
- vue-jsx 宏默认值源码 — https://github.com/vuejs/vue-jsx-vapor/blob/minor/packages/macros/src/core/define-component/index.ts
- Vue 单向数据流 — https://vuejs.org/guide/components/props.html#one-way-data-flow
- Vue Ref 解包规则 — https://vuejs.org/guide/essentials/reactivity-fundamentals.html#additional-ref-unwrapping-details
- StyleX — https://stylexjs.com ；Vite 插件 `@stylexjs/unplugin` README
- vanilla-extract — https://vanilla-extract.style
- Svelte 5 `$bindable` — https://svelte.dev/docs/svelte/$bindable
- Angular `model()` — https://angular.dev/guide/components/inputs#model-inputs
- Solid props — https://docs.solidjs.com/concepts/components/props
