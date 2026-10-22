/**
 * 假后端：在浏览器里用 Mock Service Worker 拦截 /api 的请求，按 domain 里的业务规则处理、数据存在 localStorage。
 * 页面照常经 api/ 发请求，接上真实后端时去掉这里的启动（或设 VITE_MOCK=false）即可，页面不用改。
 * 路由按资源分在 handlers/ 下，每个接收同一个数据库，测试里可以换成只在内存里的数据库
 */
import type { RequestHandler } from 'msw';
import { createDatabase, type MockDatabase } from './db';
import { benefitHandlers } from './handlers/benefit';
import { sessionHandlers } from './handlers/session';
import { taskHandlers } from './handlers/tasks';
import { workflowHandlers } from './handlers/workflow';

/** 全部路由 */
export const createHandlers = (db: MockDatabase): RequestHandler[] => [
  ...sessionHandlers(db),
  ...taskHandlers(db),
  ...benefitHandlers(db),
  ...workflowHandlers(db),
];

/** 在浏览器里启动假后端：Service Worker 注册好以后才返回，之后的请求都会被接住 */
export async function startMockServer(): Promise<void> {
  const { setupWorker } = await import('msw/browser');
  const worker = setupWorker(...createHandlers(createDatabase()));
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    // 只接 /api：页面、脚本、字体等照常从开发服务器取
    onUnhandledFrame: 'bypass',
    quiet: true,
  });
}
