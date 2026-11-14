// AspectRatio：按比例定高度的框，比例写在 aspect-ratio 上；属性落到外层
import { describe, expect, it } from 'vitest';
import { mount, styleTextOf } from '../../utils/.test/mount';
import { AspectRatio } from '../AspectRatio';

describe('AspectRatio', () => {
  it('默认 16 / 9；ratio 接受数与 CSS 写法；带部件标记，属性落到外层', () => {
    const root = mount(() => (
      <>
        <AspectRatio data-x="1">
          <img src="/cover.png" alt="" />
        </AspectRatio>
        <AspectRatio ratio={1} />
        <AspectRatio ratio="4 / 3" />
      </>
    ));
    const [wide, square, classic] = [
      ...root.querySelectorAll<HTMLElement>('[data-scope="aspect-ratio"]'),
    ];
    expect(wide!.getAttribute('data-part')).toBe('root');
    expect(wide!.getAttribute('data-x')).toBe('1');
    expect(wide!.querySelector('img')).not.toBeNull();
    expect(styleTextOf(wide!)).toContain(String(16 / 9));
    expect(styleTextOf(square!)).toContain('1');
    expect(styleTextOf(classic!)).toContain('4 / 3');
  });
});
