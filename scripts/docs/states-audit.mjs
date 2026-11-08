// 交互状态审计：逐页逐个示例，把可交互元素的默认、悬停、键盘焦点三张裁图两两比对，一模一样的报出来——
// 悬停没有反馈、键盘焦点看不见。逐个组件精修时先跑它找漏的状态，再对报出的元素用 docs:states 看图。
// 先开着文档站的开发服务器（pnpm dev:docs，端口 5174）。报告在 node_modules/.cache/docs-states/audit-<主题>[-compact].md。
//
//   pnpm docs:states-audit overlay,navigation        按分类（apps/docs/src/components 下的目录名）
//   pnpm docs:states-audit select,tabs --themes=dark  或页名
//   pnpm docs:states-audit input --compact            紧凑密度（主题设置缩放到 0.9）
//   --jobs=4                                          并发几页
//
// 不可用的元素不查悬停；焦点落不上的（选项经 aria-activedescendant 指出、焦点留在容器上）不查焦点
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';
import { captureStates, hideSiteHeader, INTERACTIVE } from './lib/states.mjs';

const { chromium } = requireFrom('apps/host-demo')('playwright');
const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const wanted = args.find((arg) => !arg.startsWith('--'))?.split(',');
if (!wanted) {
  console.error(
    '用法：pnpm docs:states-audit <分类或页名,…> [--themes=light,dark] [--compact] [--jobs=4]',
  );
  process.exit(1);
}
const themes = option('themes', 'light').split(',');
const origin = option('origin', 'http://localhost:5174');
const jobs = Number(option('jobs', '4'));
const compact = args.includes('--compact');
// 一个示例最多查几个元素：同一类的选项、按钮再多也是一样的样式
const LIMIT = 8;

// 分类目录下的组件目录名（DatePicker）换成页名（date-picker）
const components = join(root, 'apps/docs/src/components');
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const categories = Object.fromEntries(
  readdirSync(components, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [
      entry.name,
      readdirSync(join(components, entry.name), { withFileTypes: true })
        .filter((child) => child.isDirectory())
        .map((child) => kebab(child.name)),
    ]),
);
const names = new Set(wanted.flatMap((item) => categories[item] ?? [item]));

const browser = await chromium.launch();

/** 侧栏里的组件页地址（合并过的页面以侧栏为准），留下要查的 */
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
  return paths.filter((path) => names.has(path.replace('/components/', '')));
}

/** 查一页：每个示例里的可交互元素，三张裁图一样的记下来 */
async function auditPage(theme, path) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'zh-CN',
    reducedMotion: 'reduce',
  });
  await context.addInitScript((value) => localStorage.setItem('vue-tsx-pro-theme', value), theme);
  if (compact)
    await context.addInitScript(() =>
      localStorage.setItem('vue-tsx-pro-theme-settings', JSON.stringify({ scaling: 0.9 })),
    );
  const page = await context.newPage();
  const found = [];
  try {
    await page.goto(`${origin}${path}`);
    await page.waitForFunction(() => document.querySelector('main h1'), null, {
      timeout: 120_000,
    });
    await hideSiteHeader(page);
    const ids = await page.evaluate(() =>
      [...document.querySelectorAll('main h2[id]')].map((heading) => heading.id),
    );
    for (const id of ids) {
      // 示例卡片推迟渲染：滚到小节那里再等示例出来；键盘、API 这类小节没有示例，跳过
      const section = page.locator(`[id="${id}"]`).locator('xpath=..');
      await page.locator(`[id="${id}"]`).scrollIntoViewIfNeeded();
      const demo = section.locator('[data-demo]');
      await demo
        .first()
        .waitFor({ timeout: 2000 })
        .catch(() => undefined);
      if ((await demo.count()) === 0) continue;
      await page.waitForTimeout(200);
      const targets = demo.locator(INTERACTIVE);
      const count = Math.min(await targets.count(), LIMIT);
      for (let index = 0; index < count; index++) {
        const target = targets.nth(index);
        if (!(await target.isVisible())) continue;
        const { label, disabled, focusable, cells } = await captureStates(page, target, {
          active: false,
          settle: 80,
        });
        if (!cells.default) continue;
        const missing = [];
        if (!disabled && cells.hover === cells.default) missing.push('悬停');
        if (focusable && cells.focus === cells.default) missing.push('焦点');
        if (missing.length) found.push({ path, id, label, missing });
      }
    }
  } catch (error) {
    found.push({ path, id: '-', label: `出错：${String(error).split('\n')[0]}`, missing: [] });
  }
  await context.close();
  return found;
}

const out = join(root, 'node_modules/.cache/docs-states');
mkdirSync(out, { recursive: true });
const paths = await pagePaths();
for (const theme of themes) {
  const results = [];
  const queue = [...paths];
  await Promise.all(
    Array.from({ length: jobs }, async () => {
      for (let path = queue.shift(); path; path = queue.shift()) {
        const found = await auditPage(theme, path);
        results.push(...found);
        console.log(`${path}（${theme}）：${found.length ? `${found.length} 处` : '齐全'}`);
      }
    }),
  );
  results.sort((a, b) => a.path.localeCompare(b.path) || a.id.localeCompare(b.id));
  const name = `audit-${theme}${compact ? '-compact' : ''}.md`;
  const lines = [
    `# 交互状态审计（${theme}${compact ? '，紧凑' : ''}）`,
    '',
    `${paths.length} 页，${results.length} 处缺状态`,
    '',
    '| 页面 | 示例 | 元素 | 没有变化的状态 |',
    '| --- | --- | --- | --- |',
    ...results.map(
      ({ path, id, label, missing }) =>
        `| ${path.replace('/components/', '')} | ${id} | ${label.replaceAll('|', '\\|')} | ${missing.join('、')} |`,
    ),
  ];
  writeFileSync(join(out, name), `${lines.join('\n')}\n`);
  console.log(`报告在 ${join(out, name)}`);
}
await browser.close();
