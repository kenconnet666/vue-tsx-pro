// 把 docs:review 的示例截图按页拼成联系表（两列、缩小），一页一张，逐页过目用；结果在 node_modules/.cache/docs-review/sheets。
//
//   pnpm docs:sheets              全部页（先跑 pnpm docs:review）
//   pnpm docs:sheets button,menu  只拼这几页

import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

const { chromium } = requireFrom('apps/host-demo')('playwright');
const dir = join(root, 'node_modules/.cache/docs-review');
const out = join(dir, 'sheets');
mkdirSync(out, { recursive: true });
const only = process.argv[2]?.split(',');
const report = JSON.parse(readFileSync(join(dir, 'report.json'), 'utf8'));
const files = readdirSync(dir).filter((file) => file.endsWith('.png'));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
for (const { path } of report) {
  const name = path.replace('/components/', '');
  if (only && !only.includes(name)) continue;
  const shots = files.filter((file) => file.startsWith(`${name}--`));
  if (shots.length === 0) continue;
  const cells = shots
    .map((file) => {
      const data = readFileSync(join(dir, file)).toString('base64');
      const id = file.slice(name.length + 2).replace(/--\w+\.png$/, '');
      return `<figure><figcaption>${id}</figcaption><img src="data:image/png;base64,${data}"></figure>`;
    })
    .join('');
  await page.setContent(`<!doctype html><style>
    body { margin: 0; padding: 8px; font: 13px sans-serif; background: #ddd; }
    h1 { font-size: 15px; margin: 0 0 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
    figure { margin: 0; background: #fff; padding: 4px; }
    figcaption { color: #555; margin-bottom: 2px; }
    img { width: 100%; display: block; }
  </style><h1>${name}</h1><div class="grid">${cells}</div>`);
  await page.waitForTimeout(100);
  await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
}
await browser.close();
console.log(`联系表在 ${out}`);
