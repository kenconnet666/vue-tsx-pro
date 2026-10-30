// 浏览器测试的公共部分：挂演示页面（测试结束时卸载）、派发触摸、慢速拖动
import { onTestFinished } from 'vitest';
import { createApp, h, type Component } from 'vue';

declare module 'vitest/browser' {
  interface BrowserCommands {
    /** 用真实的触摸点一下文字是 text 的元素（vitest.browser.config.ts） */
    tap(text: string): Promise<void>;
  }
}

/** 把演示页面挂到 body 上 */
export function mount(page: Component) {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({ render: () => h(page, { query: {} }) });
  app.mount(root);
  onTestFinished(() => {
    app.unmount();
    root.remove();
  });
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 派发一次触摸（WebKit 不让构造 Touch，统一用普通事件带上触点，组件只读 touches 的坐标） */
export function touch(target: Element, type: string, x: number, y: number) {
  const point = { identifier: 0, target, clientX: x, clientY: y, pageX: x, pageY: y };
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { touches: type === 'touchend' ? [] : [point], changedTouches: [point] });
  target.dispatchEvent(event);
}

/** 慢慢拖：每步隔一帧，松手前停一会儿（不带惯性） */
export async function drag(
  target: Element,
  from: [number, number],
  to: [number, number],
  steps = 6,
) {
  touch(target, 'touchstart', ...from);
  for (let step = 1; step <= steps; step++) {
    await wait(16);
    touch(
      target,
      'touchmove',
      from[0] + ((to[0] - from[0]) * step) / steps,
      from[1] + ((to[1] - from[1]) * step) / steps,
    );
  }
  await wait(150);
  touch(target, 'touchmove', ...to);
  touch(target, 'touchend', ...to);
}
