/**
 * @babel/standalone 的最小替身：StyleX 的 Babel 插件浏览器版只从它取解析器、遍历器与类型工具（packages），
 * 这些 Worker 里的 @babel/core 已经带着，不必再加载几兆的 standalone 整包。vite.config.ts 里把它映射过来
 */
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
// CommonJS 包，导出是运行时逐个挂上去的：要用默认导入拿整个 exports 对象，命名空间导入拿不到
import types from '@babel/types';

/** StyleX 用到的那几个包 */
export const packages = {
  parser: { parse },
  traverse: { default: traverse },
  types,
};
