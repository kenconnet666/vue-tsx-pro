/**
 * 一个文件的完整编译：解析一次、生成一次，中间两遍遍历，组合本包与官方的 Babel 插件。
 *
 *   第 1 遍：样式的响应式绑定与热更新（style-bindings.ts、style-hot.ts）→ 符文与 props（transform.ts）
 *   第 2 遍：Vue JSX（@vue/babel-plugin-jsx）→ 属性合并换成会合并 ref 的版本（merge-props.ts）→ 去掉 TS 类型
 *           → 调用方追加的插件（热更新标记、演练场的模块表）
 *
 * 以前每一步各自解析、生成一次，成本大头是每一遍的遍历与生成（含 source map），合并后编译快三四成。
 * 分成两遍而不是一遍：第 1 遍的改写（符文换成 .value、样式调用换成绑定）要在 vue-jsx 处理元素之前完成，
 * 同一遍里各插件的访问器按节点交错执行，vue-jsx 会先看到没改写的属性。
 * 第 2 遍开始时重建作用域：第 1 遍插入的 import 与声明没有全部登记，vue-jsx 与去类型插件要靠作用域里的绑定判断。
 *
 * Vite 预设（vite/）与文档站的代码演练场都用它，两处的结果一致。
 */
import {
  parseAsync,
  transformFromAstAsync,
  type FileResult,
  type PluginItem,
  type PluginObject,
  type types as t,
} from '@babel/core';
import typescript from '@babel/plugin-transform-typescript';
import vueJsx, { type VueJSXPluginOptions } from '@vue/babel-plugin-jsx';
import { languageOf, parserPlugins, type Language } from './ast.ts';
import type { RunesWarning } from './errors.ts';
import { mergePropsPlugin } from './merge-props.ts';
import { needsStyleBindings, styleBindingsPlugin } from './style-bindings.ts';
import { styleHotPlugin } from './style-hot.ts';
import { needsRunes, runesBabelPlugin } from './transform.ts';

/** 编译结果的 source map（Babel 生成的） */
export type SourceMap = NonNullable<FileResult['map']>;

/** 去掉类型的插件（@babel/plugin-transform-typescript）的选项 */
type TypeScriptOptions = Parameters<typeof typescript>[1];

/** compile 的选项；没开的步骤不做 */
export interface CompileOptions {
  /** 文件路径（不带查询参数）：报错与 source map 用它 */
  filename: string;
  /** 文件的语言，默认按扩展名；Vue 单文件组件里 lang="tsx" 的脚本由调用方传 'tsx' */
  lang?: Language;
  /** 编译符文与 _component 的 props，默认 true；依赖包里的文件传 false */
  runes?: boolean;
  /** 渲染优化（optimize.ts），默认 true */
  optimize?: boolean;
  /** JSX 里的动态样式调用改成响应式绑定（style-bindings.ts） */
  styleBindings?: boolean;
  /** 开发服务器：样式热更新原地生效，值是模块 id（相对项目根目录，style-hot.ts） */
  styleHot?: string;
  /** Vue JSX 插件的选项 */
  jsx?: VueJSXPluginOptions;
  /** 去掉 TS 类型的插件的选项 */
  typescript?: TypeScriptOptions;
  /** 追加在最后一遍末尾的插件（只在文件需要编译时运行） */
  plugins?: PluginItem[];
  /** 生成 source map，默认 true */
  sourceMaps?: boolean;
}

/** compile 的结果 */
export interface CompileResult {
  /** 编译后的代码 */
  code: string;
  /** 对应原始代码的 source map；关掉 sourceMaps 时为 null */
  map: SourceMap | null;
  /** 编译后的 AST：热更新据此找出文件里声明的组件 */
  ast: t.File;
  /** 不影响正确性、但多半不是作者本意的写法（符文） */
  warnings: RunesWarning[];
  /** 开了 styleHot 且文件里有顶层样式时：去掉样式参数后的源码哈希（style-hot.ts） */
  styleSkeleton?: string;
}

/**
 * 编译一个文件；什么都不用做（没有符文、样式绑定与热更新，也不是 JSX 文件）时返回 null。
 * 写法错误时抛出带代码帧的错误。
 */
export async function compile(
  code: string,
  options: CompileOptions,
): Promise<CompileResult | null> {
  const lang = options.lang ?? languageOf(options.filename) ?? 'js';
  const first: PluginItem[] = [];
  if (options.runes !== false && needsRunes(code)) {
    first.push([runesBabelPlugin, { optimize: options.optimize ?? true }]);
  }
  // 都在符文改写之前：先认出原样的 create 调用与参数的位置；绑定的读取函数里的引用随后照常按符文改写
  if (options.styleHot && needsStyleBindings(code)) {
    const moduleId = options.styleHot;
    first.unshift(() => styleHotPlugin(moduleId));
  }
  if (options.styleBindings && needsStyleBindings(code)) first.unshift(styleBindingsPlugin);
  const second: PluginItem[] = [];
  if (lang === 'tsx' || lang === 'jsx') {
    second.push([vueJsx, options.jsx ?? {}], mergePropsPlugin);
    if (lang === 'tsx') second.push([typescript, options.typescript ?? {}]);
  }
  if (!first.length && !second.length) return null;

  const passes = [first, [...second, ...(options.plugins ?? [])]].filter((pass) => pass.length);
  if (first.length && passes.length === 2) passes[1]!.unshift(rescope);
  const shared = { filename: options.filename, babelrc: false, configFile: false } as const;
  let ast: t.File | null = await parseAsync(code, {
    ...shared,
    parserOpts: { plugins: parserPlugins(lang) },
  });
  const metadata: {
    runesWarnings?: RunesWarning[];
    styleSkeleton?: string;
  } = {};
  for (const [index, plugins] of passes.entries()) {
    const last = index === passes.length - 1;
    const result = await transformFromAstAsync(ast!, code, {
      ...shared,
      plugins,
      ast: true,
      code: last,
      cloneInputAst: false,
      sourceMaps: last && (options.sourceMaps ?? true),
      // 生成的字符串（子节点里的文字）保留原样，不转成 \u 转义
      generatorOpts: { jsescOption: { minimal: true } },
    });
    Object.assign(metadata, result!.metadata);
    ast = result!.ast!;
    if (last) {
      return {
        code: result!.code ?? '',
        map: result!.map,
        ast: ast!,
        warnings: metadata.runesWarnings ?? [],
        styleSkeleton: metadata.styleSkeleton,
      };
    }
  }
  return null;
}

/** 重建作用域（见文件开头） */
function rescope(): PluginObject {
  return {
    name: 'vue-tsx-pro-rescope',
    visitor: {
      Program(program) {
        program.scope.crawl();
      },
    },
  };
}
