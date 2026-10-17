import { defineConfig } from 'vite';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';

/**
 * 组件库构建：TSX 与符文在这里编译掉；StyleX 保留 stylex.create 源码，
 * 由使用方应用的 StyleX 插件统一编译（原子类跨库去重，sx 覆盖才能正确合并）。
 */
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro({ stylex: false })],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
    rollupOptions: { external: ['vue', '@stylexjs/stylex', /^@vue-tsx-pro\//] },
    minify: false,
    sourcemap: true,
  },
});
