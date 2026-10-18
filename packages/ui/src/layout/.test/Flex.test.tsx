// 实际排版（间距、换行、对齐）见 apps/host-demo/test/base.browser.test.ts
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { Flex } from '../Flex';

const render = (node: Parameters<typeof mount>[0]) => mount(node).firstElementChild as HTMLElement;
const classes = (el: Element) => el.getAttribute('class')!.split(' ').length;

describe('Flex', () => {
  it('默认 div，未声明的属性落到元素上；各项 prop 各自追加样式', () => {
    const plain = render(() => <Flex data-x="1">a</Flex>);
    expect(plain.tagName).toBe('DIV');
    expect(plain.dataset.x).toBe('1');
    const full = render(() => (
      <Flex direction="column" align="center" justify="between" wrap gap="md">
        a
      </Flex>
    ));
    expect(classes(full)).toBeGreaterThan(classes(plain) + 3);
  });

  it('列表标签去掉圆点并补上 role="list"（Safari 去掉圆点后会丢列表语义）', () => {
    const list = render(() => (
      <Flex as="ul">
        <li>a</li>
      </Flex>
    ));
    expect(list.tagName).toBe('UL');
    expect(list.getAttribute('role')).toBe('list');
    expect(render(() => <Flex as="nav">a</Flex>).hasAttribute('role')).toBe(false);
  });
});

// 类型：as 只能在布局标签里选
// @ts-expect-error button 不在可选标签里
export const wrongTag = () => <Flex as="button">x</Flex>;
