import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Separator } from '../Separator';

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

  it('带文字：文字给读屏、两段线隐藏；labelAlign 决定线在哪边；有语义时以文字为名称', () => {
    const center = render(() => <Separator>或者</Separator>);
    expect(center.hasAttribute('aria-hidden')).toBe(false);
    expect(center.textContent).toBe('或者');
    expect(center.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    const start = render(() => (
      <Separator labelAlign="start" decorative={false}>
        更改后
      </Separator>
    ));
    expect(start.children).toHaveLength(2);
    expect(start.firstElementChild!.textContent).toBe('更改后');
    expect(start.getAttribute('role')).toBe('separator');
    expect(start.getAttribute('aria-labelledby')).toBe(start.firstElementChild!.id);
  });
});
