// 拖动相关的组件在真实浏览器里的行为：ScrollArea 的浮层滚动条、Slider（演示页 /base）
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

let app: App;
let root: HTMLElement;

beforeEach(async () => {
  const host = createHostApp(createMemoryHistory());
  await host.router.push('/base');
  await host.router.isReady();
  root = document.createElement('div');
  document.body.append(root);
  app = host.app;
  app.mount(root);
});
afterEach(() => {
  app.unmount();
  root.remove();
});

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const center = (element: Element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};
/** 用指针事件在元素上拖动：按下、分几步移动、松开 */
async function drag(
  element: Element,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const init = (x: number, y: number) => ({
    clientX: x,
    clientY: y,
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    buttons: 1,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(new PointerEvent('pointerdown', init(from.x, from.y)));
  for (let step = 1; step <= 5; step++) {
    const x = from.x + ((to.x - from.x) * step) / 5;
    const y = from.y + ((to.y - from.y) * step) / 5;
    element.dispatchEvent(new PointerEvent('pointermove', init(x, y)));
    await nextFrame();
  }
  element.dispatchEvent(new PointerEvent('pointerup', init(to.x, to.y)));
  await nextFrame();
}

describe('ScrollArea：浮层滚动条', () => {
  const area = () => $('.scroll-demo');
  const viewport = () => area().firstElementChild as HTMLElement;
  const bar = () => area().querySelector<HTMLElement>('[data-axis="y"]')!;
  const thumb = () => bar().firstElementChild as HTMLElement;

  it('原生滚动条不占位：视口内容宽度等于容器宽度，滚动条绝对定位在内容上方', async () => {
    await nextFrame();
    expect(viewport().clientWidth).toBe(viewport().offsetWidth);
    expect(viewport().scrollHeight).toBeGreaterThan(viewport().clientHeight);
    expect(getComputedStyle(bar()).position).toBe('absolute');
  });

  it('指针进入时出现、滚动条半透明；出现前后视口尺寸不变', async () => {
    const before = viewport().getBoundingClientRect();
    expect(bar().dataset.state).toBe('hidden');
    area().dispatchEvent(new PointerEvent('pointerenter'));
    await expect.poll(() => bar().dataset.state).toBe('visible');
    const after = viewport().getBoundingClientRect();
    expect([after.width, after.height]).toEqual([before.width, before.height]);
    expect(getComputedStyle(thumb()).backgroundColor).toMatch(/color-mix|rgba|oklab|color\(/);
  });

  it('滑块长度按“可见 / 总高度”的比例（至少 20px，内容再长也抓得住）；滚动时滑块跟着移动', async () => {
    await nextFrame();
    const ratio = viewport().clientHeight / viewport().scrollHeight;
    expect(thumb().getBoundingClientRect().height).toBeCloseTo(
      Math.max(20, bar().clientHeight * ratio),
      0,
    );
    const top = thumb().getBoundingClientRect().top;
    viewport().scrollTop = 200;
    await expect.poll(() => thumb().getBoundingClientRect().top).toBeGreaterThan(top);
  });

  it('拖动滑块滚动内容；滚轮落在滚动条上时转交给视口', async () => {
    area().dispatchEvent(new PointerEvent('pointerenter'));
    await nextFrame();
    const start = center(thumb());
    await drag(thumb(), start, { x: start.x, y: start.y + 40 });
    expect(viewport().scrollTop).toBeGreaterThan(40);

    const scrolled = viewport().scrollTop;
    bar().dispatchEvent(new WheelEvent('wheel', { deltaY: 60, bubbles: true, cancelable: true }));
    expect(viewport().scrollTop).toBeGreaterThan(scrolled);
  });

  it('两个方向都能滚动时各有一条，type="always" 一直显示且互不重叠', async () => {
    const both = $('.scroll-both-demo');
    await expect
      .poll(() =>
        [...both.querySelectorAll<HTMLElement>('[data-axis]')].map((b) => b.dataset.state),
      )
      .toEqual(['visible', 'visible']);
    const y = both.querySelector('[data-axis="y"]')!.getBoundingClientRect();
    const x = both.querySelector('[data-axis="x"]')!.getBoundingClientRect();
    expect(y.bottom).toBeLessThanOrEqual(x.top + 0.5);
  });
});

describe('Slider', () => {
  const slider = () => $('[role="slider"].slider-demo');
  const track = () => $('.slider-root');

  it('点击轨道跳到对应位置，拖动时实时更新绑定的值', async () => {
    const rect = track().getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    await drag(
      track(),
      { x: rect.left + rect.width * 0.2, y },
      { x: rect.left + rect.width * 0.8, y },
    );
    expect(Number(slider().getAttribute('aria-valuenow'))).toBeCloseTo(80, -1);
    expect($('.slider-value').textContent).toBe(`${slider().getAttribute('aria-valuenow')}%`);
    expect(document.activeElement).toBe(slider());
  });

  it('范围：拖动离得近的滑块，拖过另一个时停在它的位置；刻度文字在轨道下方', async () => {
    const root = $('.slider-range-root');
    const [low, high] = root.querySelectorAll<HTMLElement>('[role="slider"]');
    const rect = root.querySelector('div')!.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    // 从 600 附近拖到 150：越过低端的 200 时停在 200
    await drag(
      root,
      { x: rect.left + rect.width * 0.62, y },
      { x: rect.left + rect.width * 0.15, y },
    );
    expect([low!.getAttribute('aria-valuenow'), high!.getAttribute('aria-valuenow')]).toEqual([
      '200',
      '200',
    ]);
    expect(document.activeElement).toBe(high);
    expect($('.slider-range-value').textContent).toBe('200–200 元');
    const label = [...root.querySelectorAll('span')].find((span) => span.textContent === '500')!;
    expect(label.getBoundingClientRect().top).toBeGreaterThan(rect.bottom);
  });

  it('键盘：方向键与 Home/End', async () => {
    slider().focus();
    slider().dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await nextFrame();
    expect(slider().getAttribute('aria-valuenow')).toBe('100');
    slider().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    await nextFrame();
    expect(slider().getAttribute('aria-valuenow')).toBe('99');
  });
});
