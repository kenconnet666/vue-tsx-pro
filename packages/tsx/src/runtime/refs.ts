/**
 * 元素 ref 的合并。Vue 的 mergeProps 对 ref 是后者盖前者：JSX 里 `<div {...css.attrs(…)} ref={el}>` 编译成
 * mergeProps(attrs, { ref })，样式绑定的 ref（css.attrs 交出，元素挂上后改变量、换类）与使用方的 ref 就会互相盖掉。
 *
 *   mergeJsxProps(...)   编译产物里 JSX 属性的合并（编译器把 Vue JSX 生成的 mergeProps 换成它）
 *   mergeRefs([a, b])    几个 ref 合成一个，组件库的部件属性合并也用它
 */
import { mergeProps, type Ref } from 'vue';

/** 能交给元素 ref 的值：回调或 Ref（字符串 ref 是模板写法，TSX 里不用） */
export type RefSetter = ((element: unknown) => void) | Ref<unknown>;

/** 把元素交给一个 ref：回调就调用，Ref 就写进 value */
export function setRef(ref: RefSetter, element: unknown): void {
  if (typeof ref === 'function') ref(element);
  else ref.value = element;
}

/** 几个 ref 合成一个，每个都拿到元素（卸载时都拿到 null）；只有一个时原样返回 */
export function mergeRefs(refs: readonly RefSetter[]): RefSetter | undefined {
  if (refs.length < 2) return refs[0];
  return (element: unknown) => {
    for (const ref of refs) setRef(ref, element);
  };
}

/** 编译产物里 JSX 属性的合并：同 Vue 的 mergeProps，另外几层都给了 ref 时合成一个 */
export function mergeJsxProps(
  ...layers: Parameters<typeof mergeProps>
): ReturnType<typeof mergeProps> {
  const merged = mergeProps(...layers);
  let refs: RefSetter[] | undefined;
  for (const layer of layers) {
    const ref = (layer as { ref?: unknown } | null)?.ref;
    if (ref == null) continue;
    // 有字符串 ref 时照 Vue 原来的规则（后者盖前者），不知道该怎么合
    if (typeof ref === 'string') return merged;
    (refs ??= []).push(ref as RefSetter);
  }
  if (refs && refs.length > 1) (merged as { ref?: unknown }).ref = mergeRefs(refs);
  return merged;
}
