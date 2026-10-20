/**
 * Vite 预设：按固定顺序组合四个插件，使用方只写一行 vueTsxPro()。
 *
 *   1. 符文与 props（本包）：_state / _derived / _component 参数解构 … → Vue API，读写 → .value
 *   2. 主题 tokens 的字符串写法（本包）：stylex.create 里的 '_xs' → token 变量（tokens.ts）
 *   3. StyleX：stylex.create → 原子类与 CSS
 *   4. @vitejs/plugin-vue-jsx（官方）：去掉 TS 类型、JSX → VNode、热更新
 *
 * 第 1、2 步只改写用到符文、token 写法的文件，宿主项目里的其他代码原样交给后续插件。
 */
import type { Plugin } from 'vite';
import stylex from '@stylexjs/unplugin';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { Features } from 'lightningcss';
import { compileRunes } from '../compiler/index.ts';
import { compilerCacheKey } from './cache-key.ts';
import { stylexModuleResolution } from './stylex-resolution.ts';
import { themeTokens } from './tokens.ts';

type StylexOptions = NonNullable<Parameters<typeof stylex.vite>[0]>;

/** 本包的 StyleX 入口：运行时同 @stylexjs/stylex，类型带中文注释（见 src/stylex） */
const STYLEX_ENTRY = '@vue-tsx-pro/tsx/stylex';

