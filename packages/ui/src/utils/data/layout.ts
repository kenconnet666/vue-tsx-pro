/**
 * 布局与取值计算里反复用到的小工具：取值夹在范围内、对齐到步长、判断排版方向。
 */

/** 把 value 夹在 [min, max] 之间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 小数位数：0.1 → 1 */
const decimals = (value: number) => (String(value).split('.')[1] ?? '').length;

/**
 * 夹在 [min, max] 之间并对齐到 min + n × step（没有 min 时对齐到 0 + n × step）；
 * 结果按 step 与 min 的小数位取整，不带进 0.1 + 0.2 这类浮点误差。Slider、NumberField 共用
 */
export function snapToStep(value: number, step: number, min = -Infinity, max = Infinity): number {
  const base = Number.isFinite(min) ? min : 0;
  const stepped = base + Math.round((value - base) / step) * step;
  const places = Math.max(decimals(step), Number.isFinite(min) ? decimals(min) : 0);
  return Number(clamp(stepped, min, max).toFixed(places));
}

/** 元素是否处在从右到左排版里（按计算后的 direction，跟随 dir 属性与 CSS） */
export function isRtl(element: Element): boolean {
  return getComputedStyle(element).direction === 'rtl';
}
