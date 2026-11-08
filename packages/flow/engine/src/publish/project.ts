/**
 * 流程工程的编译与加载（docs/decisions/0002-projects.md）：发布时用选项里的 transform 把每个 .ts / .tsx 编成从模块表取导入的 JS
 * （`@zerodep-dev/flow-ts-studio` 的 compileInPlace，或浏览器里 Worker 编译；引擎自己不带编译器），跟着版本存下来；
 * 执行时由这里的链接器加载——相对路径在工程里找，包名先找引擎自带的（模型包、defineLogic），再找宿主登记的。
 * Node 与浏览器同一套，不依赖打包器。
 *
 * 信任模型：只有管理员能写，代码在宿主里直接执行，不做沙箱。
 */
import * as model from '@zerodep-dev/flow-ts-model';
import {
  PROJECT_FILES,
  upgradeDefinition,
  type FlowProject,
  type FormManifest,
  type FormValues,
  type ProcessDefinition,
} from '@zerodep-dev/flow-ts-model';
import { FlowError } from '../core/errors.ts';
import type { FlowExtensions, Variables } from '../types.ts';

/** 流程代码里的逻辑：按种类分组，定义里写 `logic.名字` 引用 */
export type FlowLogic<V extends object = Variables> = FlowExtensions<V>;

/**
 * 写 logic.ts：给了单据时 ctx.variables、ctx.read 按单据的类型来
 * ```ts
 * import form from './form';
 * export default defineLogic(form, {
 *   guards: { budget: ({ variables }) => Number(variables.amount) > 1e5 ? '超出预算' : true },
 * });
 * ```
 */
export function defineLogic<const L extends FlowLogic>(logic: L): L;
export function defineLogic<Form extends FormManifest, const L extends FlowLogic<FormValues<Form>>>(
  form: Form,
  logic: L,
): L;
export function defineLogic(first: unknown, second?: unknown): unknown {
  return second ?? first;
}

/** 宿主登记给流程代码 import 的模块：给出导出，或用到才加载；types 是给类型检查、在线编辑器的声明 */
export interface HostModule {
  readonly exports?: object;
  readonly load?: () => Promise<object>;
  readonly types?: string;
}

/** 模块名 → 宿主模块 */
export type HostModules = Readonly<Record<string, HostModule>>;

/**
 * TS / TSX → 模块表格式的 JS（组件库 browser-compile 的输出：导入读 `__modules['名字']`，导出写 `__exports`）；path 用来报错
 */
export type TransformCode = (source: string, path: string) => Promise<string>;

/** 编译好的工程：并进单据变量的定义、每个模块的 JS */
export interface CompiledProject {
  readonly definition: ProcessDefinition;
  readonly modules: Readonly<Record<string, string>>;
}

const isCode = (path: string) => /\.tsx?$/.test(path);

/** 编译：读 process.json、转换每个 .ts / .tsx；写得不对报 invalid-definition（field 是文件路径） */
export async function compileProject(
  project: FlowProject,
  transform: TransformCode | undefined,
): Promise<CompiledProject> {
  if (!transform) {
    throw new FlowError(
      'invalid-definition',
      '发布流程工程要在引擎选项里给 transform（@zerodep-dev/flow-ts-studio 的 compileInPlace）',
    );
  }
  const json = project.files[PROJECT_FILES.process];
  if (json === undefined) {
    throw new FlowError('invalid-definition', `流程工程里要有 ${PROJECT_FILES.process}`, {
      field: PROJECT_FILES.process,
    });
  }
  const definition = attempt(PROJECT_FILES.process, () => upgradeDefinition(JSON.parse(json)));
  const modules: Record<string, string> = {};
  for (const [path, source] of Object.entries(project.files)) {
    if (isCode(path)) modules[path] = await attemptAsync(path, () => transform(source, path));
  }
  return { definition, modules };
}

/** 加载好的工程：取模块的导出；单据与逻辑是 form.ts、logic.ts 的默认导出 */
export interface LinkedProject {
  module(path: string): Readonly<Record<string, unknown>>;
  readonly form: FormManifest | undefined;
  readonly logic: FlowLogic | undefined;
}

/** 引擎自带、流程代码总能 import 的模块 */
const BUILTIN: Readonly<Record<string, object>> = {
  '@zerodep-dev/flow-ts-model': model,
  '@zerodep-dev/flow-ts-engine': { defineLogic },
};

