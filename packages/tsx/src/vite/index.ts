/**
 * Vite 预设：使用方只写一行 vueTsxPro()。
 *
 * 编译插件（vue-tsx-pro）对每个文件调用一次 compile（compiler/compile.ts）：解析一次、生成一次，
 * 依次是符文、token 字符串写法、StyleX、Vue JSX 与去掉类型，再登记组件的热更新（hmr.ts）。
 * StyleX 的规则由 stylex.ts 合成 CSS 交给页面。
 * 以前是符文、token、@stylexjs/unplugin、@vitejs/plugin-vue-jsx 四个插件，每个文件解析、生成四次。
 *
 * 哪些文件做哪一步：
 *   - 符文与 token 写法：项目自己的脚本文件（不含 node_modules、虚拟模块与 Vue 单文件组件）
 *   - StyleX：从 StyleX 入口导入的脚本，含 node_modules（组件库的发布包保留着 stylex.create）与单文件组件的脚本
 *   - JSX 与去掉类型：.jsx、.tsx，以及单文件组件里 lang="jsx" / "tsx" 的脚本；.ts 的类型由 Vite 自带的 oxc 去掉
 */
import type { Options as StylexBabelOptions } from '@stylexjs/babel-plugin';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';
import { Features } from 'lightningcss';
import { normalizePath, type Plugin, type Rollup } from 'vite';
import { availableParallelism } from 'node:os';
import { languageOf, needsTokens } from '../compiler/detect.ts';
import { CompileCache } from './cache.ts';
import { compilerCacheKey } from './cache-key.ts';
import type { CompilerSetup, ModuleRequest } from './module.ts';
import { CompilePool } from './pool.ts';
import { stylexCss, StylexRules, type StylexCssOptions } from './stylex.ts';
import { SSR_REGISTER_CODE, SSR_REGISTER_ID } from './ssr-register.ts';

export { workspaceSource } from './workspace.ts';

/**
 * StyleX 的选项：StyleX Babel 插件的选项，加上合成 CSS 的选项。
 * importSources 总是认 @stylexjs/stylex 与本包带中文注释的入口 @vue-tsx-pro/tsx/stylex，这里给的加在后面
 */
export type StylexOptions = Partial<StylexBabelOptions> & StylexCssOptions;

/** vueTsxPro() 的选项；都不写就是应用的默认配置 */
export interface VueTsxProOptions {
  /**
   * StyleX 选项；传 false 时不编译 StyleX。
   * 组件库构建应传 false：保留 stylex.create，由使用方应用统一编译。
   */
  stylex?: StylexOptions | false;
  /**
   * 主题 tokens 模块：`fontSize: '_xs'` 这类写法从这里取 token 变量。
   * 包名或相对项目根目录的路径，默认 '@vue-tsx-pro/ui/tokens.stylex'；传 false 关闭这种写法。
   * 与 stylex 选项无关：组件库构建不编译 StyleX，token 写法照样要改写。
   */
  tokens?: string | false;
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
   * 选项里有函数（如自定义的 StyleX 模块解析）时不能复制到线程，自动在主线程编译
   */
  parallel?: boolean;
  /**
   * 样式在哪里生成，默认 'runtime'：stylex.create 由运行时引擎处理（stylex/runtime.ts，一个元素一个组合类，
   * 动态值直接改元素上的变量），只有 *.stylex.ts（defineVars、defineConsts、defineMarker）由 StyleX 编译；
   * 不用逐文件过 StyleX 的 Babel，发布的组件库也不必由使用方再编译，整个预构建。
   * 'compile'：旧的方式，StyleX 在编译期把 stylex.create 换成原子类、提取成 CSS 文件；
   * 按运行时模式构建的组件库（@vue-tsx-pro/ui 的发布包）不能交给它编译
   */
  styles?: 'compile' | 'runtime';
}

/**
 * Vite 预设：`plugins: [vueTsxPro()]`，默认运行时样式（styles: 'runtime'）。
 * 编译模式下组件库构建写 `vueTsxPro({ styles: 'compile', stylex: false })`，由使用方统一编译 StyleX。
 */
export function vueTsxPro(options: VueTsxProOptions = {}): Plugin[] {
  if ((options.styles ?? 'runtime') === 'runtime') return runtimeStyles(options);
  if (options.stylex === false) return [compiler(options, undefined)];
  const { useCSSLayers, enableLTRRTLComments, lightningcssOptions, ...babel } =
    options.stylex ?? {};
  const rules = new StylexRules({
    useCSSLayers,
    enableLTRRTLComments,
    // 不把 :dir(rtl) 降级成 :lang(ar, he, …)：降级后镜像只认 lang 属性，dir="rtl" 而 lang 不是
    // 右到左语言时（或没写 lang）图标不翻转。:dir() 在 Chrome 120、Firefox 49、Safari 16.4 起都支持，
    // 组件库本来就要求 2024 年后的浏览器（Popover API、@starting-style）
    lightningcssOptions: {
      ...lightningcssOptions,
      exclude: (lightningcssOptions?.exclude ?? 0) | Features.DirSelector,
    },
  });
  // 没给 unstable_moduleResolution 时用 stylex-resolution.ts 的：源码与产物编译出相同的变量名（见 module.ts）
  const stylex: StylexBabel = {
    // 与 @stylexjs/unplugin 一致：开发服务器里带可读的类名与来源
    dev: process.env.NODE_ENV === 'development' || process.env.BABEL_ENV === 'development',
    // 打包工具会去掉只被 StyleX 用过的导入，留一个副作用导入保住 .stylex 模块
    treeshakeCompensation: true,
    enableLTRRTLComments,
    ...babel,
  };
  return [compiler(options, { babel: stylex, rules }), stylexCss(rules)];
}

