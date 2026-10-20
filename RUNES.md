# 符文（runes）

让本地响应式变量像普通变量一样读写，语义全部交给 Vue。设计对标 Svelte 5 的符文体系（§9），底层是 Vue 的 ref / computed / watchEffect / v-model。

> **一句话**：在我们的代码里，响应式变量写出来就是它的值；Vue 的 `Ref` 只出现在和 Vue 生态交接的边界上（`_fromRef` 收进来、`_toRef` 交出去）。

三条原则：

1. **Vue 能做的不另造。** 生命周期、`provide` / `inject`、`watch` 原样使用；符文只覆盖 Vue 做不到的事：去掉 `.value`，以及让双向绑定写成 TypeScript 能完整理解的普通属性。
2. **互通靠 Vue 协议。** 组件之间走 v-model 协议；和宿主共享状态走 Ref 或 getter，pinia、VueUse 本来就接受这两者。
3. **会悄悄丢响应性的写法编译期报错**（§8），不靠文档提醒。

## 1. 一览

| 写法                                                    | 编译成                                     | 说明                                                           |
| ------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `let n = _state(0)`                                     | `ref(0)`                                   | 读写 `n` ↔ `n.value`                                           |
| `const form = _state({ … })`                            | `ref({ … })`                               | 不能整体替换，属性照常可改                                     |
| `export const settings = _state({ … })`                 | `reactive({ … })`                          | 导出 ref 里的对象本身，导入方改属性是响应式的                  |
| `let list = _state.raw([])`                             | `shallowRef([])`                           | 只整体替换，不做深层代理                                       |
| `_state.snapshot(form)`                                 | `snapshot(form.value)`                     | 去掉代理的静态深拷贝                                           |
| `const d = _derived(expr)` / `_derived.by(() => { … })` | `computed`                                 | 只读                                                           |
| `let d = _derived(expr)`                                | `overridable(() => expr)`                  | 可以临时覆盖，依赖变化后重新跟随                               |
| `const { a, b } = _derived(obj)`                        | 每个变量各自一个派生值                     | 嵌套、默认值、`...rest` 与普通解构一致                         |
| `_effect(fn)` / `_effect.pre(fn)`                       | `watchEffect`（`flush: 'post'` / `'pre'`） | 副作用；返回的函数是清理函数                                   |
| `const stop = _effect.root(fn)`                         | 独立的 `effectScope`                       | 不随组件销毁，手动清理                                         |
| 组件参数 `({ size = 'md' })`                            | `prop(__props, 'size', () => 'md')`        | 普通 prop：可以临时覆盖（只改本地）                            |
| 组件参数 `({ checked = _bindable(false) })`             | `bindable(…, emit)`                        | 可双向绑定的 prop                                              |
| `<Switch checked={_bind(on)} />`                        | `v-model:checked={on.value}`               | 父级声明双向绑定；原生元素支持 `_bind.trim/.number/.lazy`      |
| `let theme = _fromRef(useStorage(…))`                   | 直接持有这个 Ref                           | Ref → 变量；也支持解构 `const { x, y } = _fromRef(useMouse())` |
| `_toRef(count)`                                         | `count`（背后的 Ref）                      | 变量 → Ref，交给需要可写 Ref 的 API                            |
| `_untrack(x)`                                           | `untrack(() => x.value)`                   | 只取当前值、不追踪；组件函数体里写表示有意只要初始值，不警告   |

## 2. 状态 `_state`

- **一律是 ref**。`let` 可以整体替换；`const` 不能整体替换，对象的属性照常可改（ref 里的对象是深层响应式的）。`const n = _state(0)` 这种改不了的原始值编译报错。
- **整体替换也是响应式的**：`form = { … }` 会更新所有读过 `form` 的地方。但之前拿走旧对象的地方仍指着旧对象，所以对象要交给别人长期持有时用 `const` 加改属性。
- **大数据只整体替换**时用 `_state.raw`，省掉深层代理。
- **交给第三方库或 `structuredClone`** 前用 `_state.snapshot(x)` 拿一份不带代理的拷贝。
- **传进函数是传值**（同 Svelte）：`useX(count)` 传的是当前数字。要让对方跟随变化，传 getter `() => count`；对方要写回时传 `_toRef(count)`。对象状态传进去就是同一个响应式对象。

## 3. 派生 `_derived`

- 依赖变化才重新计算，读多少次都只算一次。
- `let` 声明的派生值可以**临时覆盖**（同 Svelte 5.25），常用于乐观更新：

```tsx
let likes = _derived(post.likes);
async function like() {
  likes += 1; // 先显示 +1；post.likes 一变，likes 重新跟随它
  try {
    await api.like();
  } catch {
    likes -= 1;
  }
}
```

- 不要在派生里改状态；需要“状态变了就做点什么”的是副作用（§4）。

## 4. 副作用 `_effect`

```tsx
_effect(() => {
  const id = setInterval(tick, interval); // 读到的 interval 自动成为依赖
  return () => clearInterval(id); //        下次执行前、销毁时调用
});
```

