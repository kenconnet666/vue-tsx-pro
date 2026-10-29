import { defineConfig } from 'vite';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// H5 端：组件库按发布的产物引用（不加 workspaceSource），与小程序两端一致
export default defineConfig({
  plugins: vueTsxPro(),
});
