import { defineConfig } from 'nitro';
import { prerenderRules } from '@zerodep-dev/vue-tsx-pro-kit/page';
import { pages } from './src/pages.ts';

export default defineConfig({
  // 接口：server/api/*.ts（Nitro 3 默认不扫目录，要写明）
  serverDir: './server',
  // mode: 'static' 的页面构建时预渲染成 HTML
  routeRules: prerenderRules(pages),
  // PGlite 在自己的目录旁读 .wasm、.data：整个包原样带进产物、不打进 bundle
  traceDeps: ['@electric-sql/pglite*'],
});
