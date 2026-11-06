// 一批文档页的示例截图，存进指定目录（对比样式改动前后用）：先开着文档站（pnpm dev:docs），
//
//   node scripts/docs/shots-batch.mjs before            截到 node_modules/.cache/docs-shots-before（常用的 21 页）
//   node scripts/docs/shots-batch.mjs before all        全部组件页
//   node scripts/docs/shots-batch.mjs after all --jobs=6   并发几页（默认 4）
//   node scripts/docs/shots-batch.mjs after button,card  只截这几页
//   --origin=http://localhost:5175                      文档站在别的地址（截图专用的工作树）
//   node scripts/docs/shots-compare.mjs before after    逐张比对
import { execFile } from 'node:child_process';
import { globSync, mkdirSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { promisify } from 'node:util';
import { root } from '../lib/repo.mjs';

const run = promisify(execFile);
const args = process.argv.slice(2);
const option = (name, fallback) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const [label, list] = args.filter((arg) => !arg.startsWith('--'));
if (!label) {
  console.error('用法：node scripts/docs/shots-batch.mjs <标签> [all|页面,…] [--jobs=4]');
  process.exit(1);
}

/** 文档站的路由名：组件目录名转连字符（同 apps/docs/src/site/nav.ts 的 kebab） */
const kebab = (name) => name.replace(/(?<=[a-z0-9])([A-Z])/g, '-$1').toLowerCase();

const COMMON = [
  'button',
  'badge',
  'icon-button',
  'text',
  'card',
  'tabs',
  'list',
  'timeline',
  'select',
  'text-field',
  'checkbox',
  'slider',
  'date-picker',
  'dialog',
  'menu',
  'alert',
  'progress',
  'data-table',
  'bar-chart',
  'avatar',
  'tags-input',
];
const pages =
  list === 'all'
    ? globSync('apps/docs/src/components/*/*/docs.tsx', { cwd: root })
        .map((file) => kebab(basename(dirname(file))))
        .sort()
    : (list?.split(',') ?? COMMON);

const target = join(root, `node_modules/.cache/docs-shots-${label}`);
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

const jobs = Number(option('jobs', 4));
const origin = option('origin', 'http://localhost:5174');
const queue = [...pages];
const failed = [];
async function worker() {
  for (let page = queue.shift(); page; page = queue.shift()) {
    try {
      await run(
        'node',
        [
          join(root, 'scripts/docs/shot.mjs'),
          `/components/${page}`,
          `--out=${target}`,
          `--origin=${origin}`,
        ],
        { maxBuffer: 1 << 24 },
      );
      console.log(`✓ ${page}`);
    } catch (error) {
      failed.push(page);
      console.log(`✗ ${page}：${String(error.stderr ?? error.message).split('\n')[0]}`);
    }
  }
}
await Promise.all(Array.from({ length: jobs }, worker));
console.log(
  `${pages.length - failed.length} / ${pages.length} 页${failed.length ? `，失败：${failed.join(',')}` : ''}`,
);
