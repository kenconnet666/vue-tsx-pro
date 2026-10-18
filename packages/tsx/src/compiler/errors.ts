import type { NodePath } from '@babel/core';

/** 符文误用时抛出的错误：带代码帧的说明，以及供编辑器/语言服务定位的起止位置 */
export interface RunesError extends Error {
  /** 出错代码的起止位置（行从 1、列从 0 开始，同 Babel） */
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

/** 编译警告：说明、位置，以及带代码帧的完整文本（给 Vite 输出） */
export interface RunesWarning {
  /** 说明文字 */
  message: string;
  /** 起止位置，同 RunesError.loc */
  loc?: RunesError['loc'];
  /** 带代码帧的完整文本 */
  frame: string;
}

/** 生成指向某个节点的 RunesError（由调用方 throw） */
export function fail(path: NodePath, message: string): RunesError {
  const error: RunesError = path.buildCodeFrameError(message);
  const loc = path.node.loc;
  if (loc) error.loc = { start: { ...loc.start }, end: { ...loc.end } };
  return error;
}

/** 生成指向某个节点的编译警告 */
export function warning(path: NodePath, message: string): RunesWarning {
  const { loc } = fail(path, message);
  return { message, loc, frame: path.buildCodeFrameError(message).message };
}
