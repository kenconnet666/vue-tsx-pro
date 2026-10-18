/**
 * vue-router 的路由适配（子路径 `@vue-tsx-pro/ui/vue-router`；vue-router 是可选的 peer 依赖）：
 *
 *   app.use(router).use(createUi({ router: vueRouterAdapter(router) }))
 *
 * Link、LinkButton、导航组件的站内链接点击后走 router.push（不刷新页面），当前页按路由判断。
 * 组件本身只依赖 config 里的 UiRouter 接口，换别的路由库时自己实现这两个函数即可。
 */
import type { Router } from 'vue-router';
import type { UiRouter } from '../config/context';

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
  return {
    navigate: (href) => void router.push(href),
    isActive(href) {
      // resolve 处理 base 与相对路径；读 currentRoute 是响应式的，导航组件在渲染时调用即可跟随路由
      const target = router.resolve(href).path;
      const current = router.currentRoute.value.path;
      if (current === target) return true;
      return match === 'prefix' && current.startsWith(target.endsWith('/') ? target : `${target}/`);
    },
  };
}
