import { afterEach, describe, expect, it } from 'vitest';
import { createApp, type App, type VNodeChild } from 'vue';
import { _component } from '@vue-tsx-pro/tsx';
import { VisuallyHidden } from './VisuallyHidden';

const apps: App[] = [];
afterEach(() => {
  while (apps.length) apps.pop()!.unmount();
});

function render(node: () => VNodeChild) {
  const el = document.createElement('div');
  const app = createApp(_component(() => node));
  apps.push(app);
  app.mount(el);
  return el.firstElementChild as HTMLElement;
}

describe('VisuallyHidden', () => {
  it('默认是 span，内容照常在 DOM 里（读屏能读到），并带上视觉隐藏的样式', () => {
    const el = render(() => <VisuallyHidden data-x="1">在新窗口打开</VisuallyHidden>);
    expect(el.tagName).toBe('SPAN');
    expect(el.textContent).toBe('在新窗口打开');
    expect(el.dataset.x).toBe('1');
    expect(el.getAttribute('class')).toBeTruthy();
  });

  it('as 可以换成 div', () => {
    expect(render(() => <VisuallyHidden as="div">x</VisuallyHidden>).tagName).toBe('DIV');
  });
});

// 类型：as 只能在给定的标签里选
// @ts-expect-error button 不在 VisuallyHidden 允许的标签里
export const wrongTag = () => <VisuallyHidden as="button">x</VisuallyHidden>;
