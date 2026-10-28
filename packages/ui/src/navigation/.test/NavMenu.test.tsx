// NavMenu：菜单树渲染成小节/分组/链接；没有可显示页面的目录不画；当前页按路由适配判断；顶层可以改成分组
import { Boxes, House } from '@lucide/icons';
import { describe, expect, it, vi } from 'vitest';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { NavMenu, type NavMenuItem } from '../NavMenu';

const items: NavMenuItem[] = [
  { label: '首页', href: '/', icon: House },
  {
    label: '降本管理',
    icon: Boxes,
    children: [
      { label: '降本项目', href: '/projects', badge: 3 },
      { label: '台账', href: '/ledger' },
      { label: '设置', children: [{ label: '字典', href: '/dict' }] },
    ],
  },
  { label: '空目录', children: [{ label: '无页面的子目录', children: [] }] },
];

const render = (path: string, topLevel?: 'section' | 'group') =>
  mount(() => (
    <Provider router={{ navigate: vi.fn(), isActive: (href) => href === path }}>
      <NavMenu aria-label="主菜单" items={items} topLevel={topLevel} />
    </Provider>
  ));

describe('NavMenu', () => {
  it('顶层的目录是小节，叶子是链接，没有页面的目录不画', () => {
    const nav = render('/projects').querySelector('nav[aria-label="主菜单"]')!;
    const links = [...nav.querySelectorAll('a')].map((a) => a.textContent);
    expect(links).toEqual(['首页', '降本项目3', '台账', '字典']);
    expect(nav.textContent).toContain('降本管理');
    expect(nav.textContent).not.toContain('空目录');
    // 顶层是小节（一直展开）：标题不是按钮；更深一层是可收起的分组：标题是按钮
    const buttons = [...nav.querySelectorAll('button[aria-expanded]')].map((b) => b.textContent);
    expect(buttons).toEqual(['设置']);
  });

  it('当前页的链接带 aria-current', () => {
    const nav = render('/ledger').querySelector('nav')!;
    const current = [...nav.querySelectorAll('a[aria-current="page"]')].map((a) => a.textContent);
    expect(current).toEqual(['台账']);
  });

  it('topLevel="group" 时顶层目录也是可收起的分组', () => {
    const nav = render('/', 'group').querySelector('nav')!;
    const buttons = [...nav.querySelectorAll('button[aria-expanded]')].map((b) => b.textContent);
    expect(buttons).toEqual(['降本管理', '设置']);
  });
});
