// NavBar：链接按路由判断当前页（aria-current），子项是当前页时下拉按钮也高亮；量不到布局时全部显示、“更多”藏起来。
// NavList：计数角标（展开时 Badge，紧凑时图标上的小圆点），紧凑分组弹出子项、组里有当前页时图标高亮
import { House, Package } from '@lucide/icons';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { NavBar } from '../NavBar';
import { NavGroup, NavItem, NavList } from '../NavList';

const withRouter = (path: string, render: () => unknown) =>
  mount(() => (
    <Provider router={{ navigate: vi.fn(), isActive: (href) => href === path }}>
      {render() as never}
    </Provider>
  ));

describe('NavBar', () => {
  it('当前页的链接带 aria-current；子项是当前页时它的下拉按钮也高亮；角标', () => {
    const root = withRouter('/po', () => (
      <NavBar
        aria-label="主导航"
        items={[
          { label: '工作台', href: '/' },
          {
            label: '采购',
            children: [
              { label: '采购单', href: '/po' },
              { label: '供应商', href: '/suppliers' },
            ],
          },
          { label: '报表', href: '/reports', badge: 3 },
        ]}
      />
    ));
    const nav = root.querySelector('nav[aria-label="主导航"]')!;
    const home = nav.querySelector<HTMLAnchorElement>('a')!;
    expect(home.textContent).toBe('工作台');
    expect(home.hasAttribute('aria-current')).toBe(false);
    const trigger = nav.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
    expect(trigger.textContent).toBe('采购');
    expect(trigger.dataset.state).toBe('active');
    expect([...nav.querySelectorAll('a')].at(-1)!.textContent).toBe('报表3');
    // 量不到布局：全部显示，“更多”藏起来（读屏、Tab 都跳过）
    const more = nav.querySelector('button[aria-label="更多"]')!.closest('li')!;
    expect(more.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('NavList 的角标与紧凑分组', () => {
  it('展开时角标是文字后面的 Badge；紧凑时叠在图标上，分组只剩图标、有当前页时高亮', async () => {
    const render = (compact: boolean) =>
      withRouter('/orders/refunds', () => (
        <NavList aria-label="后台" compact={compact}>
          <NavItem href="/" icon={House} badge={5}>
            概览
          </NavItem>
          <NavGroup label="订单" icon={Package}>
            <NavItem href="/orders">全部订单</NavItem>
            <NavItem href="/orders/refunds">退款</NavItem>
          </NavGroup>
        </NavList>
      ));
    const wide = render(false);
    expect(wide.querySelector('a')!.textContent).toBe('概览5');
    const narrow = render(true);
    await nextTick();
    // 紧凑：图标右上角一个小圆点（Indicator），读屏照样念出数目；文字对看的人隐藏
    expect(narrow.querySelector('a')!.textContent).toBe('5 条新消息概览');
    const group = narrow.querySelector<HTMLButtonElement>('nav > ul > li:nth-child(2) button')!;
    expect(group.textContent).toBe('订单');
    expect(group.dataset.state).toBe('active');
    expect(group.hasAttribute('aria-expanded')).toBe(false);
  });
});
