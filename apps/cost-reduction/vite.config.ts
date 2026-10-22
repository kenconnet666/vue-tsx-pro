import { defineConfig } from 'vite';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';
// 仓库内部的配置，不是组件库的公开接口：按相对路径引用
import { uiPrebundle, uiPrebundleExclude } from '../../packages/ui/prebundle.config.ts';

export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  // 固定端口：IDE 里启动、浏览器里打开的总是同一个地址；被占用时报错而不是换端口
  server: { port: 5175, strictPort: true, warmup: { clientFiles: ['./src/main.ts'] } },
  // 组件库源码里的依赖一开始就预构建：打开某页才发现新依赖会重新预构建并刷新页面
  optimizeDeps: { include: [...uiPrebundle, 'decimal.js'], exclude: uiPrebundleExclude },
  build: { rolldownOptions: { experimental: { lazyBarrel: true } } },
});
