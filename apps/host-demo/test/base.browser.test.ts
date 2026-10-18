// 基础组件演示页在真实浏览器里的行为与无障碍检查；每加一批组件就在这里补对应的检查
import axe from 'axe-core';
import { themeTransition } from '@vue-tsx-pro/ui';
import { durations } from '@vue-tsx-pro/ui/tokens.stylex';
import { animate, cubicBezier } from 'animejs';
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

describe('动效：Anime.js 的 JS 动画取主题 tokens', () => {
  it('选项读的是真实主题的取值（StyleX 生成的 CSS 变量）', () => {
    const { duration, ease } = themeTransition($('.ball'));
    expect(duration).toBe(200);
    expect((ease as (t: number) => number)(0.4)).toBeCloseTo(cubicBezier(0.2, 0, 0, 1)(0.4));
  });

  it('点击后小球按弹簧动画移动到位', async () => {
    $('.move-ball').click();
    await expect
      .poll(
        () =>
          $('.ball').getBoundingClientRect().left -
          $('.ball').parentElement!.getBoundingClientRect().left,
        { timeout: 3000 },
      )
      .toBeGreaterThanOrEqual(120);
  });

  it('时长 token 为 0（减少动态效果、主题覆盖）时立即完成，元素与 JS 对象都到位', async () => {
    const element = document.createElement('div');
    element.style.setProperty(/--[\w-]+/.exec(String(durations.md))![0], '0ms');
    root.append(element);
    const options = themeTransition(element);
    expect(options).toEqual({ duration: 0 });

    await animate(element, { opacity: 0, ...options });
    expect(getComputedStyle(element).opacity).toBe('0');
    const target = { x: 0 };
    await animate(target, { x: 100, ...options });
    expect(target.x).toBe(100);
  });
});
