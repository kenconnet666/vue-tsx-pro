// MapChart 在真实浏览器里：分档着色与图例、地点的名字、地图撑满绘图区的宽或高（换投影之后也是）、
// 滚轮不按 Ctrl 时滚动页面而不缩放、流向画成连线、地点的名字避让
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import { until } from '../../../../test/until';
import Projections from '../demo/Projections';
import Provinces from '../demo/Provinces';
import Sites from '../demo/Sites';
import SupplyChain from '../demo/SupplyChain';

const featuresOf = (root: Element) => [
  ...root.querySelectorAll<SVGPathElement>('svg path[class*="feature"]'),
];

/** 地图（所有区域合起来）占绘图区的比例：宽、高里占得多的那边（窄的绘图区里地图撑满宽） */
function fillRatio(root: Element): number {
  const features = featuresOf(root);
  const svg = features[0]!.ownerSVGElement!.getBoundingClientRect();
  const boxes = features.map((path) => path.getBoundingClientRect()).filter((box) => box.height);
  if (!boxes.length) return 0;
  const width =
    Math.max(...boxes.map((box) => box.right)) - Math.min(...boxes.map((box) => box.left));
  const height =
    Math.max(...boxes.map((box) => box.bottom)) - Math.min(...boxes.map((box) => box.top));
  return Math.max(width / svg.width, height / svg.height);
}

it('省份分 5 档着色，图例是 5 个色块，地点写上名字，地图占满绘图区', async () => {
  const root = mount(Provinces);
  const features = await until(() => featuresOf(root).length > 30 && featuresOf(root));
  const fills = new Set(features.map((path) => getComputedStyle(path).fill));
  // 5 档 + 没有数据的底色
  expect(fills.size).toBeGreaterThanOrEqual(5);
  const bins = [...root.querySelectorAll('span')].filter((span) =>
    /^[\d,]+ – [\d,]+$/.test(span.textContent!),
  );
  expect(bins).toHaveLength(5);
  // 地点的名字在画完之后的下一帧排好
  const svg = features[0]!.ownerSVGElement!;
  await until(() => svg.querySelector('[data-point-labels] text'));
  for (const label of ['上海总装', '西安机加', '成都复材'])
    expect(svg.textContent).toContain(label);
  // 区域的形状在第一帧之后才画出来
  await until(() => fillRatio(root) > 0.9);
});

it('滚轮不按 Ctrl 时不缩放、提示按住 Ctrl；按住 Ctrl 才缩放，复位回到原样', async () => {
  const root = mount(Provinces);
  const features = await until(() => featuresOf(root).length > 30 && featuresOf(root));
  const group = features[0]!.parentElement!;
  const wheel = (ctrlKey: boolean) =>
    features[0]!.dispatchEvent(
      new WheelEvent('wheel', { deltaY: -200, ctrlKey, bubbles: true, cancelable: true }),
    );

  wheel(false);
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(group.getAttribute('transform') ?? '').not.toContain('scale');
  expect(root.querySelector('[role="status"]')?.textContent).toContain('Ctrl');

  wheel(true);
  await until(() => /scale\((?!1\b)/.test(group.getAttribute('transform') ?? ''));
  root.querySelector<HTMLButtonElement>('[aria-label="复位"]')!.click();
  await until(() => /scale\(1(,1)?\)/.test(group.getAttribute('transform') ?? ''));
});

it('换投影之后地图仍占满绘图区', async () => {
  const root = mount(Projections);
  await until(() => featuresOf(root).length > 30);
  for (const name of ['墨卡托', '地球仪', '等积圆锥']) {
    const button = [...root.querySelectorAll('button')].find((item) => item.textContent === name)!;
    button.click();
    // 换投影会换一个新的地图，等新的画好
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(fillRatio(root), name).toBeGreaterThan(0.9);
  }
});

it('流向画成连线，每条一根', async () => {
  const root = mount(SupplyChain);
  const links = await until(() => {
    const paths = root.querySelectorAll('svg g[class*="links"] path');
    return paths.length > 0 && paths;
  });
  expect(links).toHaveLength(6);
});

it('挤在一起的地点：名字互不重叠、不压地点，挤的画引线', async () => {
  const root = mount(Sites);
  const labels = await until(() => {
    const texts = [...root.querySelectorAll<SVGTextElement>('[data-point-labels] text')];
    return texts.length > 0 && texts;
  });
  const boxes = labels.map((text) => text.getBoundingClientRect());
  const markers = [...root.querySelectorAll('svg g[class*="point"] path')]
    .map((path) => path.getBoundingClientRect())
    .filter((box) => box.width);
  const overlap = (a: DOMRect, b: DOMRect) =>
    a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
  boxes.forEach((box, index) => {
    const name = labels[index]!.textContent!;
    boxes.slice(index + 1).forEach((other, offset) => {
      const pair = `${name} / ${labels[index + 1 + offset]!.textContent} ${JSON.stringify([box, other])}`;
      expect(overlap(box, other), pair).toBe(false);
    });
    for (const marker of markers) expect(overlap(box, marker), name).toBe(false);
  });
  // 长三角的 7 个地点大多标上了（绘图区窄时放不下的不显示），有几个退到外一圈
  const delta = ['上海', '苏州', '无锡', '常州', '杭州', '嘉兴', '宁波'];
  expect(labels.filter((text) => delta.includes(text.textContent!)).length).toBeGreaterThanOrEqual(
    5,
  );
  expect(root.querySelectorAll('[data-point-labels] line').length).toBeGreaterThan(0);
});