- **时机**：挂载后、每次 DOM 更新后执行（同 Svelte 的 `$effect`）；`_effect.pre` 在 DOM 更新前执行，用于自动滚动前的测量之类。
- **嵌套**：`_effect` 里创建的 `_effect` 属于外层这一次执行，外层重跑时一起销毁。
- **位置**：写在组件函数体、组件里调用的组合式函数、或另一个 `_effect` 里；不在任何作用域里调用会报错，这时用 `_effect.root` 手动管理。写在渲染函数里编译报错。
- **只监听指定的值**用 Vue 的 `watch`，监听源写成 getter：`watch(() => count, cb)`。直接写 `watch(count, cb)` 传进去的是当前值，编译报错。Vue 没有公开的 `untrack`，所以不提供 Svelte 的 `untrack`。
- 派生值用 `_derived`，不要用副作用去同步状态。

## 5. 组件 props

`_component` 的参数解构就是 Svelte 的 `$props()`：

```tsx
export const Badge = _component(
  ({ size = 'md', icon = pick(size), checked = _bindable(false), children, ...rest }: Props) => {
    // 组件函数体只执行一次；return 的函数才是渲染
    return () => <span {...rest}>{children}</span>;
  },
);
```

- **默认值**可以是任意表达式，每个实例惰性求值一次；可以引用前面的 prop 并随之更新。
- **普通 prop 可以写**（同 Svelte）：只改组件本地，父级传入新值时以父级为准。需要让父级也拿到新值时用 `_bindable`。
- **`...rest`** 是没有声明为 prop 的属性；props 声明与组件名由编译器生成。
- **children**：JSX 子节点就是 `children` prop，读取时才生成，所以只能在渲染函数或回调里读取。带参数的函数子节点是渲染函数（`<List>{(item) => …}</List>`），可以经中间组件原样转交。
- 在组件函数体里直接读 prop 或状态只拿到当前值，编译器给出警告。

## 6. 双向绑定 `_bindable` + `_bind`

- 子组件用 `_bindable(默认值)` 声明“可以被双向绑定”，父组件用 `属性={_bind(x)}` 声明“这里要双向绑定”，编译成 Vue 的 v-model 协议：传的是值和更新回调，父级的 Ref 不会交给子组件。
- **两边都要写**（同 Svelte 的 `$bindable` + `bind:`）：编译器逐文件工作，看不到子组件声明了什么。写成函数调用而不是 `bind:checked`，是因为带冒号的属性名在 TSX 里没有补全和跳转。
- **受控语义同 Vue 的 `useModel`**：父级绑定时以父级为准，父级拒绝或修正新值时组件跟着回去；只传值时作为初始值；都不传就是组件自己的状态。
- 可以绑对象属性：`value={_bind(form.name)}`；原生输入元素支持修饰符 `_bind.trim`、`_bind.number`、`_bind.lazy`，中文输入法组合期间不写回。

## 7. 共享状态与暴露能力

| 需求                       | 写法                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| 子组件改父级的某个字段     | `value={_bind(form.name)}`                                                                 |
| 子组件负责一组字段         | 把对象作为普通 prop 传入：`<AddressFields address={form.address} />`，子组件直接改它的属性 |
| 子组件可能整体替换对象     | 子组件 `value = _bindable(…)`，父级用 `let` 声明并写 `value={_bind(filters)}`              |
| 父级要用子组件的状态或方法 | 控制器对象（见下），不用 expose                                                            |
| 只是通知                   | 回调 prop：`onChange={(value) => …}`                                                       |
| 层级很深                   | `createContext`                                                                            |
| 跨文件共享                 | pinia；或 `export const x = _state({ … })`；会被整体替换的状态导出读写函数                 |

**控制器对象**：用组合式函数创建“状态 + 方法”，父级持有，再作为 prop 交给组件，两边用的是同一份数据。

```tsx
export function useForm<T extends object>(initial: T) {
  const values = _state({ ...initial });
  let submitting = _state(false);
  return {
    values, // 对象：交出去就是同一个响应式对象
    get submitting() {
      return submitting; // 原始值：用 getter 交出去
    },
    reset: () => Object.assign(values, initial),
  };
}

// 父组件
const form = useForm({ name: '' });
<Form controller={form}>…</Form>;
<Button onClick={form.reset}>重置</Button>;
```

组合式函数里的原始值也可以交出 Ref：`return { count: _toRef(count) }`，使用方用 `const { count } = _fromRef(useCounter())` 收成普通变量。

## 8. 编译期检查

**报错**（带源码位置）：

