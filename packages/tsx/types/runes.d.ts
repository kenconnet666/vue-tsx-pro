/**
 * 符文的类型：在类型层面它们都是“普通值”，编译后才变成 Vue 的 Ref。
 */
import type { Ref } from 'vue';

/**
 * _from 解构时只接受 Ref 属性：编译后每个解构出的变量都按 .value 读写，
 * 函数等非 Ref 属性会变成 never，提示从原对象单独解构，例如 const { reset } = useX()
 */
type UnwrapRefs<T> = { [K in keyof T]: T[K] extends Ref<infer V> ? V : never };

/** _bind 与它的修饰符（可以连写：_bind.lazy.trim）；类型上就是传入的值本身 */
interface Bind {
  <T>(target: T): T;
  /** 去掉首尾空白（原生输入元素） */
  readonly trim: Bind;
  /** 转成数字（原生输入元素） */
  readonly number: Bind;
  /** change 时才同步，而不是每次输入（原生输入元素） */
  readonly lazy: Bind;
}

declare global {
  /** 可重新赋值的状态 → ref；const + 对象/数组字面量 → reactive */
  function _state<T>(initial: T): T;
  function _state<T>(): T | undefined;
  namespace _state {
    /** 只能整体替换的状态 → shallowRef */
    function raw<T>(initial: T): T;
    function raw<T>(): T | undefined;
  }

  /** 只读派生 → computed(() => expression) */
  function _derived<T>(expression: T): T;
  namespace _derived {
    /** 复杂派生 → computed(fn) */
    function by<T>(fn: () => T): T;
  }

  /** 组件参数默认值：可双向绑定的 prop，父级写 属性={_bind(x)}；不绑定时就是组件自己的状态 */
  function _bindable<T>(fallback?: T): T;

  /**
   * 双向绑定，与 _bindable 成对：<Switch checked={_bind(on)} />、<input value={_bind.trim(name)} />
   * 编译为 Vue 的 v-model；参数是 let 声明的响应式变量或对象属性
   */
  const _bind: Bind;

  /** 持有外部 Ref（如组合式函数的返回值），之后像普通变量一样读写 */
  function _from<T>(source: Ref<T>): T;
  function _from<T extends object>(source: T): UnwrapRefs<T>;

  /** 取回响应式变量背后的 Ref，交给需要 Ref 的 Vue API */
  function _ref<T>(value: T): Ref<T>;
}

export {};
