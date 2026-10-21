/** 模板 ref 的取值换成 DOM 元素 */

/** ref 落在组件上拿到的是组件实例，取它的根元素；本来就是元素时原样返回 */
export function toElement(value: unknown): HTMLElement | null {
  if (value instanceof HTMLElement) return value;
  const root = (value as { $el?: unknown } | null)?.$el;
  return root instanceof HTMLElement ? root : null;
}
