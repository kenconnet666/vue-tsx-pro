/**
 * 代码演练场的主线程部分：把代码交给 Worker 编译，执行结果拿到组件。
 * 用户代码里的 import 都从这张模块表取：复用文档站已经加载的 vue、组件库，不再下载一份。
 */
import * as tsx from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import * as ui from '@vue-tsx-pro/ui';
import * as tokens from '@vue-tsx-pro/ui/tokens.stylex';
import * as vue from 'vue';
import type { Component } from 'vue';
import type { TokenGroups } from './compile';
import type { CompileRequest, CompileResponse } from './compile.worker';

/** 体积大的模块：代码里用到时才加载（图标很多；图表、3D 带着 Unovis、three） */
const LAZY_MODULES: Record<string, () => Promise<unknown>> = {
  '@lucide/icons': () => import('@lucide/icons'),
  '@vue-tsx-pro/ui/charts': () => import('@vue-tsx-pro/ui/charts'),
  '@vue-tsx-pro/ui/three': () => import('@vue-tsx-pro/ui/three'),
  three: () => import('three'),
};

/** 用户代码能导入的模块；编译结果按 `__modules["名字"]` 取 */
async function moduleTable(code: string): Promise<Record<string, unknown>> {
  const table: Record<string, unknown> = {
    vue,
    '@vue-tsx-pro/tsx': tsx,
    '@vue-tsx-pro/tsx/stylex': stylex,
    '@stylexjs/stylex': stylex,
    '@vue-tsx-pro/ui': ui,
    '@vue-tsx-pro/ui/tokens.stylex': tokens,
  };
  const used = Object.entries(LAZY_MODULES).filter(
    ([name]) => code.includes(JSON.stringify(name)) || code.includes(`'${name}'`),
  );
  for (const [name, load] of used) table[name] = await load();
  return table;
}

/** 各组 token 名（defineVars 的结果里还带着 __ 开头的内部字段，去掉） */
export const tokenGroups: TokenGroups = Object.fromEntries(
  Object.entries(tokens).map(([group, vars]) => [
    group,
    Object.keys(vars).filter((name) => !name.startsWith('__')),
  ]),
);

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, (response: CompileResponse) => void>();

/** 编译一段代码（第一次调用时启动 Worker） */
export async function compile(code: string): Promise<CompileResponse> {
  if (!worker) {
    worker = new Worker(new URL('./compile.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<CompileResponse>) => {
      pending.get(event.data.id)?.(event.data);
      pending.delete(event.data.id);
    };
  }
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    worker!.postMessage({ id, code, tokenGroups } satisfies CompileRequest);
  });
}

/** 演练场代码的样式：一个 style 元素，每次编译后整体替换；离开演练场时传空字符串清掉 */
let style: HTMLStyleElement | undefined;
export function applyStyles(css: string) {
  style ??= document.head.appendChild(document.createElement('style'));
  style.dataset.playground = '';
  style.textContent = css;
}

/** 执行编译结果，返回它默认导出的组件 */
export async function evaluate(code: string): Promise<Component> {
  const exports: { default?: Component } = {};
  // oxlint-disable-next-line no-implied-eval -- 演练场就是要执行用户自己在页面上写的代码，只在用户自己的浏览器里执行
  new Function('__modules', '__exports', code)(await moduleTable(code), exports);
  if (!exports.default) throw new Error('代码要 export default 一个组件');
  return exports.default;
}
