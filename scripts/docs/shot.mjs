// 文档页的示例截图：每个示例一张（卡片连同打开的弹层），各主题各一张，PNG 存到 node_modules/.cache/docs-shots。
// 先开着文档站的开发服务器（pnpm dev:docs，端口 5174）。改完示例后看一眼效果用，不进 CI。
//
//   pnpm docs:shot /components/menu                       全部示例，亮、暗两套主题
//   pnpm docs:shot /components/menu basic,groups --themes=dark
//   pnpm docs:shot /components/menu page                  整页；keyboard 是键盘小节
//   pnpm docs:shot /components/select basic --click=basic:城市    截图前点开一个按钮或下拉框（按名称找）
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

// playwright 装在 host-demo（浏览器测试）里
const { chromium } = requireFrom('apps/host-demo')('playwright');
const [path, which = 'all'] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
if (!path?.startsWith('/')) {
  console.error(
    '用法：pnpm docs:shot /components/<页面> [示例 id,…|all|page|keyboard] [--themes=light,dark]',
  );
  process.exit(1);
}
const option = (name, fallback) =>
  process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const themes = option('themes', 'light,dark').split(',');
const width = Number(option('width', '1280'));
const origin = option('origin', 'http://localhost:5174');
const clicks = new Map(
  process.argv
    .filter((arg) => arg.startsWith('--click='))
    .map((arg) => arg.slice(8).split(':'))
    .map(([id, ...text]) => [id, text.join(':')]),
);
const dir = join(root, 'node_modules/.cache/docs-shots');
mkdirSync(dir, { recursive: true });
const name = path.replaceAll('/', '_').replace(/^_/, '');

const browser = await chromium.launch();
for (const theme of themes) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript((value) => localStorage.setItem('vue-tsx-pro-theme', value), theme);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await page.goto(`${origin}${path}`);
  // 开发服务器冷启动时第一次编译要一会儿
  await page.waitForFunction(() => document.querySelector('main h1'), null, { timeout: 120_000 });
  // 推迟渲染的示例卡片：滚一遍让它们都渲染出来
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  if (which === 'page') {
    await page.screenshot({ path: join(dir, `${name}-page-${theme}.png`), fullPage: true });
  } else {
    const ids =
      which === 'all'
        ? await page.evaluate(() =>
            [...document.querySelectorAll('main section > h2[id]')].map((heading) => heading.id),
          )
        : which.split(',');
    for (const id of ids) {
      // 示例：标题所在的 section；键盘、API 等小节：标题的父元素
      const target = page.locator(`[id="${id}"]`).locator('xpath=..');
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      if (clicks.has(id)) {
        // 按钮或下拉框（Select 的触发器是 role="combobox"），按名称找
        await target
          .getByRole('button', { name: clicks.get(id) })
          .or(target.getByRole('combobox', { name: clicks.get(id) }))
          .first()
          .click();
        await page.waitForTimeout(500);
      }
      // 换成页面坐标：卡片与打开的弹层（顶层）合起来
      const clip = await page.evaluate((id) => {
        const rects = [document.getElementById(id).parentElement.getBoundingClientRect()];
        const open = document.querySelector(':popover-open, dialog[open]');
        if (open) rects.push(open.getBoundingClientRect());
        const left = Math.min(...rects.map((rect) => rect.left));
        const top = Math.min(...rects.map((rect) => rect.top));
        const right = Math.max(...rects.map((rect) => rect.right));
        const bottom = Math.max(...rects.map((rect) => rect.bottom));
        return { x: left + scrollX, y: top + scrollY, width: right - left, height: bottom - top };
      }, id);
      await page.screenshot({
        path: join(dir, `${name}-${id}-${theme}.png`),
        clip,
        fullPage: true,
      });
      if (clicks.has(id)) await page.keyboard.press('Escape');
    }
  }
  if (errors.length)
    console.log(`${theme}：${errors.length} 个错误：${errors.slice(0, 3).join(' | ')}`);
  await context.close();
}
await browser.close();
console.log(`截图在 ${dir}`);
