import { configDefaults, defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';

// 宿主原有的 plugin-vue 保留；加上预设后即可在同一项目里写 TSX 页面
export const plugins = [vue(), workspaceSource(), ...vueTsxPro()];

export default defineConfig({
  plugins,
  // 启动时就编译入口引到的模块：打开浏览器时不用再等
  server: { warmup: { clientFiles: ['./src/main.ts'] } },
  // 桶文件（组件库入口、@lucide/icons）只编译真正用到的再导出模块，产物不变
  build: { rolldownOptions: { experimental: { lazyBarrel: true } } },
  test: {
    name: 'host-demo',
    environment: 'happy-dom',
    // 真实浏览器里的测试见 vitest.browser.config.ts
    exclude: [...configDefaults.exclude, '**/*.browser.test.{ts,tsx}'],
  },
});
