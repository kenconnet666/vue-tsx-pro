import { defineConfig } from 'vitest/config';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// 流程引擎的界面：同组件库的测试，完整编译、happy-dom
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  test: { name: 'flow-ui', environment: 'happy-dom' },
});
