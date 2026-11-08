/** 应用的页面（nitro.config.ts 在 Node 里也加载它，只从 kit/page 导入）：工作台（首页）、发起、审批单在服务端渲染，要求登录；设计流程在浏览器里渲染、异常作业服务端渲染，都要求管理员 */
import { definePages } from '@zerodep-dev/vue-tsx-pro-kit/page';

export const pages = definePages([
  {
    path: '/',
    mode: 'ssr',
    title: '工作台',
    permission: 'flow.use',
    component: () => import('./pages/Work.tsx'),
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
    path: '/incidents',
    mode: 'ssr',
    title: '异常作业',
    permission: 'flow.admin',
    component: () => import('./pages/Incidents.tsx'),
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
