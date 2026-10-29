/**
 * Vite 预设：使用方只写一行 vueTsxPro()。
 *
 * 编译插件（vue-tsx-pro）对每个文件调用一次 compile（compiler/compile.ts）：解析一次、生成一次，
 * 依次是样式的响应式绑定与热更新、符文、Vue JSX 与去掉类型，再登记组件的热更新（hmr.ts）。
 * 样式由运行时引擎（src/styles）在页面里生成，构建与开发服务器都不处理 CSS。
 *
 * 哪些文件做哪一步：
 *   - 符文、样式绑定与热更新：项目自己的脚本文件（不含 node_modules、虚拟模块与 Vue 单文件组件）
 *   - JSX 与去掉类型：.jsx、.tsx，以及单文件组件里 lang="jsx" / "tsx" 的脚本；.ts 的类型由 Vite 自带的 oxc 去掉
 * 发布的组件库是编译好的 JS：开发时整个预构建，构建时依赖里的 .js 直接跳过（工作区里按 dist 引用的包也算，见 isPublishedOutput）。
 */
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';
import { normalizePath, type Plugin } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';
import { languageOf } from '../compiler/detect.ts';
import { CompileCache } from './cache.ts';
import { compilerCacheKey } from './cache-key.ts';
import type { CompilerSetup, ModuleRequest } from './module.ts';
import { CompilePool } from './pool.ts';
import { SSR_REGISTER_CODE, SSR_REGISTER_ID, SSR_REGISTER_RESOLVED } from './ssr-register.ts';

export { browserCompile } from './browser-compile.ts';
export { workspaceSource } from './workspace.ts';

/** vueTsxPro() 的选项；都不写就是应用的默认配置 */
export interface VueTsxProOptions {
  /**
   * 渲染优化，默认 true：组件子节点的插槽标 $stable、JSX 属性里的函数与常量每个实例只建一次，
   * 父组件因为别的状态重新渲染时子组件不再跟着重做（见 RUNES.md）。界面要读响应式数据；
   * 怀疑哪里因此没更新时，传 false 对比
   */
  optimize?: boolean;
  /** Vue JSX 插件（@vue/babel-plugin-jsx）的选项 */
  jsx?: VueJSXPluginOptions;
  /**
   * 开发服务器把编译结果存在磁盘上（cacheDir/vue-tsx-pro），重启后没改过的文件不再编译，默认 true。
   * 构建与 Vitest 不用它（Vitest 有自己的模块缓存）
   */
  cache?: boolean;
  /**
   * 在工作线程里并行编译（构建与开发服务器；Vitest 本来就是多进程，不用），默认 true。
   * 选项里有函数时不能复制到线程，自动在主线程编译
   */
  parallel?: boolean;
}

/** Vite 预设：`plugins: [vueTsxPro()]` */
export function vueTsxPro(options: VueTsxProOptions = {}): Plugin[] {
  return [compiler(options)];
}

/** Vitest 的插件钩子：只用到其中注册缓存键的部分，不依赖 vitest 的类型 */
interface VitestHooks {
  configureVitest?: (context: {
    defineCacheKeyGenerator?: (
      generator: (module: { sourceCode: string }) => string | false,
    ) => void;
  }) => void;
}

