/**
 * JSX 类型入口（tsconfig 的 jsxImportSource 指向本包时由 TypeScript 读取）。
 *
 * 在 vue-jsx 的 JSX 类型上只加一层：组件的每个 prop K 都可以写成 v-model:K，类型与 K 相同。
 * 原因：TypeScript 不对带连字符的 JSX 属性名做多余属性检查，默认情况下 v-model:xxx 写错类型也不会报错。
 */
// 顺带加载符文的全局类型：只要配置了 jsxImportSource，就能直接使用 _state 等
import type {} from './runes';
import type { JSX as VueJsx } from 'vue-jsx';

/** Vue 保留的 VNode 属性不参与 v-model */
type Reserved = 'key' | 'ref' | 'ref_for' | 'ref_key' | 'class' | 'style' | `onVnode${string}`;

type ModelProps<P> = {
  [K in keyof P as K extends Reserved ? never : K extends string ? `v-model:${K}` : never]?: P[K];
} & ('modelValue' extends keyof P ? { 'v-model'?: P['modelValue' & keyof P] } : {});

export declare namespace JSX {
  type Element = VueJsx.Element;
  interface ElementAttributesProperty extends VueJsx.ElementAttributesProperty {}
  interface ElementChildrenAttribute extends VueJsx.ElementChildrenAttribute {}
  interface IntrinsicElements extends VueJsx.IntrinsicElements {}
  interface IntrinsicAttributes extends VueJsx.IntrinsicAttributes {}
  type LibraryManagedAttributes<C, P> = VueJsx.LibraryManagedAttributes<C, P> & ModelProps<P>;
}
