/**
 * 页面要在浏览器里编译 TSX（browser-compile 入口）时加的 Vite 插件：`plugins: [...vueTsxPro(), browserCompile()]`。
 *
 * - Babel 用到的 Node 模块换成浏览器替身：path → pathe，fs、assert 换成包里 shims 目录的最小实现；
 * - Babel 是 CommonJS，一开始就预构建成 ES 模块（否则第一次编译时才发现，Vite 会重新预构建并刷新页面）；
 * - Worker 打包成 ES 模块（Babel 很大，Worker 里也按模块加载）。
 *
 * 替身是整个应用范围的：浏览器里本来就没有 fs，别的依赖拿到的也只是"不存在"。
 * 服务端构建（vite build --ssr，预渲染、服务端渲染的入口）不换：那里跑在 Node 上，依赖要拿到真的 fs。
 * 开发服务器同时服务两端时别名对两端都生效，要在开发时做服务端渲染的应用别装这个插件（kit 的应用不需要浏览器里编译）
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
    config: (_config, { isSsrBuild }) => ({
      resolve: isSsrBuild
        ? {}
        : {
            alias: [
              { find: /^(?:node:)?path$/, replacement: 'pathe' },
              { find: /^(?:node:)?fs$/, replacement: '@zerodep-dev/vue-tsx-pro-tsx/shims/fs' },
              {
                find: /^(?:node:)?assert$/,
                replacement: '@zerodep-dev/vue-tsx-pro-tsx/shims/assert',
              },
            ],
          },
      // 服务端构建不把 Babel 打进包里（编译器按需加载，服务端渲染不会走到那里）；打进去还会把 @vue/compiler-sfc 的可选依赖一起拉进来
      ssr: isSsrBuild ? { external: BABEL } : {},
      optimizeDeps: { include: BABEL.map((name) => `@zerodep-dev/vue-tsx-pro-tsx > ${name}`) },
      worker: { format: 'es' },
    }),
  };
}
