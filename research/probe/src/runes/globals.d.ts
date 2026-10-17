/**
 * 符文的类型：在类型层面它们都是“普通值”，编译后才变成 Vue 的 Ref。
 */
import type { Ref } from 'vue'

type UnwrapRefs<T> = { [K in keyof T]: T[K] extends Ref<infer V> ? V : T[K] }

declare global {
  /** 可重新赋值的状态 → ref；const + 对象/数组字面量 → reactive */
  function _state<T>(initial: T): T
  function _state<T>(): T | undefined
  namespace _state {
    /** 只能整体替换的状态 → shallowRef */
    function raw<T>(initial: T): T
    function raw<T>(): T | undefined
  }

  /** 只读派生 → computed(() => expression) */
  function _derived<T>(expression: T): T
  namespace _derived {
    /** 复杂派生 → computed(fn) */
    function by<T>(fn: () => T): T
  }

  /** 组件参数默认值：双向绑定的 prop → defineModel（标准 v-model 协议） */
  function _bindable<T>(fallback?: T): T

  /** 持有外部 Ref（如组合式函数的返回值），之后像普通变量一样读写 */
  function _from<T>(source: Ref<T>): T
  function _from<T extends object>(source: T): UnwrapRefs<T>

  /** 取回响应式变量背后的 Ref，交给需要 Ref 的 Vue API */
  function _ref<T>(value: T): Ref<T>
}

export {}
