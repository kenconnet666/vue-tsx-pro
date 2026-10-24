import { defineConfig } from 'vite';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';

export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  // 固定端口：IDE 里启动、浏览器里打开的总是同一个地址；被占用时报错而不是换端口
  server: { port: 5175, strictPort: true, warmup: { clientFiles: ['./src/main.ts'] } },
  build: { rolldownOptions: { experimental: { lazyBarrel: true } } },
});
