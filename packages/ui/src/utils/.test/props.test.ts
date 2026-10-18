// 部件 props 的合并规则
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { elementProps, mergeProps } from '../props';

describe('mergeProps', () => {
  it('普通属性：受管 > 使用方 > 默认', () => {
    const merged = mergeProps(
      { id: 'inner', title: 'a', role: 'img' },
      { id: 'mine', role: 'button' },
      { role: 'switch' },
    );
    expect(merged).toMatchObject({ id: 'mine', title: 'a', role: 'switch' });
  });

  it('sx、class、style 依次排列成数组', () => {
    const merged = mergeProps(
      { sx: 'a', class: 'x', style: 'color: red' },
      { sx: 'b', class: { active: true } },
    );
    expect(merged).toMatchObject({
      sx: ['a', 'b'],
      class: ['x', { active: true }],
      style: ['color: red'],
    });
  });

  it('事件：使用方先执行；preventDefault 后跳过组件自己的处理', () => {
    const order: string[] = [];
    const merged = mergeProps(
      { onClick: () => order.push('defaults') },
      { onClick: (event: Event) => (order.push('user'), event.preventDefault()) },
      { onClick: () => order.push('managed') },
    );
    (merged.onClick as (event: Event) => void)(new Event('click', { cancelable: true }));
    expect(order).toEqual(['user']);

    const both = mergeProps(
      { onClick: () => order.push('defaults') },
      {},
      { onClick: () => order.push('managed') },
    );
    (both.onClick as (event: Event) => void)(new Event('click'));
    expect(order).toEqual(['user', 'defaults', 'managed']);
  });

  it('ref：各方都拿到元素', () => {
    const own = ref<unknown>();
    const callback = vi.fn();
    const merged = mergeProps({ ref: own }, { ref: callback });
    (merged.ref as (element: unknown) => void)('el');
    expect([own.value, callback.mock.calls[0]?.[0]]).toEqual(['el', 'el']);
  });
});

describe('elementProps', () => {
  it('没有 sx 时原样返回，有 sx 时合并 class 与 style', () => {
    expect(elementProps({ id: 'a' })).toEqual({ id: 'a' });
    const props = elementProps({ sx: [null, false], class: 'host' });
    expect(props.class).toEqual(['host']);
    expect('sx' in props).toBe(false);
  });
});
