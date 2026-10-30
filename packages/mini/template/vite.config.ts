// H5：npm run dev / npm run build
import { defineConfig } from 'vite';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

export default defineConfig({ plugins: vueTsxPro() });
