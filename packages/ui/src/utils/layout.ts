/**
 * 布局计算里反复用到的小工具：取值夹在范围内、判断排版方向。
 */

/** 把 value 夹在 [min, max] 之间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 元素是否处在从右到左排版里（按计算后的 direction，跟随 dir 属性与 CSS） */
export function isRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}
