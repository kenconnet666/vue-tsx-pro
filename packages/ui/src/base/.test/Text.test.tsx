import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Text } from '../Text';

const render = (node: Parameters<typeof mount>[0]) => mount(node).firstElementChild as HTMLElement;
const classes = (el: Element) => (el.getAttribute('class') ?? '').split(' ').filter(Boolean).length;

describe('Text', () => {
  it('默认 span 且不加样式（全部继承上下文）；as 可换成 p', () => {
    const plain = render(() => <Text>a</Text>);
    expect(plain.tagName).toBe('SPAN');
    expect(classes(plain)).toBe(0);
    expect(render(() => <Text as="p">a</Text>).tagName).toBe('P');
  });

  it('各项 prop 各自追加样式；lineClamp 的行数写在行内变量里', () => {
    const el = render(() => (
      <Text size="sm" weight="medium" tone="muted" align="center" lineClamp={2}>
        a
      </Text>
    ));
    expect(classes(el)).toBeGreaterThanOrEqual(5);
    expect(el.getAttribute('style')).toContain('2');
  });
});

// @ts-expect-error button 不在可选标签里
export const wrongTag = () => <Text as="button">x</Text>;
