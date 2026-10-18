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
}

/**
 * Vite 预设：`plugins: [vueTsxPro()]`。组件库构建写 `vueTsxPro({ stylex: false })`，由使用方统一编译 StyleX。
 */
export function vueTsxPro(options: VueTsxProOptions = {}): Plugin[] {
  const plugins: Plugin[] = [runes()];
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
      }),
    );
    plugins.push(...stylexPlugins.map(skipDevServerWithoutHttp));
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
function runes(): Plugin & VitestHooks {
  return {
    name: 'vue-tsx-pro:runes',
    enforce: 'pre',
    // 编译器变了，Vitest 缓存的旧编译结果要作废（见 cache-key.ts）
    configureVitest({ defineCacheKeyGenerator }) {
      defineCacheKeyGenerator?.(compilerCacheKey);
    },
    async transform(code, id) {
      const file = id.split('?')[0]!;
      if (!/\.[cm]?[jt]sx?$/.test(file) || file.includes('/node_modules/')) return;
      const result = await compileRunes(code, file);
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
        ssr: { resolve: { conditions: [condition, 'module', 'node', 'development|production'] } },
      };
    },
  };
}

// ───────── 内部实现 ─────────

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
