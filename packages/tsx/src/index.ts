export {
  _component,
  type ComponentOptions,
  type TsxComponent,
  type TsxNode,
} from './runtime/component';
export { createContext, type Context } from './runtime/context';
// 供编译产物使用（作者不直接调用）
export { prop, bindable } from './runtime/props';
export { restProps } from './runtime/component';
export { overridable, snapshot } from './runtime/state';
export { effect, effectRoot } from './runtime/effect';