- 导出会被整体替换的状态（`export let x = _state(0)`、`export { x }`）
- 解构声明 `_state`（`let { a } = _state({ … })` 得到的是快照）
- 写入只读的值：`const` 派生值、`const` 状态的整体替换、`const n = _state(0)`
- 把符文当普通值使用（`const make = _state`）、`_toRef(1)` 这类参数不是响应式变量
- `var` 声明响应式变量；在渲染函数里声明 `_state` 或创建 `_effect`
- `_bindable` 写在组件参数解构以外；`_bind` 写在 JSX 属性以外、或绑定只读的值
- `watch(x, cb)` 直接传响应式变量（对象会悄悄监听旧对象）
- 组件函数体里直接读 `children`
- Vue 指令 `v-model`、`v-show`、`v-html` 等，给出 TSX 写法

**警告**：组件函数体里直接读 prop 或状态，只拿到当前值、之后不会更新。有意只要初始值时写 `_untrack(x)`。

被同名本地变量遮蔽的 `_state` 等不当作符文。

## 9. 渲染优化

JSX 交给 vue-jsx 后，没有模板编译器的那几项优化：父组件一重新渲染，带内容的子组件就跟着重做（插槽每次都是新的），收到内联函数的子组件也跟着重做（props 比较时总算“变了”）。编译器在最后一步补上两项，写法不变（`compiler/optimize.ts`）：

| 优化     | 条件                                                     | 效果                                                                                    |
| -------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 稳定插槽 | 组件的子节点没用到“这次渲染才有的值”与非响应式的可变数据 | 插槽标 `$stable`，父组件因为别的状态重新渲染时，子组件不跟着重做                        |
| 缓存     | JSX 属性里的函数、常量数组与对象没用到“这次渲染才有的值” | 每个实例只创建一次（`_cache[i] \|\| (_cache[i] = …)`），子组件的 props 不再每次都“变了” |

- **“这次渲染才有的值”**：渲染函数里声明的变量、`map` 等回调的参数。用到它们的内容与函数保持原样，不会因优化而出错。
- **非响应式的可变数据**：会被重新赋值的普通 `let`、`...rest`（Vue 的 attrs）、用对象或数组字面量初始化的 `const`。它们变了不会通知任何组件，以前靠父组件碰巧重新渲染才刷新，用到它们的内容不标稳定。
- **界面要读响应式数据**：显示在界面上的值请用 `_state` / `_derived` / props；读别处可变数据的函数（例如 setup 里的函数读一个普通对象）在内容里调用时，数据变了不会刷新。
- 原样转交 `<X>{children}</X>` 时，稳不稳定跟着上层：上层的内容每次都变，交出去的也每次都变（运行时判断）。
- 组件上的 `_bind(x)` 直接写出值与 `onUpdate:x` 回调，回调同样被缓存；原生输入框仍走 v-model 指令。
- 实测：父组件计数加一、下面有 Card > Flex > 200 个按钮，5.2ms / 203 个组件更新 → 0.1ms / 1 个；打开 30 项的菜单 32 个组件更新 → 2 个。
- 怀疑哪里因此没更新时，`vueTsxPro({ optimize: false })` 对比。

## 10. 与 Svelte 5 对照

| Svelte 5                                       | 本方案                                      | 说明                                          |
| ---------------------------------------------- | ------------------------------------------- | --------------------------------------------- |
| `$state` / `$state.raw` / `$state.snapshot`    | `_state` / `_state.raw` / `_state.snapshot` | 一致                                          |
| 不能导出会被重新赋值的状态，可以导出对象       | 同                                          |                                               |
| `$derived` / `$derived.by`、解构、`let` 可覆盖 | `_derived` / `_derived.by`                  | 一致                                          |
| `$effect` / `$effect.pre` / `$effect.root`     | `_effect` / `_effect.pre` / `_effect.root`  | 一致；底层是 watchEffect 与 effectScope       |
| `untrack(fn)`                                  | `_untrack(x)`                               | 写成表达式；用 Vue 公开的 ReactiveEffect 实现 |
| `$props()` 解构、普通 prop 可覆盖              | `_component` 参数解构                       | 我们的默认值可以引用前面的 prop               |
| `$bindable` + `bind:x`                         | `_bindable` + `_bind(x)`                    | 编译为 v-model 协议                           |
| `$props.id()` / `$inspect`                     | Vue 的 `useId()` / Devtools                 | 不另造                                        |
| 类字段 `done = $state(false)`                  | 暂不支持                                    | 写正式组件用到时再加                          |
| `bind:value={get, set}`                        | 暂不支持                                    | 用到时再加 `_bind(get, set)`                  |

## 11. 代价与限制

- **看不出哪里被追踪**：去掉 `.value` 后，读代码时分不清普通变量和响应式变量。缓解：声明处必须写符文；编辑器悬停可见类型。这是 Vue 当年放弃 Reactivity Transform 的主要理由，Svelte 5 接受了同样的代价。
- **`_` 前缀保留给符文**：项目代码里普通函数和变量不用 `_` 开头。编译器生成的导入别名是 `_vue_ref`、`_vtp_prop` 这类名字，不会冲突。
- 实现见 `packages/tsx/src/compiler`（编译，渲染优化在 `optimize.ts`）与 `packages/tsx/src/runtime`（`prop`、`bindable`、`overridable`、`snapshot`、`effect`、`forwardChildren`）。
