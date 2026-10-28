/**
 * 端到端测试（ROADMAP 13.8）：对构建产物（node .output/server/index.mjs）跑一遍，
 * 再以 RENDER_MODE=csr（整站改成浏览器渲染）跑一遍，两种模式下页面、数据、站内换页都要对。
 *
 *   pnpm build && node test/e2e.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = 5185;
const base = `http://localhost:${port}`;

/** 起产物的服务器，等健康检查通过 */
async function startServer(env) {
  const server = spawn(process.execPath, [join(app, '.output/server/index.mjs')], {
    env: { ...process.env, PORT: String(port), ...env },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) return server;
    } catch {
      // 还没起来
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  server.kill();
  throw new Error('服务器 10 秒内没有起来');
}

/** 打开一页，收集水合警告与页面报错 */
async function open(browser, path) {
  const page = await browser.newPage();
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || /hydrat/i.test(message.text())) problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  await page.goto(base + path, { waitUntil: 'networkidle' });
  return { page, problems };
}

async function run(mode) {
  const server = await startServer(mode === 'csr' ? { RENDER_MODE: 'csr' } : {});
  const browser = await chromium.launch();
  try {
    // 服务端发出的 HTML：ssr 模式下首页带着正文与数据，csr 模式下是空壳
    const html = await (await fetch(base)).text();
    if (mode === 'ssr') {
      assert.match(html, /访问量 9007199254740993/, '首页在服务端渲染了 loader 的数据');
    } else {
      assert.match(html, /<div id="app"><\/div>/, 'csr 模式只发空壳');
    }
    assert.match(await (await fetch(`${base}/report`)).text(), /<div id="app"><\/div>/);

    // 首页：数据（bigint 原样）、可交互、没有水合警告
    const home = await open(browser, '/');
    await home.page.getByText('访问量 9007199254740993（bigint）').waitFor();
    await home.page.getByRole('button', { name: '点了 0 次' }).click();
    await home.page.getByRole('button', { name: '点了 1 次' }).waitFor();
    assert.deepEqual(home.problems, [], `${mode} 首页没有报错与水合警告`);

    // 站内换页不整页刷新；回到首页经 /_data 取数据
    await home.page.evaluate(() => (window.marker = 1));
    await home.page.getByRole('link', { name: '报表' }).click();
    await home.page.getByText(/窗口宽 \d+ 像素/).waitFor();
    const data = home.page.waitForResponse((response) => response.url().includes('/_data'));
    await home.page.getByRole('link', { name: '首页' }).click();
    await data;
    await home.page.getByText('访问量 9007199254740993（bigint）').waitFor();
    assert.equal(await home.page.evaluate(() => window.marker), 1, '站内换页没有整页刷新');
    assert.equal(await home.page.title(), '首页 · fullstack-demo');

    // 直接打开 csr 页、预渲染页
    const report = await open(browser, '/report');
    await report.page.getByText(/窗口宽 \d+ 像素/).waitFor();
    assert.deepEqual(report.problems, []);
    const about = await open(browser, '/about');
    await about.page.getByRole('heading', { name: '关于' }).waitFor();
    assert.deepEqual(about.problems, []);

    // 服务端渲染出错：发空壳，浏览器照样渲染
    assert.match(await (await fetch(`${base}/fallback`)).text(), /<div id="app"><\/div>/);
    const fallback = await open(browser, '/fallback');
    await fallback.page.getByRole('heading', { name: '出错退回' }).waitFor();
    assert.deepEqual(fallback.problems, []);
    console.log(`${mode}：通过`);
  } finally {
    await browser.close();
    server.kill();
  }
}

assert.ok(
  existsSync(join(app, '.output/public/about/index.html')),
  'mode: static 的页面在构建时预渲染了',
);
await run('ssr');
await run('csr');
