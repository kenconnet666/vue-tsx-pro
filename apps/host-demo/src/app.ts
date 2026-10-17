import { createUi } from '@vue-tsx-pro/ui';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createRouter, createWebHistory, type RouterHistory } from 'vue-router';
import App from './App.vue';
import Home from './pages/Home.vue';
import { Pilot } from './pages/Pilot';
import { Profile } from './pages/Profile';
import { themeKey } from './theme';

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
    ],
  });
  const app = createApp(App)
    .use(createPinia())
    .use(router)
    // 应用级配置：所有 TSX 页面共享语言；页面内还可以用 <Provider> 局部覆盖
    .use(createUi())
    .provide(themeKey, 'dark');
  return { app, router };
}
