/** 文档站的路由：首页、指南与组件页（来自 site/nav）、找不到页面 */
import { createRouter, createWebHistory, type Router, type RouterHistory } from 'vue-router';
import { allPages } from './site/nav';

/** 整页示例的地址（示例卡片里 iframe 的 src） */
export const framePath = (demoPath: string) => `${import.meta.env.BASE_URL}frame/${demoPath}`;

/**
 * 当前文档是不是整页示例（iframe 里）。按加载时的地址判断、不看路由：
 * 路由第一次解析完成之前 App 就渲染了，要一开始就知道不套外壳；iframe 里也不会换到别的页面
 */
export const isFrame =
  typeof location !== 'undefined' && location.pathname.startsWith(framePath(''));

/**
 * 指针停到站内链接上、焦点落到它上面时，先下载那一页的模块（连同它依赖的块）：点下去时不用再等网络。
 * 每个地址只取一次；下载失败不管，真正换页时路由会再取并报错
 */
export function prefetchOnIntent(router: Router) {
  const done = new Set<string>();
  const prefetch = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.('a[href^="/"]');
    const href = link?.getAttribute('href');
    if (!href || done.has(href)) return;
    done.add(href);
    for (const record of router.resolve(href).matched) {
      const component = record.components?.default;
      if (typeof component === 'function') {
        void (component as () => Promise<unknown>)().catch(() => {});
      }
    }
  };
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('focusin', prefetch);
}

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
      // 整页示例：示例卡片里的 iframe 打开它，不套站点外壳（见 isFrame）
      { path: '/frame/:path(.*)', component: () => import('./pages/Frame'), meta: { title: '' } },
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
 * 每帧按 id 重新取：页面组件替换时元素会换
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
