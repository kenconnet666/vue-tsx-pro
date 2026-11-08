/**
 * 预渲染页面的水合检查（ROADMAP 12.1、12.4）：逐页打开文档站构建出来的 dist（预渲染过的 .html），
 * 收集 Vue 的水合不一致警告与报错，列出有问题的页面。顺带查系统滚动条：组件库的滚动区域都是浮层滚动条（ScrollArea），
 * 页面上出现系统滚动条就是漏了（多行输入框除外，它没法换）。
 *
 * 要看到具体哪里不一致，构建时带上 VTP_HYDRATION_DETAILS=1（打开 __VUE_PROD_HYDRATION_MISMATCH_DETAILS__）：
 *   VTP_HYDRATION_DETAILS=1 pnpm -C apps/docs build && node scripts/docs/hydration.mjs
 * 不带时只能知道"这页有不一致"。脚本自己起一个预览服务器（端口 4175），跑完关掉。
 * 只查几页时把地址写在后面：node scripts/docs/hydration.mjs /components/popover /guide/data
 */
import { spawn } from 'node:child_process';
import { globSync } from 'node:fs';
import { join, relative } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

const { chromium } = requireFrom('apps/host-demo')('playwright');
const dist = join(root, 'apps/docs/dist');
const port = 4175;

const only = process.argv.slice(2);
const pages = globSync('**/*.html', { cwd: dist })
  .filter((file) => file !== 'spa.html')
  .map((file) =>
    file === 'index.html' ? '/' : `/${file.replaceAll('\\', '/').replace(/\.html$/, '')}`,
  )
  .filter((path) => only.length === 0 || only.includes(path))
  .sort();

const server = spawn(
  process.execPath,
  [
    // 与 pnpm 跑脚本时一样（pnpm-workspace.yaml 的 nodeOptions）：配置按源码解析各包，不要求先构建出 dist
    '--conditions=@vue-tsx-pro/source',
    join(root, 'apps/docs/node_modules/vite/bin/vite.js'),
    'preview',
    '--configLoader',
    'native',
    '--port',
    String(port),
    '--strictPort',
  ],
  { cwd: join(root, 'apps/docs'), stdio: ['ignore', 'pipe', 'inherit'] },
);
await new Promise((resolve, reject) => {
  server.stdout.on('data', (chunk) => {
    if (String(chunk).includes(String(port))) resolve();
  });
  server.on('exit', (code) => reject(new Error(`预览服务器退出了（${code}）`)));
});

/**
 * 跟踪页面（连同 iframe）进行中的请求，quiet() 等到 500ms 内没有请求。不用 goto 的 networkidle：
 * iframe 触发过 networkidle 之后又发请求（字体分片按页面上出现的字陆续下载）时，Playwright 不再给它重新计时，
 * 整页的 networkidle 就永远等不到
 */
function trackRequests(page) {
  let inflight = 0;
  let changed = () => {};
  const update = (delta) => {
    inflight += delta;
    changed();
  };
  page.on('request', () => update(1));
  page.on('requestfinished', () => update(-1));
  page.on('requestfailed', () => update(-1));
  return {
    quiet: (timeout = 30_000) =>
      new Promise((resolve, reject) => {
        let timer;
        const deadline = setTimeout(
          () => reject(new Error(`${timeout / 1000} 秒内网络没有静下来`)),
          timeout,
        );
        changed = () => {
          clearTimeout(timer);
          if (inflight > 0) return;
          timer = setTimeout(() => {
            clearTimeout(deadline);
            resolve();
          }, 500);
        };
        changed();
      }),
  };
}

/** 警告的文字：参数里的 DOM 节点换成它的开头一段 HTML（默认只打出 JSHandle@node） */
async function describe(message) {
  const parts = await Promise.all(
    message.args().map((arg) =>
      arg
        .evaluate((value) => {
          if (!(value instanceof Node)) return typeof value === 'symbol' ? String(value) : value;
          if (value instanceof Element) return value.outerHTML.slice(0, 160);
          return `${value.nodeName} ${JSON.stringify((value.textContent ?? '').slice(0, 60))}`;
        })
        .catch(() => String(arg)),
    ),
  );
  return parts
    .map((part) => (typeof part === 'string' ? part : JSON.stringify(part)))
    .join(' ')
    .split('\n')
    .slice(0, Number(process.env.VTP_HYDRATION_LINES ?? 4))
    .join(' ');
}

/** 页面上显示系统滚动条的元素：先滚到底，懒加载的示例才渲染出来 */
async function nativeScrollbars(page) {
  return page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const describe = (element) => {
      const part = element.getAttribute('data-part');
      const text = (element.textContent ?? '').trim().slice(0, 24);
      return `${element.tagName.toLowerCase()}${part ? `[${part}]` : ''} “${text}”`;
    };
    return [...document.querySelectorAll('body *')]
      .filter((element) => {
        if (element.tagName === 'TEXTAREA') return false;
        const style = getComputedStyle(element);
        if (style.scrollbarWidth === 'none') return false;
        const scrollsY =
          /auto|scroll/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
        const scrollsX =
          /auto|scroll/.test(style.overflowX) && element.scrollWidth > element.clientWidth + 1;
        return scrollsX || scrollsY;
      })
      .map((element) => `系统滚动条：${describe(element)}`);
  });
}

/** 手机宽度：页面不能横向滚动（调用后视口留在手机宽度） */
async function phoneOverflow(page) {
  await page.setViewportSize({ width: 375, height: 812 });
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  return width > 375 ? [`手机宽度下页面宽 ${width}px`] : [];
}

/** 手机宽度：水合后的页面点菜单按钮，抽屉里要有导航链接 */
async function phoneDrawerLinks(page) {
  await page.locator('button[aria-label="打开导航"]').click();
  await page.locator('dialog[open]').waitFor();
  return page.locator('dialog[open] a[href]').count();
}

const browser = await chromium.launch();
const problems = [];
try {
  for (const path of pages) {
    const page = await browser.newPage();
    const requests = trackRequests(page);
    const pending = [];
    page.on('console', (message) => {
      if (/hydrat/i.test(message.text())) pending.push(describe(message));
    });
    const messages = [];
    page.on('pageerror', (error) => messages.push(`页面报错：${error.message}`));
    await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'load' });
    await requests.quiet().catch((error) => messages.push(error.message));
    messages.push(
      ...(await Promise.all(pending)),
      ...(await nativeScrollbars(page)),
      ...(await phoneOverflow(page)),
    );
    if (path === pages[0] && !(await phoneDrawerLinks(page)))
      messages.push('手机宽度下抽屉里没有导航链接');
    if (messages.length) problems.push({ path, messages });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}

for (const { path, messages } of problems) {
  console.log(`\n${path}`);
  for (const text of [...new Set(messages)].slice(0, 6)) console.log(`  ${text}`);
}
console.log(
  `\n${pages.length} 页，${problems.length} 页有水合问题（${relative(root, dist).replaceAll('\\', '/')}）`,
);
if (problems.length) process.exitCode = 1;
