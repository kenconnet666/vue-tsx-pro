import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'tsdown';

// 声明由 TypeScript 7 的原生 tsc 生成。插件只自动识别 7.0，7.1 要显式给出可执行文件；
// lib/getExePath.js 不在 typescript 的 exports 里，按包目录找
const typescriptDir = dirname(createRequire(import.meta.url).resolve('typescript/package.json'));
const { default: getExePath } = await import(
  pathToFileURL(join(typescriptDir, 'lib/getExePath.js')).href
);

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vite: 'src/vite/index.ts',
    styles: 'src/styles/index.ts',
    compiler: 'src/compiler/index.ts',
    // 浏览器里编译：入口不带 Babel，Worker 才带
    'browser-compile': 'src/browser-compile/index.ts',
    'browser-compile-worker': 'src/browser-compile/worker.ts',
    // 编译线程：vite/pool.ts 按 dist/compile-worker.js 启动它
    'compile-worker': 'src/vite/compile-worker.ts',
  },
  format: 'esm',
  platform: 'neutral',
  // vite 入口跑在 Node 里；neutral 平台不认识内置模块，按外部依赖原样保留
  deps: { neverBundle: [/^node:/] },
  dts: { generator: 'tsgo', tsgo: { path: getExePath() } },
});
