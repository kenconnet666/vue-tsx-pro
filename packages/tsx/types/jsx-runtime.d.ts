/**
 * JSX 类型入口（tsconfig 的 jsxImportSource 指向本包时由 TypeScript 读取）。
 *
 * 在 Vue 自带的 JSX 类型（vue/jsx-runtime）上做三处调整：
 *   1. 内容即 props：JSX 子节点按组件的 children prop 检查
 *   2. _component 定义的组件：属性直接按 setup 参数的类型检查，泛型也能推导；
 *      其他 Vue 组件（Transition、Teleport 等内置组件）的子节点照常走默认插槽
 *   3. 原生元素的事件参数带上具体的 currentTarget：<input onInput={(e) => e.currentTarget.value} />
 *
 * 双向绑定写成 属性={_bind(x)}，属性名就是 prop 本身，补全、跳转、重命名都由 TypeScript 原生支持。
 */
// 顺带加载符文的全局类型：只要配置了 jsxImportSource，就能直接使用 _state 等
import type {} from './runes';
import type { VNodeChild } from 'vue';
import type { JSX as VueJSX } from 'vue/jsx-runtime';

/**
 * _component 定义的组件：返回值带 '~tsx' 标记（见 runtime/component.ts）。
 * Vue 的 FunctionalComponent 返回 any，要先排除，否则会被误判。
 */
type IsTsxComponent<C> = C extends (...args: any) => infer R
  ? 0 extends 1 & R
    ? false
    : R extends { readonly '~tsx': true }
      ? true
      : false
  : false;

type ElementOf<Tag> = Tag extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[Tag]
  : Tag extends keyof SVGElementTagNameMap
    ? SVGElementTagNameMap[Tag]
    : Element;

/** onXxx 事件处理函数的参数补上 currentTarget 的元素类型 */
type WithCurrentTarget<Attributes, El> = {
  [Name in keyof Attributes]: Name extends `on${string}`
    ? NonNullable<Attributes[Name]> extends (event: infer E) => unknown
      ? (event: E & { currentTarget: El }) => void
      : Attributes[Name]
    : Attributes[Name];
};

export declare namespace JSX {
  interface Element extends VueJSX.Element {}
  interface ElementClass extends VueJSX.ElementClass {}
  interface ElementAttributesProperty extends VueJSX.ElementAttributesProperty {}
  /** 子节点对应的 prop 名 */
  interface ElementChildrenAttribute {
    children: {};
  }
  type IntrinsicElements = {
    [Tag in keyof VueJSX.IntrinsicElements]: WithCurrentTarget<
      VueJSX.IntrinsicElements[Tag],
      ElementOf<Tag>
    > & { children?: VNodeChild };
  };
  interface IntrinsicAttributes extends VueJSX.IntrinsicAttributes {}
  type LibraryManagedAttributes<C, P> = C extends string
    ? P
    : IsTsxComponent<C> extends true
      ? // _component：setup 参数就是全部属性（子节点即 children prop）
        P
      : // 其他 Vue 组件：内容走默认插槽
        P & { children?: unknown };
}

// Vue 3.5 的 HTML 属性类型还没有原生 Popover API 的属性，这里补上（只是类型，运行时原样交给浏览器）
declare module 'vue' {
  interface HTMLAttributes {
    /** 原生弹层：auto 自带 Esc 与点击外部关闭，manual 只由代码开关，hint 不关闭其他 auto 弹层 */
    popover?: 'auto' | 'manual' | 'hint' | '' | undefined;
  }
  interface ButtonHTMLAttributes {
    /** 点击时开关的弹层元素 id */
    popovertarget?: string | undefined;
    /** 点击时对弹层做什么，默认 toggle */
    popovertargetaction?: 'toggle' | 'show' | 'hide' | undefined;
  }
}
