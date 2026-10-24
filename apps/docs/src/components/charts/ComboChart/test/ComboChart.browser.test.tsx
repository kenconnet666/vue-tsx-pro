// 组合图、标注与百分比堆叠在真实浏览器里：右侧的刻度与左侧的刻度同高、柱与线都画出；
// 标注的竖线、圈与区间画出；百分比堆叠的每根柱子一样高
import { _component } from '@vue-tsx-pro/tsx';
import { BarChart } from '@vue-tsx-pro/ui/charts';
import { expect, it } from 'vitest';
import { h } from 'vue';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Annotations from '../../LineChart/demo/Annotations';
import Savings from '../demo/Savings';

const settle = () => new Promise((resolve) => setTimeout(resolve, 600));

it('组合图：柱与线都画出；右侧刻度与左侧刻度一一同高', async () => {
  const root = mount(Savings);
  await until(() => root.querySelectorAll('[class*="grouped-bar-component"] path').length === 18);
  await until(() => root.querySelector('[class*="line-component"] path'));
  await settle();
  const texts = [...root.querySelectorAll('svg text')];
  const center = (element: Element) => {
    const box = element.getBoundingClientRect();
    return Math.round(box.top + box.height / 2);
  };
  const left = ['0', '50', '100', '150', '200', '250'].map((label) =>
    texts.find((text) => text.textContent === label)!,
  );
  const right = ['0%', '25%', '50%', '75%', '100%', '125%'].map((label) =>
    texts.find((text) => text.textContent === label)!,
  );
  expect(right.every(Boolean)).toBe(true);
  // 同一格的左右刻度落在同一条网格线上（文字的垂直中心相差不到 3px）
  left.forEach((tick, position) => {
    expect(Math.abs(center(tick) - center(right[position]!))).toBeLessThan(3);
  });
});

it('标注：事件的竖线与文字、圈出的值与文字、类目轴与数值轴上的区间都画出', async () => {
  const root = mount(Annotations);
  await until(() => root.querySelector('[class*="line-component"] path'));
  await settle();
  const text = root.querySelector('svg')!.textContent!;
  for (const label of [
    '换 6063-T5',
    '新供应商切换',
    '模具维修，临时外协',
    '年内最低 114.9',
    '验证窗',
    '目标区间',
  ])
    expect(text).toContain(label);
  expect(root.querySelectorAll('[class*="plotband"] rect').length).toBeGreaterThanOrEqual(2);
});

it('百分比堆叠：每根柱子都叠满，一样高', async () => {
  const data = [
    { name: 'A', x: 10, y: 30 },
    { name: 'B', x: 200, y: 50 },
    { name: 'C', x: 1, y: 1 },
  ];
  const root = mount(
    _component(
      () => () =>
        h(BarChart<(typeof data)[number]>, {
          'aria-label': '构成',
          data,
          index: 'name',
          series: [
            { key: 'x', label: 'X' },
            { key: 'y', label: 'Y' },
          ],
          stacked: 'percent',
        }),
    ),
  );
  const bars = () => [...root.querySelectorAll('[class*="stacked-bar-component"] path')];
  await until(() => bars().length === 6);
  await settle();
  // 每个类目两段：按横坐标分组，量每组的总高
  const groups = new Map<number, number>();
  for (const bar of bars()) {
    const box = bar.getBoundingClientRect();
    const key = Math.round(box.left);
    groups.set(key, (groups.get(key) ?? 0) + box.height);
  }
  const heights = [...groups.values()];
  expect(heights).toHaveLength(3);
  for (const height of heights) expect(Math.abs(height - heights[0]!)).toBeLessThan(2);
});
