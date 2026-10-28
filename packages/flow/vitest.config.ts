import { defineConfig } from 'vitest/config';

// 流程引擎各包的测试：node 环境，各包的 test/ 目录；spec/ 是从 flow 仓库复制来的语言无关样例
export default defineConfig({
  // 仓库内按源码解析各包（同 tsconfig 的 customConditions）；后三个是 Vite 默认的服务端条件
  ssr: {
    resolve: { conditions: ['@vue-tsx-pro/source', 'module', 'node', 'development|production'] },
  },
  test: {
    name: 'flow',
    environment: 'node',
    include: ['*/test/**/*.test.ts'],
  },
});
