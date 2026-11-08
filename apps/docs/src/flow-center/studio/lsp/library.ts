/**
 * 语言服务工作区里的依赖：流程代码 import 得到的包。只放类型要用的——模型包的源码（它只依赖 json-wire）、
 * 引擎的 extensions.ts（defineLogic 与扩展点的类型，不碰库与实体）、json-wire 的声明；宿主模块的声明（`@app/business`）。路径 → 内容，按 node_modules 的布局。
 * 源码在构建时按原文打进来，与仓库里的同一份。
 */
import extensions from '../../../../../../packages/flow/engine/src/extensions.ts?raw';
import { BUSINESS_TYPES } from '../../domain/business-data';

const ROOT = '../../../../../../packages/flow/';

const model = import.meta.glob<string>(
  ['../../../../../../packages/flow/model/src/**/*.ts', '!**/.test/**', '!**/*.test.ts'],
  { query: '?raw', import: 'default', eager: true },
);
const jsonWire = import.meta.glob<string>(
  '../../../../../../packages/flow/model/node_modules/@zerodep-dev/json-wire/dist/*.d.ts',
  { query: '?raw', import: 'default', eager: true },
);

const packageJson = (name: string, types: string) =>
  JSON.stringify({ name, type: 'module', types });

/**
 * 视图用到的页面模块：在线编辑器里给宽松的类型（一律 any），不把 vue 与组件库的声明搬进 Worker；
 * 仓库里写的视图由项目的类型检查按真的声明查
 */
const VIEW_TYPES = `declare module 'vue';
declare module '@zerodep-dev/vue-tsx-pro-tsx';
declare module '@zerodep-dev/vue-tsx-pro-tsx/styles';
declare module '@zerodep-dev/vue-tsx-pro-ui';
declare module '@lucide/icons';
declare namespace JSX {
  type Element = any;
  interface IntrinsicElements { [name: string]: any }
  interface ElementChildrenAttribute { children: {} }
}
declare function _state<T>(value: T): T;
declare namespace _state { function raw<T>(value: T): T; }
declare function _derived<T>(value: T): T;
`;

/** 工作区的根 */
export const WORKSPACE = '/project';

/** 工作区里要先放好的文件：tsconfig 与依赖包 */
export function libraryFiles(): Record<string, string> {
  const modules = `${WORKSPACE}/node_modules/@zerodep-dev`;
  const files: Record<string, string> = {
    // 同服务端的类型检查（flow-ts-studio/typecheck）：严格、按打包器解析、可以写 .ts 后缀
    [`${WORKSPACE}/tsconfig.json`]: JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'esnext',
        module: 'esnext',
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        // 视图（views/*.tsx）：JSX 留给组件库的编译器，这里只查类型
        jsx: 'preserve',
        noEmit: true,
        skipLibCheck: true,
        lib: ['esnext'],
      },
    }),
    [`${modules}/flow-ts-model/package.json`]: packageJson(
      '@zerodep-dev/flow-ts-model',
      './src/index.ts',
    ),
    [`${modules}/flow-ts-engine/package.json`]: packageJson(
      '@zerodep-dev/flow-ts-engine',
      './src/extensions.ts',
    ),
    [`${modules}/flow-ts-engine/src/extensions.ts`]: extensions,
    // 宿主模块的声明：流程代码 import '@app/business' 有类型、补全
    [`${WORKSPACE}/types/app-business.d.ts`]: BUSINESS_TYPES,
    [`${WORKSPACE}/types/views.d.ts`]: VIEW_TYPES,
    [`${modules}/json-wire/package.json`]: packageJson(
      '@zerodep-dev/json-wire',
      './dist/index.d.ts',
    ),
  };
  for (const [path, source] of Object.entries(model))
    files[
      `${modules}/flow-ts-model/${path.slice(path.indexOf(`${ROOT}model/`) + `${ROOT}model/`.length)}`
    ] = source;
  for (const [path, source] of Object.entries(jsonWire))
    files[`${modules}/json-wire/dist/${path.slice(path.lastIndexOf('/') + 1)}`] = source;
  return files;
}
