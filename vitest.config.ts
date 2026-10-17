import { defineConfig } from 'vitest/config';

// 根目录统一运行各包自己的 Vitest 配置
export default defineConfig({
  test: {
    projects: ['packages/*'],
  },
});
