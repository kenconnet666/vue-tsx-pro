// 应用入口：声明页面，构建工具据此生成 app.json 与各页面文件
import { definePages } from '@zerodep-dev/vue-tsx-pro-mini';
import { ButtonPage } from './pages/ButtonPage.tsx';

export default definePages({ index: ButtonPage });
