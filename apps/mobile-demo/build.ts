// 构建微信、支付宝两端：node build.ts [wx|my] [--watch]，不给平台时两端都构建；
// --watch 是开发模式（不压缩、带源码映射），改了源码只重打应用的包
import { buildMini, watchMini, type MiniBuildOptions } from '@zerodep-dev/vue-tsx-pro-mini/build';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const named = args.filter((arg) => arg === 'wx' || arg === 'my') as ('wx' | 'my')[];
const platforms = named.length ? named : (['wx', 'my'] as const);

const optionsFor = (platform: 'wx' | 'my'): MiniBuildOptions => ({
  root: import.meta.dirname,
  platform,
  plugins: vueTsxPro(),
  development: watch,
  // 微信「小程序测试号」，只用于本地开发者工具预览
  appId: 'wxbc70cc8a7367b5e9',
  darkmode: true,
  window: {
    navigationBarTitleText: 'vue-tsx-pro',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTextStyle: 'black',
  },
});

for (const platform of platforms) {
  if (watch) {
    await watchMini(optionsFor(platform), ({ pages, ms, count }) =>
      console.log(`${platform}: 第 ${count} 次，${pages.length} 个页面（${ms} ms）`),
    );
    continue;
  }
  const started = performance.now();
  const { outDir, pages } = await buildMini(optionsFor(platform));
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  console.log(`${platform}: ${pages.length} 个页面 → ${outDir}（${seconds}s）`);
}
