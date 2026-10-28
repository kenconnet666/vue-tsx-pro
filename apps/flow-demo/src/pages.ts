/** 应用的页面（nitro.config.ts 在 Node 里也加载它，只从 kit/page 导入）：待办（首页）、发起、实例详情，都要求登录（flow.use）；三个页面都在服务端渲染 */
import { definePages } from '@zerodep-dev/vue-tsx-pro-kit/page';

export const pages = definePages([
  {
    path: '/',
    mode: 'ssr',
    title: '待办',
    permission: 'flow.use',
    component: () => import('./pages/Todo.tsx'),
  },
  {
    path: '/start',
    mode: 'ssr',
    title: '发起',
    permission: 'flow.use',
    component: () => import('./pages/Start.tsx'),
  },
  {
    path: '/instances/:id',
    mode: 'ssr',
    title: '审批单',
    permission: 'flow.use',
    component: () => import('./pages/Instance.tsx'),
  },
]);

/** 出现在菜单里的页面（详情页从列表点进去） */
export const menu = pages.filter((page) => !page.path.includes(':'));
