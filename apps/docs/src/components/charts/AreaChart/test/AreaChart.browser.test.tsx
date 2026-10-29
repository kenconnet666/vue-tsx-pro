// AreaChart 在真实浏览器里：每个系列一片面积，悬停列出当天各系列；堆叠切到占比时数值轴到 100%，图例隐藏一层
import { expect, it } from 'vitest';
import { hoverCategory, tooltipText } from '../../../../test/chart';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Stacked from '../demo/Stacked';
import Traffic from '../demo/Traffic';

const areas = (root: Element) =>
  [...root.querySelectorAll('[data-part="area"]')].filter((path) => path.getAttribute('d'));
const ticks = (root: Element) =>
  [...root.querySelectorAll('svg text')].map((text) => text.textContent);

it('两片面积；悬停周四：提示框列出周四的新访客与回访访客', async () => {
  const root = mount(Traffic);
  await until(() => areas(root).length === 2);
  // 等进场动画结束
  await new Promise((resolve) => setTimeout(resolve, 500));
  hoverCategory(root, '周四');
  const text = await until(() => tooltipText(root).includes('新访客') && tooltipText(root));
  expect(text).toContain('周四');
  expect(text).toContain('4,200 人次');
  expect(text).toContain('3,000 人次');
});

it('堆叠：切到占比时数值轴到 100%；点图例隐藏一个渠道，剩两层', async () => {
  const root = mount(Stacked);
  await until(() => areas(root).length === 3);
  expect(ticks(root)).not.toContain('100%');
  [...root.querySelectorAll('button')].find((button) => button.textContent === '占比')!.click();
  await until(() => ticks(root).includes('100%'));
  // 图例在图表里（上面的“金额、占比”也是一组按钮）
  root.querySelector<HTMLButtonElement>('[role="figure"] [role="group"] button')!.click();
  await until(() => areas(root).length === 2);
});
