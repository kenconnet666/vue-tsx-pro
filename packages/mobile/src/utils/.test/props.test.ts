// 部件属性的合并：sx 与 class 按层排列、受管属性优先、使用方的事件先执行并能拦下组件的
import { describe, expect, it, vi } from 'vitest';
import { mergeProps } from '../props';

describe('mergeProps', () => {
  it('只有默认层时原样返回', () => {
    const defaults = { class: 'a' };
    expect(mergeProps(defaults)).toBe(defaults);
  });

  it('sx、class 按"默认、使用方、受管"排成数组；其他属性受管 > 使用方 > 默认', () => {
    const merged = mergeProps<Record<string, unknown>>(
      { sx: 'd', class: 'd', title: 'd', role: 'd' },
      { sx: 'u', class: 'u', title: 'u', role: 'u' },
      { role: 'm' },
    );
    expect(merged.sx).toEqual(['d', 'u']);
    expect(merged.class).toEqual(['d', 'u']);
    expect(merged.title).toBe('u');
    expect(merged.role).toBe('m');
  });

  it('使用方的事件先执行；调用了 preventDefault 就跳过组件的（不依赖 Event 全局，小程序里也成立）', () => {
    const own = vi.fn();
    const user = vi.fn((event: { preventDefault(): void }) => event.preventDefault());
    const merged = mergeProps<Record<string, unknown>>({ onClick: own }, { onClick: user });
    const event = {
      defaultPrevented: false,
      preventDefault() {
        event.defaultPrevented = true;
      },
    };
    (merged.onClick as (event: unknown) => void)(event);
    expect(user).toHaveBeenCalledOnce();
    expect(own).not.toHaveBeenCalled();
  });

  it('使用方传 undefined 不盖掉组件自己的事件', () => {
    const own = vi.fn();
    const merged = mergeProps<Record<string, unknown>>({ onClick: own }, { onClick: undefined });
    expect(merged.onClick).toBe(own);
  });
});
