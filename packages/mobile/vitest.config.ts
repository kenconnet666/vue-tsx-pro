import { defineConfig } from 'vitest/config';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// 组件按源码编译；DOM 用 happy-dom。小程序端的渲染测试用 mini 导出的页面测试工具（同一个进程里不碰 DOM）
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  test: { name: 'mobile', environment: 'happy-dom' },
});
