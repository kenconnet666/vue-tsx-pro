import { defineConfig } from 'vitest/config';
import { vueTsxPro } from './src/vite';

export default defineConfig({
  plugins: vueTsxPro(),
  test: {
    name: 'tsx',
    environment: 'happy-dom',
  },
});
