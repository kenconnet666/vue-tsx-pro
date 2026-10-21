import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vite: 'src/vite/index.ts',
    stylex: 'src/stylex/index.ts',
    compiler: 'src/compiler/index.ts',
    // 编译线程：vite/pool.ts 按 dist/compile-worker.js 启动它
    'compile-worker': 'src/vite/compile-worker.ts',
  },
  format: 'esm',
  platform: 'neutral',
  dts: true,
});
