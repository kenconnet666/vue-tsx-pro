/**
 * _component()：唯一的组件边界。
 *
 * 一切基于 props：作者只写参数解构与默认值，编译器（compiler/index.ts）把它们换成
 * prop 访问器，并补上组件名与 props 声明作为第二个参数。运行时这里只做两件事：
 *
 *   1. 返回一个普通的 Vue 组件对象（Vue 组件本来就是对象，不需要 defineComponent）
 *   2. 把默认插槽映射成 props.children，内容也是 prop
 */
import {
  getCurrentInstance,
  type Component,
  type ComponentInternalInstance,
  type SetupContext,
  type VNode,
  type VNodeChild,
} from 'vue';

/** setup 返回渲染函数；setup 本身只执行一次 */
type Render = () => VNodeChild;

export interface ComponentOptions {
  /** 组件名，DevTools 与警告信息里显示；编译器从 const X = _component(...) 自动补上 */
  name?: string;
  /** Vue 的 props 声明（名字列表）；编译器从参数解构自动生成 */
  props?: string[];
}

/**
 * 类型上把组件描述为“接收 props 的函数”：JSX 直接按参数类型检查属性，
 * 泛型组件 _component(<T,>(props: { items: T[] }) => …) 的类型参数也能保留下来。
 */
export function _component<P extends object = {}>(
  setup: (props: P) => Render,
  options?: ComponentOptions,
): (props: P) => VNode;

export function _component(
  setup: (props: object, ctx: SetupContext) => Render,
  options: ComponentOptions = {},
): Component {
  return {
    // 未声明为 prop 的属性不自动落到根元素，由作者用 ...rest 决定放在哪里
    inheritAttrs: false,
    ...options,
    setup: (props, ctx) => setup(withChildren(props, ctx, getCurrentInstance()!), ctx),
  };
}

/** 只拦截 children，其余属性原样交给 Vue 的 props（保持依赖收集） */
function withChildren(props: object, ctx: SetupContext, instance: ComponentInternalInstance) {
  return new Proxy(props, {
    get(target, key, receiver) {
      return key === 'children' ? readChildren(ctx, instance) : Reflect.get(target, key, receiver);
    },
  });
}

/**
 * JSX 子节点被编译成默认插槽，这里还原成 children prop：
 *   - 带参数的函数子节点（<List>{(item) => …}</List>）是渲染函数，原样交给组件按需调用
 *   - 其余内容在读取时才执行插槽：读取发生在子组件的渲染函数里，内容是惰性的，依赖也归属子组件
 *
 * Vue 会把插槽统一包一层 (...args) => …，参数个数只能从 vnode 上的原始插槽判断。
 */
function readChildren(ctx: SetupContext, instance: ComponentInternalInstance) {
  const raw = (instance.vnode.children as Record<string, unknown> | null)?.default;
  if (typeof raw === 'function' && raw.length > 0) return raw;
  return ctx.slots.default?.() ?? ctx.attrs.children;
}
