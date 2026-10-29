// 部件 props 的合并规则
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { elementProps, mergeAttrs, mergeProps } from '../props';

const styles = css.create({ box: { display: 'flex' }, red: { color: 'red' } });

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

  it('只有默认层时原样返回，不复制', () => {
    const defaults = { sx: 'a', id: 'x' };
    expect(mergeProps(defaults)).toBe(defaults);
    expect(mergeProps(defaults, {}, undefined)).toBe(defaults);
  });

  it('使用方显式传 undefined 的事件不会盖掉组件的', () => {
    const own = vi.fn();
    const merged = mergeProps({ onClick: own }, { onClick: undefined, title: 't' });
    expect(merged.onClick).toBe(own);
  });

  it('只有一方给了事件时不包装', () => {
    const user = vi.fn();
    expect(mergeProps({ id: 'a' }, { onClick: user }).onClick).toBe(user);
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

describe('mergeAttrs', () => {
  it('合并三层后把 sx 换成 class', () => {
    const attrs = mergeAttrs<'div'>(
      { sx: styles.box, id: 'a' },
      { class: 'user' },
      { role: 'group' },
    );
    expect(attrs).toMatchObject({ id: 'a', role: 'group' });
    // Vue 会展开嵌套的 class 数组
    expect(attrs.class).toEqual([['user'], css.attrs(styles.box).class]);
    expect('sx' in attrs).toBe(false);
  });

  it('单个样式的编译结果与 css.attrs 一致，数组照常合并', () => {
    expect(mergeAttrs<'div'>({ sx: styles.box }).class).toBe(css.attrs(styles.box).class);
    expect(mergeAttrs<'div'>({ sx: [styles.box, styles.red] }).class).toBe(
      css.attrs(styles.box, styles.red).class,
    );
  });
});
