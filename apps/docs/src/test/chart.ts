// 图表浏览器测试的交互：把指针移到一个图形或一个类目上（图表按 pointermove 找悬停的图形、类目），读提示框的文字。
// 图形用 data-part 找（bar、line、area、dot、point、segment、node、link、feature…），提示框是 data-part="tooltip"
//
//   hover(root.querySelectorAll('[data-part="segment"]')[0]!);
//   const text = await until(() => tooltipText(root).includes('搜索引擎') && tooltipText(root));

/** 指针移到元素的中心（事件从元素冒泡到图表的 SVG） */
export function hover(element: Element): void {
  const box = element.getBoundingClientRect();
  element.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      clientX: box.left + box.width / 2,
      clientY: box.top + box.height / 2,
    }),
  );
}

/** 点一下元素 */
export function click(element: Element): void {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/** 提示框的文字（没有显示或正在淡出时是空串）；不含给读屏的数据表 */
export function tooltipText(root: Element): string {
  const box = root.querySelector<HTMLElement>('[data-part="tooltip"]');
  return box && getComputedStyle(box).opacity !== '0' ? (box.textContent ?? '') : '';
}

/** XY 图表：指针移到某个类目（按坐标轴上的刻度文字找横坐标）的竖线上，触发十字线与提示框 */
export function hoverCategory(root: Element, category: string): void {
  const svg = root.querySelector('svg')!;
  const tick = [...svg.querySelectorAll('text')].find((text) => text.textContent === category)!;
  const x = tick.getBoundingClientRect();
  const box = svg.getBoundingClientRect();
  svg.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      clientX: x.left + x.width / 2,
      clientY: box.top + box.height / 2,
    }),
  );
}
