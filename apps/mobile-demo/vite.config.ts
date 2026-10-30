import { defineConfig } from 'vite';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// H5 端：组件库按发布的产物引用（不加 workspaceSource），与小程序两端一致。
// 构建到 dist/h5（dist 下还有小程序的 wx、my），原生应用的外壳从这里取（capacitor.config.json 的 webDir）
export default defineConfig({
  plugins: vueTsxPro(),
  build: { outDir: 'dist/h5' },
});
