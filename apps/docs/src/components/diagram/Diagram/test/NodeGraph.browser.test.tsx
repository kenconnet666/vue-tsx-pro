// 节点图：端口对准卡片里的行，连线是从端口伸出的贝塞尔曲线、没有箭头；能拖动平移的画布滚轮默认缩放
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';
import NodeGraph from '../demo/NodeGraph';

const center = (element: Element) => {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x: x + width / 2, y: y + height / 2 };
};

it('端口对准它那一行，连线画成曲线', async () => {
  const root = mount(NodeGraph);
  await expect.poll(() => root.querySelectorAll('[data-diagram-port-id]').length).toBe(8);
  const node = root.querySelector('[data-node="mul"]')!;
  const port = node.querySelector('[data-diagram-port-id="B"]')!;
  const row = [...node.querySelectorAll('div')].find((element) => element.textContent === 'B')!;
  expect(Math.abs(center(port).y - center(row).y)).toBeLessThan(1.5);
  const lines = [...root.querySelectorAll('[data-part="edgeLine"]')];
  expect(lines.length).toBe(4);
  for (const line of lines) expect(line.getAttribute('d')).toMatch(/^M[\d.-]+,[\d.-]+C/);
  expect(root.querySelector('[data-part="edgeArrow"]')).toBeNull();
});

it('滚轮缩放（不用按 Ctrl），光标是小手', async () => {
  const root = mount(NodeGraph);
  const viewport = root.querySelector<HTMLElement>('[data-scope="diagram"][data-part="root"]')!;
  // 节点在屏幕上的宽度跟着缩放变
  const node = root.querySelector<HTMLElement>('[data-node="mul"]')!;
  const width = () => node.getBoundingClientRect().width;
  expect(getComputedStyle(viewport).cursor).toBe('grab');
  await expect.poll(width).toBeGreaterThan(0);
  const before = width();
  const { x, y } = center(viewport);
  viewport.dispatchEvent(
    new WheelEvent('wheel', {
      deltaY: -200,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  );
  await expect.poll(width).toBeGreaterThan(before);
});
