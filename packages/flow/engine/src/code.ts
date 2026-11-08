/**
 * 流程自带的 TS（ROADMAP 14.8b，docs/decisions/0001 的 3.3）：定义的 `code.source` 是一个 TS 模块，导出的函数与注册的扩展同形，
 * 定义里写 `code.名字` 引用（处理人 `{ resolver: 'code.reviewer' }`、守卫 `'code.budget'`、动作 `'code.sync'`、条件 `fn.code.big`）。
 * 发布时去掉类型、存进这个版本（之后不变），执行时按编译结果加载一次。
 *
 * 信任模型（已定的决定第 7 条）：只有受信任的管理员能写，代码在宿主进程里直接执行，不做沙箱；模块自成一体，不能 import 别的模块。
 */
import { FlowError } from './errors.ts';

/** 去掉类型的函数：TS 源码 → 能执行的 JS */
export type CompileCode = (source: string) => string;

/** 默认用 Node 自带的 stripTypeScriptTypes；浏览器里没有，要在引擎选项里给 compileCode */
const stripWithNode: CompileCode = (source) => {
  const strip = globalThis.process?.getBuiltinModule?.('node:module')?.stripTypeScriptTypes;
  if (!strip) throw new Error('这个环境去不了类型，引擎选项里要给 compileCode');
  return strip(source, { mode: 'strip' });
};

/** 去掉类型，得到能执行的 JS；语法错误报 invalid-definition */
export function compileCode(source: string, compile: CompileCode = stripWithNode): string {
  try {
    return compile(source);
  } catch (error) {
    throw new FlowError(
      'invalid-definition',
      `流程自带的代码写得不对：${error instanceof Error ? error.message : String(error)}`,
      {
        field: 'code',
      },
    );
  }
}

/** 编译结果 → 模块的导出（同一份编译结果只加载一次） */
const modules = new Map<string, Promise<Readonly<Record<string, unknown>>>>();

/** 加载编译好的模块（data: URL，Node 与浏览器都能 import） */
export function loadCode(compiled: string): Promise<Readonly<Record<string, unknown>>> {
  let loaded = modules.get(compiled);
  if (!loaded) {
    const url = `data:text/javascript,${encodeURIComponent(compiled)}`;
    loaded = import(/* @vite-ignore */ url) as Promise<Readonly<Record<string, unknown>>>;
    modules.set(compiled, loaded);
  }
  return loaded;
}
