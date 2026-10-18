import { describe, expect, it } from 'vitest';
import { mount } from '../../../test/mount';
import { Separator } from './Separator';

const render = (node: Parameters<typeof mount>[0]) => mount(node).firstElementChild!;

describe('Separator', () => {
  it('默认装饰性：对读屏隐藏', () => {
    const el = render(() => <Separator />);
    expect(el.getAttribute('role')).toBe('none');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('有语义时是 separator，竖向带 aria-orientation', () => {
    const horizontal = render(() => <Separator decorative={false} />);
    expect(horizontal.getAttribute('role')).toBe('separator');
    expect(horizontal.hasAttribute('aria-orientation')).toBe(false);
    const vertical = render(() => <Separator decorative={false} orientation="vertical" />);
    expect(vertical.getAttribute('aria-orientation')).toBe('vertical');
    expect(vertical.hasAttribute('aria-hidden')).toBe(false);
  });
});
