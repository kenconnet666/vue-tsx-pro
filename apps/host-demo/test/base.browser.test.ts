// 基础组件演示页在真实浏览器里的行为与无障碍检查；每加一批组件就在这里补对应的检查
import axe from 'axe-core';
import { afterEach, beforeEach, expect, it } from 'vitest';
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

it('VisuallyHidden：视觉上不占位，读屏名称仍然在', () => {
  const button = $('.icon-only');
  const hidden = button.querySelector('span')!;
  expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  expect(button.textContent?.trim()).toBe('设置');
});

it('无障碍：演示页 axe-core 没有违规（亮色与暗色）', async () => {
  expect((await axe.run(root)).violations.map((violation) => violation.id)).toEqual([]);
  $('.toggle-theme').click();
  // 主题切换时颜色有过渡，等过渡结束再检查对比度
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await Promise.all(document.getAnimations().map((animation) => animation.finished));
  expect((await axe.run(root)).violations.map((violation) => violation.id)).toEqual([]);
});
