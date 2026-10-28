import { defineConfig } from 'vite';
import { nitro } from 'nitro/vite';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';
import { kit } from '@zerodep-dev/vue-tsx-pro-kit/vite';

// 框架的插件按约定的入口（src/entry-client.ts、src/entry-server.ts）配好两个环境；接口在 server/ 下（nitro.config.ts）
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro(), kit(), nitro()],
  // 固定端口：被占用时报错而不是换端口
  server: { port: 5176, strictPort: true },
});
