// 文档站巡检：逐页打开组件文档，记下控制台错误、示例在桌面与手机宽度下的横向溢出，并截下每个示例（发布前逐个组件过一遍用）。
// 先开着文档站的开发服务器（pnpm dev:docs，端口 5174）。结果在 node_modules/.cache/docs-review：report.md 与各示例的截图。
//
//   pnpm docs:review                         全部组件页，亮色主题截图
//   pnpm docs:review menu,date-picker        只看某几页（页名或地址前缀，逗号分隔）：其他页的截图与报告条目保留
//   pnpm docs:review --themes=light,dark --no-shots
//
// 溢出：示例区（[data-demo]）的内容比它宽（scrollWidth > clientWidth），或整页出现横向滚动条；手机宽度是 390px。
// 两列不齐：1920 宽时并排的两列示例（apps/docs/src/site/Examples.tsx），底边差超过 COLUMN_SLACK，
// 而把长的那列最后一个示例挪到短的那列末尾能让两列更齐时，报出该挪哪个（每页在代码里写定左右列，不自动平衡）。

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

// playwright 装在 host-demo（浏览器测试）里
const { chromium } = requireFrom('apps/host-demo')('playwright');
const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
// 页面写名字（button、date-picker）或地址；Git Bash 会把 / 开头的参数改写成 Windows 路径，所以只取 /components/ 之后的部分
const only = args.find((arg) => !arg.startsWith('--'));
const prefixes = (only ?? '')
  .split(',')
  .map((item) => `/components/${item.split('/components/').pop().replace(/^\//, '')}`);
const themes = option('themes', 'light').split(',');
const origin = option('origin', 'http://localhost:5174');
const shots = !args.includes('--no-shots');
const dir = join(root, 'node_modules/.cache/docs-review');
// 全量巡检从空目录开始；只看某几页时保留别的页，这几页的截图换新、报告条目替换
if (!only) rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const reportFile = join(dir, 'report.json');
const previous = only && existsSync(reportFile) ? JSON.parse(readFileSync(reportFile, 'utf8')) : [];

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
  // 开发服务器热更新会整页刷新（边改代码边巡检时）：滚到一半页面没了就重来，最多三次
  for (let attempt = 1; ; attempt++) {
    try {
      await page.goto(`${origin}${path}`);
      await page.waitForFunction(() => document.querySelector('main h1'), null, {
        timeout: 120_000,
      });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(600);
      return { page, errors };
    } catch (error) {
      if (attempt >= 3 || !/context was destroyed|navigat/i.test(String(error))) throw error;
    }
  }
}

/** 横向溢出的示例（id）与整页是否横向滚动 */
const overflow = (page) =>
  page.evaluate(() => ({
    page: document.documentElement.scrollWidth > window.innerWidth + 1,
    examples: [...document.querySelectorAll('[data-demo]')]
      .filter((demo) => demo.scrollWidth > demo.clientWidth + 1)
      .map((demo) => demo.closest('section')?.querySelector('h2[id]')?.id ?? '?'),
  }));

/** 两列底边差多少以内算齐（px，约一个小示例的高度） */
const COLUMN_SLACK = 160;

/** 并排的两列示例里不齐的：各列高度与建议挪动的示例 */
const columns = (page) =>
  page.evaluate((slack) => {
    const found = [];
    for (const grid of document.querySelectorAll('[data-example-columns]')) {
      const narrow = [...grid.children].filter(
        (child) => child.getAttribute('data-example-column') === '',
      );
      // 同一行的两列（中间可能隔着占满整行的宽示例）；窄屏时上下排，不看
      for (let index = 0; index + 1 < narrow.length; index += 2) {
        const [left, right] = [narrow[index], narrow[index + 1]];
        if (Math.abs(left.getBoundingClientRect().top - right.getBoundingClientRect().top) > 1)
          continue;
        const height = (element) => element.getBoundingClientRect().height;
        const [tall, short] = height(left) >= height(right) ? [left, right] : [right, left];
        const difference = height(tall) - height(short);
        if (difference <= slack) continue;
        const items = [...tall.children];
        const last = items.at(-1);
        const gap =
          items.length > 1
            ? last.getBoundingClientRect().top - items.at(-2).getBoundingClientRect().bottom
            : 0;
        const moved = Math.abs(difference - 2 * (height(last) + gap));
        found.push({
          left: Math.round(height(left)),
          right: Math.round(height(right)),
          move: moved < difference ? (last.querySelector('h2[id]')?.id ?? '?') : null,
          from: tall === left ? '左' : '右',
          after: Math.round(moved),
        });
      }
    }
    return found;
  }, COLUMN_SLACK);

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
    if (shots && theme === themes[0]) {
      for (const file of readdirSync(dir))
        if (file.startsWith(`${name}--`)) rmSync(join(dir, file));
    }
    if (shots) {
      // 文档站的顶栏是粘性的，元素截图滚动拼接时会盖住卡片上沿；截图前让它随页面滚走
      await page.evaluate(() =>
        document.querySelector('header')?.style.setProperty('position', 'relative'),
      );
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
  // 两列只在宽屏并排（内容区至少 54rem，去掉侧栏与本页目录）：按 1920 宽量
  const wide = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  result.columns = await columns((await open(wide, path)).page);
  await wide.close();
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
    result.columns?.length && `两列不齐 ${result.columns.length} 处`,
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
    ...(r.columns ?? []).map(
      ({ left, right, move, from, after }) =>
        `- 两列不齐：左 ${left} / 右 ${right} px` +
        (move ? `；把 ${move}（${from}列最后一个）挪到另一列末尾后差 ${after} px` : ''),
    ),
    ...(r.mobile?.page ? ['- 手机：整页横向滚动'] : []),
    ...(r.mobile?.examples ?? []).map((id) => `- 手机：示例 ${id} 横向溢出`),
  ];
  if (problems.length) lines.push(`## ${r.path}`, '', ...problems, '');
}
writeFileSync(join(dir, 'report.md'), lines.join('\n'));
writeFileSync(
  reportFile,
  JSON.stringify(
    [
      ...previous.map((entry) => results.find((result) => result.path === entry.path) ?? entry),
      ...results.filter((result) => !previous.some((entry) => entry.path === result.path)),
    ],
    null,
    2,
  ),
);
console.log(`报告与截图在 ${dir}`);
