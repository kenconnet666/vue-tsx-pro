import { describe, expect, it } from 'vitest';
import type { VNodeChild } from 'vue';
import { mount } from '../../../test/mount';
import { VisuallyHidden } from './VisuallyHidden';

const render = (node: () => VNodeChild) => mount(node).firstElementChild as HTMLElement;

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
