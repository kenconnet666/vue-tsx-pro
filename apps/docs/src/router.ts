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
    // 换页回到顶部；带锚点时滚到那一节，让开粘性顶栏（标题的 scroll-margin-top）。
    // hash 不是页内锚点（演练场的 #code=…）时也回到顶部
    scrollBehavior(to, _from, saved) {
      if (saved) return saved;
      const target = to.hash && document.getElementById(decodeURIComponent(to.hash.slice(1)));
      if (!target) return { top: 0 };
      return { el: target, top: parseFloat(getComputedStyle(target).scrollMarginTop) || 0 };
    },
  });
}
