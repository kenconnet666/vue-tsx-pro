import { createUi } from '@vue-tsx-pro/ui';
import { createShikiHighlighter } from '@vue-tsx-pro/ui/shiki';
import { vueRouterAdapter } from '@vue-tsx-pro/ui/vue-router';
import { createApp } from 'vue';
import { App } from './App';
import { createCostRouter } from './router';
import { preference } from './theme';

const router = createCostRouter();

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
