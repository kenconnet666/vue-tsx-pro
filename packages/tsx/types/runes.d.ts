/**
 * 符文的类型：在类型层面它们都是“普通值”，编译后才变成 Vue 的 Ref。
 */
import type { Ref } from 'vue';

/**
 * _fromRef 解构时只接受 Ref 属性：编译后每个解构出的变量都按 .value 读写，
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
  /**
   * 响应式状态 → ref，之后像普通变量一样读写。
   * let 可以整体替换；const 不能整体替换，对象的属性照常可改。
   * 跨文件共享：`export const settings = _state({...})` 可以直接导出（导出的是 ref 里的对象本身）。
   */
  function _state<T>(initial: T): T;
  function _state<T>(): T | undefined;
  namespace _state {
    /** 只能整体替换的状态 → shallowRef */
    function raw<T>(initial: T): T;
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

  /** 组件参数默认值：可双向绑定的 prop，父级写 属性={_bind(x)}；不绑定时就是组件自己的状态 */
  function _bindable<T>(fallback?: T): T;

  /**
   * 双向绑定，与 _bindable 成对：<Switch checked={_bind(on)} />、<input value={_bind.trim(name)} />
   * 编译为 Vue 的 v-model；参数是 let 声明的响应式变量或对象属性
   */
  const _bind: Bind;

  /**
   * Ref → 变量：持有外部 Ref（组合式函数、storeToRefs 的返回值），之后像普通变量一样读写，写入直接落到原 Ref。
   * 与 _toRef 互逆：`let theme = _fromRef(useStorage('theme', 'dark'))`、`const { x, y } = _fromRef(useMouse())`
   */
  function _fromRef<T>(source: Ref<T>): T;
  function _fromRef<T extends object>(source: T): UnwrapRefs<T>;

  /**
   * 变量 → Ref：取回响应式变量背后的 Ref，交给需要可写 Ref 的 API。与 _fromRef 互逆：`useIncrement(_toRef(count))`。
   * 只读的场合传 getter 就够了：`watch(() => count, …)`
   */
  function _toRef<T>(value: T): Ref<T>;
}

export {};
