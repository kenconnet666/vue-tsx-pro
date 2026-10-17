/**
 * Vite 预设：按固定顺序组合三个插件，使用方只写一行 vueTsxPro()。
 *
 *   1. 符文与 props：_state / _derived / _component 参数解构 … → Vue API，读写 → .value
 *   2. StyleX：stylex.create → 原子类与 CSS
 *   3. vue-jsx：只编译 JSX（不启用它的宏，props 由第 1 步处理）
 */
import type { Plugin } from 'vite';
import stylex from '@stylexjs/unplugin';
import vueJsx from 'vue-jsx/vite';
import { compileRunes } from '../compiler/index';

type StylexOptions = NonNullable<Parameters<typeof stylex.vite>[0]>;

export interface VueTsxProOptions {
  /**
   * StyleX 插件选项；传 false 时不编译 StyleX。
   * 组件库构建应传 false：保留 stylex.create，由使用方应用统一编译。
   */
  stylex?: StylexOptions | false;
}

/** 热更新要识别的组件定义函数：Vue 的 defineComponent 与我们的 _component */
const COMPONENT_FUNCTIONS = ['defineComponent', '_component'];

export function vueTsxPro(options: VueTsxProOptions = {}): Plugin[] {
  const plugins: Plugin[] = [runes()];
  if (options.stylex !== false) {
    plugins.push(...toArray(stylex.vite(options.stylex)).map(skipDevServerWithoutHttp));
  }
  plugins.push(...vueJsxForComponents());
  return plugins;
}

/**
 * vue-jsx 只在开发服务器里生成热更新代码；但显式传入 hmr 选项会覆盖这个判断，
 * 让生产构建也带上热更新代码。所以先保留选项对象，等知道是开发还是构建时再补上 hmr。
 */
function vueJsxForComponents(): Plugin[] {
  const options: Parameters<typeof vueJsx>[0] = {};
  const setHmr: Plugin = {
    name: 'vue-tsx-pro:jsx-hmr',
    configResolved(config) {
      if (config.command === 'serve') options.hmr = { defineComponentName: COMPONENT_FUNCTIONS };
    },
  };
  return [setHmr, ...toArray(vueJsx(options))];
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
      return compileRunes(code, file);
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
