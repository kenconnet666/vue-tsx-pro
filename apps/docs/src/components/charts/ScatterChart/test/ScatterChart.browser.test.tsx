// ScatterChart 在真实浏览器里：每行一个点，悬停一个点看名称与两个值；气泡图的点按销量有大有小
import { expect, it } from 'vitest';
import { hover, tooltipText } from '../../../../test/chart';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Bubbles from '../demo/Bubbles';
import Cities from '../demo/Cities';

const points = (root: Element) => [...root.querySelectorAll('[data-part="point"]')];

it('12 座城市 12 个点；悬停一个点：提示框写城市名与通勤时间', async () => {
  const root = mount(Cities);
  const all = await until(() => points(root).length === 12 && points(root));
  // 等进场动画结束，点到位
  await new Promise((resolve) => setTimeout(resolve, 500));
  hover(all[0]!);
  const text = await until(() => tooltipText(root).includes('北京') && tooltipText(root));
  expect(text).toContain('47');
});

it('气泡图：两个品类 8 个点，大小随销量（最大的比最小的大一倍以上）', async () => {
  const root = mount(Bubbles);
  const all = await until(() => points(root).length === 8 && points(root));
  await new Promise((resolve) => setTimeout(resolve, 500));
  const sizes = all.map((point) => point.getBoundingClientRect().width);
  expect(Math.max(...sizes)).toBeGreaterThan(Math.min(...sizes) * 2);
});
