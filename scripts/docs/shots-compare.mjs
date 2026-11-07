// 比对两批示例截图（shots-batch.mjs 截的）：逐像素比，列出有差异的图与差异像素的比例，差异图存进 diff 目录
//
//   node scripts/docs/shots-compare.mjs before after
//   node scripts/docs/shots-compare.mjs before after --ignore=before2   两份基线之间本来就不同的图（动画、时钟）不算
//   node scripts/docs/shots-compare.mjs reference current --summary=<文件>   结果再写成 Markdown 表（CI 的任务摘要）
//
// 3D 分类（WebGL）的画面每次都不同，不比。只报告，总是正常退出：外观的改动多半是有意的，由提交的人看差异图确认
import {
  appendFileSync,
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

const { PNG } = requireFrom('.')('pngjs');
const [a, b] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const option = (name) =>
  process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const ignoreLabel = option('ignore');
const summaryFile = option('summary');
const dirA = join(root, `node_modules/.cache/docs-shots-${a}`);
const dirB = join(root, `node_modules/.cache/docs-shots-${b}`);
const diffDir = join(root, `node_modules/.cache/docs-shots-diff`);
rmSync(diffDir, { recursive: true, force: true });
mkdirSync(diffDir, { recursive: true });

if (!existsSync(dirA)) {
  const note = `没有可比的基线（${a}），这次的截图存为下一次的基线`;
  console.log(note);
  if (summaryFile) appendFileSync(summaryFile, `## 示例截图\n\n${note}\n`);
  process.exit(0);
}

/** 文档站的路由名：组件目录名转连字符（同 apps/docs/src/site/nav.ts 的 kebab） */
const kebab = (name) => name.replace(/(?<=[a-z0-9])([A-Z])/g, '-$1').toLowerCase();
// 3D 分类：WebGL 的画面每次不同
const webgl = globSync('apps/docs/src/components/three/*/docs.tsx', { cwd: root }).map(
  (file) => `components_${kebab(basename(dirname(file)))}-`,
);

// 每个通道差超过这个值才算不同（抗锯齿的细微差别不算）
const THRESHOLD = 24;
// 两份基线之间字节就不同的图：本来就不稳定，不比
const unstable = new Set(
  ignoreLabel
    ? readdirSync(dirA).filter((file) => {
        const other = join(root, `node_modules/.cache/docs-shots-${ignoreLabel}`, file);
        return !existsSync(other) || !readFileSync(join(dirA, file)).equals(readFileSync(other));
      })
    : [],
);
const compared = (file) =>
  file.endsWith('.png') && !unstable.has(file) && !webgl.some((prefix) => file.startsWith(prefix));

let same = 0;
const rows = [];
for (const file of readdirSync(dirA).filter(compared)) {
  if (!existsSync(join(dirB, file))) {
    rows.push([file, '去掉了']);
    continue;
  }
  const left = PNG.sync.read(readFileSync(join(dirA, file)));
  const right = PNG.sync.read(readFileSync(join(dirB, file)));
  if (left.width !== right.width || left.height !== right.height) {
    rows.push([file, `尺寸不同 ${left.width}×${left.height} → ${right.width}×${right.height}`]);
    continue;
  }
  const diff = new PNG({ width: left.width, height: left.height });
  let changed = 0;
  for (let i = 0; i < left.data.length; i += 4) {
    const different =
      Math.abs(left.data[i] - right.data[i]) > THRESHOLD ||
      Math.abs(left.data[i + 1] - right.data[i + 1]) > THRESHOLD ||
      Math.abs(left.data[i + 2] - right.data[i + 2]) > THRESHOLD;
    if (different) changed++;
    // 差异图：不同的像素标红，相同的淡化
    diff.data[i] = different ? 255 : left.data[i] * 0.3 + 178;
    diff.data[i + 1] = different ? 0 : left.data[i + 1] * 0.3 + 178;
    diff.data[i + 2] = different ? 0 : left.data[i + 2] * 0.3 + 178;
    diff.data[i + 3] = 255;
  }
  if (!changed) {
    same++;
    continue;
  }
  writeFileSync(join(diffDir, file), PNG.sync.write(diff));
  rows.push([
    file,
    `${changed} 像素（${((changed / (left.width * left.height)) * 100).toFixed(2)}%）`,
  ]);
}
for (const file of readdirSync(dirB).filter(compared)) {
  if (!existsSync(join(dirA, file))) rows.push([file, '新增']);
}

const headline = `相同 ${same} 张，有差异 ${rows.length} 张${unstable.size ? `（${unstable.size} 张本来就不稳定，没比）` : ''}`;
console.log(headline);
for (const [file, note] of rows) console.log(`  ${file}：${note}`);
if (summaryFile) {
  const table = rows.length
    ? `\n\n| 截图 | 变化 |\n| --- | --- |\n${rows.map(([file, note]) => `| ${file} | ${note} |`).join('\n')}\n\n差异图在产物 docs-shots-diff 里（变了的像素标红）。`
    : '';
  appendFileSync(summaryFile, `## 示例截图\n\n${headline}${table}\n`);
}
