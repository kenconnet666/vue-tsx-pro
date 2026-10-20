/** api.ts 的 Worker 线程：建 TypeScript 程序、提取 API 都在这里做，不占开发服务器的主线程 */
import { parentPort } from 'node:worker_threads';
import {
  extractCatalog,
  extractComponentApi,
  invalidateProgram,
  type ApiRequest,
  type ApiResponse,
} from './api.ts';

parentPort!.on('message', (message: ApiRequest | 'invalidate' | 'warm') => {
  if (message === 'invalidate') invalidateProgram();
  if (typeof message === 'string') {
    extractCatalog();
    return;
  }
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
