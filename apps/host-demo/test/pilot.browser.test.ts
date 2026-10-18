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
  const result = await axe.run(document.body);
  expect(result.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
});
