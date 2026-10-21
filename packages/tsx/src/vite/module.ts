/**
 * 编译一个模块：compile（compiler/compile.ts）加上组件的热更新、SSR 登记。
 * 主线程（index.ts）与编译线程（compile-worker.ts）共用；设置要能在线程之间复制，所以只放数据，
 * StyleX 的模块解析（含函数）没给时在这里按默认生成。
 */
import type { Options as StylexBabelOptions } from '@stylexjs/babel-plugin';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';
import { compile, type SourceMap, type StylexRule } from '../compiler/index.ts';
import { componentMarkers, exportedComponents, hmrCode, ssrCode } from './hmr.ts';
import { stylexModuleResolution } from './stylex-resolution.ts';
import { tokenModule } from './tokens.ts';

/** 对所有模块都一样的设置 */
export interface CompilerSetup {
  /** 渲染优化 */
  optimize: boolean;
  /** token 模块（包名或相对项目根目录的路径），false 时不改写 token 写法 */
  tokens: string | false;
  /** 项目根目录 */
  root: string;
  /** StyleX 插件的选项；undefined 时不编译 StyleX。没给 unstable_moduleResolution 时用 stylex-resolution.ts 的 */
  stylex: Partial<StylexBabelOptions> | undefined;
  /** Vue JSX 插件的选项 */
  jsx: VueJSXPluginOptions | undefined;
  /** 开发服务器：登记组件的热更新 */
  hmr: boolean;
}

/** 一个模块的编译请求 */
export interface ModuleRequest {
  /** 代码 */
  code: string;
  /** 模块 id（可能带查询参数） */
  id: string;
  /** 文件路径（不带查询参数） */
  file: string;
  /** 语言 */
  lang: 'ts' | 'tsx' | 'js' | 'jsx';
  /** 项目自己的脚本文件：编译符文与 token 写法 */
  own: boolean;
  /** SSR 环境 */
  ssr: boolean;
}

/** 一个模块的编译结果 */
export interface ModuleResult {
  /** 编译后的代码（含热更新、SSR 登记） */
  code: string;
  /** source map */
  map: SourceMap | null;
  /** StyleX 规则 */
  stylex: StylexRule[];
  /** 符文的警告（代码帧） */
  warnings: string[];
}

const resolutions = new WeakMap<object, Partial<StylexBabelOptions>>();

/** 补上默认的模块解析（每份设置只生成一次） */
function stylexOptions(stylex: Partial<StylexBabelOptions>) {
  if (stylex.unstable_moduleResolution) return stylex;
  let options = resolutions.get(stylex);
  if (!options) {
    options = { ...stylex, unstable_moduleResolution: stylexModuleResolution() as never };
    resolutions.set(stylex, options);
  }
  return options;
}

/** 编译一个模块；什么都不用做时返回 null */
export async function compileModule(
  request: ModuleRequest,
  setup: CompilerSetup,
): Promise<ModuleResult | null> {
  const { code, id, file, lang, own, ssr } = request;
  const jsx = lang === 'tsx' || lang === 'jsx';
  const tokens = setup.tokens;
  const result = await compile(code, {
    filename: file,
    lang,
    runes: own,
    optimize: setup.optimize,
    tokens: own && tokens !== false ? () => tokenModule(tokens, file, setup.root) : undefined,
    stylex: setup.stylex && stylexOptions(setup.stylex),
    jsx: setup.jsx,
    plugins: jsx ? [() => componentMarkers(setup.hmr || ssr)] : undefined,
  });
  if (!result) return null;
  let output = result.code;
  if (jsx && (setup.hmr || ssr)) {
    const components = exportedComponents(result.ast, id);
    if (components.length && setup.hmr && !ssr && !/\?vue&type=script/.test(id)) {
      output += hmrCode(components);
    }
    if (components.length && ssr) output += ssrCode(components, id, setup.root);
  }
  return {
    code: output,
    map: result.map,
    stylex: result.stylex,
    warnings: result.warnings.map((warning) => warning.frame),
  };
}
