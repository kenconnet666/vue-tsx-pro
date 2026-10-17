import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { vueTsxPro } from './src/vite/index';

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: vueTsxPro(),
  resolve: {
    // 编译产物会从 '@vue-tsx-pro/tsx' 导入 prop 访问器，样式从 '@vue-tsx-pro/tsx/stylex' 导入；包内测试直接指向源码
    alias: [
      { find: /^@vue-tsx-pro\/tsx$/, replacement: source('./src/index.ts') },
      { find: /^@vue-tsx-pro\/tsx\/stylex$/, replacement: source('./src/stylex/index.ts') },
    ],
  },
  test: {
    name: 'tsx',
    environment: 'happy-dom',
  },
});
