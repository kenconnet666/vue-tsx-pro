/**
 * vue-router 的路由适配（子路径 `@vue-tsx-pro/ui/vue-router`；vue-router 是可选的 peer 依赖）：
 *
 *   app.use(router).use(createUi({ router: vueRouterAdapter(router) }))
 *
 * Link、LinkButton、导航组件的站内链接点击后走 router.push（不刷新页面），<a href> 渲染 router.resolve 的真实地址
 * （带 base 与 hash 模式的 #），当前页按路由判断。组件本身只依赖 config 里的 UiRouter 接口，换别的路由库时自己实现即可。
 */
import { shallowRef, watch } from 'vue';
import type { LocationQueryRaw, RouteLocationNormalizedLoaded, Router } from 'vue-router';
import type { LoadingBarController } from '../feedback/LoadingBar';
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

/**
 * 路由切换时走顶部加载条：开始跳转时 start，跳完 finish，跳转失败（守卫抛错、懒加载的页面加载失败）时 error。
 * 被守卫取消、重定向的不算失败。返回取消监听的函数。
 *
 *   useRouteLoadingBar(router, loadingBar)
 */
export function useRouteLoadingBar(
  router: Router,
  controller: Pick<LoadingBarController, 'start' | 'finish' | 'error'>,
): () => void {
  const removers = [
    router.beforeEach((to, from) => {
      if (to.fullPath !== from.fullPath) controller.start();
    }),
    router.afterEach(() => controller.finish()),
    router.onError(() => controller.error()),
  ];
  return () => removers.forEach((remove) => remove());
}

/** 路由页签的一项（与 PageTabs 的 PageTab 同形） */
export interface RouteTab {
  /** 路由的路径（不含查询参数）：同一路径一个页签 */
  path: string;
  /** 页签上的文字 */
  title: string;
  /** 固定的页（首页）：不能关 */
  pinned?: boolean;
}

/** 页签用到的路由信息：当前路由与 router.resolve 的结果都有 */
export type RouteTabSource = Pick<
  RouteLocationNormalizedLoaded,
  'path' | 'fullPath' | 'meta' | 'params' | 'query'
>;

/** useRouteTabs 的选项 */
export interface RouteTabsOptions {
  /** 固定在最前面、不能关的首页 */
  home?: string;
  /** 页签的文字：默认取路由的 meta.title，没有时是路径 */
  title?: (route: RouteTabSource) => string;
  /** 哪些路由进页签：默认都进（登录页、404 这类返回 false） */
  include?: (route: RouteLocationNormalizedLoaded) => boolean;
  /** 最多开几个：超过时关掉最早打开的（固定的、当前的除外），默认不限 */
  max?: number;
}

/** 路由页签的状态：属性名与 PageTabs 的一致，可以整个展开 `<PageTabs {...tabs} />` */
export interface RouteTabs {
  /** 打开过的页面，按显示的顺序 */
  readonly pages: readonly RouteTab[];
  /** 当前页的路径 */
  readonly current: string;
  /** 切到一个页签：回到它上次的完整地址（带查询参数） */
  onNavigate(path: string): void;
  /** 关闭页签；关掉的有当前页时跳到旁边的（后面的，没有时前面的） */
  onClose(paths: readonly string[]): void;
  /** 按新的顺序排 */
  onReorder(paths: readonly string[]): void;
}

/**
 * 路由页签（后台的多页签）：进过的路由各一个页签，和 PageTabs 一起放在 AppShell 的 tabs 里。
 * 同一路径一个页签，切回来时回到它上次的完整地址（筛选条件、页码在查询参数里时不丢）。在组件 setup 里调用。
 *
 *   const tabs = useRouteTabs(router, { home: '/' });
 *   <AppShell tabs={<PageTabs {...tabs} />} …>
 */
export function useRouteTabs(router: Router, options: RouteTabsOptions = {}): RouteTabs {
  const titleOf = (route: RouteTabSource) =>
    options.title?.(route) ??
    (typeof route.meta.title === 'string' ? route.meta.title : route.path);
  const pages = shallowRef<RouteTab[]>([]);
  // 各页签上次的完整地址
  const fullPaths = new Map<string, string>();
  if (options.home) {
    const home = router.resolve(options.home);
    pages.value = [{ path: home.path, title: titleOf(home), pinned: true }];
    fullPaths.set(home.path, home.fullPath);
  }

  watch(
    () => router.currentRoute.value,
    (route) => {
      if (options.include && !options.include(route)) return;
      fullPaths.set(route.path, route.fullPath);
      const title = titleOf(route);
      const index = pages.value.findIndex((page) => page.path === route.path);
      if (index >= 0) {
        if (pages.value[index]!.title !== title)
          pages.value = pages.value.map((page, at) => (at === index ? { ...page, title } : page));
        return;
      }
      let next = [...pages.value, { path: route.path, title }];
      // 超过上限：关掉最早打开的（固定的、刚打开的除外）
      while (options.max && next.length > options.max) {
        const oldest = next.findIndex((page) => !page.pinned && page.path !== route.path);
        if (oldest < 0) break;
        fullPaths.delete(next[oldest]!.path);
        next = next.filter((_, at) => at !== oldest);
      }
      pages.value = next;
    },
    { immediate: true },
  );

  return {
    get pages() {
      return pages.value;
    },
    get current() {
      return router.currentRoute.value.path;
    },
    onNavigate(path) {
      void router.push(fullPaths.get(path) ?? path);
    },
    onClose(paths) {
      const closing = new Set(
        paths.filter((path) => !pages.value.find((page) => page.path === path)?.pinned),
      );
      if (closing.size === 0) return;
      const current = router.currentRoute.value.path;
      const order = pages.value;
      const rest = order.filter((page) => !closing.has(page.path));
      pages.value = rest;
      for (const path of closing) fullPaths.delete(path);
      if (!closing.has(current)) return;
      // 关掉了当前页：跳到它后面还开着的一个，没有时前面的
      const at = order.findIndex((page) => page.path === current);
      const after = order.slice(at + 1).find((page) => !closing.has(page.path));
      const before = order
        .slice(0, at)
        .reverse()
        .find((page) => !closing.has(page.path));
      const target = after ?? before;
      if (target) void router.push(fullPaths.get(target.path) ?? target.path);
    },
    onReorder(paths) {
      const byPath = new Map(pages.value.map((page) => [page.path, page]));
      pages.value = paths.flatMap((path) => byPath.get(path) ?? []);
    },
  };
}
