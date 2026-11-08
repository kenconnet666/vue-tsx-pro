/**
 * 流程中心的路由（docs/decisions 0009）：自己的应用外壳，引擎跑在浏览器的 Worker 里。
 * 文档站的路由挂它；流程中心的浏览器测试也用它建自己的路由。
 */
import type { RouteRecordRaw } from 'vue-router';

export const flowRoutes: RouteRecordRaw = {
  path: '/flow',
  component: () => import('./App'),
  meta: { title: '流程中心' },
  children: [
    { path: '', redirect: '/flow/work' },
    {
      path: 'work',
      component: () => import('./pages/Workbench'),
      meta: { title: '工作台 · 流程中心' },
    },
    {
      path: 'studio',
      component: () => import('./studio/StudioList'),
      meta: { title: '工作室 · 流程中心' },
    },
    {
      path: 'studio/:key',
      component: () => import('./studio/StudioEditor'),
      meta: { title: '工作室 · 流程中心' },
    },
    {
      path: 'admin',
      component: () => import('./pages/Admin'),
      meta: { title: '管理 · 流程中心' },
    },
    {
      path: 'monitor',
      component: () => import('./pages/Monitor'),
      meta: { title: '监控 · 流程中心' },
    },
    {
      path: 'documents',
      component: () => import('./pages/Documents'),
      meta: { title: '单据 · 流程中心' },
    },
    {
      path: 'proxy',
      component: () => import('./pages/Proxies'),
      meta: { title: '代理 · 流程中心' },
    },
    {
      path: 'start',
      component: () => import('./pages/StartCenter'),
      meta: { title: '发起 · 流程中心' },
    },
    {
      path: 'start/:key',
      component: () => import('./pages/StartForm'),
      meta: { title: '发起 · 流程中心' },
    },
  ],
};
