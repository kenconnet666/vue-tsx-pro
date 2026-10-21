import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { Link } from '../../base/Link';
import { LinkButton } from '../../base/LinkButton';
import { Provider } from '../Provider';
import { mount } from '../../utils/.test/mount';
import { vueRouterAdapter } from '../vue-router';

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:path(.*)*', component: { render: () => null } }],
  });

describe('vueRouterAdapter', () => {
  it('isActive：默认路径完全相同；prefix 时子路径也算', async () => {
    const router = makeRouter();
    await router.push('/orders/42');
    expect(vueRouterAdapter(router).isActive!('/orders')).toBe(false);
    expect(vueRouterAdapter(router).isActive!('/orders/42')).toBe(true);
    const prefix = vueRouterAdapter(router, { match: 'prefix' });
    expect(prefix.isActive!('/orders')).toBe(true);
    expect(prefix.isActive!('/order')).toBe(false);
    // 首页是所有路径的前缀：只在就是首页时算当前
    expect(prefix.isActive!('/')).toBe(false);
  });

  it('hash 模式：<a href> 渲染 #/…（相对当前页），新标签页打开也是同一页', () => {
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/:path(.*)*', component: { render: () => null } }],
    });
    const root = mount(() => (
      <Provider router={vueRouterAdapter(router)}>
        <Link href="/orders">订单</Link>
      </Provider>
    ));
    expect(root.querySelector('a')!.getAttribute('href')).toBe('#/orders');
  });

  it('<a href> 渲染带 base 的真实地址，外部链接与页内锚点原样；点击交给路由的仍是原文', async () => {
    const router = createRouter({
      history: createWebHistory('/admin/'),
      routes: [{ path: '/:path(.*)*', component: { render: () => null } }],
    });
    const root = mount(() => (
      <Provider router={vueRouterAdapter(router)}>
        <Link href="/orders">订单</Link>
        <Link href="https://example.com">外部</Link>
        <Link href="#notes">本页</Link>
      </Provider>
    ));
    const [orders, external, anchor] = root.querySelectorAll('a');
    expect(orders!.getAttribute('href')).toBe('/admin/orders');
    expect(external!.getAttribute('href')).toBe('https://example.com');
    expect(anchor!.getAttribute('href')).toBe('#notes');
    orders!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    await new Promise((resolve) => setTimeout(resolve));
    expect(router.currentRoute.value.path).toBe('/orders');
  });

  it('isActive：带锚点的链接指向页内的一节，锚点也相同才算当前', async () => {
    const router = makeRouter();
    await router.push('/orders/42#items');
    const adapter = vueRouterAdapter(router);
    expect(adapter.isActive!('#items')).toBe(true);
    expect(adapter.isActive!('#notes')).toBe(false);
    expect(adapter.isActive!('/orders/42#notes')).toBe(false);
    expect(adapter.isActive!('/orders/42')).toBe(true);
  });

  it('LinkButton 的站内点击走 router.push，不刷新页面', async () => {
    const router = makeRouter();
    await router.push('/');
    const root = mount(() => (
      <Provider router={vueRouterAdapter(router)}>
        <LinkButton href="/orders">订单</LinkButton>
      </Provider>
    ));
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    root.querySelector('a')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    await router.isReady();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve));
    expect(router.currentRoute.value.path).toBe('/orders');
  });
});
