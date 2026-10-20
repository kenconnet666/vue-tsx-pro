/** api.ts 的 Worker 线程：建 TypeScript 程序、提取 API 都在这里做，不占开发服务器的主线程 */
import { parentPort } from 'node:worker_threads';
import {
  extractCatalog,
  extractComponentApi,
  invalidateProgram,
  warmProgram,
  type ApiRequest,
  type ApiResponse,
} from './api.ts';

parentPort!.on('message', (message: ApiRequest | 'invalidate' | 'warm') => {
  // 只标记、只建程序：不顺手提取整个组件目录，页面要的单个接口不用排在它后面
  if (message === 'invalidate') return invalidateProgram();
  if (message === 'warm') return warmProgram();
  const { id, interfaceName } = message;
  let response: ApiResponse;
  try {
    const data = interfaceName ? extractComponentApi(interfaceName) : extractCatalog();
    response = { id, code: `export default ${JSON.stringify(data)};\n` };
  } catch (error) {
    response = {
      id,
      error: error instanceof Error ? (error.stack ?? error.message) : String(error),
    };
  }
  parentPort!.postMessage(response);
});
