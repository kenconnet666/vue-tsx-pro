/**
 * 预渲染页面的水合检查（ROADMAP 12.1、12.4）：逐页打开文档站构建出来的 dist（预渲染过的 .html），
 * 收集 Vue 的水合不一致警告与报错，列出有问题的页面。
 *
 * 要看到具体哪里不一致，构建时带上 VTP_HYDRATION_DETAILS=1（打开 __VUE_PROD_HYDRATION_MISMATCH_DETAILS__）：
 *   VTP_HYDRATION_DETAILS=1 pnpm build:docs && node scripts/docs/hydration.mjs
 * 不带时只能知道"这页有不一致"。脚本自己起一个预览服务器（端口 4175），跑完关掉。
 */
import { spawn } from 'node:child_process';
import { globSync } from 'node:fs';
import { join, relative } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

const { chromium } = requireFrom('apps/host-demo')('playwright');
const dist = join(root, 'apps/docs/dist');
const port = 4175;

const pages = globSync('**/*.html', { cwd: dist })
  .filter((file) => file !== 'spa.html')
  .map((file) =>
    file === 'index.html' ? '/' : `/${file.replaceAll('\\', '/').replace(/\.html$/, '')}`,
  )
  .sort();

const server = spawn(
  process.execPath,
  [
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

const browser = await chromium.launch();
const problems = [];
try {
  for (const path of pages) {
    const page = await browser.newPage();
    const messages = [];
    page.on('console', (message) => {
      const text = message.text();
      if (/hydrat/i.test(text)) messages.push(text.split('\n').slice(0, 3).join(' '));
    });
    page.on('pageerror', (error) => messages.push(`页面报错：${error.message}`));
    await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'networkidle' });
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
