/**
 * 框架的 Vite 插件：按约定的入口（src/entry-client.ts、src/entry-server.ts）配好浏览器与服务端两个环境；
 * 服务端把 vue、@vue/server-renderer 解析成 ESM 的运行时版本（Node 下默认是带模板编译器与 @babel/parser 的 CommonJS 完整版，
 * 这里的组件都是编译好的渲染函数，用不到运行时编译）。与组件库的预设、Nitro 一起用：
 *
 *   plugins: [workspaceSource(), ...vueTsxPro(), kit(), nitro()]
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

/** kit 的选项 */
export interface KitOptions {
  /** 浏览器入口，默认 ./src/entry-client.ts */
  client?: string;
  /** 服务端入口，默认 ./src/entry-server.ts */
  server?: string;
}

/** 框架的 Vite 插件 */
export function kit({
  client = './src/entry-client.ts',
  server = './src/entry-server.ts',
}: KitOptions = {}): Plugin {
  return {
    name: 'vue-tsx-pro:kit',
    config(config) {
      const fromApp = createRequire(join(config.root ?? process.cwd(), 'package.json'));
      const vueRoot = dirname(fromApp.resolve('vue/package.json'));
      const rendererRoot = dirname(
        createRequire(join(vueRoot, 'package.json')).resolve('@vue/server-renderer/package.json'),
      );
      return {
        resolve: {
          alias: [
            { find: /^vue$/, replacement: join(vueRoot, 'dist/vue.runtime.esm-bundler.js') },
            {
              find: /^(vue|@vue)\/server-renderer$/,
              replacement: join(rendererRoot, 'dist/server-renderer.esm-bundler.js'),
            },
          ],
        },
        environments: {
          client: { build: { rolldownOptions: { input: client } } },
          ssr: { build: { rolldownOptions: { input: server } } },
        },
      };
    },
  };
}
