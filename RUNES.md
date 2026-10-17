# 类 Svelte 符文（runes）编译到 Vue Ref：研究

研究日期：2026-10-17（Asia/Singapore）

> **命名决定（2026-10-17）**：符文改用下划线前缀——`_state`、`_state.raw`、`_derived`、`_derived.by`、`_bindable`、`_from`、`_ref`。本文为了和 Svelte 对照，正文仍写 `$xxx`，含义一一对应；`research/probe` 已改名并通过全部测试。工程规划见 [PLAN.md](PLAN.md)。

前置：`RESEARCH.md`（只做 VDOM、只写 TSX、`_component()` + StyleX）。
证据：`research/probe` 中的编译原型与 35 项测试（含此前的 13 项）。

> **底座更新（2026-10-17）**：Vue 改为 3.5.44，JSX 交给官方 `@vitejs/plugin-vue-jsx`（vue-jsx 已移除）；定位收窄为"在已有 Vue 3.5 项目中用 TSX 写独立页面"，不再与 SFC 模板互相使用组件。下文已按此更新，涉及 vue-jsx 的研究过程保留在提交历史中。

> **原型已清理（2026-10-17）**：文中引用的 `research/probe` 已从仓库删除，完整代码保留在提交 `7ad76fb` 中（例如 `git show 7ad76fb:research/probe/src/component.ts`）；已经迁入正式包的部分见 `packages/tsx`。

---

## 1. 结论

**可行，而且能做得很小。** 原型只有一个约 400 行（含注释）的 Babel 前置转换、一份 36 行的类型声明和一层 19 行的 JSX 类型。生成的代码就是手写 Vue 会写的代码，之后照常交给官方 JSX 插件。

核心思路只有一句：

> **编译器只负责让本地响应式变量像普通变量一样读写；状态、派生、副作用、双向绑定、生命周期的语义全部是 Vue 原生的。**

由此得到三条设计原则：

1. **Vue 能做的不另造。** 副作用用 `watch` / `watchEffect`，生命周期、`provide` / `inject` 原样使用，双向绑定直接用 Vue 的 `v-model` 协议。新增的符文只覆盖 Vue 做不到的那一件事：去掉 `.value`。
2. **互通靠 Vue 协议，不靠适配层。** 组件之间走 Vue 标准的 `v-model:xxx` 协议；与宿主共享状态走 Ref 或 getter，Vue 生态（pinia、VueUse 等）本来就同时接受两者。
3. **会悄悄丢响应性的写法一律编译期报错。** 不靠文档提醒。

---

## 2. API 全貌

| 写法                                                            | 编译成                                                   | 读写                                               |
| --------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `let x = $state(v)`                                             | `ref(v)`                                                 | `x` ↔ `x.value`                                    |
| `let x = $state.raw(v)`                                         | `shallowRef(v)`                                          | 只整体替换                                         |
| `const obj = $state({ … })` / `$state([…])`                     | `reactive(…)`                                            | **不改写**，就是 reactive 对象，可导出、可跨函数传 |
| `const d = $derived(expr)`                                      | `computed(() => expr)`                                   | 只读                                               |
| `const d = $derived.by(() => { … })`                            | `computed(fn)`                                           | 只读                                               |
| `const { a, b: [c] } = $derived(obj)`                           | 每个变量各自一个 `computed`                              | 只读；嵌套、默认值、`...rest` 与普通解构一致       |
| 组件参数 `{ checked = $bindable(false) }`                       | 本包的 `bindable(__props, 'checked', () => false, emit)` | 读写，走 v-model 协议                              |
| `let t = $from(someRef)` / `const { x, y } = $from(useMouse())` | 直接持有这些 Ref                                         | 读写（`const` 时只读）                             |
| `$ref(x)`                                                       | `x` 背后的 Ref                                           | 交给需要 Ref 的 Vue API                            |
| `v-model:checked={on}` / `<input v-model={name} />`             | **不是新语法**，Vue JSX 原有指令                         | `on` 只是被当作普通引用改写成 `on.value`           |

**没有** `$effect`、`$props`、`bind:`：

- `$effect` → 直接写 `watchEffect(() => …)`。闭包里读到的已经是 `x.value`，Vue 自然收集依赖。需要 Svelte `$effect` 的 DOM 后时机就加 `{ flush: 'post' }`。
- `$props` → `_component` 的参数解构就是 `$props()`，见 §2.3。
- `bind:` → Vue 的 `v-model:xxx` 已经是同一个概念。复用它，作者不用学第二套名字，也保证和 Vue 生态是同一个协议。

### 2.1 写出来的样子

