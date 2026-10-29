// H5 入口：同一套页面组件直接挂到浏览器上，按 hash 换页面（小程序那边由 app.ts 交给运行时）
import { createApp, defineComponent, h, shallowRef } from 'vue';
import { DEMO_PAGES, type DemoPage } from './pages/index.ts';

const current = shallowRef(location.hash.slice(1));
addEventListener('hashchange', () => {
  current.value = location.hash.slice(1);
  scrollTo(0, 0);
});

const Root = defineComponent(
  () => () => h(DEMO_PAGES[(current.value in DEMO_PAGES ? current.value : 'index') as DemoPage]),
);

createApp(Root).mount('#app');
