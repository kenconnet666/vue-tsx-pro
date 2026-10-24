/**
 * 编译一个模块：compile（compiler/compile.ts）加上组件的热更新、SSR 登记。
 * 主线程（index.ts）与编译线程（compile-worker.ts）共用；设置要能在线程之间复制，所以只放数据。
 */
import { relative } from 'node:path';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';
import type { Language } from '../compiler/ast.ts';
import { compile, type SourceMap } from '../compiler/index.ts';
import { componentMarkers, exportedComponents, hmrCode, ssrCode, styleHotCode } from './hmr.ts';

/** 对所有模块都一样的设置 */
export interface CompilerSetup {
  /** 渲染优化 */
  optimize: boolean;
  /** 项目根目录 */
  root: string;
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
  lang: Language;
  /** 项目自己的脚本文件：编译符文与样式绑定 */
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
  /** 符文的警告（代码帧） */
  warnings: string[];
}

/** 编译一个模块；什么都不用做时返回 null */
export async function compileModule(
  request: ModuleRequest,
  setup: CompilerSetup,
): Promise<ModuleResult | null> {
  const { code, id, file, lang, own, ssr } = request;
  const jsx = lang === 'tsx' || lang === 'jsx';
  // 样式热更新原地生效：开发服务器、项目自己的文件
  const styleHot = own && setup.hmr && !ssr;
  const result = await compile(code, {
    filename: file,
    lang,
    runes: own,
    optimize: setup.optimize,
    styleBindings: own,
    styleHot: styleHot ? relative(setup.root, file).split('\\').join('/') : undefined,
    jsx: setup.jsx,
    plugins: jsx ? [() => componentMarkers(setup.hmr || ssr)] : undefined,
  });
  if (!result) return null;
  let output = result.code;
  const skeleton = result.styleSkeleton;
  let accepted = false;
  if (jsx && (setup.hmr || ssr)) {
    const { components, otherExports } = exportedComponents(result.ast, id);
    if (components.length && setup.hmr && !ssr && !/\?vue&type=script/.test(id)) {
      output += hmrCode(components, otherExports, skeleton);
      accepted = true;
    }
    if (components.length && ssr) output += ssrCode(components, id, setup.root);
  }
  if (skeleton) output += styleHotCode(skeleton, accepted);
  return {
    code: output,
    map: result.map,
    warnings: result.warnings.map((warning) => warning.frame),
  };
}
