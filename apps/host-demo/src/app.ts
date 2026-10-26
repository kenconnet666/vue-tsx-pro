import { createUi } from '@zerodep-dev/vue-tsx-pro-ui';
import { createShikiHighlighter } from '@zerodep-dev/vue-tsx-pro-ui/shiki';
import { vueRouterAdapter } from '@zerodep-dev/vue-tsx-pro-ui/vue-router';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createRouter, createWebHistory, type RouterHistory } from 'vue-router';
import App from './App.vue';
import Home from './pages/Home.vue';
import { Base } from './pages/Base';
import { DateDemo } from './pages/DateDemo';
import { Integration } from './pages/Integration';
import { Profile } from './pages/Profile';
import { siteNameKey } from './site';

/** 只加载演示里用到的语言（Shiki 的细粒度写法），不让开发服务器处理两百多种语法 */
const highlighter = createShikiHighlighter({
  languages: {
    tsx: () => import('@shikijs/langs/tsx'),
    ts: () => import('@shikijs/langs/typescript'),
    json: () => import('@shikijs/langs/json'),
    bash: () => import('@shikijs/langs/shellscript'),
  },
});

/** 宿主应用的组装；测试传入内存路由历史 */
export function createHostApp(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes: [
      { path: '/', component: Home },
      // TSX 页面与 SFC 页面一样注册为路由组件
      { path: '/profile/:id', component: Profile },
      // 组件库试点（扫清障碍用，不是正式组件）
      { path: '/integration', component: Integration },
      // 组件库的基础组件演示（文档站暂缓）
      { path: '/base', component: Base },
      // 日期组件的演示
      { path: '/date', component: DateDemo },
    ],
  });
  const app = createApp(App)
    .use(createPinia())
    .use(router)
    // 应用级配置：所有 TSX 页面共享语言、代码高亮与路由适配；页面内还可以用 <Provider> 局部覆盖
    .use(createUi({ highlighter, router: vueRouterAdapter(router) }))
    .provide(siteNameKey, 'Host Demo');
  return { app, router };
}
