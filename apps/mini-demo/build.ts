// 构建微信、支付宝两端：node build.ts [wx|my]，不给参数时两端都构建
import { buildMini } from '@zerodep-dev/vue-tsx-pro-mini/build';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

const platforms = process.argv[2] ? [process.argv[2] as 'wx' | 'my'] : (['wx', 'my'] as const);

for (const platform of platforms) {
  const started = performance.now();
  const { outDir, pages } = await buildMini({
    root: import.meta.dirname,
    platform,
    plugins: vueTsxPro(),
    // 微信「小程序测试号」，只用于本地开发者工具预览
    appId: 'wxbc70cc8a7367b5e9',
    window: {
      navigationBarTitleText: 'vue-tsx-pro',
      navigationBarBackgroundColor: '#ffffff',
      navigationBarTextStyle: 'black',
    },
  });
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  console.log(`${platform}: ${pages.length} 个页面 → ${outDir}（${seconds}s）`);
}