```tsx
// 子组件：checked 双向绑定，其余是普通 prop
export const Switch = _component(
  ({ checked = $bindable(false), disabled = false, onChange, children }: SwitchProps) => {
    function toggle() {
      if (disabled) return;
      checked = !checked;
      onChange?.(checked); // 同步读到的就是新值
    }
    return () => (
      <button aria-pressed={checked} disabled={disabled} onClick={toggle}>
        {children}
      </button>
    );
  },
);

// 父组件
export const Page = _component(() => {
  let on = $state(false);
  let name = $state('');
  const greeting = $derived(`你好，${name || '匿名'}`);

  watchEffect(() => console.log(on)); // 副作用：直接用 Vue

  return () => (
    <>
      <Switch v-model:checked={on}>通知</Switch>
      <input v-model={name} />
      <p>{greeting}</p>
    </>
  );
});
```

编译后（节选，就是手写 Vue 的样子）：

```ts
const Switch = _component(({ disabled = false, onChange, children }) => {
  const checked = bindable(__props, 'checked', () => false, __ctx.emit)
  function toggle() {
    if (disabled) return
    checked.value = !checked.value
    onChange?.(checked.value)
  }
  return () => <button aria-pressed={checked.value} …>{children}</button>
})

const Page = _component(() => {
  let on = _ref(false)
  let name = _ref('')
  const greeting = _computed(() => `你好，${name.value || '匿名'}`)
  watchEffect(() => console.log(on.value))
  return () => <><Switch v-model:checked={on.value}>…</Switch><input v-model={name.value} />…</>
})
```

### 2.2 与生态互通的写法

```tsx
// 接入组合式函数返回的 Ref
let theme = $from(useStorage('theme', 'dark'))   // 之后 theme = 'light' 直接写回存储
const { x, y } = $from(useMouse())

// 交出去：优先 getter（Vue 与 VueUse 普遍接受 MaybeRefOrGetter）
const doubled = $from(useDoubled(() => count))
watch(() => on, (value) => …)

// 对方只收可写 Ref 时用 $ref
const increment = useIncrement($ref(count))

// 接入 pinia：storeToRefs 返回的就是一组 Ref
const { user } = _from(storeToRefs(useUserStore()))
```

### 2.3 组件 props：Svelte 式响应式解构

`_component` 的参数解构就是 Svelte 5 的 `let { … } = $props()`：解构出的变量保持响应式，默认值写在解构里。这部分由我们的编译器完成，**不需要 `defineComponent`**。

```tsx
export const Badge = _component(({ size = 'md', icon = pick(size), index = -1, checked = _bindable(false), ...rest }: Props) => {
  …
})
```

编译后（Vue 组件本来就是普通对象）：

```ts
export const Badge = _component((__props, __ctx) => {
  const size = prop(__props, 'size', () => 'md')
  const icon = prop(__props, 'icon', () => pick(size.value))
  const index = prop(__props, 'index', () => -1)
  const checked = bindable(__props, 'checked', () => false, __ctx.emit)
  const rest = __ctx.attrs
  …
}, { name: 'Badge', props: ['size', 'icon', 'index', 'checked', 'onUpdate:checked'] })
```

- **任意默认值**：函数调用、负数、模板字符串都可以；默认值在实例内惰性求值，`[]`、`makeList()` 每个实例各自一份，同一实例只求值一次。
- **默认值可以引用前面的 prop**，并且随它更新（`icon = pick(size)` 在 `size` 变化时重新计算）。这一点比 Svelte 更进一步：Svelte 的默认值只算一次。
- **读写**：解构出的 prop 和符文一样改写为 `.value`；普通 prop 只读，写入在编译期报错并提示改用 `_bindable`。
- **props 声明**自动生成；`...rest` 就是未声明为 prop 的属性（`__ctx.attrs`），不含 prop 本身与 `onUpdate:xxx`。
- **组件名**取自变量名（DevTools 与警告信息里可见）。
- **children**：JSX 子节点就是 `children` prop。普通内容在读取时才生成（惰性，依赖归属子组件），所以只能在渲染函数或回调里读取，直接写在组件函数体里会编译报错。**带参数的函数子节点是渲染函数**（`<List items={…}>{(item) => …}</List>`），原样交给组件调用，也能经中间组件 `<List>{children}</List>` 原样转交；无参函数等同于惰性内容，不需要单独写。
- **类型**：组件的类型就是“接收 props 的函数”，JSX 直接按参数类型检查；子节点按 `children` prop 检查；泛型组件的类型参数也能推导。

