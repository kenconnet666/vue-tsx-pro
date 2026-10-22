/**
 * 路由表：外壳是布局路由，各页是它的子路由（按需加载）。meta 写页面标题（浏览器标签上显示）与侧栏里高亮哪一项；
 * 项目详情、编辑按编号的前缀（DJ / DMC）高亮对应的台账
 */
import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type RouterHistory,
  type RouteRecordRaw,
} from 'vue-router';
import { kindOfCode } from '../domain/task/code';
import { AppLayout } from './layout/AppLayout';
import type { NavKey } from './layout/nav';

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题 */
    title?: string;
    /** 侧栏里高亮哪一项：固定的一项，或按地址参数算 */
    section?: NavKey | ((route: RouteLocationNormalized) => NavKey);
  }
}

/** 项目详情、编辑：按编号的前缀高亮单机降本或降 DMC 台账 */
const ledgerOfCode = (route: RouteLocationNormalized): NavKey =>
  kindOfCode(String(route.params.code));

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        component: () => import('../modules/analytics/DashboardPage'),
        meta: { title: '统计看板', section: 'dashboard' },
      },
      {
        path: 'tasks/unit',
        component: () => import('../modules/tasks/ledger/UnitLedgerPage'),
        meta: { title: '单机降本台账', section: 'unit' },
      },
      {
        path: 'tasks/dmc',
        component: () => import('../modules/tasks/ledger/DmcLedgerPage'),
        meta: { title: '降 DMC 台账', section: 'dmc' },
      },
      {
        path: 'tasks/unit/new',
        component: () => import('../modules/tasks/editor/UnitEditorPage'),
        meta: { title: '新建单机降本项目', section: 'unit' },
      },
      {
        path: 'tasks/dmc/new',
        component: () => import('../modules/tasks/editor/DmcEditorPage'),
        meta: { title: '新建降 DMC 项目', section: 'dmc' },
      },
      {
        path: 'tasks/:code',
        component: () => import('../modules/tasks/detail/TaskDetailPage'),
        meta: { title: '项目详情', section: ledgerOfCode },
      },
      {
        path: 'tasks/:code/edit',
        component: () => import('../modules/tasks/editor/TaskEditPage'),
        meta: { title: '编辑项目', section: ledgerOfCode },
      },
      {
        path: 'benefit/confirm',
        component: () => import('../modules/benefit/ConfirmPage'),
        meta: { title: '收益认定', section: 'confirm' },
      },
      {
        path: 'benefit/ledger',
        component: () => import('../modules/benefit/ValueLedgerPage'),
        meta: { title: '一本账', section: 'ledger' },
      },
      {
        path: 'spec',
        component: () => import('../modules/spec/SpecPage'),
        meta: { title: '设计规格', section: 'spec' },
      },
      {
        path: ':rest(.*)*',
        component: () => import('../modules/spec/NotFoundPage'),
        meta: { title: '页面不存在' },
      },
    ],
  },
];

/** 建路由（测试里可以换成内存里的 history） */
export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  const router = createRouter({
    history,
    routes,
    // 换页回到顶部；只换查询参数（页签、筛选）时留在原处
    scrollBehavior: (to, from) => (to.path === from.path ? false : { top: 0 }),
  });
  router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} · 联合降本管理` : '联合降本管理';
  });
  return router;
}
