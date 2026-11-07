/**
 * 体积预算（ROADMAP P7.3）：组件库每个入口（主入口与各子路径）打包、压缩成一个文件后的 gzip 大小，与 size-budgets.json
 * 比对，超了报错。打包用 Vite 自带的 rolldown；依赖的包（vue、图标、tsx 的运行时、three……）都不算，懒加载的部分也不算。
 * 先 pnpm build 出 dist。
 *
 *   node scripts/size.mjs           检查（CI 的 consumer 任务构建后跑）
 *   node scripts/size.mjs --write   按现在的大小重写预算（各留 5% 余量）：有意变大了才用
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const ui = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUDGETS = join(ui, 'size-budgets.json');
const manifest = JSON.parse(readFileSync(join(ui, 'package.json'), 'utf8'));

// rolldown 是 Vite 的依赖：经 Vite 找到它
const vite = fileURLToPath(import.meta.resolve('vite'));
const { rolldown } = await import(pathToFileURL(createRequire(vite).resolve('rolldown')).href);

/** 入口：package.json 的 exports 里指向 dist 的 JS */
const entries = Object.entries(manifest.exports).flatMap(([key, target]) =>
  typeof target === 'object' && typeof target.default === 'string' && target.default.endsWith('.js')
    ? [[key, join(ui, target.default)]]
    : [],
);

/** 一个入口打包、压缩后的 gzip 字节数（只算入口那一块，懒加载的块不算） */
async function sizeOf(file) {
  const bundle = await rolldown({
    input: file,
    // 别的包都不算：组件库自己的文件是相对路径
    external: (id) => !id.startsWith('.') && !/^([a-zA-Z]:)?[\\/]/.test(id),
    logLevel: 'silent',
  });
  const { output } = await bundle.generate({ format: 'esm', minify: true });
  await bundle.close();
  const entry = output.find((chunk) => chunk.type === 'chunk' && chunk.isEntry);
  return gzipSync(entry.code).length;
}

const sizes = {};
for (const [key, file] of entries) sizes[key] = await sizeOf(file);
const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

if (process.argv.includes('--write')) {
  const budgets = Object.fromEntries(
    Object.entries(sizes).map(([key, bytes]) => [key, Math.ceil(kb(bytes * 1.05))]),
  );
  writeFileSync(BUDGETS, `${JSON.stringify(budgets, null, 2)}\n`);
  console.log(`体积预算已按现在的大小重写（${entries.length} 个入口，各留 5% 余量）`);
  process.exit(0);
}

const budgets = JSON.parse(readFileSync(BUDGETS, 'utf8'));
const over = [];
for (const [key, bytes] of Object.entries(sizes)) {
  const budget = budgets[key];
  const line = `${key.padEnd(20)} ${String(kb(bytes)).padStart(7)} KB${budget ? ` / ${budget} KB` : '（没有预算）'}`;
  console.log(line);
  if (budget === undefined || kb(bytes) > budget) over.push(line);
}
if (over.length) {
  console.error(
    `\n这些入口超了体积预算（或没有预算）：\n  ${over.join('\n  ')}\n有意变大时用 node scripts/size.mjs --write 重写预算`,
  );
  process.exit(1);
}
console.log(`\n体积预算检查通过：${entries.length} 个入口`);
