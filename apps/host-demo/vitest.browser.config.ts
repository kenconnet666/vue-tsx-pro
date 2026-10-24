// 真实浏览器（Playwright 的 Chromium、Firefox、WebKit）里的测试：布局、焦点、原生弹层、输入法、无障碍检查
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { plugins } from './vite.config.ts';

export default defineConfig({
  plugins,
  // 测试用到的依赖一开始就预构建：否则 Vite 跑到一半发现新依赖会重新预构建并刷新页面，
  // 三个浏览器并行时正在初始化的测试页会卡住（CI 冷启动时出现过）。组件库按源码读，它的依赖由启动时的扫描发现
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axe-core', 'zod'],
  },
  test: {
    name: 'host-demo-browser',
    include: ['test/**/*.browser.test.{ts,tsx}'],
    // CI 的 4 核机器上三个浏览器并行，动画、懒加载这类时序断言偶尔超时（每次挂的都是不同的一条，本地都能过）；
    // 同 Playwright 默认模板，CI 上失败的用例重跑，真的坏了重跑也过不了
    retry: process.env.CI ? 2 : 0,
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
