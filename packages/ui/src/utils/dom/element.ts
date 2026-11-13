/** 模板 ref 的取值换成 DOM 元素；判断是不是元素（服务端渲染时没有 HTMLElement 这个全局，也能安全调用） */

/** 是不是 HTML 元素；服务端渲染时总是 false（直接写 `instanceof HTMLElement` 在服务端会抛 ReferenceError） */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

/** ref 落在组件上拿到的是组件实例，取它的根元素；本来就是元素时原样返回 */
export function toElement(value: unknown): HTMLElement | null {
  if (isHTMLElement(value)) return value;
  const root = (value as { $el?: unknown } | null)?.$el;
  return isHTMLElement(root) ? root : null;
}

/**
 * 图片是不是已经加载好了：load 在监听接上之前就发生过时（服务端渲染后水合、缓存里的图）不会再来一次，
 * 元素挂上时用它补一次
 */
export function imageLoaded(element: unknown): boolean {
  return element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0;
}
