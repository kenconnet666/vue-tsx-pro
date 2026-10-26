// 联合降本管理（待重做）：装上组件库，挂载占位页
import { createUi } from '@zerodep-dev/vue-tsx-pro-ui';
import { createApp } from 'vue';
import { App } from './App';

createApp(App)
  .use(createUi({ paintDocument: true }))
  .mount('#app');
