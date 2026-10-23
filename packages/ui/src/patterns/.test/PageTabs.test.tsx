// PageTabs：点页签跳过去（Enter 才切换），关闭按钮报告要关的地址，固定的页不能关；右键“关闭其他”“关闭右侧”。
// useRouteTabs：进过的路由各一个页签（同一路径一个），切回去回到上次的完整地址，关掉当前页跳到旁边的，max
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { useRouteTabs } from '../../config/vue-router';
import { mount } from '../../utils/.test/mount';
import { PageTabs } from '../PageTabs';

beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const pages = [
  { path: '/', title: '工作台', pinned: true },
  { path: '/po', title: '采购单' },
  { path: '/suppliers', title: '供应商' },
  { path: '/reports', title: '报表' },
];

describe('PageTabs', () => {
  it('点页签跳过去；关闭按钮报告要关的地址，固定的页没有关闭按钮', async () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    const root = mount(() => (
      <PageTabs pages={pages} current="/po" onNavigate={onNavigate} onClose={onClose} />
    ));
    const tab = (title: string) =>
      [...root.querySelectorAll<HTMLElement>('[role="tab"]')].find(
        (item) => item.textContent === title,
      )!;
    expect(tab('采购单').getAttribute('aria-selected')).toBe('true');
    tab('供应商').click();
    await nextTick();
    expect(onNavigate).toHaveBeenCalledWith('/suppliers');
    // 固定的页没有关闭按钮：不包在放关闭按钮的那一层里
    expect(tab('工作台').parentElement!.getAttribute('role')).toBe('tablist');
    tab('报表').parentElement!.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
    expect(onClose).toHaveBeenCalledWith(['/reports']);
  });

  it('右键菜单：关闭其他、关闭右侧（固定的页不算）', async () => {
    const onClose = vi.fn();
    const root = mount(() => (
      <PageTabs pages={pages} current="/po" onNavigate={() => {}} onClose={onClose} />
    ));
    const po = [...root.querySelectorAll<HTMLElement>('[role="tab"]')][1]!;
    po.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    await nextTick();
    await nextTick();
    const item = (text: string) =>
      [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
        (menuItem) => menuItem.textContent === text,
      )!;
    item('关闭其他').click();
    expect(onClose).toHaveBeenLastCalledWith(['/suppliers', '/reports']);
    po.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    await nextTick();
    await nextTick();
    item('关闭右侧').click();
    expect(onClose).toHaveBeenLastCalledWith(['/suppliers', '/reports']);
  });
});

describe('useRouteTabs', () => {
  const makeRouter = () =>
    createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => null }, meta: { title: '工作台' } },
        { path: '/po', component: { render: () => null }, meta: { title: '采购单' } },
        { path: '/suppliers', component: { render: () => null }, meta: { title: '供应商' } },
        { path: '/:rest(.*)*', component: { render: () => null } },
      ],
    });

  it('进过的路由各一个页签，切回去回到上次的完整地址；关掉当前页跳到后面的', async () => {
    const router = makeRouter();
    await router.push('/');
    let tabs!: ReturnType<typeof useRouteTabs>;
    mount(() => {
      tabs ??= useRouteTabs(router, { home: '/' });
      return null;
    });
    await router.push('/po?page=3');
    await router.push('/suppliers');
    await router.push('/po?page=4');
    await nextTick();
    expect(tabs.pages.map((page) => page.title)).toEqual(['工作台', '采购单', '供应商']);
    tabs.onNavigate('/suppliers');
    await nextTick();
    tabs.onNavigate('/po');
    await new Promise((resolve) => setTimeout(resolve));
    expect(router.currentRoute.value.fullPath).toBe('/po?page=4');
    tabs.onClose(['/po']);
    await new Promise((resolve) => setTimeout(resolve));
    expect(router.currentRoute.value.path).toBe('/suppliers');
    expect(tabs.pages.map((page) => page.path)).toEqual(['/', '/suppliers']);
    // 固定的首页关不掉
    tabs.onClose(['/']);
    expect(tabs.pages).toHaveLength(2);
  });

  it('include 排除的路由不进页签；超过 max 关掉最早打开的（固定的除外）；onReorder 按新顺序', async () => {
    const router = makeRouter();
    await router.push('/');
    let tabs!: ReturnType<typeof useRouteTabs>;
    mount(() => {
      tabs ??= useRouteTabs(router, {
        home: '/',
        max: 3,
        include: (route) => route.path !== '/login',
      });
      return null;
    });
    await router.push('/login');
    await router.push('/po');
    await router.push('/suppliers');
    await nextTick();
    expect(tabs.pages.map((page) => page.path)).toEqual(['/', '/po', '/suppliers']);
    await router.push('/reports');
    await nextTick();
    expect(tabs.pages.map((page) => page.path)).toEqual(['/', '/suppliers', '/reports']);
    // 没有 meta.title 时页签文字是路径
    expect(tabs.pages[2]!.title).toBe('/reports');
    tabs.onReorder(['/reports', '/', '/suppliers']);
    expect(tabs.pages.map((page) => page.path)).toEqual(['/reports', '/', '/suppliers']);
  });
});
