// 真实浏览器里的 H5 测试：手机视口、触摸屏（Chromium 与 WebKit；Firefox 不支持移动端模拟）。
// 测的是 happy-dom 做不了的：排版量出来的尺寸、浮层贴边、真实触摸的点按、按真实行高对齐的滑动
import { playwright } from '@vitest/browser-playwright';
import { workspaceSource, vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';
import type { BrowserCommand } from 'vitest/node';
import { defineConfig } from 'vitest/config';

/** 用真实的触摸点一下页面上文字是 text 的元素（Playwright 的 tap，要 hasTouch） */
const tap: BrowserCommand<[text: string]> = async (context, text) => {
  await context.iframe.getByText(text, { exact: true }).first().tap();
};

const phone = playwright({ contextOptions: { hasTouch: true, isMobile: true } });

export default defineConfig({
  // 组件库按源码读：不用先构建 dist
  plugins: [workspaceSource(), ...vueTsxPro()],
  optimizeDeps: { include: ['vue', '@lucide/icons'] },
  test: {
    name: 'mobile-demo-browser',
    include: ['test/**/*.browser.test.{ts,tsx}'],
    retry: process.env.CI ? 2 : 0,
    browser: {
      enabled: true,
      headless: true,
      viewport: { width: 375, height: 812 },
      commands: { tap },
      connectTimeout: process.env.CI ? 180_000 : 60_000,
      instances: [
        { browser: 'chromium', provider: phone },
        { browser: 'webkit', provider: phone },
      ],
    },
  },
});
