// Sortable：指针拖过别的项的中线时重排、松开后滑回布局位置；键盘拿起移动；axe（演示页 /base）
import axe from 'axe-core';
import { userEvent } from 'vitest/browser';
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
const titles = () =>
  [...root.querySelectorAll('.sortable-demo li')].map((item) => item.textContent);
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** 在把手上按下，竖直拖动 distance px（分几步），松开 */
async function drag(handle: HTMLElement, distance: number) {
  const rect = handle.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const init = { pointerId: 7, button: 0, bubbles: true, isPrimary: true };
  handle.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: x, clientY: y }));
  for (let step = 1; step <= 5; step++) {
    handle.dispatchEvent(
      new PointerEvent('pointermove', { ...init, clientX: x, clientY: y + (distance * step) / 5 }),
    );
    await frame();
  }
  handle.dispatchEvent(
    new PointerEvent('pointerup', { ...init, clientX: x, clientY: y + distance }),
  );
}

describe('Sortable', () => {
  it('把第一项往下拖过两项：数据重排，松开后被拖的项回到布局位置', async () => {
    const [first, , third] = root.querySelectorAll('.sortable-demo li');
    // 拖到第三项的中线以下一点
    const distance = third!.getBoundingClientRect().top - first!.getBoundingClientRect().top + 8;
    await drag($('.sortable-demo [aria-label="移动 写需求文档"]'), distance);
    await expect
      .poll(() => titles().slice(0, 3))
      .toEqual(['评审设计稿', '修复登录 bug', '写需求文档']);
    // 滑回之后没有残留的位移
    await expect
      .poll(() => getComputedStyle($('.sortable-demo li:nth-child(3)')).transform)
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    expect($('.sortable-demo li[data-dragging]')).toBeNull();
  });

  it('键盘：空格拿起，↓ 两次，空格放下；焦点一直在把手上', async () => {
    const handle = $('.sortable-demo [aria-label="移动 写需求文档"]');
    handle.focus();
    await userEvent.keyboard('{ }{ArrowDown}{ArrowDown}{ }');
    await expect.poll(() => titles()[2]).toBe('写需求文档');
    expect(document.activeElement).toBe($('.sortable-demo [aria-label="移动 写需求文档"]'));
    expect($('.sortable-order').textContent).toContain('评审设计稿 → 修复登录 bug → 写需求文档');
  });

  it('axe-core 没有违规', async () => {
    const result = await axe.run($('.sortable-demo').parentElement!);
    expect(result.violations).toEqual([]);
  });
});
