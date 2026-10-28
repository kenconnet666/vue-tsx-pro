import { defineConfig } from 'nitro';
import { prerenderRules } from './src/framework/page.ts';
import { pages } from './src/pages.ts';

export default defineConfig({
  // 接口：server/api/*.ts（Nitro 3 默认不扫目录，要写明）
  serverDir: './server',
  // mode: 'static' 的页面构建时预渲染成 HTML
  routeRules: prerenderRules(pages),
});
