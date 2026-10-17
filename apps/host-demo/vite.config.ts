import { configDefaults, defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';

// 宿主原有的 plugin-vue 保留；加上预设后即可在同一项目里写 TSX 页面
export const plugins = [vue(), workspaceSource(), ...vueTsxPro()];

export default defineConfig({
  plugins,
  test: {
    name: 'host-demo',
    environment: 'happy-dom',
    // 真实浏览器里的测试见 vitest.browser.config.ts
    exclude: [...configDefaults.exclude, '**/*.browser.test.ts'],
  },
});
