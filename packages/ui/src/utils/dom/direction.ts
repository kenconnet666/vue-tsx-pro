/** 排版方向：从右到左时方向键、拖动、滚动位置要换边 */

/** 元素是否处在从右到左排版里（按计算后的 direction，跟随 dir 属性与 CSS） */
export function isRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}
