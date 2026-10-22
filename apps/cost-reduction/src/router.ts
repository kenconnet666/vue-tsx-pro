/** 路由：每个案例页一条（地址是页面名的 kebab 写法），打开根地址进统计看板 */
import { createRouter, createWebHistory, type RouterHistory } from 'vue-router';
import { pageRoute } from './shell';

const pages = import.meta.glob<{ default: object }>('./pages/*.tsx');

export function createCostRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  return createRouter({
    history,
    routes: [
      { path: '/', redirect: '/cost-dashboard' },
      ...Object.entries(pages).map(([file, load]) => ({
        path: `/${pageRoute(file.slice('./pages/'.length, -'.tsx'.length))}`,
        component: load as () => Promise<{ default: object }>,
      })),
    ],
    scrollBehavior: () => ({ top: 0 }),
  });
}
