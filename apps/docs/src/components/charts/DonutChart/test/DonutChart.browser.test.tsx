// DonutChart 在真实浏览器里：每项一个扇区，中间是合计；悬停看数值与占比；点图例隐藏一项后合计重算；饼图没有中心文字
import { expect, it } from 'vitest';
import { hover, tooltipText } from '../../../../test/chart';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Budget from '../demo/Budget';
import Sources from '../demo/Sources';

const segments = (root: Element) =>
  [...root.querySelectorAll('[class*="donut-component"] path[class*="segment"]')].filter((path) =>
    path.getAttribute('d'),
  );
const center = (root: Element) =>
  [...root.querySelectorAll('[class*="central-label"]')]
    .map((text) => text.textContent)
    .filter(Boolean)
    .join(' ');

it('5 个扇区，中间写合计与说明；悬停搜索引擎：数值与占比', async () => {
  const root = mount(Sources);
  const all = await until(() => segments(root).length === 5 && segments(root));
  expect(center(root)).toBe('11,950 本周访问');
  await new Promise((resolve) => setTimeout(resolve, 500));
  hover(all[0]!);
  const text = await until(() => tooltipText(root).includes('搜索引擎') && tooltipText(root));
  expect(text).toContain('4,820 次');
  expect(text).toContain('40.3%');
});

it('点图例隐藏搜索引擎：剩 4 个扇区，合计变成 7,130', async () => {
  const root = mount(Sources);
  await until(() => segments(root).length === 5);
  root.querySelector<HTMLButtonElement>('[role="group"] button')!.click();
  await until(() => center(root).startsWith('7,130'));
  await until(() => segments(root).length === 4);
});

it('饼图（arcWidth 为 0）：4 个扇区、没有中心文字', async () => {
  const root = mount(Budget);
  await until(() => segments(root).length === 4);
  expect(center(root)).toBe('');
});