对照：Vue 3.5 SFC 的 props 解构把默认值放进静态的 props 选项（编译成模块级工厂函数），无法引用其他 prop。

---

## 3. 为什么这样设计：对照 Vue 放弃 Reactivity Transform 的理由

Vue 官方在 2023 年放弃了 Reactivity Transform（`$ref` / `$computed` / `$$`）。尤雨溪给出的理由，以及本方案的回应：

| Vue 的顾虑                                           | 本方案                                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 去掉 `.value` 后，看不出哪里被追踪、哪一行触发副作用 | **仍然存在，这是主要代价。** 缓解：声明处必须显式写符文；`const` 对象状态不改写、语义与 reactive 完全一致；可选的 `$` 前缀命名约定见 §6 |
| 有的文件用、有的不用，两套心智模型来回切换           | 生成代码就是 Vue 代码，没有第二套运行时；跨边界只有两种形态（Ref、getter），且都是 Vue 原生的                                           |
| 响应式变量与 Ref 互转是额外负担                      | 只有 `$from` 和 `$ref` 两个转换；而 Vue 生态普遍接受 getter，所以大多数情况连 `$ref` 都不需要                                           |
| 扭曲 JS 语义                                         | 范围只限于符文声明的局部变量。传进函数是传值（与 Svelte 5 一致），对象状态用 reactive 保持引用语义                                      |
| 跨文件、跨函数悄悄丢响应性                           | 导出会重新赋值的状态、解构符文结果、把符文当值传递、写只读派生或普通 prop，**全部编译期报错**                                           |

Svelte 5 接受了同样的代价，并给出了同样的边界规则：传原始值是传快照，跨边界传 getter 或对象，不能导出会被重新赋值的状态。本方案在这几点上与 Svelte 一致，区别是落地到 Vue 现成的 Ref / reactive / computed / v-model 上，而不是自带运行时。

---

## 4. 实测

### 4.1 运行时（`test/runes.test.tsx`、`test/oneway.test.tsx`）

| 场景                                                                                                                                              | 结果 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| `$state` / `$derived` / `$derived.by` 渲染与更新；`watchEffect`、`onMounted` 直接用 Vue                                                           | 通过 |
| `$bindable` + 父级 `v-model:checked`：双向同步；子组件写入后同步读到新值                                                                          | 通过 |
| `$bindable` 不绑定：作为本地状态，各实例独立                                                                                                      | 通过 |
| `$bindable` 单向传值：子组件可本地切换，父级一变以父级为准（同 Svelte 未绑定的 `$bindable`）                                                      | 通过 |
| 原生 `<input v-model={name}>` 双向绑定                                                                                                            | 通过 |
| `const` 对象状态 = reactive：`v-model_number={settings.fontSize}` 对象路径 + 修饰符                                                               | 通过 |
| `$from` 接入组合式函数的 Ref（单个、解构）；写回                                                                                                  | 通过 |
| getter 交给 `MaybeRefOrGetter`；`$ref(x)` 交给只收 Ref 的函数并写回同一个 Ref                                                                     | 通过 |
| `watch(() => x, …)` 观察响应式变量                                                                                                                | 通过 |
| 跨模块：导出 reactive 对象；导出读写函数                                                                                                          | 通过 |
| 读写形态：解构交换 `[a, b] = [b, a]`、对象简写、`for (x of …)`、`??=` `&&=` `**=`、前后自增、同名参数遮蔽、`typeof x` 类型位置、`<View />` 标签名 | 通过 |

### 4.2 编译期报错（`test/runes-errors.test.ts`，12 项全过）

| 写法                                        | 报错                                                           |
| ------------------------------------------- | -------------------------------------------------------------- |
| `export let x = $state(0)` / `export { x }` | 不能直接导出响应式变量；导出 const 对象或读写函数              |
| `d = 3`（`d` 来自 `$derived`）              | `d 来自 $derived，是只读的`                                    |
| 写入普通 prop                               | `prop disabled 是只读的；…请写成 disabled = $bindable(默认值)` |
| `const x = $state(0)`                       | const 只能是对象/数组字面量；要重新赋值请用 let                |
| `let { a } = $state({ … })`                 | 不能解构声明：解构得到的是快照                                 |
| `const make = $state`                       | 符文只能按约定位置直接调用                                     |
| `$ref(1)`                                   | `$ref(x)` 的参数必须是响应式变量                               |
| `var x = $state(0)`                         | 请用 let 或 const                                              |
| 组件外 `$bindable`                          | 只能写在组件参数解构的默认值位置                               |
| `$state.deep(0)`                            | 只支持 `$state.raw`、`$derived.by`                             |
| 本地定义了同名 `$state` 函数                | 不当作符文，不改写                                             |

