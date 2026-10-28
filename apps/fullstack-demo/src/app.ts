/** 应用的定义：两个入口共用（服务端 entry-server.ts、浏览器 entry-client.ts） */
import { createUi } from '@zerodep-dev/vue-tsx-pro-ui';
import { vueRouterAdapter } from '@zerodep-dev/vue-tsx-pro-ui/vue-router';
import { createRouter } from 'vue-router';
import { App } from './App.tsx';
import { defineApp } from './framework/app.ts';
import { pageRoutes } from './framework/page.ts';
import { pages } from './pages.ts';

export const app = defineApp({
  App,
  siteName: 'fullstack-demo',
  createRouter: (history) => createRouter({ history, routes: pageRoutes(pages) }),
  createUi: (router) => createUi({ paintDocument: true, router: vueRouterAdapter(router) }),
});
