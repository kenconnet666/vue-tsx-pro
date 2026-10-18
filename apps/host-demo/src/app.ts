import { createUi } from '@vue-tsx-pro/ui';
import { createShikiHighlighter } from '@vue-tsx-pro/ui/shiki';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createRouter, createWebHistory, type RouterHistory } from 'vue-router';
import App from './App.vue';
import Home from './pages/Home.vue';
import { Base } from './pages/Base';
import { Pilot } from './pages/Pilot';
import { Profile } from './pages/Profile';
import { siteNameKey } from './site';

/** 宿主应用的组装；测试传入内存路由历史 */
export function createHostApp(history: RouterHistory = createWebHistory()) {
  const router = createRouter({
    history,
    routes: [
      { path: '/', component: Home },
      // TSX 页面与 SFC 页面一样注册为路由组件
      { path: '/profile/:id', component: Profile },
      // 组件库试点（扫清障碍用，不是正式组件）
      { path: '/pilot', component: Pilot },
      // 组件库的基础组件演示（文档站暂缓）
      { path: '/base', component: Base },
    ],
  });
  const app = createApp(App)
    .use(createPinia())
    .use(router)
    // 应用级配置：所有 TSX 页面共享语言与代码高亮；页面内还可以用 <Provider> 局部覆盖
    .use(createUi({ highlighter: createShikiHighlighter() }))
    .provide(siteNameKey, 'Host Demo');
  return { app, router };
}
