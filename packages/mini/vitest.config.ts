import { defineConfig } from 'vitest/config';
import { workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// 运行时不碰 DOM：节点、渲染器、样式解析、页面的增量更新都在 Node 里测（组件库的真实组件在 mobile 的测试里跑）
export default defineConfig({
  plugins: [workspaceSource()],
  test: { name: 'mini', environment: 'node' },
});
