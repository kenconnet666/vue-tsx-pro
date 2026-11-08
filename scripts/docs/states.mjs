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
const selector = option(
  'selector',
  'button:not([aria-hidden="true"]), a[href], [role="option"], [role="tab"], [role="menuitem"]',
);
// 一个示例最多截几个元素：再多表就太长了
const LIMIT = Number(option('limit', '16'));
const PAD = 6;
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
  // 站点的粘性页头会盖住滚到顶部的示例
  await page.evaluate(() =>
    document
      .querySelector('[data-scope="app-shell"][data-part="header"]')
      ?.style.setProperty('visibility', 'hidden'),
  );
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
      await target.scrollIntoViewIfNeeded();
      const label = (
        (await target.getAttribute('aria-label')) ??
        (await target.innerText()).trim().slice(0, 16) ??
        ''
      ).replaceAll('\n', ' ');
      const disabled = await target.evaluate(
        (element) =>
          element.matches(':disabled, [aria-disabled="true"], [data-disabled]') ||
          element.closest('[aria-disabled="true"]') != null,
      );
      const shot = async () => {
        const box = await target.boundingBox();
        if (!box) return '';
        const clip = {
          x: Math.max(0, box.x - PAD),
          y: Math.max(0, box.y - PAD),
          width: box.width + PAD * 2,
          height: box.height + PAD * 2,
        };
        return (await page.screenshot({ clip })).toString('base64');
      };
      // 指针移开、焦点移走，回到默认
      const reset = async () => {
        await page.mouse.move(0, 0);
        await page.mouse.up();
        await page.evaluate(() =>
          document.activeElement instanceof HTMLElement ? document.activeElement.blur() : null,
        );
        await page.waitForTimeout(150);
      };
      await reset();
      const cells = { default: await shot() };
      await target.hover({ force: true });
      await page.waitForTimeout(250);
      cells.hover = await shot();
      await reset();
      // 键盘焦点：先按一下 Shift 让浏览器认为是键盘操作，再程序聚焦（:focus-visible 才成立）
      await page.keyboard.press('Shift');
      await target.evaluate((element) => element.focus());
      await page.waitForTimeout(200);
      cells.focus = await shot();
      await reset();
      if (!disabled) {
        const box = await target.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.waitForTimeout(150);
          cells.active = await shot();
          // 在元素外松开：不触发点击（不打开菜单、不改示例的状态）
          await page.mouse.move(0, 0);
          await page.mouse.up();
        }
      }
      await reset();
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
