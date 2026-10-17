/**
 * JSX 类型入口（tsconfig 的 jsxImportSource 指向本包时由 TypeScript 读取）。
 *
 * 在 vue-jsx 的 JSX 类型上做三处调整，让“一切基于 props”在类型上成立：
 *   1. 内容即 props：JSX 子节点按组件的 children prop 检查（vue-jsx 原本按插槽 v-slots 检查）
 *   2. _component 定义的组件：属性直接按 setup 参数的类型检查，泛型也能推导
 *   3. 每个 prop K 都可以写成 v-model:K，类型与 K 相同。TypeScript 不对带连字符的属性名
 *      做多余属性检查，默认情况下 v-model:xxx 写错类型也不会报错
 */
// 顺带加载符文的全局类型：只要配置了 jsxImportSource，就能直接使用 _state 等
import type {} from './runes';
import type { JSX as VueJsx, NodeChild } from 'vue-jsx';

/** Vue 保留的 VNode 属性不参与 v-model */
type Reserved = 'key' | 'ref' | 'ref_for' | 'ref_key' | 'class' | 'style' | `onVnode${string}`;

type ModelProps<P> = {
  [K in keyof P as K extends Reserved ? never : K extends string ? `v-model:${K}` : never]?: P[K];
} & ('modelValue' extends keyof P ? { 'v-model'?: P['modelValue' & keyof P] } : {});

export declare namespace JSX {
  type Element = VueJsx.Element;
  interface ElementAttributesProperty extends VueJsx.ElementAttributesProperty {}
  /** 子节点对应的 prop 名 */
  interface ElementChildrenAttribute {
    children: {};
  }
  /** 原生元素同样用 children 接收子节点 */
  type IntrinsicElements = {
    [K in keyof VueJsx.IntrinsicElements]: VueJsx.IntrinsicElements[K] & { children?: NodeChild };
  };
  interface IntrinsicAttributes extends VueJsx.IntrinsicAttributes {}
  type LibraryManagedAttributes<C, P> = C extends abstract new (...args: any) => any
    ? // 其他 Vue 组件（第三方库、defineComponent）：沿用 vue-jsx 的推导，内容走默认插槽
      VueJsx.LibraryManagedAttributes<C, P> & ModelProps<P> & { children?: unknown }
    : // _component 定义的组件：setup 参数就是全部属性
      P & ModelProps<P>;
}
