import { defineConfig } from 'vitest/config';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';

// 测试时完整编译（含 StyleX），与使用方应用的效果一致
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  test: {
    name: 'ui',
    environment: 'happy-dom',
    passWithNoTests: true,
  },
});
