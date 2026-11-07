import { createApp } from 'vue';
import { createUi } from '@zerodep-dev/vue-tsx-pro-ui';
import { vueRouterAdapter } from '@zerodep-dev/vue-tsx-pro-ui/vue-router';
import { App } from './App';
import { router } from './router';

createApp(App)
  .use(router)
  // 组件库的链接、导航走 vue-router：站内跳转不刷新页面，侧边导航在 /orders/42 也高亮“采购单”
  .use(createUi({ router: vueRouterAdapter(router, { match: 'prefix' }) }))
  .mount('#app');
