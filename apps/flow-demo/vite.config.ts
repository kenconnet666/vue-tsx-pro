import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vite';
import { nitro } from 'nitro/vite';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// vue 与 @vue/server-renderer 在 Node 里默认解析到 CommonJS 的完整版，连同模板编译器与 @babel/parser（约 0.8 MB）进了服务端包；
// 这里的组件都是编译好的渲染函数，用不到运行时编译，换成 ESM 的运行时版本
const vueRoot = dirname(createRequire(import.meta.url).resolve('vue/package.json'));
const serverRendererRoot = dirname(
  createRequire(join(vueRoot, 'package.json')).resolve('@vue/server-renderer/package.json'),
);

// 两个环境两个入口：浏览器（client）挂载或水合，服务端（ssr）由 Nitro 交给它渲染页面；接口在 server/ 下（nitro.config.ts）
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro(), nitro()],
  resolve: {
    alias: [
      { find: /^vue$/, replacement: join(vueRoot, 'dist/vue.runtime.esm-bundler.js') },
      {
        find: /^(vue|@vue)\/server-renderer$/,
        replacement: join(serverRendererRoot, 'dist/server-renderer.esm-bundler.js'),
      },
    ],
  },
  environments: {
    client: { build: { rolldownOptions: { input: './src/entry-client.ts' } } },
    ssr: { build: { rolldownOptions: { input: './src/entry-server.ts' } } },
  },
  // 固定端口：文档站 5174，这里 5176；被占用时报错而不是换端口
  server: { port: 5176, strictPort: true },
});
