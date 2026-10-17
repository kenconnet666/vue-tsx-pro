// 真实浏览器（Playwright Chromium）里的测试：布局、焦点、原生 popover、输入法、无障碍检查
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { plugins } from './vite.config';

export default defineConfig({
  plugins,
  test: {
    name: 'host-demo-browser',
    include: ['test/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
