export {
  _component,
  type ComponentOptions,
  type TsxComponent,
  type TsxNode,
} from './runtime/component';
export { createContext, type Context } from './runtime/context';
// 供编译产物使用（作者不直接调用）
export { prop, readonlyProp, childrenProp, bindable } from './runtime/props';
export { restProps, childrenStable, forwardChildren } from './runtime/component';
export { overridable, snapshot, untrack } from './runtime/state';
export { effect, effectRoot } from './runtime/effect';
export { mergeJsxProps, mergeRefs, setRef, type RefSetter } from './runtime/refs';
// 组件库合并部件属性时用：...rest 交出背后的普通对象，不穿过 Proxy
export { ownProps } from './runtime/component';
