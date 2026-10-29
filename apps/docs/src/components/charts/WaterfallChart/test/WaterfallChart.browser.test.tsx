// WaterfallChart 在真实浏览器里：每步一根柱子，后一步接着前一步的累计，往上、往下两种颜色；点一根柱子下钻
import { expect, it } from 'vitest';
import { click } from '../../../../test/chart';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Budget from '../demo/Budget';
import Versions from '../demo/Versions';

/** 柱子，从左到右 */
const bars = (root: Element) =>
  [...root.querySelectorAll('[data-part="bar"]')]
    .filter((bar) => bar.getBoundingClientRect().height > 0.5)
    .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);

it('7 步 7 根柱子：材料单价从 V1 的顶往下，成材率从材料单价的底往上，V2 到批量的顶', async () => {
  const root = mount(Versions);
  await until(() => bars(root).length === 7);
  // 等进场动画结束
  await new Promise((resolve) => setTimeout(resolve, 600));
  const boxes = bars(root).map((bar) => bar.getBoundingClientRect());
  const [v1, material, yieldRate, , , batch, v2] = boxes;
  expect(material!.top).toBeCloseTo(v1!.top, 0);
  expect(yieldRate!.bottom).toBeCloseTo(material!.bottom, 0);
  expect(v2!.top).toBeCloseTo(batch!.top, 0);
  const fills = bars(root).map((bar) => getComputedStyle(bar).fill);
  // 往下（材料单价）与往上（成材率）两种颜色，合计柱又是一种
  expect(new Set([fills[0], fills[1], fills[2]]).size).toBe(3);
});

it('点“外包”那根柱子下钻', async () => {
  const root = mount(Budget);
  await until(() => bars(root).length === 7);
  await new Promise((resolve) => setTimeout(resolve, 600));
  click(bars(root)[2]!);
  await until(() => root.textContent!.includes('点了：外包'));
});
