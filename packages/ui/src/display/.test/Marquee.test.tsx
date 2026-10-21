// Marquee：内容复制一份（对读屏隐藏、不可聚焦），方向与暂停写成 data 属性
import { describe, expect, it, vi } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Marquee } from '../Marquee';

describe('Marquee', () => {
  it('两份内容：第二份 aria-hidden 且 inert，读屏只念一遍', () => {
    const root = mount(() => (
      <Marquee aria-label="合作伙伴">
        <a href="#a">A</a>
        <a href="#b">B</a>
      </Marquee>
    ));
    const marquee = root.firstElementChild as HTMLElement;
    const [original, copy] = marquee.firstElementChild!.children;
    expect(original!.textContent).toBe('AB');
    expect(copy!.textContent).toBe('AB');
    expect(original!.hasAttribute('aria-hidden')).toBe(false);
    expect(copy!.getAttribute('aria-hidden')).toBe('true');
    expect(copy!.hasAttribute('inert')).toBe(true);
    expect(marquee.getAttribute('role')).toBe('marquee');
    expect(marquee.getAttribute('aria-label')).toBe('合作伙伴');
  });

  it('减少动态效果时不滚动、变成手动滚动的区域：可以聚焦，键盘也能滚', () => {
    const stub = (reduce: boolean) =>
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: reduce && query.includes('reduce'),
        addEventListener() {},
        removeEventListener() {},
      }));
    try {
      stub(false);
      const moving = mount(() => <Marquee aria-label="公告">内容</Marquee>);
      expect(moving.firstElementChild!.hasAttribute('tabindex')).toBe(false);
      stub(true);
      const still = mount(() => <Marquee aria-label="公告">内容</Marquee>);
      expect(still.firstElementChild!.getAttribute('tabindex')).toBe('0');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('方向与暂停写成 data 属性', () => {
    const root = mount(() => (
      <Marquee direction="up" paused>
        内容
      </Marquee>
    ));
    const marquee = root.firstElementChild as HTMLElement;
    expect(marquee.dataset.direction).toBe('up');
    expect(marquee.dataset.paused).toBe('true');
  });
});
