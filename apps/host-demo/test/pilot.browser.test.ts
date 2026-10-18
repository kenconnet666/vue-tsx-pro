// 试点组件在真实浏览器里的行为：em 尺寸、主题变量、原生 popover 与焦点、输入法、无障碍
import axe from 'axe-core';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { nextTick, type App } from 'vue';
import { createMemoryHistory } from 'vue-router';
import { createHostApp } from '../src/app';

let app: App;
let root: HTMLElement;

beforeEach(async () => {
  const host = createHostApp(createMemoryHistory());
  await host.router.push('/pilot');
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

const button = (text: string) =>
  [...root.querySelectorAll<HTMLElement>('main button, main a')].find(
    (element) => element.textContent?.trim() === text,
  )!;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  root.querySelector<T>(selector)!;
const style = (element: Element) => getComputedStyle(element);
/** 等进出场过渡播完：过渡途中透明度不足，axe 会误报对比度 */
const settle = async () => {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await Promise.allSettled(document.getAnimations().map((animation) => animation.finished));
};

it('em 尺寸：档位改变字号，内部尺寸同比缩放；继承上下文字号', () => {
  const [sm, md, lg] = ['小', '默认', '大'].map(button);
  expect([style(sm!).fontSize, style(md!).fontSize, style(lg!).fontSize]).toEqual([
    '13px',
    '14px',
    '16px',
  ]);
  const heights = [sm!, md!, lg!].map((element) => element.getBoundingClientRect().height);
  expect(heights[0]! / 13).toBeCloseTo(heights[2]! / 16, 1);

  const inherited = $('.inherit-size');
  expect(style(inherited).fontSize).toBe('24px');
  expect(inherited.querySelector('svg')!.getBoundingClientRect().width).toBe(24);
});

it('主题：token 变量生效，页面内切换暗色', async () => {
  // 主按钮 indigo 9 两套主题相同；输入框表面亮色 slate 1、暗色 slate 2
  expect(style(button('默认')).backgroundColor).toBe('rgb(62, 99, 221)');
  expect(style($('.search-field')).backgroundColor).toBe('rgb(252, 252, 253)');
  $('.toggle-theme').click();
  await expect.poll(() => style($('.search-field')).backgroundColor).toBe('rgb(24, 25, 27)');
});

it('Popover：打开时焦点进入，Esc 关闭并写回、焦点回到触发器；点击外部关闭', async () => {
  const trigger = $('.menu-trigger');
  const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
  await userEvent.click(trigger);
  await expect.poll(() => panel.matches(':popover-open')).toBe(true);
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  expect(panel.contains(document.activeElement)).toBe(true);
  expect(panel.getBoundingClientRect().top).toBeGreaterThan(trigger.getBoundingClientRect().bottom);

  await userEvent.keyboard('{Escape}');
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(trigger);

  await userEvent.click(trigger);
  await expect.poll(() => panel.matches(':popover-open')).toBe(true);
  const main = $('main');
  await userEvent.click(main, {
    position: { x: main.clientWidth - 10, y: main.clientHeight - 10 },
  });
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false');
});

it('TextField：输入法组合输入期间不写回，组合结束才写回', async () => {
  const input = $<HTMLInputElement>('.search-field input');
  input.dispatchEvent(new CompositionEvent('compositionstart'));
  input.value = 'ni';
  input.dispatchEvent(new Event('input'));
  await nextTick();
  expect($('.keyword').textContent).toBe('');
  input.value = '你';
  input.dispatchEvent(new CompositionEvent('compositionend'));
  await nextTick();
  expect($('.keyword').textContent).toBe('你');
});

it('无障碍：axe-core 没有违规', async () => {
  const result = await axe.run($('main'));
  expect(result.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
});

it('Popover：打开时再次点击触发器会关闭（不被点击外部关闭后又重新打开）', async () => {
  const trigger = $('.menu-trigger');
  const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
  await userEvent.click(trigger);
  await expect.poll(() => panel.matches(':popover-open')).toBe(true);
  await userEvent.click(trigger);
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect([panel.matches(':popover-open'), trigger.getAttribute('aria-expanded')]).toEqual([
    false,
    'false',
  ]);
});

it('无障碍：弹出层打开时 axe-core 也没有违规', async () => {
  const trigger = $('.menu-trigger');
  await userEvent.click(trigger);
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true');
  await settle();
  const result = await axe.run(document.body);
  expect(result.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
});

it('Dialog：打开时焦点进入并锁定页面滚动，焦点在两端循环', async () => {
  const dialog = $<HTMLDialogElement>('.pilot-dialog');
  await userEvent.click($('.dialog-trigger'));
  await expect.poll(() => dialog.open).toBe(true);
  expect(dialog.contains(document.activeElement)).toBe(true);
  expect(document.documentElement.style.overflow).toBe('hidden');

  const input = $('.dialog-field input');
  const ok = $('.dialog-ok');
  ok.focus();
  await userEvent.keyboard('{Tab}');
  expect(document.activeElement).toBe(input);
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
  expect(document.activeElement).toBe(ok);
});

it('Dialog：里面的弹层先关，再按 Esc 关对话框；关闭后写回、恢复滚动、焦点回到触发器', async () => {
  const dialog = $<HTMLDialogElement>('.pilot-dialog');
  const trigger = $('.dialog-trigger');
  await userEvent.click(trigger);
  await expect.poll(() => dialog.open).toBe(true);

  const nested = $('.nested-trigger');
  const panel = document.getElementById(nested.getAttribute('aria-controls')!)!;
  await userEvent.click(nested);
  await expect.poll(() => panel.matches(':popover-open')).toBe(true);

  await userEvent.keyboard('{Escape}');
  await expect.poll(() => panel.matches(':popover-open')).toBe(false);
  expect(dialog.open).toBe(true);

  await userEvent.keyboard('{Escape}');
  await expect.poll(() => dialog.open).toBe(false);
  expect(document.documentElement.style.overflow).toBe('');
  expect(document.activeElement).toBe(trigger);
  // 写回了父级状态：再次点击能重新打开
  await userEvent.click(trigger);
  await expect.poll(() => dialog.open).toBe(true);
});

it('Dialog：点击遮罩关闭；点击内容、内边距，或从内容拖到遮罩上松开都不关闭', async () => {
  const dialog = $<HTMLDialogElement>('.pilot-dialog');
  await userEvent.click($('.dialog-trigger'));
  await expect.poll(() => dialog.open).toBe(true);
  await userEvent.click(dialog.querySelector('h2')!);
  expect(dialog.open).toBe(true);
  // dialog 自己的内边距：click 的目标也是 dialog
  await userEvent.click(dialog, { position: { x: 4, y: 4 } });
  expect(dialog.open).toBe(true);
  // 在内容里按下、拖到遮罩上松开（选中文字）：click 落在共同祖先 dialog 上
  const rect = dialog.getBoundingClientRect();
  const inside = { bubbles: true, clientX: rect.left + 20, clientY: rect.top + 20 };
  dialog.querySelector('h2')!.dispatchEvent(new PointerEvent('pointerdown', inside));
  const outside = { bubbles: true, clientX: rect.left + 10, clientY: rect.top - 10 };
  dialog.dispatchEvent(new MouseEvent('click', outside));
  expect(dialog.open).toBe(true);
  // 遮罩不是 DOM 元素，Playwright 的可点击检查会命中 <html> 而判定被遮挡，所以跳过检查
  await userEvent.click(dialog, { position: { x: 10, y: -10 }, force: true });
  await expect.poll(() => dialog.open).toBe(false);
});

it('无障碍：对话框打开时 axe-core 也没有违规', async () => {
  const dialog = $<HTMLDialogElement>('.pilot-dialog');
  await userEvent.click($('.dialog-trigger'));
  await expect.poll(() => dialog.open).toBe(true);
  await settle();
  const { violations } = await axe.run(root);
  expect(violations.map((violation) => violation.id)).toEqual([]);
});

it('进出场过渡：打开时淡入放大；关闭时支持 overlay 过渡的浏览器先播完离场过渡再隐藏', async () => {
  const fading = (element: Element) =>
    element
      .getAnimations()
      .some((animation) => (animation as CSSTransition).transitionProperty === 'opacity');

  const trigger = $('.menu-trigger');
  const panel = document.getElementById(trigger.getAttribute('aria-controls')!)!;
  await userEvent.click(trigger);
  await expect.poll(() => fading(panel)).toBe(true);
  await settle();
  expect(style(panel).opacity).toBe('1');

  const dialog = $<HTMLDialogElement>('.pilot-dialog');
  await userEvent.click($('.dialog-trigger'));
  await expect.poll(() => fading(dialog)).toBe(true);
  await settle();
  expect(style(dialog).opacity).toBe('1');

  dialog.close();
  if (CSS.supports('overlay', 'auto')) {
    // 离场过渡期间仍在顶层显示（overlay 与 display 的 allow-discrete），播完才隐藏
    expect(fading(dialog)).toBe(true);
    expect(style(dialog).display).not.toBe('none');
    await settle();
  }
  // 不支持 overlay 过渡的浏览器（Firefox、Safari）关闭后立即隐藏
  expect(style(dialog).display).toBe('none');
});
