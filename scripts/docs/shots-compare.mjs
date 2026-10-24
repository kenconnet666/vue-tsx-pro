// 比对两批示例截图（shots-batch.mjs 截的）：逐像素比，列出有差异的图与差异像素的比例，差异图存进 diff 目录
//
//   node scripts/docs/shots-compare.mjs before after
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { requireFrom, root } from '../lib/repo.mjs';

const { PNG } = requireFrom('.')('pngjs');
const [a, b] = process.argv.slice(2);
const dirA = join(root, `node_modules/.cache/docs-shots-${a}`);
const dirB = join(root, `node_modules/.cache/docs-shots-${b}`);
const diffDir = join(root, `node_modules/.cache/docs-shots-diff`);
rmSync(diffDir, { recursive: true, force: true });
mkdirSync(diffDir, { recursive: true });

// 每个通道差超过这个值才算不同（抗锯齿的细微差别不算）
const THRESHOLD = 24;
let same = 0;
const rows = [];
for (const file of readdirSync(dirA).filter((name) => name.endsWith('.png'))) {
  if (!existsSync(join(dirB, file))) {
    rows.push([file, '缺少']);
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
console.log(`相同 ${same} 张，有差异 ${rows.length} 张`);
for (const [file, note] of rows) console.log(`  ${file}：${note}`);
