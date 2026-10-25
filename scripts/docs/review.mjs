// 文档站巡检：逐页打开组件文档，记下控制台错误、示例在桌面与手机宽度下的横向溢出，并截下每个示例（发布前逐个组件过一遍用）。
// 先开着文档站的开发服务器（pnpm dev:docs，端口 5174）。结果在 node_modules/.cache/docs-review：report.md 与各示例的截图。
//
//   pnpm docs:review                         全部组件页，亮色主题截图
//   pnpm docs:review menu,date-picker        只看某几页（页名或地址前缀，逗号分隔）
//   pnpm docs:review --themes=light,dark --no-shots
//
// 溢出：示例区（[data-demo]）的内容比它宽（scrollWidth > clientWidth），或整页出现横向滚动条；手机宽度是 390px。

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

// playwright 装在 host-demo（浏览器测试）里
const { chromium } = requireFrom('apps/host-demo')('playwright');
const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
// 页面写名字（button、date-picker）或地址；Git Bash 会把 / 开头的参数改写成 Windows 路径，所以只取 /components/ 之后的部分
const prefixes = (args.find((arg) => !arg.startsWith('--')) ?? '')
  .split(',')
  .map((item) => `/components/${item.split('/components/').pop().replace(/^\//, '')}`);
const themes = option('themes', 'light').split(',');
const origin = option('origin', 'http://localhost:5174');
const shots = !args.includes('--no-shots');
const dir = join(root, 'node_modules/.cache/docs-review');
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();

/** 侧栏里的组件页地址，按侧栏的顺序 */
async function pagePaths() {
  const page = await browser.newPage();
  await page.goto(`${origin}/`);
  await page.waitForFunction(() => document.querySelector('nav a[href^="/components/"]'), null, {
    timeout: 120_000,
  });
  const paths = await page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll('nav a[href^="/components/"]')].map(
        (a) => a.getAttribute('href').split('#')[0],
      ),
    ),
  ]);
  await page.close();
  return paths.filter((path) => prefixes.some((prefix) => path.startsWith(prefix)));
}

/** 打开一页、滚一遍让推迟渲染的示例都出来 */
async function open(context, path) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await page.goto(`${origin}${path}`);
  await page.waitForFunction(() => document.querySelector('main h1'), null, { timeout: 120_000 });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  return { page, errors };
}

/** 横向溢出的示例（id）与整页是否横向滚动 */
const overflow = (page) =>
  page.evaluate(() => ({
    page: document.documentElement.scrollWidth > window.innerWidth + 1,
    examples: [...document.querySelectorAll('[data-demo]')]
      .filter((demo) => demo.scrollWidth > demo.clientWidth + 1)
      .map((demo) => demo.closest('section')?.querySelector('h2[id]')?.id ?? '?'),
  }));

const results = [];
const paths = await pagePaths();
for (const [index, path] of paths.entries()) {
  const name = path.replace('/components/', '');
  const result = { path, errors: [], desktop: null, mobile: null };
  for (const theme of themes) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript((value) => localStorage.setItem('vue-tsx-pro-theme', value), theme);
    const { page, errors } = await open(context, path);
    if (theme === themes[0]) result.desktop = await overflow(page);
    if (shots) {
      const ids = await page.evaluate(() =>
        [...document.querySelectorAll('main section > h2[id]')]
          .filter((heading) => heading.parentElement.querySelector('[data-demo]'))
          .map((heading) => heading.id),
      );
      for (const id of ids) {
        const card = page.locator(`[id="${id}"]`).locator('xpath=..');
        await card.scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
        await card.screenshot({ path: join(dir, `${name}--${id}--${theme}.png`) });
      }
    }
    result.errors.push(...errors.map((error) => `${theme}: ${error}`));
    await context.close();
  }
  // 手机宽度只量溢出，不截图
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const { page, errors } = await open(mobile, path);
  result.mobile = await overflow(page);
  result.errors.push(...errors.map((error) => `mobile: ${error}`));
  await mobile.close();
  results.push(result);
  const flags = [
    result.errors.length && `${result.errors.length} 个错误`,
    result.desktop?.examples.length && `桌面溢出 ${result.desktop.examples.join(',')}`,
    result.mobile?.page && '手机整页横滚',
    result.mobile?.examples.length && `手机溢出 ${result.mobile.examples.join(',')}`,
  ].filter(Boolean);
  console.log(
    `[${index + 1}/${paths.length}] ${path}${flags.length ? '  ⚠ ' + flags.join('；') : ''}`,
  );
}
await browser.close();

const lines = ['# 文档站巡检', '', `${results.length} 页，主题 ${themes.join('、')}`, ''];
for (const r of results) {
  const problems = [
    ...r.errors.map((error) => `- 错误：${error.slice(0, 300)}`),
    ...(r.desktop?.page ? ['- 桌面：整页横向滚动'] : []),
    ...(r.desktop?.examples ?? []).map((id) => `- 桌面：示例 ${id} 横向溢出`),
    ...(r.mobile?.page ? ['- 手机：整页横向滚动'] : []),
    ...(r.mobile?.examples ?? []).map((id) => `- 手机：示例 ${id} 横向溢出`),
  ];
  if (problems.length) lines.push(`## ${r.path}`, '', ...problems, '');
}
writeFileSync(join(dir, 'report.md'), lines.join('\n'));
writeFileSync(join(dir, 'report.json'), JSON.stringify(results, null, 2));
console.log(`报告与截图在 ${dir}`);
