import type { NodePath } from '@babel/core';

/** 符文误用时抛出的错误：带代码帧的说明，以及供编辑器/语言服务定位的起止位置 */
export interface RunesError extends Error {
  loc?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

/** 编译警告：说明、位置，以及带代码帧的完整文本（给 Vite 输出） */
export interface RunesWarning {
  message: string;
  loc?: RunesError['loc'];
  frame: string;
}

export function fail(path: NodePath, message: string): RunesError {
  const error: RunesError = path.buildCodeFrameError(message);
  const loc = path.node.loc;
  if (loc) error.loc = { start: { ...loc.start }, end: { ...loc.end } };
  return error;
}

export function warning(path: NodePath, message: string): RunesWarning {
  const { loc } = fail(path, message);
  return { message, loc, frame: path.buildCodeFrameError(message).message };
}
