import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { vueTsxPro } from './src/vite/index';

export default defineConfig({
  plugins: vueTsxPro(),
  resolve: {
    // 编译产物会从 '@vue-tsx-pro/tsx' 导入 prop 访问器；包内测试直接指向源码
    alias: { '@vue-tsx-pro/tsx': fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
  },
  test: {
    name: 'tsx',
    environment: 'happy-dom',
  },
});
