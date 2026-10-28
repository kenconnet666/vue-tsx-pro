import { defineConfig } from 'vite';
import { nitro } from 'nitro/vite';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// 两个环境两个入口：浏览器（client）挂载或水合，服务端（ssr）由 Nitro 交给它渲染页面；接口在 server/ 下（nitro.config.ts）
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro(), nitro()],
  environments: {
    client: { build: { rolldownOptions: { input: './src/entry-client.ts' } } },
    ssr: { build: { rolldownOptions: { input: './src/entry-server.ts' } } },
  },
  // 固定端口：文档站 5174，这里 5175；被占用时报错而不是换端口
  server: { port: 5175, strictPort: true },
});
