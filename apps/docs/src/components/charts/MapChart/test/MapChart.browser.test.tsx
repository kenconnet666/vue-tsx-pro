// MapChart 在真实浏览器里：分档着色与图例、地点的名字、地图撑满绘图区的宽或高（换投影之后也是）、
// 滚轮不按 Ctrl 时滚动页面而不缩放、流向画成连线
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import Projections from '../demo/Projections';
import Provinces from '../demo/Provinces';
import SupplyChain from '../demo/SupplyChain';

/** 等到条件成立（Unovis 在动画帧里绘制），最多 3 秒 */
async function until<T>(read: () => T | undefined | false): Promise<T> {
  const deadline = performance.now() + 3000;
  for (;;) {
    const value = read();
    if (value) return value;
    if (performance.now() > deadline) throw new Error('等待超时');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

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
  const text = features[0]!.ownerSVGElement!.textContent!;
  for (const label of ['上海总装', '西安机加', '成都复材']) expect(text).toContain(label);
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
