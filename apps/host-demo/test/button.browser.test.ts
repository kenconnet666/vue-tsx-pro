// 按钮家族在真实浏览器里：尺寸、波纹、加载中宽度不变（演示页 /base；颜色对比度由 base 的 axe 检查覆盖）
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

describe('Button', () => {
  it('高度不小于 24px 的点击区域，随字号缩放（control 2.25em）', () => {
    for (const button of root.querySelectorAll<HTMLElement>('.button-row-accent button')) {
      if (button.textContent === 'link') continue;
      const { height } = button.getBoundingClientRect();
      const fontSize = Number.parseFloat(getComputedStyle(button).fontSize);
      expect(height).toBeGreaterThanOrEqual(Math.max(24, fontSize * 2.25) - 0.5);
    }
    const icon = $('.icon-button-demo').getBoundingClientRect();
    expect(icon.width).toBeCloseTo(icon.height, 0);
  });

  it('按下时出现波纹，松开后淡出并移除', async () => {
    const button = $('.button-row-accent button');
    const rect = button.getBoundingClientRect();
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: rect.left + 10,
        clientY: rect.top + 10,
        button: 0,
        bubbles: true,
      }),
    );
    const ripple = button.querySelector<HTMLElement>('span[aria-hidden="true"]:last-child')!;
    expect(ripple).not.toBeNull();
    expect(getComputedStyle(ripple).position).toBe('absolute');
    window.dispatchEvent(new PointerEvent('pointerup'));
    await expect.poll(() => ripple.isConnected, { timeout: 3000 }).toBe(false);
  });

  it('loading：宽度不变，显示旋转指示，读屏名称保留', async () => {
    const button = $<HTMLButtonElement>('.save-button');
    const width = button.getBoundingClientRect().width;
    button.click();
    await nextFrame();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getBoundingClientRect().width).toBeCloseTo(width, 0);
    expect(button.textContent).toBe('保存');
    expect(document.activeElement === button || !button.disabled).toBe(true);
  });
});
