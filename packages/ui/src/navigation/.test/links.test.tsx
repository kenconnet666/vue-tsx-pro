// Breadcrumbs、Pagination、NavList：结构、当前页、路由适配
import { House, Package } from '@lucide/icons';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { Breadcrumbs } from '../Breadcrumbs';
import { NavGroup, NavItem, NavList, NavSection } from '../NavList';
import { Pagination } from '../Pagination';

const trail = [
  { label: '首页', href: '/' },
  { label: '订单', href: '/orders' },
  { label: '退款', href: '/orders/refunds' },
  { label: '#1024' },
];

describe('Breadcrumbs', () => {
  it('nav > ol，名称取语言包；最后一项是当前页（不是链接），分隔符对读屏隐藏', () => {
    const root = mount(() => <Breadcrumbs items={trail} />);
    const nav = root.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('面包屑');
    const items = [...nav.querySelectorAll('li')];
    expect(items).toHaveLength(4);
    expect(items.slice(0, 3).every((li) => li.querySelector('a'))).toBe(true);
    const current = items[3]!.querySelector('[aria-current="page"]')!;
    expect([current.tagName, current.textContent]).toEqual(['SPAN', '#1024']);
    expect(items[0]!.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
    expect(items[3]!.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('maxItems：折叠中间部分，被折叠的各级是菜单里的链接', () => {
    const root = mount(() => <Breadcrumbs items={trail} maxItems={3} />);
    const expand = root.querySelector('button')!;
    expect(expand.getAttribute('aria-label')).toBe('显示被折叠的路径');
    expect(expand.getAttribute('aria-haspopup')).toBe('menu');
    expect(root.querySelectorAll('ol > li')).toHaveLength(4); // 首页、折叠按钮、退款、#1024
    const menu = root.querySelector('[role="menu"]')!;
    const link = menu.querySelector<HTMLAnchorElement>('a[role="menuitem"]')!;
    expect([link.textContent, link.getAttribute('href')]).toEqual(['订单', '/orders']);
  });

  it('折叠处那一项有自己的部件属性，propsItem 不作用于它', () => {
    const root = mount(() => (
      <Breadcrumbs
        items={trail}
        maxItems={3}
        propsItem={{ class: 'item' }}
        propsCollapsedItem={{ class: 'collapsed' }}
      />
    ));
    const items = [...root.querySelectorAll('ol > li')];
    expect(items.map((li) => li.className.includes('collapsed'))).toEqual([
      false,
      true,
      false,
      false,
    ]);
    expect(items[1]!.classList).not.toContain('item');
    expect(items[1]!.querySelector('button')).not.toBeNull();
  });
});

describe('Pagination', () => {
  it('按 total / pageSize 算页数；当前页带 aria-current，上一页在第 1 页时不可用', () => {
    const root = mount(() => <Pagination total={95} pageSize={10} showTotal />);
    const nav = root.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('分页');
    const current = nav.querySelector('[aria-current="page"]')!;
    expect([current.textContent, current.getAttribute('aria-label')]).toEqual(['1', '第 1 页']);
    const [previous] = nav.querySelectorAll<HTMLButtonElement>('button');
    expect([previous!.getAttribute('aria-label'), previous!.disabled]).toEqual(['上一页', true]);
    expect(nav.textContent).toContain('10');
    expect(nav.textContent).toContain('共 95 条');
  });

  it('总条数按语言加千分位', () => {
    const root = mount(() => <Pagination total={1286} pageSize={20} showTotal />);
    expect(root.textContent).toContain('共 1,286 条');
  });

  it('点页码、下一页写回 page；页码多时出现省略号', async () => {
    let page = _state(1);
    const root = mount(() => <Pagination _page={_bind(page)} pageCount={20} />);
    const buttonFor = (label: string) =>
      [...root.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === label)!;
    buttonFor('下一页').click();
    expect(page).toBe(2);
    buttonFor('第 5 页').click();
    await nextTick();
    expect(page).toBe(5);
    expect(root.querySelectorAll('li [aria-hidden="true"] svg').length).toBeGreaterThan(0);
  });

  it('给了 href 时页码与上一页、下一页都是链接（rel=prev / next）', () => {
    const root = mount(() => <Pagination _page={2} pageCount={3} href={(n) => `?page=${n}`} />);
    const href = (selector: string) => root.querySelector(selector)!.getAttribute('href');
    expect([href('a[rel="prev"]'), href('a[rel="next"]')]).toEqual(['?page=1', '?page=3']);
    expect([...root.querySelectorAll('a:not([rel])')].map((a) => a.getAttribute('href'))).toEqual([
      '?page=1',
      '?page=2',
      '?page=3',
    ]);
  });
});

describe('NavList', () => {
  const render = (path: string) => {
    const navigate = vi.fn();
    const root = mount(() => (
      <Provider router={{ navigate, isActive: (href) => href === path }}>
        <NavList aria-label="后台">
          <NavItem href="/" icon={House}>
            概览
          </NavItem>
          <NavGroup label="订单" icon={Package}>
            <NavItem href="/orders">全部订单</NavItem>
            <NavItem href="/orders/refunds">退款</NavItem>
          </NavGroup>
        </NavList>
      </Provider>
    ));
    return { root, navigate };
  };

  it('当前页按路由适配判断，带 aria-current="page"；点击站内链接交给路由', () => {
    const { root, navigate } = render('/');
    const links = root.querySelectorAll('a');
    expect(links[0]!.getAttribute('aria-current')).toBe('page');
    expect(links[1]!.hasAttribute('aria-current')).toBe(false);
    links[1]!.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }),
    );
    expect(navigate).toHaveBeenCalledWith('/orders');
  });

  it('分组默认收起；含当前页时自动展开；触发器切换', async () => {
    const collapsed = render('/');
    await nextTick();
    const trigger = collapsed.root.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.click();
    await nextTick();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const opened = render('/orders/refunds');
    await nextTick();
    expect(opened.root.querySelector('button[aria-expanded]')!.getAttribute('aria-expanded')).toBe(
      'true',
    );
  });
  it('NavSection：带小标题的一组，一直展开；标题是列表的名称', () => {
    const root = mount(() => (
      <NavList aria-label="文档">
        <NavSection label="指南">
          <NavItem href="/start">快速开始</NavItem>
        </NavSection>
      </NavList>
    ));
    const list = root.querySelector('nav > ul > li > ul')!;
    const label = document.getElementById(list.getAttribute('aria-labelledby')!)!;
    expect(label.textContent).toBe('指南');
    expect(list.querySelector('a')!.textContent).toBe('快速开始');
    expect(root.querySelector('button[aria-expanded]')).toBeNull();
  });
});

describe('边界情况', () => {
  it('Pagination：父级的 page 超出总页数（筛选后变少）时按最后一页显示', () => {
    const root = mount(() => <Pagination _page={9} total={30} pageSize={10} />);
    expect(root.querySelector('[aria-current="page"]')!.textContent).toBe('3');
  });
});
