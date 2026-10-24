/**
 * 编译之前的快速判断（不依赖 Babel）：Vite 预设的入口只用这些，开发服务器启动时不必载入 Babel 与各插件
 * （它们在编译线程里、第一次编译时才载入）。
 */

/** 文件的语言：.tsx、.jsx 才编译 JSX，.tsx 才在编译时去掉类型（.ts 的类型由打包工具去掉） */
export type Language = 'ts' | 'tsx' | 'js' | 'jsx';

/** 样式入口（src/stylex）：编译器按从它导入的 create 找样式 */
export const STYLE_SOURCE = '@vue-tsx-pro/tsx/stylex';

/**
 * 模块的语言：Vue 单文件组件里的脚本（X.vue?vue&type=script&lang.tsx）看查询参数，其他看扩展名；
 * 不是脚本时返回 undefined
 */
export function languageOf(id: string): Language | undefined {
  const [file = '', query = ''] = id.split('?');
  const match = /(?:^|&)lang\.([jt]sx?)(?:&|$)/.exec(query) ?? /\.[cm]?([jt]sx?)$/.exec(file);
  return match?.[1] as Language | undefined;
}

/** Babel 解析插件：.ts 不能开 JSX，否则 <T>value 类型断言、<T>(x) => x 泛型箭头函数会被当作 JSX 解析 */
export function parserPlugins(lang: Language | undefined): ('jsx' | 'typescript')[] {
  return lang === 'ts' ? ['typescript'] : ['jsx', 'typescript'];
}
