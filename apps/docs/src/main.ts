import { createUi } from '@vue-tsx-pro/ui';
import { createShikiHighlighter } from '@vue-tsx-pro/ui/shiki';
import { vueRouterAdapter } from '@vue-tsx-pro/ui/vue-router';
import { createApp } from 'vue';
import { App } from './App';
import { createDocsRouter, prefetchOnIntent } from './router';
import { siteTheme, siteThemeReady } from './site/theme';

const router = createDocsRouter();
prefetchOnIntent(router);

const app = createApp(App)
  .use(router)
  .use(
    createUi({
      theme: siteTheme,
      // 整页由主题管理：页面边缘、回弹滚动露出的地方也是主题的底色与字体
      paintDocument: true,
      // 只加载文档里用到的语言（Shiki 的细粒度写法）：默认的全量语言表有两百多种，开发服务器第一次处理要几十秒
      highlighter: createShikiHighlighter({
        languages: {
          tsx: () => import('@shikijs/langs/tsx'),
          ts: () => import('@shikijs/langs/typescript'),
          typescript: () => import('@shikijs/langs/typescript'),
          js: () => import('@shikijs/langs/javascript'),
          javascript: () => import('@shikijs/langs/javascript'),
          json: () => import('@shikijs/langs/json'),
          bash: () => import('@shikijs/langs/shellscript'),
          sh: () => import('@shikijs/langs/shellscript'),
          css: () => import('@shikijs/langs/css'),
          html: () => import('@shikijs/langs/html'),
        },
      }),
      router: vueRouterAdapter(router),
    }),
  );

// 加载失败也照常挂载（用没定制的主题），错误照样报出来
void siteThemeReady().finally(() => app.mount('#app'));
