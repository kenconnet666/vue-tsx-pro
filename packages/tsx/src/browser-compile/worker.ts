/**
 * 编译 Worker：在页面线程之外跑 Babel（compile.ts）。由 createCompileClient 启动，用 Vite 时这样导入：
 * `import CompileWorker from '@zerodep-dev/vue-tsx-pro-tsx/browser-compile/worker?worker'`。
 */
// 必须是第一个导入：Babel 读 process.env、process.cwd()，先补上
import '../../shims/process.js';
import { compileModule } from './compile.ts';
import type { CompileRequest, CompileResponse } from './index.ts';

self.onmessage = async (event: MessageEvent<CompileRequest>) => {
  const { id, source, filename } = event.data;
  const start = performance.now();
  let response: CompileResponse;
  try {
    response = {
      id,
      code: await compileModule(source, { filename }),
      ms: performance.now() - start,
    };
  } catch (error) {
    response = {
      id,
      error: error instanceof Error ? error.message : String(error),
      ms: performance.now() - start,
    };
  }
  self.postMessage(response);
};
