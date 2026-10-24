// 一批文档页的示例截图，存进指定目录（对比样式改动前后用）：先开着文档站（pnpm dev:docs），
//
//   node scripts/docs/shots-batch.mjs before            截到 node_modules/.cache/docs-shots-before
//   node scripts/docs/shots-batch.mjs after             改完再截一份
//   node scripts/docs/shots-compare.mjs before after    逐张比对
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../lib/repo.mjs';

const label = process.argv[2];
if (!label) {
  console.error('用法：node scripts/docs/shots-batch.mjs <标签> [页面,…]');
  process.exit(1);
}
const pages = (
  process.argv[3] ??
  [
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
  ].join(',')
).split(',');

const shots = join(root, 'node_modules/.cache/docs-shots');
const target = join(root, `node_modules/.cache/docs-shots-${label}`);
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const page of pages) {
  rmSync(shots, { recursive: true, force: true });
  try {
    execFileSync('node', [join(root, 'scripts/docs/shot.mjs'), `/components/${page}`], {
      stdio: 'pipe',
    });
    cpSync(shots, target, { recursive: true });
    console.log(`✓ ${page}`);
  } catch (error) {
    console.log(`✗ ${page}：${String(error.stderr ?? error.message).split('\n')[0]}`);
  }
}
