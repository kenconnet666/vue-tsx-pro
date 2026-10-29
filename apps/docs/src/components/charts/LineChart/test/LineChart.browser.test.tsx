// LineChart 在真实浏览器里：每个系列一条线、空心数据点，悬停时十字线与提示框，空值处断开
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Basic from '../demo/Basic';
import Gaps from '../demo/Gaps';

const lines = (root: Element) =>
  [...root.querySelectorAll<SVGPathElement>('[data-part="line"]')].filter((path) =>
    path.getAttribute('d'),
  );
const dots = (root: Element) => root.querySelectorAll('[data-part="dot"]');

it('两条线；空心的数据点：12 个月 × 2 个系列', async () => {
  const root = mount(Basic);
  await until(() => dots(root).length === 24);
  await until(() => lines(root).length >= 2);
});

it('悬停：提示框列出当月各系列的值', async () => {
  const root = mount(Basic);
  await until(() => dots(root).length === 24);
  const svg = root.querySelector('svg')!;
  const box = svg.getBoundingClientRect();
  svg.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      clientX: box.right - 20,
      clientY: box.top + box.height / 2,
    }),
  );
  const text = await until(() => {
    const content = root.querySelector('[role="figure"] [aria-hidden="true"]')!.textContent!;
    return content.includes('实际销售') && content;
  });
  expect(text).toContain('12月');
  // 数字与单位之间是不换行的空格
  expect(text).toContain('360\u00a0万元');
});

it('空值不画点：8 个月里 6 月没有数据，只有 7 个点', async () => {
  const root = mount(Gaps);
  await until(() => dots(root).length === 7);
  // 等一会儿，确认不是还没画完
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(dots(root)).toHaveLength(7);
});
