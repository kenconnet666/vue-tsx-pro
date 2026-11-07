/** 属性里写的 CSS 长度（minItemWidth、minFieldWidth）换成像素，给要按宽度算列数的组件用 */

/** CSS 长度换成 px：认 px、em（按元素的字号）、rem；别的单位（calc、%）返回 null */
export function lengthToPx(length: string, element: Element): number | null {
  const match = /^(\d*\.?\d+)(px|r?em)$/.exec(length.trim());
  if (!match) return null;
  const value = Number(match[1]);
  if (match[2] === 'px') return value;
  const from = match[2] === 'rem' ? document.documentElement : element;
  return value * parseFloat(getComputedStyle(from).fontSize);
}
