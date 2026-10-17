import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { createRouter, createWebHistory, type RouterHistory } from 'vue-router';
import App from './App.vue';
import Home from './pages/Home.vue';
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
    ],
  });
  const app = createApp(App).use(createPinia()).use(router).provide(themeKey, 'dark');
  return { app, router };
}
