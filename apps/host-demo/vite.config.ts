import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';

// 宿主原有的 plugin-vue 保留；加上预设后即可在同一项目里写 TSX 页面
export default defineConfig({
  plugins: [vue(), workspaceSource(), ...vueTsxPro()],
  test: {
    name: 'host-demo',
    environment: 'happy-dom',
  },
});
