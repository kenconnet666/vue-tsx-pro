// 演示页之间的跳转：小程序用 navigateTo 进页面栈，H5 改 hash（main.ts 按 hash 换页面）；参数两端都作为页面的 query 属性
import type { DemoPage } from './pages/index.ts';

interface NavigateApi {
  navigateTo(options: { url: string }): void;
  navigateBack(options: { delta: number }): void;
}
declare const wx: NavigateApi | undefined;
declare const my: NavigateApi | undefined;

const miniApi = () => (typeof wx !== 'undefined' ? wx : typeof my !== 'undefined' ? my : undefined);

/** 跳到另一个演示页 */
export function go(page: DemoPage, query: Record<string, string | number> = {}) {
  // 不用 URLSearchParams：小程序的逻辑层里不一定有
  const search = Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  const api = miniApi();
  if (api) api.navigateTo({ url: `/pages/${page}/index${search ? `?${search}` : ''}` });
  else location.hash = page === 'index' && !search ? '' : `${page}${search ? `?${search}` : ''}`;
}

/** 返回上一页 */
export function back() {
  const api = miniApi();
  if (api) api.navigateBack({ delta: 1 });
  else history.back();
}
