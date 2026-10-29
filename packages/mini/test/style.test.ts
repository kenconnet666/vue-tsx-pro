// 样式条件按节点状态判定：组件库的条件别名（属性选择器、:is/:not）、:active、@media 宽度
import { describe, expect, it } from 'vitest';
import { conditions, css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { MiniNode } from '../src/node.ts';
import { matchCondition, resolveStyle, setColorScheme, setWindowWidth } from '../src/style.ts';

const nodeWith = (attrs: Record<string, unknown> = {}) => {
  const node = new MiniNode('button');
  for (const [name, value] of Object.entries(attrs)) node.attrs.set(name, value);
  return node;
};

describe('条件判定', () => {
  it('条件别名按属性判定：原生、ARIA、data 几种写法都认', () => {
    expect(matchCondition(nodeWith({ disabled: true }), conditions._disabled)).toBe(true);
    expect(matchCondition(nodeWith({ disabled: false }), conditions._disabled)).toBe(false);
    expect(matchCondition(nodeWith({ 'aria-disabled': 'true' }), conditions._disabled)).toBe(true);
    expect(matchCondition(nodeWith({ 'data-selected': '' }), conditions._selected)).toBe(true);
    expect(matchCondition(nodeWith({ 'aria-pressed': false }), conditions._pressed)).toBe(false);
  });

  it(':not 里的选择器列表与组合：[aria-current] 但不是 "false"', () => {
    expect(matchCondition(nodeWith({ 'aria-current': 'page' }), conditions._current)).toBe(true);
    expect(matchCondition(nodeWith({ 'aria-current': 'false' }), conditions._current)).toBe(false);
    expect(
      matchCondition(nodeWith({ disabled: true }), ':hover:not(:disabled,[aria-disabled="true"])'),
    ).toBe(false);
  });

  it(':active 跟着按下状态；:hover、:focus-visible 在触屏上不成立', () => {
    const node = nodeWith();
    expect(matchCondition(node, ':active')).toBe(false);
    node.pressed = true;
    expect(matchCondition(node, ':active')).toBe(true);
    expect(matchCondition(node, ':hover')).toBe(false);
    expect(matchCondition(node, ':focus-visible')).toBe(false);
  });

  it('结构伪类只数元素兄弟，不算文本与注释（Vue 的片段锚点）', () => {
    const parent = new MiniNode('div');
    const anchor = MiniNode.text('');
    const [first, last] = [new MiniNode('div'), new MiniNode('div')];
    parent.setChildren([anchor, first, last, new MiniNode('#comment')]);
    expect(matchCondition(first, ':first-child')).toBe(true);
    expect(matchCondition(first, ':last-child')).toBe(false);
    expect(matchCondition(last, ':last-child')).toBe(true);
    expect(matchCondition(last, ':only-child')).toBe(false);
  });

  it('@media 只认宽度；减少动效等能力不成立', () => {
    setWindowWidth(375);
    expect(matchCondition(nodeWith(), '@media (min-width: 320px)')).toBe(true);
    expect(matchCondition(nodeWith(), '@media (min-width: 640px)')).toBe(false);
    expect(matchCondition(nodeWith(), '@media (max-width: 400px) and (min-width: 300px)')).toBe(
      true,
    );
    expect(matchCondition(nodeWith(), conditions._reducedMotion)).toBe(false);
  });
});

describe('主题', () => {
  it('主题类展开成节点上的变量；跟随系统的值按系统的深浅色取', () => {
    const colors = css.defineVars('mini-theme-colors', { text: '#111' });
    const system = css.createTheme(colors, {
      text: { default: '#111', '@media (prefers-color-scheme: dark)': '#eee' },
    });
    const node = new MiniNode('div');
    node.className = css.attrs(system).class!;
    setColorScheme('light');
    expect(resolveStyle(node).style).toBe('--mini-theme-colors-text:#111');
    setColorScheme('dark');
    expect(resolveStyle(node).style).toBe(
      '--mini-theme-colors-text:#111;--mini-theme-colors-text:#eee',
    );
    setColorScheme('light');
  });
});