报错带源码位置，例如：

```
input.tsx: d 来自 $derived，是只读的
  2 | const d = $derived(a * 2)
> 3 | d = 3
    | ^^^^^
```

### 4.3 类型（`types-probe/runes.tsx`、`types-probe/vmodel.tsx`）

- 符文在类型层面就是普通值：`let on = $state(false)` 的类型是 `boolean`，悬停、补全、重构都按普通变量工作。
- **发现：TS 对带连字符的 JSX 属性名（`v-model:*`、`data-*`）不做多余属性检查**，所以默认情况下 `v-model:checked={'x'}` 不会报错。补法是在 Vue 的 JSX 类型上加一层（`types/jsx-runtime.d.ts`）：为每个 prop `K` 生成同类型的 `v-model:K`，并排除 `key`/`ref`/`class` 等保留属性。之后 `<Switch v-model:checked={label} />`（`label: string`）正确报错。
- 纯 `tsc` 即可，不需要 Volar 插件。

---

## 5. 与上一轮"直接传 Ref"的关系

上一轮的约定是：共享可写状态以 `Ref<T>` prop 传入，子组件直接改 `.value`。引入符文后建议：

| 场景                                          | 推荐                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| 组件之间的双向状态                            | `$bindable` + `v-model:xxx`（Vue 标准协议，生态双向互通；不绑定时自动退化为本地状态） |
| 传给组合式函数、工具函数                      | getter 优先；需要可写 Ref 时 `$ref(x)`                                                |
| 少数需要把同一个 Ref 深层共享给很多组件的场景 | 仍可用 `Ref<T>` prop + `$ref(x)`，或 `provide` / `inject`                             |

"直接传 Ref"仍然成立，只是不再是组件间的默认做法：v-model 协议在互通性上明显更好，而写法同样简洁（`v-model:checked={on}`），子组件内部同样直接写 `checked = !checked`。

---

## 6. 风险与限制

1. **看不出追踪点**（Vue 的头号顾虑）。可选缓解：
   - 约定响应式变量统一加 `$` 前缀（`unplugin-reactive-vue` 的思路），由 lint 规则检查；
   - 编辑器语义高亮（需要语言服务插件，成本较高）。
     建议先不加命名约定，写几个真实组件再看是否需要。
2. **setup 顶层读取是快照。** `const initial = count` 只取当前值，这符合 JS 直觉，但 Svelte 会对此给出警告（`state_referenced_locally`）。可以在编译器里加同类警告。
3. **两次解析。** 符文编译与官方 JSX 插件各自用 Babel 解析一次。只编译用到我们写法的文件，代价可以接受；如有需要，可以把符文编译作为 `babelPlugins` 交给官方插件，合并成一次。
4. **`$bindable` 写入后同步读到新值**：由本包的 `bindable` 保证（Vue 原生 `useModel` 写入后不能同步读取，见参考链接）。
5. **`$state` 在 render 函数里声明** 会每次渲染新建 Ref。已改为编译期报错。
6. **类字段、`$state` 在类中** 未支持。可后续按需讨论，Svelte 5 支持 `$state` 类字段。
7. **HMR**：已验证组件热替换、页面不刷新；组件局部状态会重置（官方插件对组件调用 `reload`）。
8. **未验证**：真实浏览器输入法、WebStorm 中的实际体验、source map 精度。SSR 不在范围内。

---

## 7. 下一步建议

1. 先用这套写法把 Input、Switch、泛型 Select 三个原型写完，体会"看不出追踪点"在真实组件里是否构成问题，再决定是否加 `$` 前缀约定。
2. 补一条编译检查：setup 顶层读取符文变量给出快照警告（render 函数内声明符文已报错）。
3. 实现底座保持 Babel 7，与官方 JSX 插件、StyleX 一致；三者都支持 Babel 8 后一起升级。

---

## 参考

- 尤雨溪关于放弃 Reactivity Transform 的说明 — https://github.com/vuejs/rfcs/discussions/369
- Vue Macros 维护的 Reactivity Transform — https://vue-macros.dev/features/reactivity-transform.html
- `unplugin-reactive-vue`（`$` 前缀标识响应式变量的思路） — https://www.npmjs.com/package/unplugin-reactive-vue
- Svelte 5 `$state`（跨函数、跨模块传递规则） — https://svelte.dev/docs/svelte/$state
- Svelte 5 `$bindable` — https://svelte.dev/docs/svelte/$bindable
- Vue `useModel` 写入后同步读取问题 — https://github.com/vuejs/core/issues/11080
