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
    async scrollBehavior(to, _from, saved) {
      if (saved) return saved;
      const id = decodeURIComponent(to.hash.slice(1));
      if (!id || !document.getElementById(id)) return { top: 0 };
      const target = await settled(id);
      if (!target) return { top: 0 };
      return { el: target, top: parseFloat(getComputedStyle(target).scrollMarginTop) || 0 };
    },
  });
}

/**
 * 等锚点的位置连续两帧不变（异步高亮、图片撑开上方内容时它还在移动），最多等 1 秒。
 * 每帧按 id 重新取：示例换列时元素会重建
 */
async function settled(id: string): Promise<HTMLElement | null> {
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  let last = NaN;
  for (let frame = 0; frame < 60; frame++) {
    await nextFrame();
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    if (top === undefined || top === last) break;
    last = top;
  }
  return document.getElementById(id);
}
