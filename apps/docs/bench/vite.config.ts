// 样式合并基准的生产构建（scripts/docs/style-merge.mjs 驱动）：只带样式需要的两个插件，不走文档站的页面与 API 提取
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [workspaceSource(), ...vueTsxPro()],
  build: {
    outDir: resolve(import.meta.dirname, '../node_modules/.cache/bench-style-merge'),
    emptyOutDir: true,
    // BENCH_PROFILE=1：不压缩，CPU 剖析里能看到函数名
    minify: !process.env.BENCH_PROFILE,
  },
});
