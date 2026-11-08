// 一批文档页的示例截图，存进指定目录（对比样式改动前后用）：先开着文档站（pnpm -C apps/docs dev），
//
//   node scripts/docs/shots-batch.mjs before            截到 node_modules/.cache/docs-shots-before（常用的 21 页）
//   node scripts/docs/shots-batch.mjs before all        全部组件页
//   node scripts/docs/shots-batch.mjs after all --jobs=6   并发几页（默认 4）
//   node scripts/docs/shots-batch.mjs after button,card  只截这几页
//   --origin=http://localhost:5175                      文档站在别的地址（截图专用的工作树）
//   --variants=rtl,forced,mobile   基础、输入、浮层、表格这几类页面再截这些变体（亮色主题；见 shot.mjs 的 --variant）
// 浮层分类的页面每个示例再截一张打开后的（shot.mjs 的 --open）
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
// 组件页：路由名 → 分类
const categories = new Map(
  globSync('apps/docs/src/components/*/*/docs.tsx', { cwd: root }).map((file) => [
    kebab(basename(dirname(file))),
    basename(dirname(dirname(file))),
  ]),
);
const pages =
  list === 'all'
    ? [...categories.keys()].sort((a, b) => a.localeCompare(b))
    : (list?.split(',') ?? COMMON);
// 变体只截这几类：控件最多、最容易在从右到左、高对比、窄屏下出问题
const VARIANT_CATEGORIES = new Set(['base', 'input', 'overlay', 'table']);
const variants = option('variants', '').split(',').filter(Boolean);
/** 要截的：页面与变体（空是默认的亮、暗两套） */
const tasks = [
  ...pages.map((page) => [page, '']),
  ...variants.flatMap((variant) =>
    pages
      .filter((page) => VARIANT_CATEGORIES.has(categories.get(page)))
      .map((page) => [page, variant]),
  ),
];

const target = join(root, `node_modules/.cache/docs-shots-${label}`);
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

const jobs = Number(option('jobs', 4));
/** 一页最多截多久：偶尔有一页卡住（浏览器不退出），不让它拖住整批（CI 那一步 40 分钟超时）；超时的再试一次 */
const PAGE_TIMEOUT = 3 * 60_000;
const origin = option('origin', 'http://localhost:5174');
const queue = [...tasks];
const failed = [];
async function worker() {
  for (let task = queue.shift(); task; task = queue.shift()) {
    const [page, variant] = task;
    const name = variant ? `${page}（${variant}）` : page;
    const started = performance.now();
    // 每一项的耗时：CI 里看慢在哪一页
    const took = () => `${((performance.now() - started) / 1000).toFixed(1)}s`;
    const shoot = () =>
      run(
        'node',
        [
          join(root, 'scripts/docs/shot.mjs'),
          `/components/${page}`,
          `--out=${target}`,
          `--origin=${origin}`,
          ...(variant ? [`--variant=${variant}`, '--themes=light'] : []),
          ...(categories.get(page) === 'overlay' ? ['--open'] : []),
        ],
        { maxBuffer: 1 << 24, timeout: PAGE_TIMEOUT, killSignal: 'SIGKILL' },
      );
    try {
      try {
        await shoot();
      } catch (error) {
        if (!error.killed) throw error;
        console.log(`… ${name} 超过 ${PAGE_TIMEOUT / 60_000} 分钟，重试`);
        await shoot();
      }
      console.log(`✓ ${name} ${took()}`);
    } catch (error) {
      failed.push(name);
      const reason = error.killed ? '超时' : String(error.stderr ?? error.message).split('\n')[0];
      console.log(`✗ ${name} ${took()}：${reason}`);
    }
  }
}
await Promise.all(Array.from({ length: jobs }, worker));
console.log(
  `${tasks.length - failed.length} / ${tasks.length} 次${failed.length ? `，失败：${failed.join(',')}` : ''}`,
);
