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
  it('部件属性：每一项的 li、链接、菜单按钮可以按项给；链接的 onClick 先执行、可以拦下跳转', () => {
    const navigate = vi.fn();
    const root = mount(() => (
      <Provider router={{ navigate, isActive: () => false }}>
        <NavBar
          aria-label="主导航"
          items={[
            { label: '工作台', href: '/' },
            { label: '采购', children: [{ label: '采购单', href: '/po' }] },
          ]}
          propsItem={(item) => ({ class: `item-${item.label}` })}
          propsLink={{
            class: 'link',
            onClick: (event: MouseEvent) => event.preventDefault(),
          }}
          propsTrigger={(item) => ({ title: `${item.label}菜单` })}
          propsMore={{ 'aria-label': '其余' }}
        />
      </Provider>
    ));
    expect(root.querySelector('li.item-工作台')).not.toBeNull();
    const link = root.querySelector<HTMLAnchorElement>('a.link')!;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(navigate).not.toHaveBeenCalled();
    const trigger = root.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
    expect([trigger.title, trigger.getAttribute('aria-expanded')]).toEqual(['采购菜单', 'false']);
    expect(root.querySelector('button[aria-label="其余"]')).not.toBeNull();
  });

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

  it('紧凑的分组在触屏上点得开：点图标弹出子项，再点收起，点外面收起', async () => {
    const root = withRouter('/', () => (
      <NavList aria-label="后台" compact>
        <NavGroup label="订单" icon={Package}>
          <NavItem href="/orders">全部订单</NavItem>
        </NavGroup>
      </NavList>
    ));
    await nextTick();
    const group = root.querySelector<HTMLButtonElement>('nav > ul > li button')!;
    const panel = () => root.querySelector<HTMLElement>('nav > ul > li [popover]')!;
    const shown = () => panel().dataset.state === 'open';
    const tap = async (target: Element) => {
      target.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }),
      );
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      for (let i = 0; i < 4; i++) await nextTick();
    };
    await tap(group);
    expect(shown()).toBe(true);
    await tap(group);
    expect(shown()).toBe(false);
    await tap(group);
    expect(shown()).toBe(true);
    document.body.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }),
    );
    for (let i = 0; i < 4; i++) await nextTick();
    expect(shown()).toBe(false);
  });
});
