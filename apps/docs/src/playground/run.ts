/**
 * 代码演练场的主线程部分：把代码交给 Worker 编译、执行结果拿到组件（组件库的 browser-compile 入口）。
 * 用户代码里的 import 都从这张模块表取：复用文档站已经加载的 vue、组件库，不再下载一份。
 */
import * as tsx from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import * as ui from '@zerodep-dev/vue-tsx-pro-ui';
import * as tokens from '@zerodep-dev/vue-tsx-pro-ui/tokens';
import * as vars from '@zerodep-dev/vue-tsx-pro-ui/vars';
import * as vue from 'vue';
import type { Component } from 'vue';
import {
  createCompileClient,
  evaluateModule,
  importedModules,
  type CompileResult,
} from '@zerodep-dev/vue-tsx-pro-tsx/browser-compile';
import CompileWorker from '@zerodep-dev/vue-tsx-pro-tsx/browser-compile/worker?worker';

/** 一直在的模块：文档站本来就加载了 */
const MODULES: Record<string, unknown> = {
  vue,
  '@zerodep-dev/vue-tsx-pro-tsx': tsx,
  '@zerodep-dev/vue-tsx-pro-tsx/styles': css,
  '@zerodep-dev/vue-tsx-pro-ui': ui,
  '@zerodep-dev/vue-tsx-pro-ui/tokens': tokens,
  '@zerodep-dev/vue-tsx-pro-ui/vars': vars,
};

/** 代码里用到时才加载的模块（图标很多；图表、3D 带着 Unovis、three；子路径不在文档站的首屏里） */
const LAZY_MODULES: Record<string, () => Promise<unknown>> = {
  '@lucide/icons': () => import('@lucide/icons'),
  '@zerodep-dev/vue-tsx-pro-ui/charts': () => import('@zerodep-dev/vue-tsx-pro-ui/charts'),
  '@zerodep-dev/vue-tsx-pro-ui/patterns': () => import('@zerodep-dev/vue-tsx-pro-ui/patterns'),
  '@zerodep-dev/vue-tsx-pro-ui/diagram': () => import('@zerodep-dev/vue-tsx-pro-ui/diagram'),
  '@zerodep-dev/vue-tsx-pro-ui/theme-customize': () =>
    import('@zerodep-dev/vue-tsx-pro-ui/theme-customize'),
  '@zerodep-dev/vue-tsx-pro-ui/xlsx': () => import('@zerodep-dev/vue-tsx-pro-ui/xlsx'),
  '@zerodep-dev/vue-tsx-pro-ui/code-editor': () =>
    import('@zerodep-dev/vue-tsx-pro-ui/code-editor'),
  '@zerodep-dev/vue-tsx-pro-ui/three': () => import('@zerodep-dev/vue-tsx-pro-ui/three'),
  '@zerodep-dev/vue-tsx-pro-ui/docs-kit': () => import('@zerodep-dev/vue-tsx-pro-ui/docs-kit'),
  three: () => import('three'),
};

/** 用户代码能导入的模块名（组件库的子路径都要在：pages 测试检查） */
export const playgroundModuleNames: readonly string[] = [
  ...Object.keys(MODULES),
  ...Object.keys(LAZY_MODULES),
];

/** 用户代码能导入的模块：一直在的，加上代码里用到的按需模块 */
async function moduleTable(code: string): Promise<Record<string, unknown>> {
  const table: Record<string, unknown> = { ...MODULES };
  for (const name of importedModules(code)) {
    const load = LAZY_MODULES[name];
    if (load) table[name] = await load();
  }
  return table;
}

const compiler = createCompileClient(() => new CompileWorker());

/** 编译一段代码（第一次调用时启动 Worker） */
export function compile(code: string): Promise<CompileResult> {
  return compiler.compile(code, { filename: 'Playground.tsx' });
}

/** 执行编译结果，返回它默认导出的组件 */
export async function evaluate(code: string): Promise<Component> {
  const exports = evaluateModule<{ default?: Component }>(code, await moduleTable(code));
  if (!exports.default) throw new Error('代码要 export default 一个组件');
  return exports.default;
}
