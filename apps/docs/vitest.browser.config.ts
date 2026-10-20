// 真实浏览器（Playwright 的 Chromium、Firefox、WebKit）里的测试：示例的布局、焦点、动画与三套主题的无障碍检查
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { plugins } from './vite.config.ts';

export default defineConfig({
  plugins,
  // 测试用到的依赖一开始就预构建：跑到一半发现新依赖会重新预构建并刷新页面（见 host-demo 的同名配置）
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'axe-core',
      '@floating-ui/dom',
      '@vue-tsx-pro/ui > @internationalized/date',
      '@lucide/icons',
      '@stylexjs/stylex',
      'tabbable',
      'zod',
      'zod/v4/core',
      'animejs',
      'shiki/core',
      'shiki/engine/javascript',
      'shiki/langs',
    ],
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
