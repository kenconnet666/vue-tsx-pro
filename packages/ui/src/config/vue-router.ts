/**
 * vue-router 的路由适配（子路径 `@vue-tsx-pro/ui/vue-router`；vue-router 是可选的 peer 依赖）：
 *
 *   app.use(router).use(createUi({ router: vueRouterAdapter(router) }))
 *
 * Link、LinkButton、导航组件的站内链接点击后走 router.push（不刷新页面），<a href> 渲染 router.resolve 的真实地址
 * （带 base 与 hash 模式的 #），当前页按路由判断。组件本身只依赖 config 里的 UiRouter 接口，换别的路由库时自己实现即可。
 */
import type { LocationQueryRaw, Router } from 'vue-router';
import type { QueryPatch, UiRouter } from './context';

/** 怎样算“当前页” */
export interface RouteMatches {
  /** 路径完全相同（默认）：面包屑、分页、标签页 */
  exact: unknown;
  /** 当前路径以它开头：侧边导航里 /orders 在 /orders/42 页面也高亮 */
  prefix: unknown;
}

/** vueRouterAdapter 的选项 */
export interface VueRouterAdapterOptions {
  /** 怎样算当前页，默认 exact */
  match?: keyof RouteMatches;
}

/** 把 vue-router 的实例转成组件库的路由适配 */
export function vueRouterAdapter(
  router: Router,
  { match = 'exact' }: VueRouterAdapterOptions = {},
): UiRouter {
  // 同一轮里的 replaceQuery 攒在一起，一次 replace（参考 VueUse 的 useRouteQuery）：分开跳转时后一次会覆盖前一次
  let pending: QueryPatch | undefined;
  function flushQuery() {
    const { path, hash, query } = router.currentRoute.value;
    const next: LocationQueryRaw = { ...query };
    for (const [key, value] of Object.entries(pending ?? {})) {
      if (value === undefined) delete next[key];
      else next[key] = typeof value === 'string' ? value : [...value];
    }
    pending = undefined;
    void router.replace({ path, hash, query: next });
  }

  return {
    navigate: (href) => void router.push(href),
    beforeLeave: (guard) =>
      router.beforeEach((to, from) => (to.path === from.path ? true : guard())),
    query: () =>
      Object.fromEntries(
        Object.entries(router.currentRoute.value.query).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.map((item) => item ?? '') : (value ?? ''),
        ]),
      ),
    replaceQuery(patch) {
      if (!pending) queueMicrotask(flushQuery);
      pending = { ...pending, ...patch };
    },
    resolve: (href) => router.resolve(href).href,
    isActive(href) {
      // resolve 处理 base 与相对路径；读 currentRoute 是响应式的，导航组件在渲染时调用即可跟随路由
      const resolved = router.resolve(href);
      // 带锚点的链接（#tasks、/guide#install）指向页内的一节：路径相同、锚点也相同才算当前
      if (resolved.hash && resolved.hash !== router.currentRoute.value.hash) return false;
      const target = resolved.path;
      const current = router.currentRoute.value.path;
      if (current === target) return true;
      // 首页（/）是所有路径的前缀：只在就是首页时算当前
      if (match !== 'prefix' || target === '/') return false;
      return current.startsWith(target.endsWith('/') ? target : `${target}/`);
    },
  };
}
