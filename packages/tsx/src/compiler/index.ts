/**
 * runes 编译器：让本地响应式变量像普通变量一样读写，语义全部交给 Vue。
 *
 * 只做五件事（各步见 transform.ts）：
 *   1. 把符文声明换成 Vue API：_state → ref，_derived → computed，_fromRef → 直接持有外部 Ref
 *   2. 把 _component 的参数解构换成实例内的 prop 访问器（参考 Svelte 5 的 $.prop），
 *      并生成 Vue 需要的 props 声明；_bindable 走标准 v-model 协议（props.ts）
 *   3. 把这些变量的读写改写成 .value
 *   4. _toRef(x) 取回背后的 Ref；属性={_bind(x)} 换成 Vue 的 v-model（bind.ts）
 *   5. 对会悄悄失去响应性的写法、以及 TSX 里有更自然写法的 Vue 指令直接报错
 *
 * 生成的代码就是手写 Vue 会写的代码，之后交给官方 @vitejs/plugin-vue-jsx 编译 JSX。
 *
 * 主题 tokens 的字符串写法（stylex.create 里的 '_xs'）是另一个独立的转换，见 tokens.ts。
 *
 * 目录内的相对导入带 .ts 扩展名：语言服务（scripts/language-services）与 Vitest 配置在 Node 里直接加载这些源码。
 */
import { transformAsync, type PluginObj } from '@babel/core';
import { parserPlugins } from './ast.ts';
import type { RunesWarning } from './errors.ts';
import { RunesTransform } from './transform.ts';

export type { RunesError, RunesWarning } from './errors.ts';
export { compileTokens, type TokenModule, type TokenModuleLoader } from './tokens.ts';

/** 用到符文，或定义了 _component（需要编译 props 解构）的文件才需要编译；宿主项目的其他文件原样放过 */
const NEEDS_COMPILE = /\b_(?:state|derived|bindable|bind|effect|fromRef|toRef)\b|\b_component\s*\(/;

export async function compileRunes(code: string, filename = 'input.tsx') {
  if (!NEEDS_COMPILE.test(code)) return null;
  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    parserOpts: { plugins: parserPlugins(filename) },
    plugins: [runesBabelPlugin],
  });
  if (!result) return null;
  const warnings = (result.metadata as { runesWarnings?: RunesWarning[] }).runesWarnings ?? [];
  return { code: result.code ?? '', map: result.map, warnings };
}

export function runesBabelPlugin(): PluginObj {
  return {
    name: 'vue-tsx-pro-runes',
    visitor: {
      Program(program, state) {
        const transform = new RunesTransform(program, state.filename);
        transform.run();
        (state.file.metadata as { runesWarnings?: RunesWarning[] }).runesWarnings =
          transform.warnings;
      },
    },
  };
}
