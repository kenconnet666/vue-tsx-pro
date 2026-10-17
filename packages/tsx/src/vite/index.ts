/**
 * Vite 预设：按固定顺序组合三个插件，使用方只写一行 vueTsxPro()。
 *
 *   1. 符文：_state / _derived / _bindable … → Vue API，读写 → .value
 *   2. StyleX：stylex.create → 原子类与 CSS
 *   3. vue-jsx：参数解构、defineModel 等宏，再编译 JSX
 */
import type { Plugin } from 'vite';
import stylex from '@stylexjs/unplugin';
import vueJsx from 'vue-jsx/vite';
import { compileRunes } from '../compiler';

type StylexOptions = NonNullable<Parameters<typeof stylex.vite>[0]>;

export interface VueTsxProOptions {
  /**
   * StyleX 插件选项；传 false 时不编译 StyleX。
   * 组件库构建应传 false：保留 stylex.create，由使用方应用统一编译。
   */
  stylex?: StylexOptions | false;
}

/** 宏的组件边界：defineComponent 与我们的 component() */
const COMPONENT_ALIASES = ['defineComponent', 'component'];

export function vueTsxPro(options: VueTsxProOptions = {}): Plugin[] {
  const plugins: Plugin[] = [runes()];
  if (options.stylex !== false) {
    plugins.push(...toArray(stylex.vite(options.stylex)));
  }
  plugins.push(...toArray(vueJsx({ macros: { defineComponent: { alias: COMPONENT_ALIASES } } })));
  return plugins;
}

/** unplugin 生成的 Vite 插件可能是单个插件，也可能是数组 */
function toArray(plugin: unknown): Plugin[] {
  return (Array.isArray(plugin) ? plugin : [plugin]) as Plugin[];
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
