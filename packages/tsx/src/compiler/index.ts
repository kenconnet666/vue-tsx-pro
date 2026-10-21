/**
 * 编译器入口。
 *
 * compile（compile.ts）是一个文件的完整编译，Vite 预设与文档站的代码演练场都用它：解析一次、生成一次，
 * 中间依次是符文、token 字符串写法、StyleX、Vue JSX 与去掉类型。
 *
 * 其中本包自己的两个转换：
 *   - 符文（transform.ts）：让本地响应式变量像普通变量一样读写，语义全部交给 Vue
 *     1. 把符文声明换成 Vue API：_state → ref，_derived → computed，_fromRef → 直接持有外部 Ref
 *     2. 把 _component 的参数解构换成实例内的 prop 访问器（参考 Svelte 5 的 $.prop），
 *        并生成 Vue 需要的 props 声明；_bindable 走标准 v-model 协议（props.ts）
 *     3. 把这些变量的读写改写成 .value
 *     4. _toRef(x) 取回背后的 Ref；属性={_bind(x)} 换成 Vue 的 v-model（bind.ts）
 *     5. 对会悄悄失去响应性的写法、以及 TSX 里有更自然写法的 Vue 指令直接报错
 *     6. 渲染优化：组件子节点的插槽标 $stable，JSX 属性里的函数与常量每个实例只建一次（optimize.ts，可关）
 *     生成的代码就是手写 Vue 会写的代码，JSX 交给官方的 @vue/babel-plugin-jsx。
 *   - 主题 tokens 的字符串写法（tokens.ts）：stylex.create 里的 '_xs' → token 变量
 *
 * compileRunes、compileTokens 只做其中一步，测试与语言服务用。
 *
 * 目录内的相对导入带 .ts 扩展名：语言服务（scripts/language-services）与 Vitest 配置在 Node 里直接加载这些源码。
 */
import { transformAsync } from '@babel/core';
import { parserPlugins } from './ast.ts';
import type { SourceMap } from './compile.ts';
import type { RunesWarning } from './errors.ts';
import { needsRunes, runesBabelPlugin, type RunesOptions } from './transform.ts';

export {
  compile,
  type CompileOptions,
  type CompileResult,
  type SourceMap,
  type StylexRule,
} from './compile.ts';
export type { RunesError, RunesWarning } from './errors.ts';
export { compileTokens, type TokenModule, type TokenModuleLoader } from './tokens.ts';
export { runesBabelPlugin, type RunesOptions } from './transform.ts';

/**
 * 只编译一个文件里的符文与 _component 参数解构；不需要编译时返回 null。
 * 结果带 source map 与警告（只拿到初始值的读取等），误用直接抛出 RunesError。
 */
export async function compileRunes(
  code: string,
  filename = 'input.tsx',
  options: RunesOptions = {},
): Promise<{ code: string; map: SourceMap | null; warnings: RunesWarning[] } | null> {
  if (!needsRunes(code)) return null;
  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    // 生成的字符串（子节点里的文字）保留原样，不转成 \u 转义
    generatorOpts: { jsescOption: { minimal: true } },
    parserOpts: { plugins: parserPlugins(filename) },
    plugins: [[runesBabelPlugin, options]],
  });
  if (!result) return null;
  const warnings = (result.metadata as { runesWarnings?: RunesWarning[] }).runesWarnings ?? [];
  return { code: result.code ?? '', map: result.map ?? null, warnings };
}
