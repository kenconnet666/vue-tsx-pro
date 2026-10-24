// 真实浏览器（Playwright 的 Chromium、Firefox、WebKit）里的测试：示例的布局、焦点、动画与亮暗两套主题的无障碍检查
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { optimizeDeps, plugins } from './vite.config.ts';

export default defineConfig({
  plugins,
  // 依赖一开始就预构建（与开发服务器同一份，加上测试专用的）：否则 Vite 跑到一半发现新依赖会重新预构建并刷新页面，
  // 三个浏览器并行时正在初始化的测试页会卡住（CI 上出现过“failed to find the current suite”）
  optimizeDeps: {
    ...optimizeDeps,
    include: [...optimizeDeps.include, 'vue', 'vue-router', 'axe-core', 'zod'],
  },
  test: {
    name: 'docs-browser',
    include: ['src/**/*.browser.test.{ts,tsx}'],
    // 每个浏览器里的测试文件依次跑：三个浏览器 × 几个文件同时向冷启动的服务器要组件库源码时，
    // WebKit 的模块导入会失败（Importing a module script failed）
    fileParallelism: false,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      // CI 的 Windows 机器上文档站与宿主的六个浏览器同时启动，Firefox 偶尔要一分多钟才连上（默认 60 秒就判失败）
      connectTimeout: process.env.CI ? 180_000 : 60_000,
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
  },
});
