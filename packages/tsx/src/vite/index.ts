/**
 * Vite 预设：按固定顺序组合三个插件，使用方只写一行 vueTsxPro()。
 *
 *   1. 符文与 props（本包）：_state / _derived / _component 参数解构 … → Vue API，读写 → .value
 *   2. StyleX：stylex.create → 原子类与 CSS
 *   3. @vitejs/plugin-vue-jsx（官方）：去掉 TS 类型、JSX → VNode、热更新
 *
 * 只有用到符文或 _component 的文件会被第 1 步改写，宿主项目里的其他代码原样交给后续插件。
 */
import type { Plugin } from 'vite';
import stylex from '@stylexjs/unplugin';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { compileRunes } from '../compiler/index';

type StylexOptions = NonNullable<Parameters<typeof stylex.vite>[0]>;

export interface VueTsxProOptions {
  /**
   * StyleX 插件选项；传 false 时不编译 StyleX。
   * 组件库构建应传 false：保留 stylex.create，由使用方应用统一编译。
   */
  stylex?: StylexOptions | false;
}

export function vueTsxPro(options: VueTsxProOptions = {}): Plugin[] {
  const plugins: Plugin[] = [runes()];
  if (options.stylex !== false) {
    plugins.push(...toArray(stylex.vite(options.stylex)).map(skipDevServerWithoutHttp));
  }
  // _component 与 defineComponent 一样参与热更新与 tree-shaking 标注
  plugins.push(vueJsx({ defineComponentName: ['defineComponent', '_component'] }));
  return plugins;
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

/** 只处理符文的插件，单独导出以便自定义组合 */
export function runes(): Plugin {
  return {
    name: 'vue-tsx-pro:runes',
    enforce: 'pre',
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
