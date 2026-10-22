// useQueryState：从地址读初始值、改了写回去（等于初始值时删掉）、地址变了跟着变；同一轮的几次写入合并成一次
import { _component } from '@vue-tsx-pro/tsx';
import { effectScope, nextTick, type Ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it, vi } from 'vitest';
import { useTableQuery } from '../../table/use-table-query';
import { mount } from '../../utils/.test/mount';
import { Provider } from '../Provider';
import { queryCodecs, useQueryState, useQueryStates } from '../query-state';
import { vueRouterAdapter } from '../vue-router';

async function routerAt(url: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:path(.*)*', component: { render: () => null } }],
  });
  await router.push(url);
  return router;
}

/** 在 Provider 里跑 setup，拿到它的返回值 */
function setupWith<T>(router: Awaited<ReturnType<typeof routerAt>>, setup: () => T): T {
  let result!: T;
  const Probe = _component(() => {
    result = setup();
    return () => null;
  });
  mount(() => (
    <Provider router={vueRouterAdapter(router)}>
      <Probe />
    </Provider>
  ));
  return result;
}

/** 等合并的写入（微任务）与路由跳转完成 */
const settle = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve));
};

describe('useQueryState', () => {
  it('按初始值的类型读；读不出用初始值；改了写回地址，等于初始值时删掉', async () => {
    const router = await routerAt('/orders?view=mine&size=abc&tag=a&tag=b');
    const { view, size, tags, open } = setupWith(router, () => ({
      view: useQueryState('view', 'all'),
      size: useQueryState('size', 20),
      tags: useQueryState<readonly string[]>('tag', []),
      open: useQueryState('open', false),
    }));
    expect([view.value, size.value, tags.value, open.value]).toEqual([
      'mine',
      20,
      ['a', 'b'],
      false,
    ]);

    view.value = 'all';
    size.value = 50;
    open.value = true;
    await settle();
    // 同一轮写了三个键：一次跳转，互不覆盖；别的参数不动
    expect(router.currentRoute.value.query).toEqual({ size: '50', tag: ['a', 'b'], open: 'true' });
    expect(router.currentRoute.value.path).toBe('/orders');
  });

  it('地址变了（后退、点了带参数的链接）跟着变；数字清空是 null', async () => {
    const router = await routerAt('/orders');
    const year: Ref<number | null> = setupWith(router, () =>
      useQueryState<number | null>('year', 2026, queryCodecs.number),
    );
    await router.push('/orders?year=2025');
    expect(year.value).toBe(2025);
    await router.push('/orders?year=');
    expect(year.value).toBeNull();
    router.back();
    await settle();
    expect(year.value).toBe(2025);
  });

  it('useQueryStates：一个对象对应几个参数，各键按自己的类型', async () => {
    const router = await routerAt('/orders?keyword=泵&year=2025');
    const filters = setupWith(router, () =>
      useQueryStates({ keyword: '', year: 2026, team: null as string | null }),
    );
    expect(filters.value).toEqual({ keyword: '泵', year: 2025, team: null });
    filters.value = { keyword: '', year: 2026, team: 'A' };
    await settle();
    expect(router.currentRoute.value.query).toEqual({ team: 'A' });
  });

  it('没配路由时就是普通的状态', () => {
    const scope = effectScope();
    const view = scope.run(() => useQueryState('view', 'all'))!;
    view.value = 'mine';
    expect(view.value).toBe('mine');
    scope.stop();
  });
});

describe('useTableQuery 的 syncToUrl', () => {
  it('页码、条数、排序、筛选条件从地址来，改了写回去；地址变了重新请求', async () => {
    const router = await routerAt('/tasks?page=3&sort=-amount&keyword=泵');
    const fetcher = vi.fn(async () => ({ rows: [1], total: 100 }));
    const tasks = setupWith(router, () =>
      useTableQuery(fetcher, { filters: { keyword: '' }, pageSize: 20, syncToUrl: true }),
    );
    await settle();
    expect(fetcher).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 3,
        pageSize: 20,
        sort: { key: 'amount', direction: 'descending' },
        filters: { keyword: '泵' },
      }),
      expect.anything(),
    );

    tasks.search({ keyword: '阀' });
    tasks.sort = null;
    await settle();
    expect(router.currentRoute.value.query).toEqual({ keyword: '阀' });

    await router.push('/tasks?keyword=阀&page=2');
    await settle();
    expect(tasks.page).toBe(2);
    expect(fetcher).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, sort: null }),
      expect.anything(),
    );
  });
});
