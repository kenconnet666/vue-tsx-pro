import { useRouteLoadingBar } from '@zerodep-dev/vue-tsx-pro-ui/vue-router';
import { createApp, createSSRApp } from 'vue';
import { App } from './App';
import { createDocsRouter, prefetchOnIntent } from './router';
import { loadingBar } from './site/loading-bar';
import { siteThemeReady } from './site/theme';
import { createDocsUi } from './site/ui';

const router = createDocsRouter();
// 只在生产环境预取：开发时取一页要现编译、现提取 API（没缓存时 Worker 要建十几秒的程序），
// 指针划过侧栏就会触发好几页，挂起的请求占满浏览器到开发服务器的连接，真正点开的页面反而被堵住
if (import.meta.env.PROD) prefetchOnIntent(router);
// 换页要加载页面的代码块：慢的时候顶部有加载条
useRouteLoadingBar(router, loadingBar);

// 构建时预渲染过的页面（build/prerender.ts）接管已有的 HTML；开发服务器与没预渲染的地址照常挂载
const root = document.getElementById('app')!;
const app = (root.hasChildNodes() ? createSSRApp : createApp)(App)
  .use(router)
  .use(createDocsUi(router));

// 加载失败也照常挂载（用没定制的主题），错误照样报出来；水合要等路由解析完，页面的组件到位
void Promise.all([siteThemeReady(), router.isReady()]).finally(() => app.mount(root));
