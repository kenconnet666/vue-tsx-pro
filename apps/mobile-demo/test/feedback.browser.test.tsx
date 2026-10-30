// 浮层与手势在真实浏览器里（手机视口、触摸屏）：弹出层贴边、滑动单元格按量出的按钮宽度停住
import { expect, it } from 'vitest';
import { commands } from 'vitest/browser';
import { FeedbackPage } from '../src/pages/FeedbackPage.tsx';
import { drag, mount } from './helpers.ts';

it('底部弹出层贴着视口底边、占满宽度，遮罩盖住整个视口', async () => {
  mount(FeedbackPage);
  await commands.tap('底部弹出');
  const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
  await expect.poll(() => dialog()?.dataset.state).toBe('open');
  // 进场动画播完：面板落到底边
  await expect
    .poll(() => Math.round(dialog()!.getBoundingClientRect().bottom), { timeout: 3000 })
    .toBe(innerHeight);
  const rect = dialog()!.getBoundingClientRect();
  expect(rect.left).toBe(0);
  expect(Math.round(rect.width)).toBe(innerWidth);
  const overlay = document.elementFromPoint(innerWidth / 2, 10)!;
  expect(overlay.closest('[role="dialog"]')).toBeNull();
  expect(getComputedStyle(overlay).position).toBe('fixed');
});

it('滑动单元格：左滑超过三成打开，停在右侧按钮的总宽度上', async () => {
  mount(FeedbackPage);
  // 外层的下拉刷新也收 touchmove：取最里面那个
  const cell = [...document.querySelectorAll<HTMLElement>('[data-touch-move]')]
    .filter((node) => node.textContent?.includes('订单 1024'))
    .at(-1)!;
  const track = cell.firstElementChild as HTMLElement;
  const actions = [...track.children].at(-1)!.getBoundingClientRect().width;
  expect(actions).toBeGreaterThan(80);
  const { top, height } = cell.getBoundingClientRect();
  const y = top + height / 2;
  await drag(cell, [300, y], [300 - actions * 0.6, y]);
  await expect.poll(() => cell.dataset.open).toBe('right');
  await expect
    .poll(() => Math.round(new DOMMatrix(getComputedStyle(track).transform).m41))
    .toBe(-Math.round(actions));
});
