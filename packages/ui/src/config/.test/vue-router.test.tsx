import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
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
