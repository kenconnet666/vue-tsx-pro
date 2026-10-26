/**
 * 在浏览器里编译、执行 TSX 模块：代码演练场、表单设计器、审批页面的兜底重编都用它。
 *
 * 编译（Babel）放在 Worker 里，打字时界面不卡；这个入口本身不带 Babel，只有 Worker 与 compileInThread 才加载它：
 *
 * ```ts
 * import { createCompileClient, evaluateModule } from '@zerodep-dev/vue-tsx-pro-tsx/browser-compile';
 * import CompileWorker from '@zerodep-dev/vue-tsx-pro-tsx/browser-compile/worker?worker';
 *
 * const compiler = createCompileClient(() => new CompileWorker());
 * const result = await compiler.compile(source);
 * if ('error' in result) showError(result.error);
 * else mount(evaluateModule(result.code, { vue, '@zerodep-dev/vue-tsx-pro-ui': ui }).default);
 * ```
 *
 * Vite 里还要加上 `browserCompile()` 插件（`@zerodep-dev/vue-tsx-pro-tsx/vite`）：Babel 用到的 Node 模块换成浏览器替身、预构建 Babel。
 */
import type { CompileModuleOptions } from './compile.ts';

export type { CompileModuleOptions } from './compile.ts';

/** 编译的结果：成功时是代码，失败时是带代码帧的错误消息；ms 是编译用的毫秒数 */
export type CompileResult = { code: string; ms: number } | { error: string; ms: number };

/** 发给编译 Worker 的消息 */
export interface CompileRequest {
  /** 请求编号：回复里原样带回 */
  id: number;
  /** 源码 */
  source: string;
  /** 编译选项（插件不能跨线程，只有文件名） */
  filename?: string;
}

/** 编译 Worker 的回复 */
export type CompileResponse = CompileResult & { id: number };

/** 编译客户端：把源码交给 Worker，等回复 */
export interface CompileClient {
  /** 编译一个模块；第一次调用时才启动 Worker */
  compile(source: string, options?: { filename?: string }): Promise<CompileResult>;
  /** 结束 Worker；之后再编译会重新启动 */
  dispose(): void;
}

/**
 * 建一个编译客户端。createWorker 给出编译 Worker：用 Vite 时是
 * `() => new CompileWorker()`（`import CompileWorker from '@zerodep-dev/vue-tsx-pro-tsx/browser-compile/worker?worker'`）。
 */
export function createCompileClient(createWorker: () => Worker): CompileClient {
  let worker: Worker | undefined;
  let nextId = 0;
  const pending = new Map<number, (response: CompileResponse) => void>();
  const start = () => {
    const created = createWorker();
    created.onmessage = (event: MessageEvent<CompileResponse>) => {
      pending.get(event.data.id)?.(event.data);
      pending.delete(event.data.id);
    };
    return created;
  };
  return {
    compile(source, options = {}) {
      const id = nextId++;
      return new Promise((resolve) => {
        // 在 Promise 里启动：环境里没有 Worker（服务端渲染、测试）时是一次失败的编译，调用方的 catch 接得住
        worker ??= start();
        // 回复里的 id 只用来找到这个请求，交给调用方的是结果本身
        pending.set(id, ({ id: _replyId, ...result }) => resolve(result));
        worker.postMessage({ id, source, filename: options.filename } satisfies CompileRequest);
      });
    },
    dispose() {
      worker?.terminate();
      worker = undefined;
      for (const resolve of pending.values())
        resolve({ id: -1, error: 'the compiler was disposed', ms: 0 });
      pending.clear();
    },
  };
}

/**
 * 在当前线程编译（会加载 Babel）：Node 里、测试里，或者已经在 Worker 里时用。浏览器页面里用 createCompileClient，界面不卡。
 */
export async function compileInThread(
  source: string,
  options?: CompileModuleOptions,
): Promise<string> {
  const { compileModule } = await import('./compile.ts');
  return compileModule(source, options);
}

/**
 * 执行编译结果，返回它的导出。modules 是代码能导入的模块：键是 import 写的名字，值是模块本身（`import * as` 拿到的对象）。
 * 代码导入了表里没有的模块时报错，指出是哪个。
 *
 * 编译结果来自自己的用户（演练场里自己写的代码、自己的表单设计器发布的表单）：这里不做隔离，与在页面里写 script 一样。
 */
export function evaluateModule<T extends Record<string, unknown> = Record<string, unknown>>(
  code: string,
  modules: Readonly<Record<string, unknown>>,
): T {
  const missing = importedModules(code).filter((name) => !(name in modules));
  if (missing.length)
    throw new Error(
      `the module imports ${missing.join(', ')}, which the module table does not provide`,
    );
  const exports = {} as T;
  // oxlint-disable-next-line no-implied-eval -- 执行的是自己的用户写的代码，见上面的说明
  new Function('__modules', '__exports', code)(modules, exports);
  return exports;
}

/** 编译结果导入了哪些模块（按出现的先后，不重复）：按需加载大模块时先看要不要 */
export function importedModules(code: string): string[] {
  const names = new Set<string>();
  for (const match of code.matchAll(/__modules\[("(?:[^"\\]|\\.)*")]/g))
    names.add(JSON.parse(match[1]!) as string);
  return [...names];
}
