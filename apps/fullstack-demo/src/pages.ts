/** 应用的页面（nitro.config.ts 在 Node 里也加载它，只从 kit/page 导入）：三种渲染模式各一个、要求权限的待办、服务端渲染出错退回的示例（服务端入口、浏览器入口、nitro.config.ts 共用） */
import { definePages } from '@zerodep-dev/vue-tsx-pro-kit/page';

export const pages = definePages([
  { path: '/', mode: 'ssr', title: '首页', component: () => import('./pages/Home.tsx') },
  {
    path: '/todos',
    mode: 'ssr',
    title: '待办',
    permission: 'todo.read',
    component: () => import('./pages/Todos.tsx'),
  },
  { path: '/report', mode: 'csr', title: '报表', component: () => import('./pages/Report.tsx') },
  { path: '/about', mode: 'static', title: '关于', component: () => import('./pages/About.tsx') },
  {
    path: '/fallback',
    mode: 'ssr',
    title: '出错退回',
    component: () => import('./pages/Fallback.tsx'),
  },
]);
