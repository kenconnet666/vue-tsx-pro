// 小程序入口：页面名 → 页面组件，第一个是首页（mini.config.ts 的构建从这里开始）
import { definePages } from '@zerodep-dev/vue-tsx-pro-mini';
import { HomePage } from './pages/HomePage.tsx';

export default definePages({ index: HomePage });
