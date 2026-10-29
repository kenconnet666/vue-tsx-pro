// 演示页之间的跳转：小程序用 navigateTo 进页面栈，H5 改 hash（main.ts 按 hash 换页面）
import type { DemoPage } from './pages/index.ts';

interface NavigateApi {
  navigateTo(options: { url: string }): void;
}
declare const wx: NavigateApi | undefined;
declare const my: NavigateApi | undefined;

/** 跳到另一个演示页 */
export function go(page: DemoPage) {
  const api = typeof wx !== 'undefined' ? wx : typeof my !== 'undefined' ? my : undefined;
  if (api) api.navigateTo({ url: `/pages/${page}/index` });
  else location.hash = page === 'index' ? '' : page;
}