/** 脚本模块：JS、TS 文件，或 Vue 单文件组件里的脚本（…/X.vue?vue&type=script&lang.tsx） */
const SCRIPT = /\.[cm]?[jt]sx?(?:\?|$)/;
const SCRIPT_FILE = /\.[cm]?[jt]sx?$/;
/** 编译插件：每个文件一次 compile，加上组件的热更新、SSR 登记 */
function compiler(options: VueTsxProOptions): Plugin & VitestHooks {
  const optimize = options.optimize ?? true;
  let setup: CompilerSetup;
  let cache: CompileCache | undefined;
  let pool: CompilePool | undefined;
  let cacheDir = '';
  // 编译函数（连同 Babel 与各插件）第一次编译时才载入：开发服务器启动时不必等它们（编译线程里同样按需载入）
  const run = async (request: ModuleRequest) =>
    pool ? pool.run(request) : (await import('./module.ts')).compileModule(request, setup);
  return {
    name: 'vue-tsx-pro',
    enforce: 'pre',
    // 编译器变了，Vitest 缓存的旧编译结果要作废（见 cache-key.ts）。
    // import.meta.glob 展开成哪些文件取决于磁盘，按源码内容缓存会漏掉新加的文件（新示例不进通用测试），这类模块不缓存
    configureVitest({ defineCacheKeyGenerator }) {
      defineCacheKeyGenerator?.(({ sourceCode }) =>
        sourceCode.includes('import.meta.glob')
          ? false
          : `${compilerCacheKey()}${optimize ? '' : ':plain'}`,
      );
    },
    config(user) {
      const flag = (name: string, fallback: boolean): unknown => {
        const value = user.define?.[name];
        if (value === undefined) return fallback;
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return value;
        }
      };
      return {
        // .jsx、.tsx 由本插件编译；Vite 自带的 oxc 只去掉 .ts 的类型
        oxc: { include: /\.[cm]?ts$/ },
        define: {
          __VUE_OPTIONS_API__: flag('__VUE_OPTIONS_API__', true),
          __VUE_PROD_DEVTOOLS__: flag('__VUE_PROD_DEVTOOLS__', false),
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: flag(
            '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__',
            false,
          ),
        },
        // 预构建依赖时保留 JSX，不按 React 的方式编译
        optimizeDeps: { rolldownOptions: { transform: { jsx: 'preserve' } } },
      };
    },
    configResolved(config) {
      cacheDir = `${normalizePath(config.cacheDir)}/`;
      const hmr = config.command === 'serve' && !config.isProduction;
      setup = {
        optimize,
        root: config.root,
        jsx: options.jsx,
        hmr,
      };
      if ((options.cache ?? true) && config.command === 'serve' && !process.env.VITEST) {
        cache = new CompileCache(
          config.cacheDir,
          JSON.stringify([options, hmr, process.env.NODE_ENV]),
        );
      }
      if ((options.parallel ?? true) && !process.env.VITEST && cloneable(setup)) {
        pool = new CompilePool(setup, Math.max(1, Math.min(availableParallelism() - 1, 6)));
      }
    },
    // 开发服务器：先起两个编译线程，在后台载入编译器，浏览器第一次请求时不用等
    configureServer() {
      pool?.warm(2);
    },
    // 构建结束、服务器关闭时停掉编译线程；多环境构建每个环境都会走到这里，正在编译的线程做完手上的再停（见 pool.ts）
    closeBundle() {
      pool?.close();
    },
    resolveId: (id) => (id === SSR_REGISTER_ID ? SSR_REGISTER_RESOLVED : undefined),
    load: (id) => (id === SSR_REGISTER_RESOLVED ? SSR_REGISTER_CODE : undefined),
    transform: {
      filter: { id: SCRIPT },
      async handler(code, id, transformOptions) {
        if (id.startsWith('\0')) return;
        const [file = id, query = ''] = id.split('?');
        // ?raw、?url 的模块是文件内容或地址，?assets（Nitro 的资源清单）是生成的模块，都不是要编译的代码
        if (/(?:^|&)(?:raw|url|assets)(?:[=&]|$)/.test(query)) return;
        // 预构建的依赖在 cacheDir 里：cacheDir 不在 node_modules 下（自定义了位置）时也不是项目自己的代码
        const own =
          SCRIPT_FILE.test(file) &&
          !file.includes('/node_modules/') &&
          !file.startsWith(cacheDir) &&
          !isPublishedOutput(file);
        const lang = languageOf(id);
        if (!lang) return;
        // 依赖里的普通 JS 是编译好的产物：没有 JSX、符文要处理，构建时不再过一遍 Babel
        if (!own && lang === 'js') return;
        // 多环境（Vite 6 起）按模块所在的环境判断；旧的 ssr 参数留作没有环境时的退路
        const ssr = this.environment
          ? this.environment.config.consumer === 'server'
          : transformOptions?.ssr === true;
        const key = cache?.key(ssr ? `${id}\0ssr` : id, code);
        const cached = key ? cache!.read(ssr ? `${id}\0ssr` : id, key) : undefined;
        if (cached) {
          for (const warning of cached.warnings) this.warn(warning);
          return { code: cached.code, map: cached.map as never };
        }

        const result = await run({ code, id, file, lang, own, ssr });
        if (!result) return;
        for (const warning of result.warnings) this.warn(warning);
        if (key) cache!.write(ssr ? `${id}\0ssr` : id, key, result);
        return { code: result.code, map: result.map as never };
      },
    },
  };
}

/** 目录 → 它是不是"同时发布源码与 dist 的包"的根目录（见 isPublishedOutput） */
const publishedRoots = new Map<string, boolean>();

/**
 * 组件库等包的发布产物：所属的包在 exports 里写了 @vue-tsx-pro/source 条件（源码与 dist 并存），文件在它的 dist 下。
 * pnpm 工作区里按 dist 引用这些包时，解析出的真实路径不在 node_modules 下，要靠这里认出来，免得把编译好的产物再编译一遍
 */
function isPublishedOutput(file: string): boolean {
  const index = file.lastIndexOf('/dist/');
  if (index < 0) return false;
  const root = file.slice(0, index);
  let published = publishedRoots.get(root);
  if (published === undefined) {
    const manifest = join(root, 'package.json');
    published =
      existsSync(manifest) && readFileSync(manifest, 'utf8').includes('"@vue-tsx-pro/source"');
    publishedRoots.set(root, published);
  }
  return published;
}

/** 设置能不能复制到编译线程（含函数的选项不能） */
function cloneable(value: unknown) {
  try {
    structuredClone(value);
    return true;
  } catch {
    return false;
  }
}
