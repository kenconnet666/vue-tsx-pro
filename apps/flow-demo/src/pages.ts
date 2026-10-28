/** 应用的页面（nitro.config.ts 在 Node 里也加载它，只从 kit/page 导入）：待办（首页）、发起、审批单在服务端渲染，要求登录；设计流程在浏览器里渲染，要求管理员 */
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
    path: '/design',
    mode: 'csr',
    title: '设计流程',
    permission: 'flow.admin',
    component: () => import('./pages/Design.tsx'),
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
