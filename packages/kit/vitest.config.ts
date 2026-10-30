import { defineConfig } from 'vitest/config';

// 只测服务端两端通用、不碰 DOM 的部分（失效推送的 SSE 流）；页面、数据、action 由 apps/fullstack-demo 的端到端测试覆盖
export default defineConfig({
  test: { name: 'kit', environment: 'node', include: ['test/**/*.test.ts'] },
});
