// 实际列数、自动换列见 apps/host-demo/test/base.browser.test.ts
import { describe, expect, it } from 'vitest';
import { mount, styleTextOf } from '../../utils/.test/mount';
import { createGrid, Grid, GridItem, GridList, GridListItem } from '../Grid';

const render = (node: Parameters<typeof mount>[0]) => mount(node).firstElementChild as HTMLElement;

describe('Grid', () => {
  it('列数与最小宽度是动态样式：取值写在行内的 CSS 变量里', () => {
    const fixed = render(() => <Grid columns={3}>a</Grid>);
    expect(fixed.tagName).toBe('DIV');
    expect(styleTextOf(fixed)).toContain('repeat(3, minmax(0, 1fr))');
    const auto = render(() => <Grid minItemWidth="14em">a</Grid>);
    expect(styleTextOf(auto)).toContain('auto-fit');
    expect(styleTextOf(auto)).toContain('14em');
  });

  it('同时给 columns 与 minItemWidth 时以 minItemWidth 为准；GridList 是 ul 并补上 role="list"', () => {
    const grid = render(() => (
      <GridList columns={2} minItemWidth="10em">
        <li>a</li>
      </GridList>
    ));
    expect(grid.tagName).toBe('UL');
    expect(styleTextOf(grid)).toContain('auto-fit');
    expect(grid.getAttribute('role')).toBe('list');
  });

  it('createGrid 生成其他语义标签的组件', () => {
    const Gallery = createGrid('section', 'Gallery');
    const el = render(() => <Gallery aria-label="图库">a</Gallery>);
    expect(el.tagName).toBe('SECTION');
    expect(el.hasAttribute('role')).toBe(false);
  });

  it('GridItem 跨列、跨行：数字写成 span，full 占满一整行；GridListItem 是 li', () => {
    const grid = render(() => (
      <Grid columns={4}>
        <GridItem span={2} rowSpan={3}>
          a
        </GridItem>
        <GridItem span="full">b</GridItem>
        <GridItem span={1}>c</GridItem>
      </Grid>
    ));
    const [wide, full, single] = [...grid.children] as HTMLElement[];
    expect(styleTextOf(wide!)).toContain('span 2 / span 2');
    expect(styleTextOf(wide!)).toContain('span 3 / span 3');
    expect(full!.className).not.toBe('');
    expect(full!.hasAttribute('style')).toBe(false);
    // 跨一列等于不跨：不写多余的样式
    expect(single!.hasAttribute('style')).toBe(false);
    const list = render(() => (
      <GridList columns={2}>
        <GridListItem span="full">a</GridListItem>
      </GridList>
    ));
    expect(list.firstElementChild!.tagName).toBe('LI');
  });
});
