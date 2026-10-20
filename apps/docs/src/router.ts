/** 文档站的路由：首页、指南与组件页（来自 site/nav）、找不到页面 */
import { createRouter, createWebHistory, type RouterHistory } from 'vue-router';
import { allPages } from './site/nav';

/** 创建路由；测试传入内存路由历史 */
export function createDocsRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  return createRouter({
    history,
    routes: [
      { path: '/', component: () => import('./pages/Home'), meta: { title: '' } },
      // 代码演练场试点：还不在侧栏里
      {
        path: '/playground',
        component: () => import('./pages/Playground'),
        meta: { title: '代码演练场（试点）' },
      },
      ...allPages.map((page) => ({
        path: page.path,
        component: page.component,
        meta: { title: page.title },
      })),
      {
        path: '/:missing(.*)*',
        component: () => import('./pages/NotFound'),
        meta: { title: '找不到页面' },
      },
    ],
    // 换页回到顶部；带锚点时滚到那一节，让开粘性顶栏（标题的 scroll-margin-top）
    scrollBehavior(to, _from, saved) {
      if (saved) return saved;
      if (!to.hash) return { top: 0 };
      const target = document.getElementById(decodeURIComponent(to.hash.slice(1)));
      const offset = target ? parseFloat(getComputedStyle(target).scrollMarginTop) || 0 : 0;
      return { el: to.hash, top: offset };
    },
  });
}
