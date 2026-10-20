// 真实浏览器（Playwright 的 Chromium、Firefox、WebKit）里的测试：示例的布局、焦点、动画与三套主题的无障碍检查
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
// 仓库内部的配置，不是组件库的公开接口：按相对路径引用
import { uiPrebundle, uiPrebundleExclude } from '../../packages/ui/prebundle.config.ts';
import { plugins } from './vite.config.ts';

export default defineConfig({
  plugins,
  // 测试用到的依赖一开始就预构建：否则 Vite 跑到一半发现新依赖会重新预构建并刷新页面，
  // 三个浏览器并行时正在初始化的测试页会卡住（CI 冷启动时出现过）。组件库的依赖见 prebundle.config.ts
  optimizeDeps: {
    include: ['vue', 'vue-router', 'axe-core', '@stylexjs/stylex', 'zod', ...uiPrebundle],
    exclude: uiPrebundleExclude,
  },
  test: {
    name: 'docs-browser',
    include: ['src/**/*.browser.test.{ts,tsx}'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
  },
});
