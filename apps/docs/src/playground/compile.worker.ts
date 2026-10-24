/** 代码演练场的编译 Worker：编译（compile.ts）放在页面线程之外，打字时界面不卡 */
// 必须是第一个导入：给 Babel 补上 process
import './node-shims/globals';
import { compilePlayground } from './compile';

/** 发给 Worker 的消息 */
export interface CompileRequest {
  /** 请求编号：回复里原样带回 */
  id: number;
  /** 用户写的 TSX */
  code: string;
}

/** Worker 的回复 */
export type CompileResponse =
  { id: number; code: string; ms: number } | { id: number; error: string; ms: number };

self.onmessage = async (event: MessageEvent<CompileRequest>) => {
  const { id, code } = event.data;
  const start = performance.now();
  try {
    const result = await compilePlayground(code);
    self.postMessage({ id, ...result, ms: performance.now() - start });
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : String(error),
      ms: performance.now() - start,
    });
  }
};
