import { defineConfig } from 'vitest/config';

// 根目录统一运行各包与宿主示例自己的 Vitest 配置
export default defineConfig({
  test: {
    projects: ['packages/*', 'packages/flow/ui', 'apps/host-demo', 'apps/docs'],
  },
});
