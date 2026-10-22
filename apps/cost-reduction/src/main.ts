/**
 * 启动：先起假后端（没有真实后端时），再取会话与主数据，最后挂载页面。
 * 页面挂载后各处同步读取当前用户与主数据，不再各自等待
 */
import { createUi } from '@vue-tsx-pro/ui';
import { createShikiHighlighter } from '@vue-tsx-pro/ui/shiki';
import { vueRouterAdapter } from '@vue-tsx-pro/ui/vue-router';
import { createApp } from 'vue';
import { App } from './App';
import { loadMaster } from './app/master';
import { createAppRouter } from './app/router';
import { initSession } from './app/session';
import { preference } from './app/theme';

// 接上真实后端时设 VITE_MOCK=false：请求照常发出，不再被拦截
if (import.meta.env.VITE_MOCK !== 'false') {
  const { startMockServer } = await import('./mock');
  await startMockServer();
}
await Promise.all([initSession(), loadMaster()]);

const router = createAppRouter();

createApp(App)
  .use(router)
  .use(
    createUi({
      theme: () => preference.theme,
      // 整页由主题管理：页面边缘、回弹滚动露出的地方也是主题的底色与字体
      paintDocument: true,
      highlighter: createShikiHighlighter({
        languages: { tsx: () => import('@shikijs/langs/tsx') },
      }),
      router: vueRouterAdapter(router),
    }),
  )
  .mount('#app');
