/**
 * 符文的类型：在类型层面它们都是“普通值”，编译后才变成 Vue 的 Ref。
 */
import type { Ref } from 'vue';

/**
 * _fromRef 解构时只接受 Ref 属性：编译后每个解构出的变量都按 .value 读写，
 * 函数等非 Ref 属性会变成 never，提示从原对象单独解构，例如 const { reset } = useX()
 */
type UnwrapRefs<T> = { [K in keyof T]: T[K] extends Ref<infer V> ? V : never };

/** 原生输入框绑定的修饰符（可以连写：_bind.lazy.trim）；类型上就是传入的值本身 */
interface BindModifiers {
  /** 去掉首尾空白 */
  readonly trim: BindModifier;
  /** 转成数字（<input type="number"> 与 type="range" 不用写，自动按数字） */
  readonly number: BindModifier;
  /** change 时才同步，而不是每次输入 */
  readonly lazy: BindModifier;
}

/** 一个修饰符：_value={_bind.trim(name)}，参数是可写的变量或对象属性 */
interface BindModifier extends BindModifiers {
  <T>(target: T): T;
}

declare global {
  /**
   * 响应式状态 → ref，之后像普通变量一样读写。
   * let 可以整体替换；const 不能整体替换，对象的属性照常可改。
   * 跨文件共享：`export const settings = _state({...})` 可以直接导出（导出的是 ref 里的对象本身）。
   */
  function _state<T>(initial: T): T;
  /** 没有初始值的响应式状态 → ref()，初始为 undefined */
  function _state<T>(): T | undefined;
  namespace _state {
    /** 只能整体替换的状态 → shallowRef */
    function raw<T>(initial: T): T;
    /** 没有初始值、只能整体替换的状态 → shallowRef()：DOM 元素、第三方实例 */
    function raw<T>(): T | undefined;
    /** 去掉响应式代理的静态深拷贝，交给 structuredClone、第三方库或日志 */
    function snapshot<T>(value: T): T;
  }

  /**
   * 派生值。const → computed，只读；let → 可以临时覆盖（乐观更新），依赖变化后重新跟随。
   */
  function _derived<T>(expression: T): T;
  namespace _derived {
    /** 复杂派生：派生逻辑写成函数，其余同 _derived */
    function by<T>(fn: () => T): T;
  }

  /**
   * 副作用（同 Svelte 的 $effect）：挂载后、每次 DOM 更新后执行，读到的响应式变量自动成为依赖。
   * 返回的函数在下次执行前、销毁时调用。只用于副作用（DOM、订阅、日志）；派生值请用 _derived。
   * 只想监听指定的值时用 Vue 的 watch(() => x, cb)。
   */
  function _effect(fn: () => void | (() => void)): void;
  namespace _effect {
    /** DOM 更新前执行，例如自动滚动前先测量 */
    function pre(fn: () => void | (() => void)): void;
    /** 不随组件销毁的副作用作用域，返回清理函数；里面可以创建 _effect */
    function root(fn: () => void | (() => void)): () => void;
  }

  /**
   * 组件参数默认值：可双向绑定的 prop，键名以下划线开头、本地变量不带下划线：({ _checked: checked = _bindable(false) })；
   * 父级传可写的变量或对象属性就双向绑定（_checked={on}），传别的值只是初始值或受控值，都不传就是组件自己的状态
   */
  function _bindable<T>(fallback?: T): T;

  /**
   * 原生输入框绑定的修饰符：<input _value={_bind.trim(name)} />、<input _value={_bind.lazy(note)} />。
   * 一般的双向绑定不用它：下划线属性的值是可写的变量或对象属性时自动绑定（<Switch _checked={on} />）
   */
  const _bind: BindModifiers;

  /**
   * Ref → 变量：持有外部 Ref（组合式函数、storeToRefs 的返回值），之后像普通变量一样读写，写入直接落到原 Ref。
   * 与 _toRef 互逆：`let theme = _fromRef(useStorage('theme', 'dark'))`、`const { x, y } = _fromRef(useMouse())`
   */
  function _fromRef<T>(source: Ref<T>): T;
  /** 解构持有对象里的多个 Ref：`const { x, y } = _fromRef(useMouse())`，每个变量读写对应的 Ref */
  function _fromRef<T extends object>(source: T): UnwrapRefs<T>;

  /**
   * 变量 → Ref：取回响应式变量背后的 Ref，交给需要可写 Ref 的 API。与 _fromRef 互逆：`useIncrement(_toRef(count))`。
   * 只读的场合传 getter 就够了：`watch(() => count, …)`
   */
  function _toRef<T>(value: T): Ref<T>;

  /**
   * 只取当前值、不追踪（同 Svelte 的 untrack）：写在 _effect、_derived 里时不会因为它重新执行；
   * 写在组件函数体里表示有意只要初始值，例如 `let collapsed = _state(_untrack(!open))`，编译器不再警告
   */
  function _untrack<T>(value: T): T;
}

export {};
