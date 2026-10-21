/** 排版方向：从右到左时方向键、拖动、滚动位置要换边 */

/** 元素是否处在从右到左排版里（按计算后的 direction，跟随 dir 属性与 CSS） */
export function isRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}

/** 行内方向的左右键 */
export interface InlineArrows {
  /** 朝行尾：从左到右时是 →，从右到左时是 ← */
  readonly forward: 'ArrowRight' | 'ArrowLeft';
  /** 朝行首：从左到右时是 ←，从右到左时是 → */
  readonly backward: 'ArrowRight' | 'ArrowLeft';
}

const LTR_ARROWS: InlineArrows = { forward: 'ArrowRight', backward: 'ArrowLeft' };
const RTL_ARROWS: InlineArrows = { forward: 'ArrowLeft', backward: 'ArrowRight' };

/** 按排版方向取行内的前进、后退键：`const { forward, backward } = inlineArrows(isRtl(root))` */
export const inlineArrows = (rtl: boolean): InlineArrows => (rtl ? RTL_ARROWS : LTR_ARROWS);