type StylexBabel = Partial<StylexBabelOptions>;

/** 运行时模式（styles: 'runtime'）：只编译 *.stylex.ts，规则在运行时注入 */
function runtimeStyles(options: VueTsxProOptions): Plugin[] {
  const { useCSSLayers: _layers, lightningcssOptions: _css, ...babel } = options.stylex || {};
  const stylex: StylexBabel = {
    dev: process.env.NODE_ENV === 'development' || process.env.BABEL_ENV === 'development',
    treeshakeCompensation: true,
    ...babel,
    runtimeInjection: true,
  };
  return [
    compiler(options, { babel: stylex, rules: undefined, only: STYLEX_FILE }),
    {
      name: 'vue-tsx-pro:runtime-styles',
      // 引擎的依赖一开始就预构建（StyleX 的注入是 CommonJS），免得打开页面才发现、重新预构建
      config: () => ({
        optimizeDeps: {
          include: ['@stylexjs/stylex/lib/stylex-inject'],
        },
      }),
    },
  ];
}

/** *.stylex.ts：defineVars、defineConsts、defineMarker 只能写在这种文件里 */
const STYLEX_FILE = /\.stylex\.[cm]?[jt]sx?(?:\?|$)/;

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
/** 导入的 .stylex 模块（defineVars、defineConsts 只能写在这种文件里） */
const STYLEX_MODULE_IMPORT = /\bfrom\s*['"]([^'"]+\.stylex(?:\.[cm]?[jt]sx?)?)['"]/g;

/** 编译插件：每个文件一次 compile，加上组件的热更新、SSR 登记 */
function compiler(
  options: VueTsxProOptions,
  stylex: { babel: StylexBabel; rules: StylexRules | undefined; only?: RegExp } | undefined,
): Plugin & VitestHooks {
  const optimize = options.optimize ?? true;
  const tokens = options.tokens ?? '@vue-tsx-pro/ui/tokens.stylex';
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
        tokens,
        root: config.root,
        stylex: stylex?.babel,
        stylexOnly: stylex?.only?.source,
        styleBindings: (options.styles ?? 'runtime') === 'runtime',
        jsx: options.jsx,
        hmr,
      };
      if ((options.cache ?? true) && config.command === 'serve' && !process.env.VITEST) {
        const { stylex: _, ...rest } = options;
        cache = new CompileCache(
          config.cacheDir,
          JSON.stringify([rest, stylex?.babel, hmr, process.env.NODE_ENV]),
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
    // 构建结束、服务器关闭时停掉编译线程
    closeBundle() {
      pool?.close();
    },
    resolveId: (id) => (id === SSR_REGISTER_ID ? id : undefined),
    load: (id) => (id === SSR_REGISTER_ID ? SSR_REGISTER_CODE : undefined),
    transform: {
      filter: { id: SCRIPT },
      async handler(code, id, transformOptions) {
        if (id.startsWith('\0')) return;
        const [file = id, query = ''] = id.split('?');
        // ?raw、?url 的模块是文件内容或地址，不是要编译的代码
        if (/(?:^|&)(?:raw|url)(?:&|$)/.test(query)) return;
        // 预构建的依赖在 cacheDir 里：cacheDir 不在 node_modules 下（自定义了位置）时也不是项目自己的代码
        const own =
          SCRIPT_FILE.test(file) && !file.includes('/node_modules/') && !file.startsWith(cacheDir);
        const lang = languageOf(id);
        if (!lang) return;
        const ssr = transformOptions?.ssr === true;
        const dependencies = stylex?.rules ? await loadStylexModules(this, code, id) : [];
        const tokenFile =
          own && tokens !== false && needsTokens(code)
            ? (await import('./tokens.ts')).tokenModule(tokens, file, setup.root)?.file
            : undefined;
        if (tokenFile) {
          this.addWatchFile(tokenFile);
          dependencies.push(tokenFile);
        }

        const key = cache?.key(ssr ? `${id}\0ssr` : id, code, dependencies);
        const cached = key ? cache!.read(ssr ? `${id}\0ssr` : id, key) : undefined;
        if (cached) {
          stylex?.rules?.set(id, cached.stylex);
          for (const warning of cached.warnings) this.warn(warning);
          return { code: cached.code, map: cached.map as never };
        }

        const result = await run({ code, id, file, lang, own, ssr });
        stylex?.rules?.set(id, result?.stylex ?? []);
        if (!result) return;
        for (const warning of result.warnings) this.warn(warning);
        if (key) cache!.write(ssr ? `${id}\0ssr` : id, key, result);
        return { code: result.code, map: result.map as never };
      },
    },
  };
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

/**
 * 编译前先加载导入的 .stylex 模块：常量（如断点）的值在定义它的模块编译时才登记，引用方的规则先登记、
 * 这时正好合成 CSS 的话，媒体查询会留成 var(--哈希)，LightningCSS 报 “Invalid empty selector”。
 * .stylex 模块只导入 StyleX 本身，等它们不会形成层层等待。返回这些模块的文件（编译缓存的键要包含它们的内容）
 */
async function loadStylexModules(context: Rollup.PluginContext, code: string, importer: string) {
  const files: string[] = [];
  for (const [, source] of code.matchAll(STYLEX_MODULE_IMPORT)) {
    const resolved = await context.resolve(source!, importer);
    if (!resolved || resolved.external) continue;
    await context.load(resolved);
    files.push(resolved.id.split('?')[0]!);
  }
  return files;
}
