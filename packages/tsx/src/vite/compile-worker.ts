/** 编译线程（pool.ts 分派）：加载一份编译器，按主线程发来的请求编译模块；设置在创建线程时给定 */
import { parentPort, workerData } from 'node:worker_threads';
import { compileModule, type CompilerSetup, type ModuleRequest } from './module.ts';

const setup = workerData as CompilerSetup;

parentPort!.on('message', ({ id, request }: { id: number; request: ModuleRequest }) => {
  compileModule(request, setup).then(
    (result) => parentPort!.postMessage({ id, result }),
    (error: unknown) => {
      // 错误对象要能复制回主线程：带上 Vite 显示时用的位置、代码帧等字段
      const { message, stack, name } = error as Error;
      parentPort!.postMessage({ id, error: { ...(error as object), message, stack, name } });
    },
  );
});
