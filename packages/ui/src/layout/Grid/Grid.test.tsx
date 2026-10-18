// 实际列数、自动换列见 apps/host-demo/test/base.browser.test.ts
import { describe, expect, it } from 'vitest';
import { mount } from '../../../test/mount';
import { Grid } from './Grid';

const render = (node: Parameters<typeof mount>[0]) => mount(node).firstElementChild as HTMLElement;

describe('Grid', () => {
  it('列数与最小宽度是动态样式：取值写在行内的 CSS 变量里', () => {
    const fixed = render(() => <Grid columns={3}>a</Grid>);
    expect(fixed.getAttribute('style')).toContain('repeat(3, minmax(0, 1fr))');
    const auto = render(() => <Grid minItemWidth="14em">a</Grid>);
    expect(auto.getAttribute('style')).toContain('auto-fill');
    expect(auto.getAttribute('style')).toContain('14em');
  });

  it('同时给 columns 与 minItemWidth 时以 minItemWidth 为准；列表标签补上 role="list"', () => {
    const grid = render(() => (
      <Grid as="ol" columns={2} minItemWidth="10em">
        <li>a</li>
      </Grid>
    ));
    expect(grid.getAttribute('style')).toContain('auto-fill');
    expect(grid.getAttribute('role')).toBe('list');
  });
});
