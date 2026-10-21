// 弹层工具里不依赖布局的部分；焦点循环在真实浏览器里测（apps/host-demo 的浏览器测试）
import { describe, expect, it } from 'vitest';
import { lockScroll } from '../overlay';
import { toElement } from '../element';

describe('toElement', () => {
  it('元素原样返回，组件实例取 $el，其他返回 null', () => {
    const element = document.createElement('div');
    expect(toElement(element)).toBe(element);
    expect(toElement({ $el: element })).toBe(element);
    expect(toElement({ $el: document.createTextNode('x') })).toBeNull();
    expect(toElement(null)).toBeNull();
  });
});

describe('lockScroll', () => {
  it('可以叠加，最后一个解锁时恢复原样；重复解锁没有副作用', () => {
    const root = document.documentElement;
    root.style.overflow = 'auto';
    const first = lockScroll();
    const second = lockScroll();
    expect(root.style.overflow).toBe('hidden');

    first();
    first();
    expect(root.style.overflow).toBe('hidden');
    second();
    expect(root.style.overflow).toBe('auto');
  });
});
