import { defineConfig } from 'vitest/config';

// 驱动在 Node 里测：IndexedDB 用 fake-indexeddb 装到全局（与浏览器同一套接口），BroadcastChannel 是 Node 自带的
export default defineConfig({
  test: { name: 'storage', environment: 'node', setupFiles: ['fake-indexeddb/auto'] },
});
