/**
 * 页面的声明：地址、渲染模式、标题、组件（ROADMAP 13.3）。框架先长在应用里，第三次重复时抽进 kit（ROADMAP 15）。
 *
 *   export const pages = definePages([
 *     { path: '/', mode: 'ssr', title: '首页', component: () => import('./pages/Home.tsx') },
 *     { path: '/report', mode: 'csr', title: '报表', component: () => import('./pages/Report.tsx') },
 *   ]);
 *
 * 这个文件也被 nitro.config.ts 在 Node 里加载（算预渲染的地址），只放声明与纯函数，不导入组件。
 */
import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

/**
 * 页面怎么渲染：
 * - ssr：每次请求在服务端渲染，浏览器水合；出错时退回 csr
 * - csr：服务端只发空壳，浏览器渲染（只能在浏览器里画的页面、不需要被搜索引擎收录的后台页）
 * - static：构建时预渲染成 HTML，浏览器水合（内容不随请求变的页面）
 */
export type RenderMode = 'ssr' | 'csr' | 'static';

/** 一个页面 */
export interface PageDef {
  path: string;
  mode: RenderMode;
  /** 标签页标题 */
  title: string;
  /** 要求的权限：没有时服务端回 403、不取数据，浏览器画“没有权限”，菜单里不出现 */
  permission?: string;
  component: () => Promise<{ default: Component }>;
}

declare module 'vue-router' {
  interface RouteMeta {
    mode?: RenderMode;
    title?: string;
    permission?: string;
  }
}

/** 声明应用的页面（只为类型检查与推导，原样返回） */
export const definePages = <const T extends readonly PageDef[]>(pages: T): T => pages;

/** 页面换成 vue-router 的路由：模式与标题放进 meta */
export const pageRoutes = (pages: readonly PageDef[]): RouteRecordRaw[] =>
  pages.map(({ path, mode, title, permission, component }) => ({
    path,
    component,
    meta: { mode, title, permission },
  }));

/** 标签页标题：“页面标题 · 网站名”，没有页面标题时只有网站名 */
export const pageTitle = (title: string | undefined, siteName: string): string =>
  title ? `${title} · ${siteName}` : siteName;

/** mode: 'static' 的页面交给 Nitro 构建时预渲染 */
export const prerenderRules = (pages: readonly PageDef[]): Record<string, { prerender: true }> =>
  Object.fromEntries(
    pages.filter((page) => page.mode === 'static').map((page) => [page.path, { prerender: true }]),
  );
