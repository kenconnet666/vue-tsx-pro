import { configDefaults, defineConfig, type Plugin } from 'vitest/config';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';
import { builtinThemeBootColors, themeBootScript } from '@vue-tsx-pro/ui/theme-boot';
import { componentApi } from './build/api.ts';
import { demoSource } from './build/demo.ts';
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

// 组件库与 tsx 包都按 @vue-tsx-pro/source 条件解析源码：改了组件立刻热更新，不用先构建
export const plugins = [
  workspaceSource(),
  ...vueTsxPro(),
  demoSource(),
  docPages(),
  componentApi(),
  themeBoot(),
];

export default defineConfig({
  plugins,
  // 固定端口：IDE 里启动、浏览器里打开的总是同一个地址；被占用时报错而不是换端口
  server: { port: 5174, strictPort: true },
  // Shiki 的每种语言语法单独成块、用到才下载（emacs-lisp、cpp 这类大语法不会被页面加载），不必为它们报警
  build: { chunkSizeWarningLimit: 1000 },
  test: {
    name: 'docs',
    environment: 'happy-dom',
    // 真实浏览器里的测试见 vitest.browser.config.ts
    exclude: [...configDefaults.exclude, '**/*.browser.test.{ts,tsx}'],
  },
});
