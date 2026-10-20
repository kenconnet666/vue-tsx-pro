import { createUi } from '@vue-tsx-pro/ui';
import { createShikiHighlighter } from '@vue-tsx-pro/ui/shiki';
import { vueRouterAdapter } from '@vue-tsx-pro/ui/vue-router';
import { createApp } from 'vue';
import { App } from './App';
import { createDocsRouter } from './router';
import { siteTheme } from './site/theme';

const router = createDocsRouter();

createApp(App)
  .use(router)
  .use(
    createUi({
      theme: siteTheme,
      // 整页由主题管理：页面边缘、回弹滚动露出的地方也是主题的底色与字体
      paintDocument: true,
      highlighter: createShikiHighlighter(),
      router: vueRouterAdapter(router),
    }),
  )
  .mount('#app');
