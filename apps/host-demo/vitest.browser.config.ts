// 真实浏览器（Playwright 的 Chromium、Firefox、WebKit）里的测试：布局、焦点、原生弹层、输入法、无障碍检查
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
import { plugins } from './vite.config.ts';

export default defineConfig({
  plugins,
  // 测试用到的依赖一开始就预构建：否则 Vite 跑到一半发现新依赖会重新预构建并刷新页面，
  // 三个浏览器并行时正在初始化的测试页会卡住（CI 冷启动时出现过）
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axe-core',
      '@floating-ui/dom',
      // ui 包的依赖，宿主示例自己没装，按“包 > 依赖”的写法解析
      '@vue-tsx-pro/ui > @internationalized/date',
      '@lucide/icons',
      '@stylexjs/stylex',
      'tabbable',
    ],
  },
  test: {
    name: 'host-demo-browser',
    include: ['test/**/*.browser.test.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
  },
});
