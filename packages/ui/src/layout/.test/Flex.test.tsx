// 实际排版（间距、换行、对齐）见 apps/host-demo/test/base.browser.test.ts
import { describe, expect, it } from 'vitest';
import { hasStyles, mount, styleOf } from '../../utils/.test/mount';
import { createFlex, Flex, FlexList, flexStyles } from '../Flex';

const render = (node: Parameters<typeof mount>[0]) => mount(node).firstElementChild as HTMLElement;
const classes = (el: Element) => styleOf(el).size;

const Toolbar = createFlex('nav', 'Toolbar');
const Steps = createFlex('ol', 'Steps');

describe('Flex', () => {
  it('div，未声明的属性落到元素上；各项 prop 各自追加样式', () => {
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

  it('grow：在父级 flex 里占满剩余空间并允许收缩', () => {
    const grown = render(() => <Flex grow>a</Flex>);
    expect(hasStyles(grown, flexStyles.grow)).toBe(true);
    expect(
      hasStyles(
        render(() => <Flex>a</Flex>),
        flexStyles.grow,
      ),
    ).toBe(false);
  });

  it('FlexList 是 ul：去掉圆点并补上 role="list"（Safari 去掉圆点后会丢列表语义）', () => {
    const list = render(() => (
      <FlexList>
        <li>a</li>
      </FlexList>
    ));
    expect(list.tagName).toBe('UL');
    expect(list.getAttribute('role')).toBe('list');
    expect(classes(list)).toBeGreaterThan(classes(render(() => <Flex>a</Flex>)));
  });

  it('createFlex 生成其他语义标签的组件；ol 同样按列表处理', () => {
    const nav = render(() => <Toolbar aria-label="工具栏">a</Toolbar>);
    expect(nav.tagName).toBe('NAV');
    expect(nav.hasAttribute('role')).toBe(false);
    expect(render(() => <Steps>a</Steps>).getAttribute('role')).toBe('list');
  });
});

// 类型：工厂只接受布局标签，生成的组件只接受自己元素的属性
// @ts-expect-error button 不是布局标签
export const wrongTag = () => createFlex('button', 'X');
// @ts-expect-error reversed 是 ol 的属性，ul 没有
export const wrongAttribute = () => <FlexList reversed>x</FlexList>;
export const ownAttribute = () => <Steps reversed>x</Steps>;
