import { defineConfig } from 'vitest/config';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// 组件按源码编译（含组件库与流程模型包），DOM 用 happy-dom
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  test: { name: 'flow-ui', environment: 'happy-dom' },
});
