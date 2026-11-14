import { describe, expect, it } from 'vitest';
import { mount, styleOf, styleTextOf } from '../../utils/.test/mount';
import { Del, Em, Ins, Paragraph, Small, Strike, Strong, Sub, Sup, Text } from '../Text';

const render = (node: Parameters<typeof mount>[0]) => mount(node).firstElementChild as HTMLElement;
/** 元素上生效的声明条数 */
const declarations = (el: Element) => styleOf(el).size;

describe('Text', () => {
  it('span 且不加样式（全部继承上下文）', () => {
    const plain = render(() => <Text>a</Text>);
    expect(plain.tagName).toBe('SPAN');
    expect(declarations(plain)).toBe(0);
  });

  it('各项 prop 各自追加样式；lineClamp 的行数写在行内变量里', () => {
    const el = render(() => (
      <Text size="sm" weight="medium" tone="muted" align="center" lineClamp={2}>
        a
      </Text>
    ));
    expect(declarations(el)).toBeGreaterThanOrEqual(5);
    expect(styleTextOf(el)).toContain('2');
  });
});

describe('一个元素一个组件', () => {
  it('Paragraph、Strong、Em、Small 渲染对应的元素，属性落到元素上', () => {
    expect(render(() => <Paragraph data-x="1">a</Paragraph>).tagName).toBe('P');
    expect(render(() => <Strong>a</Strong>).tagName).toBe('STRONG');
    expect(render(() => <Em>a</Em>).tagName).toBe('EM');
    expect(render(() => <Small>a</Small>).tagName).toBe('SMALL');
  });

  it('Sub、Sup、Del、Ins、Strike 渲染对应的元素；上下标不占行高，增删、划掉各有样式', () => {
    const tags = [Sub, Sup, Del, Ins, Strike].map(
      (Component) => render(() => <Component>a</Component>).tagName,
    );
    expect(tags).toEqual(['SUB', 'SUP', 'DEL', 'INS', 'S']);
    // 上下标：行高 0、相对基线挪位置，不把所在的行撑高
    const sup = styleOf(render(() => <Sup>2</Sup>));
    expect(sup.get('&|line-height')).toBe('0');
    expect(sup.get('&|vertical-align')).toBe('baseline');
    expect(styleOf(render(() => <Del>a</Del>)).get('&|text-decoration-line')).toBe('line-through');
    expect(styleOf(render(() => <Strike>a</Strike>)).get('&|text-decoration-line')).toBe(
      'line-through',
    );
    // 加进来的内容不用下划线（和链接分不清）
    expect(styleOf(render(() => <Ins>a</Ins>)).get('&|text-decoration-line')).toBe('none');
    // 原生属性照常落到元素上
    expect(render(() => <Del datetime="2026-11-14">a</Del>).getAttribute('datetime')).toBe(
      '2026-11-14',
    );
  });

  it('各自的默认值带样式，可以被 prop 覆盖', () => {
    // Paragraph：去外边距 + pretty 换行；Strong：semibold；Small：xs 字号与这一档的控件高度
    expect(declarations(render(() => <Paragraph>a</Paragraph>))).toBeGreaterThanOrEqual(2);
    expect(declarations(render(() => <Strong>a</Strong>))).toBe(1);
    expect(declarations(render(() => <Small>a</Small>))).toBe(2);
    expect(declarations(render(() => <Em>a</Em>))).toBe(0);
    const small = render(() => <Small size="md">a</Small>);
    expect(small.className).not.toBe(render(() => <Small>a</Small>).className);
  });
});

// 类型：每个组件只接受自己元素的属性
// @ts-expect-error cite 是 q、blockquote 的属性，span 没有
export const wrongAttribute = () => <Text cite="x">x</Text>;
