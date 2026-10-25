// 雷达图与矩形树图在真实浏览器里：雷达的多边形、悬停一个维度标出各系列的数值、点图例隐藏系列；
// 矩形树图每条明细一块、外层分组写上名字
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Treemap from '../../TreemapChart/demo/Savings';
import Suppliers from '../demo/Suppliers';

it('雷达图：每个系列一个多边形；悬停“价格”标出三家的分数；点图例隐藏一家', async () => {
  const root = mount(Suppliers);
  const svg = root.querySelector('svg')!;
  // 网格 4 圈 + 3 个系列
  expect(svg.querySelectorAll('polygon')).toHaveLength(7);
  // 第三个维度（价格）的扇区
  const sector = svg.querySelectorAll('path')[2]!;
  sector.dispatchEvent(new PointerEvent('pointerenter'));
  await nextTick();
  const values = [...svg.querySelectorAll('g text')].map((text) => text.textContent);
  expect(values).toEqual(expect.arrayContaining(['68', '90', '76']));
  root.querySelector<HTMLButtonElement>('[role="group"] button')!.click();
  await nextTick();
  expect(svg.querySelectorAll('polygon')).toHaveLength(6);
});

it('矩形树图：每条明细一块，外层分组写上名字', async () => {
  const root = mount(Treemap);
  const text = await until(() => {
    const content = root.querySelector('svg')?.textContent ?? '';
    return content.includes('渝州电子') && content;
  });
  for (const label of ['华东', '华南', '华北', '西南', '华辰精密', '蓉城五金'])
    expect(text).toContain(label);
});
