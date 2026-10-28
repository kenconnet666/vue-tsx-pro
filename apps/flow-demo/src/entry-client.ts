/** 浏览器入口：水合服务端渲染的页面，或挂载空壳 */
import { app } from './app.ts';
import { startClient } from '@zerodep-dev/vue-tsx-pro-kit';

startClient(app);
