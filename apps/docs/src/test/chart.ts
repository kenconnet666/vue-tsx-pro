// 图表浏览器测试的交互：把指针移到一个图形或一个类目上（Unovis 的提示框按 mousemove、mouseover 触发），读提示框的文字。
// Unovis 对连续的指针事件节流：一个测试里只移一次
//
//   hover(root.querySelectorAll('[class*="segment"]')[0]!);
//   const text = await until(() => tooltipText(root).includes('搜索引擎') && tooltipText(root));

/** 指针移到元素的中心 */
export function hover(element: Element): void {
  const box = element.getBoundingClientRect();
  const init = {
    bubbles: true,
    clientX: box.left + box.width / 2,
    clientY: box.top + box.height / 2,
  };
  element.dispatchEvent(new MouseEvent('mouseover', init));
  element.dispatchEvent(new MouseEvent('mousemove', init));
}

/** 点一下元素 */
export function click(element: Element): void {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/** 提示框的文字（没有显示时是空串）；不含给读屏的数据表。提示框里的内容也带 tooltip 的类名，取最外层的 */
export function tooltipText(root: Element): string {
  const box = root.querySelector<HTMLElement>('[class*="tooltip"]');
  return box && getComputedStyle(box).opacity !== '0' ? (box.textContent ?? '') : '';
}

/** XY 图表：指针移到某个类目（按坐标轴上的刻度文字找横坐标）的竖线上，触发十字线与提示框 */
export function hoverCategory(root: Element, category: string): void {
  const svg = root.querySelector('svg')!;
  const tick = [...svg.querySelectorAll('text')].find((text) => text.textContent === category)!;
  const x = tick.getBoundingClientRect();
  const box = svg.getBoundingClientRect();
  svg.dispatchEvent(
    new MouseEvent('mousemove', {
      bubbles: true,
      clientX: x.left + x.width / 2,
      clientY: box.top + box.height / 2,
    }),
  );
}
