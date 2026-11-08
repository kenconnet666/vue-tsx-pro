// 交互状态表：一个示例里的可交互元素各截默认、悬停、键盘焦点、按下四种状态（不可用的另标出来），排成一张表，
// 逐个组件精修样式时对照状态是否齐全、亮暗两套是否一致用。先开着文档站的开发服务器（pnpm dev:docs，端口 5174）。
// 结果在 node_modules/.cache/docs-states/<页面>-<示例>-<主题>.png。
//
//   pnpm docs:states /components/button variants
//   pnpm docs:states /components/button variants,tones --themes=dark
//   pnpm docs:states /components/listbox single --selector='[role="option"]'   换成别的元素（默认按钮与链接）
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';
import { captureStates, hideSiteHeader, INTERACTIVE } from './lib/states.mjs';

// playwright 装在 host-demo（浏览器测试）里
const { chromium } = requireFrom('apps/host-demo')('playwright');
const [path, which] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
if (!path?.startsWith('/') || !which) {
  console.error(
    '用法：pnpm docs:states /components/<页面> <示例 id,…> [--themes=light,dark] [--selector=…]',
  );
  process.exit(1);
}
const option = (name, fallback) =>
  process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const themes = option('themes', 'light,dark').split(',');
const origin = option('origin', 'http://localhost:5174');
const selector = option('selector', INTERACTIVE);
// 一个示例最多截几个元素：再多表就太长了
const LIMIT = Number(option('limit', '16'));
const out = join(root, 'node_modules/.cache/docs-states');
mkdirSync(out, { recursive: true });
const name = path.replaceAll('/', '_').replace(/^_/, '');

const browser = await chromium.launch();
for (const theme of themes) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    locale: 'zh-CN',
    reducedMotion: 'reduce',
  });
  await context.addInitScript((value) => localStorage.setItem('vue-tsx-pro-theme', value), theme);
  const page = await context.newPage();
  await page.goto(`${origin}${path}`);
  await page.waitForFunction(() => document.querySelector('main h1'), null, { timeout: 120_000 });
  await hideSiteHeader(page);
  for (const id of which.split(',')) {
    const demo = page.locator(`[id="${id}"]`).locator('xpath=..').locator('[data-demo]');
    const targets = demo.locator(selector);
    // 示例卡片推迟渲染：滚到它那里，等里面的元素出来（最多 5 秒；本来就没有可交互元素的示例照样往下走）
    await page.locator(`[id="${id}"]`).scrollIntoViewIfNeeded();
    await targets
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => undefined);
    const count = Math.min(await targets.count(), LIMIT);
    const rows = [];
    for (let index = 0; index < count; index++) {
      const target = targets.nth(index);
      if (!(await target.isVisible())) continue;
      const { label, disabled, cells } = await captureStates(page, target);
      rows.push({ label: disabled ? `${label}（不可用）` : label, cells });
    }
    const states = ['default', 'hover', 'focus', 'active'];
    const html = `<!doctype html><meta charset="utf-8"><style>
      body { margin: 16px; font: 13px system-ui, sans-serif; background: ${theme === 'dark' ? '#111' : '#fff'}; color: ${theme === 'dark' ? '#eee' : '#222'}; }
      table { border-collapse: collapse; } td, th { padding: 6px 10px; border-bottom: 1px solid #8884; text-align: start; vertical-align: middle; }
      img { display: block; zoom: 0.5; }
    </style><div id="sheet" style="display: inline-block; padding: 8px"><h3>${path} #${id}（${theme}）</h3><table><tr><th></th>${states.map((state) => `<th>${state}</th>`).join('')}</tr>${rows
      .map(
        (row) =>
          `<tr><th>${row.label}</th>${states
            .map(
              (state) =>
                `<td>${row.cells[state] ? `<img src="data:image/png;base64,${row.cells[state]}">` : '—'}</td>`,
            )
            .join('')}</tr>`,
      )
      .join('')}</table></div>`;
    const sheet = await context.newPage();
    await sheet.setContent(html);
    await sheet.locator('#sheet').screenshot({ path: join(out, `${name}-${id}-${theme}.png`) });
    await sheet.close();
    console.log(`${id}（${theme}）：${rows.length} 个元素`);
  }
  await context.close();
}
await browser.close();
console.log(`状态表在 ${out}`);