/** vueTsxPro() 的选项；都不写就是应用的默认配置 */
export interface VueTsxProOptions {
  /**
   * StyleX 插件选项；传 false 时不编译 StyleX。
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
}

/**
 * Vite 预设：`plugins: [vueTsxPro()]`。组件库构建写 `vueTsxPro({ stylex: false })`，由使用方统一编译 StyleX。
 */
export function vueTsxPro(options: VueTsxProOptions = {}): Plugin[] {
  const plugins: Plugin[] = [runes(options.optimize ?? true)];
  const tokens = options.tokens ?? '@vue-tsx-pro/ui/tokens.stylex';
  if (tokens !== false) plugins.push(themeTokens(tokens));
  if (options.stylex !== false) {
    // 让编译器同时识别带中文注释的入口 @vue-tsx-pro/tsx/stylex
    const importSources = [
      ...(options.stylex?.importSources ?? ['@stylexjs/stylex']),
      STYLEX_ENTRY,
    ];
    const stylexPlugins = toArray(
      stylex.vite({
        // 源码与产物编译出相同的变量名（见 stylex-resolution.ts）
        unstable_moduleResolution: stylexModuleResolution(),
        ...options.stylex,
        importSources,
        // 不把 :dir(rtl) 降级成 :lang(ar, he, …)：降级后镜像只认 lang 属性，dir="rtl" 而 lang 不是
        // 右到左语言时（或没写 lang）图标不翻转。:dir() 在 Chrome 120、Firefox 49、Safari 16.4 起都支持，
        // 组件库本来就要求 2024 年后的浏览器（Popover API、@starting-style）
        lightningcssOptions: {
          ...options.stylex?.lightningcssOptions,
          exclude: (options.stylex?.lightningcssOptions?.exclude ?? 0) | Features.DirSelector,
        },
      }),
    );
    plugins.push(...stylexPlugins.map(skipDevServerWithoutHttp).map(loadStylexModulesOnly));
  }
  // _component 与 defineComponent 一样参与热更新与 tree-shaking 标注
  plugins.push(vueJsx({ defineComponentName: ['defineComponent', '_component'] }));
  return plugins;
}

/** Vitest 的插件钩子：只用到其中注册缓存键的部分，不依赖 vitest 的类型 */
interface VitestHooks {
  configureVitest?: (context: {
    defineCacheKeyGenerator?: (generator: () => string) => void;
  }) => void;
}

/** 符文与 props 编译 */
function runes(optimize: boolean): Plugin & VitestHooks {
  return {
    name: 'vue-tsx-pro:runes',
    enforce: 'pre',
    // 编译器变了，Vitest 缓存的旧编译结果要作废（见 cache-key.ts）
    configureVitest({ defineCacheKeyGenerator }) {
      defineCacheKeyGenerator?.(() => `${compilerCacheKey()}${optimize ? '' : ':plain'}`);
    },
    async transform(code, id) {
      const file = id.split('?')[0]!;
      if (!/\.[cm]?[jt]sx?$/.test(file) || file.includes('/node_modules/')) return;
      const result = await compileRunes(code, file, { optimize });
      if (!result) return;
      for (const warning of result.warnings) this.warn(warning.frame);
      return { code: result.code, map: result.map };
    },
  };
}

/**
 * 仅供本仓库使用：让 Vite 解析 @vue-tsx-pro/* 时直接读取源码（exports 中的 @vue-tsx-pro/source 条件），
 * 改组件库源码后无需先构建。发布包的使用方不需要它。
 */
export function workspaceSource(): Plugin {
  const condition = '@vue-tsx-pro/source';
  return {
    name: 'vue-tsx-pro:workspace-source',
    config() {
      return {
        resolve: { conditions: [condition, 'module', 'browser', 'development|production'] },
        // 按源码读 tsx 包时，它运行时导入的 @stylexjs/stylex 不会被启动时的扫描发现（发布包则会随包预构建）：
        // 爬取时才发现会丢掉已经做完的预构建、整体重来，冷启动多等二十秒。
        // 写不带前缀的名字：爬取时记下的就是这个名字，写成“@vue-tsx-pro/tsx > …”会被当成另一个依赖，照样重来
        optimizeDeps: { include: ['@stylexjs/stylex'] },
        ssr: { resolve: { conditions: [condition, 'module', 'node', 'development|production'] } },
      };
    },
  };
}

// ───────── 内部实现 ─────────

/** 导入的 .stylex 模块（defineVars、defineConsts 只能写在这种文件里） */
const STYLEX_MODULE_IMPORT = /\bfrom\s*['"]([^'"]+\.stylex(?:\.[cm]?[jt]sx?)?)['"]/g;

/**
 * 绕过 @stylexjs/unplugin 0.19.1 的问题：监听模式（开发服务器）下它每编译完一个文件，就对文件里的每个导入
 * this.resolve + this.load。每个模块要等它的整棵导入树都编译完才返回，并行编译变成层层等待，
 * 文档站冷启动第一页多等十几秒。这里让它以为不在监听模式，改为编译前先加载导入的 .stylex 模块：
 * 常量（如断点）的值在定义它的模块编译时才登记，引用方的规则先登记、这时正好收集 CSS 的话，
 * 媒体查询会留成 var(--哈希)，LightningCSS 报 “Invalid empty selector”（浏览器测试里出现过）。
 * .stylex 模块只导入 StyleX 本身，等它们不会形成层层等待
 */
function loadStylexModulesOnly(plugin: Plugin): Plugin {
  const hook = plugin.transform;
  if (!hook) return plugin;
  const handler = typeof hook === 'function' ? hook : hook.handler;
  const transform = async function (
    this: ThisParameterType<typeof handler>,
    ...args: Parameters<typeof handler>
  ) {
    const context = new Proxy(this, {
      get(target, key) {
        if (key === 'meta') return { ...target.meta, watchMode: false };
        const value: unknown = Reflect.get(target, key, target);
        // 上下文的方法可能用到私有字段：绑定回原对象
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    const [code, id] = args;
    for (const [, source] of code.matchAll(STYLEX_MODULE_IMPORT)) {
      const resolved = await this.resolve(source!, id);
      if (resolved && !resolved.external) await this.load(resolved);
    }
    return handler.apply(context, args);
  };
  return {
    ...plugin,
    transform: typeof hook === 'function' ? transform : { ...hook, handler: transform },
  };
}

/** unplugin 生成的 Vite 插件可能是单个插件，也可能是数组 */
function toArray(plugin: unknown): Plugin[] {
  return (Array.isArray(plugin) ? plugin : [plugin]) as Plugin[];
}

/**
 * 绕过 @stylexjs/unplugin 0.19.1 的问题：它在 configureServer 里启动 150ms 轮询，
 * 只在 httpServer 关闭时清理。Vitest 等中间件模式没有 httpServer，定时器永不清理，
 * 进程退出要多等 10 秒。这种模式也用不到它的开发服务器功能（CSS 端点、热更新推送），直接跳过。
 */
function skipDevServerWithoutHttp(plugin: Plugin): Plugin {
  const original = plugin.configureServer;
  if (typeof original !== 'function') return plugin;
  return {
    ...plugin,
    configureServer(server) {
      if (!server.httpServer) return;
      return original.call(this, server);
    },
  };
}
