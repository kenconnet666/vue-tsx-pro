// Marquee：内容复制一份（对读屏隐藏、不可聚焦），方向与暂停写成 data 属性
import { describe, expect, it } from 'vitest';
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
