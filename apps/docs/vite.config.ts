import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig, type Plugin } from 'vitest/config';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';
import { builtinThemeBootColors, themeBootScript } from '@vue-tsx-pro/ui/theme-boot';
// 仓库内部的配置，不是组件库的公开接口：按相对路径引用
import { uiPrebundle, uiPrebundleExclude } from '../../packages/ui/prebundle.config.ts';
import { componentApi } from './build/api.ts';
import { demoSource } from './build/demo.ts';
import { iconImports } from './build/icons.ts';
import { docPages } from './build/pages.ts';

/** 代码演练场 Worker 用的 Node 模块替身 */
const shim = (name: string) =>
  fileURLToPath(new URL(`./src/playground/node-shims/${name}`, import.meta.url));

/** 应用加载前按记住的主题设好页面底色，不先闪一下亮色 */
function themeBoot(): Plugin {
  return {
    name: 'docs:theme-boot',
    transformIndexHtml: () => [
      {
        tag: 'script',
        children: themeBootScript({ themes: builtinThemeBootColors }),
        injectTo: 'head-prepend',
      },
    ],
  };
}

// 组件库与 tsx 包都按 @vue-tsx-pro/source 条件解析源码：改了组件立刻热更新，不用先构建
export const plugins = [
  workspaceSource(),
  iconImports(),
  ...vueTsxPro(),
  demoSource(),
  docPages(),
  componentApi(),
  themeBoot(),
];

/** 预构建的依赖：开发服务器与浏览器测试共用（测试另加测试专用的几个） */
export const optimizeDeps = {
  include: [
    // 组件库源码里的依赖：一开始就预构建，打开某页才发现新依赖会重新预构建并刷新页面
    ...uiPrebundle,
    // 示例里用到的（组件库源码不在运行时导入它）
    'decimal.js',
    // 代码高亮的几种语言（main.ts 按需导入）：第一次出现代码块时才发现的话，会重新预构建并刷新页面
    '@shikijs/langs/css',
    '@shikijs/langs/html',
    '@shikijs/langs/javascript',
    '@shikijs/langs/json',
    '@shikijs/langs/shellscript',
    '@shikijs/langs/tsx',
    '@shikijs/langs/typescript',
    // 代码演练场的 Worker 在浏览器里跑 Babel：这些 CommonJS 包要预构建成 ES 模块
    '@babel/core',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    '@babel/plugin-transform-typescript',
    '@vue/babel-plugin-jsx',
    '@stylexjs/babel-plugin',
    '@stylexjs/babel-plugin > postcss-value-parser',
    // 演练场的编辑器：进入演练场才加载，预构建好免得那时才发现新依赖、重新预构建并刷新页面
    '@codemirror/autocomplete',
    '@codemirror/commands',
    '@codemirror/lang-javascript',
    '@codemirror/language',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/highlight',
  ],
  exclude: uiPrebundleExclude,
};

export default defineConfig({
  plugins,
  // 固定端口：IDE 里启动、浏览器里打开的总是同一个地址；被占用时报错而不是换端口
  server: {
    port: 5174,
    strictPort: true,
    // 启动时就编译入口引到的模块（整个组件库，几百个文件）：打开浏览器时不用再等
    warmup: { clientFiles: ['./src/main.ts'] },
  },
  optimizeDeps,
  resolve: {
    // 代码演练场的 Worker 在浏览器里跑 Babel：它用到的几个 Node 模块换成浏览器版（src/playground/node-shims）。
    // Babel 8 写的是 node:path 这种带前缀的名字，StyleX 插件（Babel 7 时代的）写的是不带前缀的
    alias: [
      { find: /^(?:node:)?path$/, replacement: 'pathe' },
      { find: /^(?:node:)?fs$/, replacement: shim('fs.ts') },
      { find: /^(?:node:)?assert$/, replacement: shim('assert.cjs') },
      // StyleX 插件浏览器版要的 @babel/standalone：只转交解析器、遍历器、类型工具
      { find: '@babel/standalone', replacement: shim('babel-standalone.ts') },
    ],
  },
  // Shiki 的每种语言语法单独成块、用到才下载（emacs-lisp、cpp 这类大语法不会被页面加载），不必为它们报警
  build: {
    chunkSizeWarningLimit: 1000,
    // 桶文件（组件库入口、@lucide/icons）只编译真正用到的再导出模块：构建时少编译约四分之一的模块，产物不变
    rolldownOptions: { experimental: { lazyBarrel: true } },
  },
  test: {
    name: 'docs',
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    // 真实浏览器里的测试见 vitest.browser.config.ts
    exclude: [...configDefaults.exclude, '**/*.browser.test.{ts,tsx}'],
  },
});
