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
  ...root.querySelectorAll<SVGPathElement>('[data-part="feature"]'),
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
  await until(() => svg.querySelector('[data-part="point-labels"] text'));
  for (const label of ['上海总仓', '西安仓', '成都仓']) expect(svg.textContent).toContain(label);
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
  expect(group.getAttribute('transform') ?? '').toMatch(/scale\(1\)/);
  expect(root.querySelector('[role="status"]')?.textContent).toContain('Ctrl');

  wheel(true);
  // 放大后 scale 不是 1（是 1.5 这类：不能写 1\b，1 与小数点之间也是单词边界）
  await until(() => /scale\((?!1\))/.test(group.getAttribute('transform') ?? ''));
  root.querySelector<HTMLButtonElement>('[aria-label="复位"]')!.click();
  await until(() => /scale\(1\)/.test(group.getAttribute('transform') ?? ''));
});

it('换投影之后地图仍占满绘图区', async () => {
  const root = mount(Projections);
  await until(() => featuresOf(root).length > 30);
  for (const name of ['墨卡托', '地球仪', '等积圆锥']) {
    const button = [...root.querySelectorAll('button')].find((item) => item.textContent === name)!;
    const before = featuresOf(root)[0]!.getAttribute('d');
    button.click();
    // 换投影后区域的路径重新算：等第一个区域的形状变了（固定等一段时间在负载高的 CI 上不够）
    await until(
      () => featuresOf(root)[0]?.getAttribute('d') !== before && featuresOf(root).length > 30,
    );
    await until(() => fillRatio(root) > 0.9).catch(() => undefined);
    expect(fillRatio(root), name).toBeGreaterThan(0.9);
  }
});

it('流向画成连线，每条一根', async () => {
  const root = mount(SupplyChain);
  const links = await until(() => {
    const paths = root.querySelectorAll('[data-part="link"]');
    return paths.length > 0 && paths;
  });
  expect(links).toHaveLength(6);
});

it('挤在一起的地点：名字互不重叠、不压地点，挤的画引线', async () => {
  const root = mount(Sites);
  const labels = await until(() => {
    const texts = [...root.querySelectorAll<SVGTextElement>('[data-part="point-labels"] text')];
    return texts.length > 0 && texts;
  });
  // 用 getBBox（SVG 坐标、不含描边）：Firefox 的 getBoundingClientRect 把名字的光晕、标记的描边也算进去，Chromium 不算
  const shape = (element: SVGGraphicsElement) => {
    const box = element.getBBox();
    return { left: box.x, top: box.y, right: box.x + box.width, bottom: box.y + box.height };
  };
  type Box = ReturnType<typeof shape>;
  const boxes = labels.map(shape);
  const markers = [...root.querySelectorAll<SVGPathElement>('[data-part="point"]')]
    .map(shape)
    .filter((box) => box.right > box.left);
  const overlap = (a: Box, b: Box) =>
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
  expect(root.querySelectorAll('[data-part="point-labels"] line').length).toBeGreaterThan(0);
});
