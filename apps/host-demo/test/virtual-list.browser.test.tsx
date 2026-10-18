// VirtualList 随页面滚动（scroll="window"）：列表上方有其他内容时，滚动位置要减去它（scrollMargin）
import { _component } from '@vue-tsx-pro/tsx';
import { VirtualList, type VirtualListHandle } from '@vue-tsx-pro/ui';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { createApp, type App } from 'vue';

const ROW = 20;
const ABOVE = 600;
const rows = Array.from({ length: 2000 }, (_, index) => index);

let app: App;
let root: HTMLElement;
let handle: VirtualListHandle | undefined;

const Page = _component(() => () => (
  <div>
    <div style={{ height: `${ABOVE}px` }}>列表上方的内容</div>
    <VirtualList
      items={rows}
      scroll="window"
      estimateSize={ROW}
      aria-label="随页面滚动的列表"
      handle={(received) => (handle = received)}
    >
      {(row) => <div style={{ height: `${ROW}px` }}>第 {row} 行</div>}
    </VirtualList>
  </div>
));

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  app = createApp(Page);
  app.mount(root);
});
afterEach(() => {
  app.unmount();
  root.remove();
  window.scrollTo(0, 0);
});

const rendered = () => [...root.querySelectorAll<HTMLElement>('[role="listitem"]')];
const posinset = (element: Element) => Number(element.getAttribute('aria-posinset'));
/** 视口顶部那一行的序号（从 1 开始） */
const rowAtViewportTop = () =>
  rendered().find((item) => {
    const { top, bottom } = item.getBoundingClientRect();
    return top <= 0 && bottom > 0;
  });

it('页面撑开到列表总高度；滚到第 500 行时渲染的就是那一段', async () => {
  expect(document.documentElement.scrollHeight).toBeGreaterThanOrEqual(ABOVE + rows.length * ROW);
  window.scrollTo(0, ABOVE + 500 * ROW);
  await expect.poll(() => rowAtViewportTop() && posinset(rowAtViewportTop()!)).toBe(501);
  expect(rendered().length).toBeLessThan(120);
});

it('handle.scrollToIndex 把第 1001 行对齐到视口顶部（算上列表上方的内容）', async () => {
  await expect.poll(() => handle).toBeTruthy();
  handle!.scrollToIndex(1000, { align: 'start' });
  await expect.poll(() => window.scrollY).toBe(ABOVE + 1000 * ROW);
  await expect.poll(() => rowAtViewportTop() && posinset(rowAtViewportTop()!)).toBe(1001);
});
