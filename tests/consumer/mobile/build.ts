// 两端小程序工程：dist/wx、dist/my
import { buildMini } from '@zerodep-dev/vue-tsx-pro-mini/build';
import { vueTsxPro } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

for (const platform of ['wx', 'my'] as const) {
  const { outDir, pages } = await buildMini({
    root: import.meta.dirname,
    platform,
    plugins: vueTsxPro(),
  });
  console.log(`${platform}: ${pages.join(', ')} → ${outDir}`);
}
