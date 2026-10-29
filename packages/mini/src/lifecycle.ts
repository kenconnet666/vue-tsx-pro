/**
 * 页面的生命周期与跳转：组件里注册页面显示、隐藏、触底的回调；按 definePages 的页面名跳转。
 *
 *   onPageShow(() => refresh());              // 从下一页返回时也会调用
 *   onReachBottom(() => loadMore());
 *   navigateTo('detail', { id: '42' });       // 页面组件收到 query 属性 { id: '42' }
 *   navigateBack();
 *
 * 注册类的函数在 H5（不在小程序页面里）调用时什么也不做，同一个组件两端都能用。
 */
import { inject, onBeforeUnmount, type InjectionKey } from 'vue';
import { platform } from './host.ts';

/** 页面级的事件 */
export type PageEvent = 'show' | 'hide' | 'reachBottom';

/** 一个页面上注册的回调 */
export type PageHooks = Map<PageEvent, Set<() => void>>;

/** 注入键：页面的 Vue 应用上 provide（page.ts） */
export const PAGE_HOOKS_KEY: InjectionKey<PageHooks> = Symbol('vue-tsx-pro.mini.page-hooks');

/** 新建一个页面的回调表 */
export const createPageHooks = (): PageHooks =>
  new Map([
    ['show', new Set()],
    ['hide', new Set()],
    ['reachBottom', new Set()],
  ]);

/** 调用一个页面上某个事件的回调 */
export function emitPageEvent(hooks: PageHooks, event: PageEvent) {
  for (const listener of hooks.get(event)!) listener();
}

function register(event: PageEvent, listener: () => void) {
  const hooks = inject(PAGE_HOOKS_KEY, null);
  if (!hooks) return;
  hooks.get(event)!.add(listener);
  onBeforeUnmount(() => hooks.get(event)!.delete(listener));
}

/** 页面显示（第一次进入，以及从别的页面、后台回来）时；组件 setup 里调用 */
export const onPageShow = (listener: () => void) => register('show', listener);

/** 页面隐藏（进入下一页、切到后台）时 */
export const onPageHide = (listener: () => void) => register('hide', listener);

/** 页面滚到底时（加载更多）；离底部多近算到底在页面配置的 onReachBottomDistance */
export const onReachBottom = (listener: () => void) => register('reachBottom', listener);

/** 跳转的参数：值会转成字符串，页面组件的 query 属性里取回 */
export type PageQuery = Record<string, string | number | boolean>;

/** 页面名 → 路径（构建时页面在 pages/<名字>/index） */
export function pageUrl(page: string, query: PageQuery = {}): string {
  const search = Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `/pages/${page}/index${search ? `?${search}` : ''}`;
}

interface RouterApi {
  navigateTo(options: { url: string }): void;
  redirectTo(options: { url: string }): void;
  reLaunch(options: { url: string }): void;
  navigateBack(options: { delta: number }): void;
}

const router = () => {
  const current = platform();
  if (!current) throw new Error('不在小程序里：页面跳转不可用（H5 用自己的路由）');
  return current.api as unknown as RouterApi;
};

/** 打开另一个页面（压进页面栈，可以返回） */
export const navigateTo = (page: string, query?: PageQuery) =>
  router().navigateTo({ url: pageUrl(page, query) });

/** 换成另一个页面（不能返回到当前页） */
export const redirectTo = (page: string, query?: PageQuery) =>
  router().redirectTo({ url: pageUrl(page, query) });

/** 关掉所有页面，打开这一个 */
export const reLaunch = (page: string, query?: PageQuery) =>
  router().reLaunch({ url: pageUrl(page, query) });

/** 返回上一页（或上几页） */
export const navigateBack = (delta = 1) => router().navigateBack({ delta });
