/**
 * 应用的定义（根组件、路由、组件库配置、网站名）与浏览器入口。服务端入口（server.ts 的 createRenderer）用同一份定义，
 * 两边渲染出同样的东西：
 *
 *   // src/app.ts
 *   export const app = defineApp({ App, siteName: '示例', createRouter: …, createUi: … });
 *   // src/entry-client.ts
 *   startClient(app);
 */
import type { UiPlugin } from '@zerodep-dev/vue-tsx-pro-ui';
import { createApp, createSSRApp, type Component } from 'vue';
import { createWebHistory, type Router, type RouterHistory } from 'vue-router';
import { installClientPageData } from './data.ts';
import { pageTitle } from './page.ts';

/** 应用的定义 */
export interface AppDefinition {
  /** 根组件（里面放 RouterView） */
  App: Component;
  /** 网站名：标签页标题是“页面标题 · 网站名” */
  siteName: string;
  /** 按给的历史记录建路由：服务端用内存历史，浏览器用地址栏 */
  createRouter(history: RouterHistory): Router;
  /** 组件库配置（createUi）：服务端还要从它取 <html>、<body> 的属性 */
  createUi(router: Router): UiPlugin;
}

/** 声明应用（只为类型检查，原样返回） */
export const defineApp = (definition: AppDefinition): AppDefinition => definition;

/**
 * 浏览器入口：服务端渲染过的页面（#app 里有内容）水合，csr 的空壳与服务端出错退回的页面直接挂载；
 * 之后站内跳转都在浏览器里完成，标签页标题跟着页面变
 */
export function startClient(definition: AppDefinition): void {
  const root = document.getElementById('app')!;
  const router = definition.createRouter(createWebHistory(import.meta.env.BASE_URL));
  const app = (root.hasChildNodes() ? createSSRApp : createApp)(definition.App)
    .use(router)
    .use(definition.createUi(router));
  installClientPageData(app, router);
  router.afterEach((to) => {
    document.title = pageTitle(to.meta.title, definition.siteName);
  });
  // 水合要等路由解析完、页面的组件到位
  void router.isReady().then(() => app.mount(root));
}
