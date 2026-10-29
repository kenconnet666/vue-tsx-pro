/**
 * 在微信、支付宝小程序里渲染 vue-tsx-pro 组件：Vue 自定义渲染器 + setData + 通用模板，
 * 样式引擎的组合类在渲染时展开成行内样式。
 *
 *   // 应用入口（构建工具把它打成一个包，各页面的 Page() 从这里取选项，见 build）
 *   export default definePages({ index: IndexPage, detail: DetailPage });
 */
import type { App, Component } from 'vue';
import type { MiniNode } from './node.ts';
import { pageOptions } from './page.ts';

export { MiniNode, type MiniEvent } from './node.ts';
export { createMiniApp } from './renderer.ts';
export { pageOptions } from './page.ts';
export {
  navigateBack,
  navigateTo,
  onPageHide,
  onPageShow,
  onReachBottom,
  pageUrl,
  redirectTo,
  reLaunch,
  type PageQuery,
} from './lifecycle.ts';

/** 应用里的页面：页面名（pages/<名字>/index）→ 页面组件 */
export type PageMap = Readonly<Record<string, Component>>;

/** 构建产物导出的对象：各页面的 Page() 选项按名字取 */
export interface MiniPages {
  readonly names: readonly string[];
  page(name: string): ReturnType<typeof pageOptions>;
}

/** 声明应用的页面；setup 对每个页面的 Vue 应用调用一次（装插件、provide） */
export function definePages(pages: PageMap, setup?: (app: App<MiniNode>) => void): MiniPages {
  return {
    names: Object.keys(pages),
    page(name) {
      const component = pages[name];
      if (!component)
        throw new Error(`没有这个页面：${name}（已声明 ${Object.keys(pages).join('、')}）`);
      return pageOptions(component, setup);
    },
  };
}