/** 加载编译好的模块：先把用到的宿主模块都加载好（模块表是同步取的），工程里的模块用到时才执行 */
export async function linkProject(
  modules: Readonly<Record<string, string>>,
  host: HostModules = {},
): Promise<LinkedProject> {
  const external = new Map<string, object>();
  for (const code of Object.values(modules)) {
    for (const name of importedModules(code)) {
      if (!name.startsWith('.') && !external.has(name))
        external.set(name, await hostModule(name, host));
    }
  }
  const loaded = new Map<string, Record<string, unknown>>();
  const loading = new Set<string>();
  const load = (path: string): Record<string, unknown> => {
    const done = loaded.get(path);
    if (done) return done;
    if (loading.has(path))
      throw new FlowError('invalid-definition', `${path} 循环 import 了自己`, { field: path });
    loading.add(path);
    const code = modules[path]!;
    const table: Record<string, unknown> = {};
    for (const name of importedModules(code)) {
      if (name.startsWith('.')) {
        const target = resolve(path, name, modules);
        Object.defineProperty(table, name, { get: () => load(target), enumerable: true });
      } else table[name] = external.get(name);
    }
    const exports = attempt(path, () => evaluate(code, table));
    loading.delete(path);
    loaded.set(path, exports);
    return exports;
  };
  const defaultOf = (path: string) =>
    modules[path] === undefined ? undefined : (load(path)['default'] as never);
  return {
    module: load,
    form: defaultOf(PROJECT_FILES.form),
    logic: defaultOf(PROJECT_FILES.logic),
  };
}

/** 编译、加载，把单据（form.ts 的字段清单）内联进定义的 form.manifest */
export async function buildProject(
  project: FlowProject,
  transform?: TransformCode,
  host?: HostModules,
): Promise<CompiledProject & { readonly linked: LinkedProject }> {
  const compiled = await compileProject(project, transform);
  const linked = await linkProject(compiled.modules, host);
  const manifest = linked.form;
  if (!manifest) return { ...compiled, linked };
  const { definition } = compiled;
  const form = { ...(definition.form ?? { key: definition.key }), manifest };
  return { ...compiled, definition: { ...definition, form }, linked };
}

/** 模块表格式的代码导入了哪些模块（按出现的先后，不重复） */
function importedModules(code: string): string[] {
  const names = new Set<string>();
  for (const match of code.matchAll(/__modules\[("(?:[^"\\]|\\.)*")]/g))
    names.add(JSON.parse(match[1]!) as string);
  return [...names];
}

/** 执行模块表格式的代码，返回导出；执行的是管理员写的代码，不做隔离 */
function evaluate(code: string, modules: Readonly<Record<string, unknown>>) {
  const exports: Record<string, unknown> = {};
  // oxlint-disable-next-line no-implied-eval -- 见文件头的信任模型
  new Function('__modules', '__exports', code)(modules, exports);
  return exports;
}

async function hostModule(name: string, host: HostModules): Promise<object> {
  const builtin = BUILTIN[name];
  if (builtin) return builtin;
  const entry = host[name];
  if (!entry) {
    throw new FlowError('invalid-definition', `流程代码 import 了没有登记的模块 ${name}`, {
      field: name,
    });
  }
  return entry.exports ?? (await entry.load!());
}

/** 相对路径 → 工程里的文件：照写的找，再试 .ts、.tsx、/index.ts */
function resolve(from: string, specifier: string, modules: Readonly<Record<string, string>>) {
  const parts = from.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (part === '..') parts.pop();
    else if (part !== '.') parts.push(part);
  }
  const base = parts.join('/');
  const found = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(
    (path) => modules[path] !== undefined,
  );
  if (!found) {
    throw new FlowError('invalid-definition', `${from} import 的 ${specifier} 在工程里找不到`, {
      field: from,
    });
  }
  return found;
}

async function attemptAsync<T>(path: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    return attempt(path, () => {
      throw error;
    });
  }
}

/** 做一步，出错时报 invalid-definition，带上是哪个文件 */
function attempt<T>(path: string, work: () => T): T {
  try {
    return work();
  } catch (error) {
    if (error instanceof FlowError) throw error;
    throw new FlowError(
      'invalid-definition',
      `${path} 写得不对：${error instanceof Error ? error.message : String(error)}`,
      { field: path },
    );
  }
}
