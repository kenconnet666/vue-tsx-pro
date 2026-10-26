/**
 * 页面要在浏览器里编译 TSX（browser-compile 入口）时加的 Vite 插件：`plugins: [...vueTsxPro(), browserCompile()]`。
 *
 * - Babel 用到的 Node 模块换成浏览器替身：path → pathe，fs、assert 换成包里 shims 目录的最小实现；
 * - Babel 是 CommonJS，一开始就预构建成 ES 模块（否则第一次编译时才发现，Vite 会重新预构建并刷新页面）；
 * - Worker 打包成 ES 模块（Babel 很大，Worker 里也按模块加载）。
 *
 * 替身是整个应用范围的：浏览器里本来就没有 fs，别的依赖拿到的也只是"不存在"。
 */
import type { Plugin } from 'vite';

/** 浏览器里跑 Babel 要预构建的 CommonJS 包 */
const BABEL = [
  '@babel/core',
  '@babel/parser',
  '@babel/traverse',
  '@babel/types',
  '@babel/plugin-transform-typescript',
  '@vue/babel-plugin-jsx',
];

/** 浏览器里编译 TSX 要的 Vite 配置 */
export function browserCompile(): Plugin {
  return {
    name: 'vue-tsx-pro:browser-compile',
    config: () => ({
      resolve: {
        alias: [
          { find: /^(?:node:)?path$/, replacement: 'pathe' },
          { find: /^(?:node:)?fs$/, replacement: '@zerodep-dev/vue-tsx-pro-tsx/shims/fs' },
          { find: /^(?:node:)?assert$/, replacement: '@zerodep-dev/vue-tsx-pro-tsx/shims/assert' },
        ],
      },
      optimizeDeps: { include: BABEL.map((name) => `@zerodep-dev/vue-tsx-pro-tsx > ${name}`) },
      worker: { format: 'es' },
    }),
  };
}
