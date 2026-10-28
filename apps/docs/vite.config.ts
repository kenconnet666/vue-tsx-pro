import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { configDefaults, defineConfig, type Plugin } from 'vitest/config';
import { browserCompile, vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';
import { builtinThemeBootColors, themeBootScript } from '@zerodep-dev/vue-tsx-pro-ui/theme-boot';
import { componentApi } from './build/api.ts';
import { demoSource } from './build/demo.ts';
import { iconImports } from './build/icons.ts';
import { docPages } from './build/pages.ts';

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

/**
 * 预览（vite preview）与线上的 nginx 一致（deploy/site.conf 的 try_files）：没有预渲染的地址（整页示例 /frame/...、找不到的页面）
 * 回到 spa.html 由浏览器渲染。vite preview 默认回到 index.html，那是预渲染的首页，拿它去水合别的页面处处对不上
 */
function spaFallback(): Plugin {
  return {
    name: 'docs:spa-fallback',
    configurePreviewServer(server) {
      const dist = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((request, _response, next) => {
        const path = decodeURIComponent((request.url ?? '/').split('?')[0]!);
        if (path !== '/' && !extname(path) && !existsSync(join(dist, `${path}.html`))) {
          request.url = '/spa.html';
        }
        next();
      });
    },
  };
}

// 组件库与 tsx 包都按 @vue-tsx-pro/source 条件解析源码：改了组件立刻热更新，不用先构建
export const plugins = [
  workspaceSource(),
  iconImports(),
  ...vueTsxPro(),
  // 代码演练场在浏览器里编译 TSX：Babel 的 Node 模块替身与预构建
  browserCompile(),
  demoSource(),
  docPages(),
  componentApi(),
  themeBoot(),
  spaFallback(),
];

/** 预构建的依赖：开发服务器与浏览器测试共用（测试另加测试专用的几个） */
export const optimizeDeps = {
  include: [
    // 示例里用到的（组件库源码不在运行时导入它）
    'decimal.js',
    '@unovis/ts/maps',
    // 代码高亮的几种语言（main.ts 按需导入）：第一次出现代码块时才发现的话，会重新预构建并刷新页面
    '@shikijs/langs/css',
    '@shikijs/langs/html',
    '@shikijs/langs/javascript',
    '@shikijs/langs/json',
    '@shikijs/langs/shellscript',
    '@shikijs/langs/tsx',
    '@shikijs/langs/typescript',
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
};

export default defineConfig({
  define: process.env.VTP_HYDRATION_DETAILS
    ? { __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' }
    : {},
  plugins,
  // 固定端口：IDE 里启动、浏览器里打开的总是同一个地址；被占用时报错而不是换端口
  server: {
    port: 5174,
    strictPort: true,
    // 启动时就编译入口引到的模块（站点外壳与它用到的组件）：打开浏览器时不用再等
    warmup: { clientFiles: ['./src/main.ts'] },
  },
  optimizeDeps,
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
