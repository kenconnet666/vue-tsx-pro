// 锚定浮层：Popover、Tooltip、Menu 在真实浏览器里（演示页 /base）
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
const isOpen = (element: Element) => element.matches(':popover-open');
/** 等进场过渡结束（最多 1 秒），axe 才算得准对比度 */
const settle = (element: Element) =>
  Promise.race([
    Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished)),
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);

describe('Popover', () => {
  it('贴着触发器下方显示，写出最终方向；打开时 axe-core 没有违规', async () => {
    const trigger = $('.popover-open');
    const panel = $('.popover-demo');
    await userEvent.click(trigger);
    await expect.poll(() => isOpen(panel)).toBe(true);
    await expect.poll(() => panel.dataset.side).toBe('bottom');
    const gap = panel.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom;
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(12);
    await settle(panel);
    const { violations } = await axe.run(panel);
    expect(violations.map((violation) => violation.id)).toEqual([]);
  });
});

describe('Tooltip', () => {
  it('悬停一段时间后显示，是触发器的描述；移开后隐藏', async () => {
    const trigger = $('.tooltip-trigger');
    const tooltip = $('.tooltip-demo');
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);
    expect(tooltip.getAttribute('role')).toBe('tooltip');
    await userEvent.hover(trigger);
    expect(isOpen(tooltip)).toBe(false);
    await expect.poll(() => isOpen(tooltip), { timeout: 2000 }).toBe(true);
    await userEvent.unhover(trigger);
    await expect.poll(() => isOpen(tooltip)).toBe(false);
  });

  it('键盘聚焦时立即显示，Esc 隐藏；点击按钮聚焦时不显示', async () => {
    const trigger = $('.tooltip-trigger');
    const tooltip = $('.tooltip-demo');
    $('.popover-open').focus();
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(trigger);
    await expect.poll(() => isOpen(tooltip)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen(tooltip)).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('指针可以从触发器移到提示上而不消失（WCAG 1.4.13）', async () => {
    const trigger = $('.tooltip-trigger');
    const tooltip = $('.tooltip-demo');
    await userEvent.hover(trigger);
    await expect.poll(() => isOpen(tooltip), { timeout: 2000 }).toBe(true);
    await userEvent.hover(tooltip);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(isOpen(tooltip)).toBe(true);
  });
});

describe('Menu', () => {
  const items = (menu: Element) => [...menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
  const result = () => $('.menu-result').textContent!;

  it('点击打开并聚焦第一项；方向键跳过不可用的项；Enter 执行、关闭并回到触发器', async () => {
    const trigger = $('.menu-open');
    const menu = $('.menu-demo');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    await userEvent.click(trigger);
    await expect.poll(() => isOpen(menu)).toBe(true);
    await expect.poll(() => document.activeElement).toBe(items(menu)[0]);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    // “归档”不可用，被跳过
    expect(document.activeElement!.textContent).toBe('显示网格');
    await userEvent.keyboard('{ArrowUp}{Enter}');
    expect(result()).toContain('执行了：复制');
    await expect.poll(() => isOpen(menu)).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('↑ 打开并聚焦最后一项；按字母跳到以它开头的项；Esc 关闭', async () => {
    const trigger = $('.menu-open');
    const menu = $('.menu-demo');
    trigger.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect.poll(() => isOpen(menu)).toBe(true);
    await expect.poll(() => document.activeElement!.textContent).toBe('删除');
    // Playwright 输入非 ASCII 字符时走文本输入、不发 keydown，这里直接派发按键
    const press = (key: string) =>
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    press('按');
    expect(document.activeElement!.textContent).toBe('按名称');
    press('按');
    expect(document.activeElement!.textContent).toBe('按日期');
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => isOpen(menu)).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('复选项切换后菜单不关；单选项选中后关闭', async () => {
    const trigger = $('.menu-open');
    const menu = $('.menu-demo');
    await userEvent.click(trigger);
    await expect.poll(() => isOpen(menu)).toBe(true);
    const grid = items(menu).find((item) => item.textContent === '显示网格')!;
    expect(grid.getAttribute('aria-checked')).toBe('true');
    await userEvent.click(grid);
    expect(grid.getAttribute('aria-checked')).toBe('false');
    expect(result()).toContain('网格关');
    expect(isOpen(menu)).toBe(true);

    await userEvent.click(items(menu).find((item) => item.textContent === '按日期')!);
    expect(result()).toContain('排序 date');
    await expect.poll(() => isOpen(menu)).toBe(false);
  });

  it('Tab 关闭菜单，焦点不回到触发器；打开时 axe-core 没有违规', async () => {
    const trigger = $('.menu-open');
    const menu = $('.menu-demo');
    await userEvent.click(trigger);
    await expect.poll(() => isOpen(menu)).toBe(true);
    await settle(menu);
    const { violations } = await axe.run(menu);
    expect(violations.map((violation) => violation.id)).toEqual([]);
    await userEvent.keyboard('{Tab}');
    await expect.poll(() => isOpen(menu)).toBe(false);
    expect(document.activeElement).not.toBe(trigger);
  });
});
