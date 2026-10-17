// 在 vue-jsx 的 JSX 类型上只加一层：让组件的每个 prop K 都能写成 v-model:K，类型与 K 相同
import type { JSX as VueJsx } from 'vue-jsx'
export { Fragment, jsx, jsxDEV, jsxs } from 'vue-jsx/jsx-runtime'

/** Vue 保留的 VNode 属性不参与 v-model */
type Reserved = 'key' | 'ref' | 'ref_for' | 'ref_key' | 'class' | 'style' | `onVnode${string}`

type ModelProps<P> = {
  [K in keyof P as K extends Reserved ? never : K extends string ? `v-model:${K}` : never]?: P[K]
} & ('modelValue' extends keyof P ? { 'v-model'?: P['modelValue' & keyof P] } : {})

export declare namespace JSX {
  type Element = VueJsx.Element
  interface ElementAttributesProperty extends VueJsx.ElementAttributesProperty {}
  interface ElementChildrenAttribute extends VueJsx.ElementChildrenAttribute {}
  interface IntrinsicElements extends VueJsx.IntrinsicElements {}
  interface IntrinsicAttributes extends VueJsx.IntrinsicAttributes {}
  type LibraryManagedAttributes<C, P> = VueJsx.LibraryManagedAttributes<C, P> & ModelProps<P>
}
