// 构建微信、支付宝两端：node build.ts [wx|my] [--watch]，不给平台时两端都构建；
// --watch 是开发模式（不压缩、带源码映射），改了源码只重打应用的包。配置在 mini.config.ts
// （使用方的项目用 vtp-mini 命令，见 packages/mini/template；演示在工作区里按源码跑，直接调构建函数）
import { buildMini, watchMini } from '@zerodep-dev/vue-tsx-pro-mini/build';
import config from './mini.config.ts';

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const named = args.filter((arg) => arg === 'wx' || arg === 'my') as ('wx' | 'my')[];
const platforms = named.length ? named : (['wx', 'my'] as const);
const root = import.meta.dirname;

for (const platform of platforms) {
  if (watch) {
    await watchMini({ ...config, root, platform, development: true }, ({ pages, ms, count }) =>
      console.log(`${platform}: 第 ${count} 次，${pages.length} 个页面（${ms} ms）`),
    );
    continue;
  }
  const started = performance.now();
  const { outDir, pages } = await buildMini({ ...config, root, platform });
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  console.log(`${platform}: ${pages.length} 个页面 → ${outDir}（${seconds}s）`);
}
