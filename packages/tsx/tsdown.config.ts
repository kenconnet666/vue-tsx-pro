import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vite: 'src/vite/index.ts',
    compiler: 'src/compiler/index.ts',
  },
  format: 'esm',
  platform: 'neutral',
  dts: true,
});
