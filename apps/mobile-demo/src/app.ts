// 小程序入口：声明页面，构建工具据此生成 app.json 与各页面文件（H5 入口见 main.ts）
import { definePages } from '@zerodep-dev/vue-tsx-pro-mini';
import { DEMO_PAGES } from './pages/index.ts';

export default definePages(DEMO_PAGES);
