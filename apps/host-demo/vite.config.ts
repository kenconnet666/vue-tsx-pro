import { configDefaults, defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';
// 仓库内部的配置，不是组件库的公开接口：按相对路径引用
import { uiPrebundle, uiPrebundleExclude } from '../../packages/ui/prebundle.config.ts';

// 宿主原有的 plugin-vue 保留；加上预设后即可在同一项目里写 TSX 页面
export const plugins = [vue(), workspaceSource(), ...vueTsxPro()];

export default defineConfig({
  plugins,
  // 组件库源码里的依赖一开始就预构建：打开某页才发现新依赖会重新预构建并刷新页面
  optimizeDeps: { include: uiPrebundle, exclude: uiPrebundleExclude },
  // 启动时就编译入口引到的模块：打开浏览器时不用再等
  server: { warmup: { clientFiles: ['./src/main.ts'] } },
  test: {
    name: 'host-demo',
    environment: 'happy-dom',
    // 真实浏览器里的测试见 vitest.browser.config.ts
    exclude: [...configDefaults.exclude, '**/*.browser.test.{ts,tsx}'],
  },
});
