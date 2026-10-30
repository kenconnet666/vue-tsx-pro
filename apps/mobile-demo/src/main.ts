// H5 入口：同一套页面组件直接挂到浏览器上，按 hash 换页面（#product?id=3），页面参数作为 query 属性，
// 同小程序运行时给页面组件的（小程序那边由 app.ts 交给运行时）。
// 在原生应用（Capacitor 的 iOS / Android 外壳）里换成插件版的宿主能力：权限、存储、震动、剪贴板、选图走原生
import { HOST_KEY } from '@zerodep-dev/vue-tsx-pro-mobile';
import { createApp, defineComponent, h, shallowRef } from 'vue';
import { DEMO_PAGES, type DemoPage } from './pages/index.ts';

/** hash → 页面名与参数 */
function parse(hash: string): { page: DemoPage; query: Record<string, string> } {
  const [name = '', search = ''] = hash.slice(1).split('?');
  const page = (name in DEMO_PAGES ? name : 'index') as DemoPage;
  return { page, query: Object.fromEntries(new URLSearchParams(search)) };
}

const current = shallowRef(parse(location.hash));
addEventListener('hashchange', () => {
  current.value = parse(location.hash);
  scrollTo(0, 0);
});

const Root = defineComponent(() => () => {
  const { page, query } = current.value;
  // key：同一个页面换了参数（另一个商品）也重新挂载，同小程序里每次进入都是新的页面
  return h(DEMO_PAGES[page] as never, { query, key: location.hash });
});

const app = createApp(Root);
// 外壳注入的全局 Capacitor；H5 的包里不带插件，用到时才加载
const capacitor = (globalThis as { Capacitor?: { isNativePlatform(): boolean } }).Capacitor;
if (capacitor?.isNativePlatform()) {
  const { createCapacitorHost } = await import('@zerodep-dev/vue-tsx-pro-mobile/capacitor');
  app.provide(HOST_KEY, await createCapacitorHost());
}
app.mount('#app');
