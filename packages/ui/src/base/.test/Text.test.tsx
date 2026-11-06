import { describe, expect, it } from 'vitest';
import { mount, styleOf, styleTextOf } from '../../utils/.test/mount';
import { Em, Paragraph, Small, Strong, Text } from '../Text';

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
