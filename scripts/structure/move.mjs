/**
 * 把组件搬进自己的文件夹：base/Button.tsx → base/Button/Button.tsx，它的测试 base/.test/Button.*.tsx → base/Button/test/，
 * 并改写 packages/ui 里所有受影响的相对导入（import、export from、import()、vi.mock，保留 ?raw 这类后缀）。
 * 用 git mv 移动，历史跟得上。
 *
 * 用法：node scripts/structure/move.mjs base/Button.tsx base/Icon.tsx …（路径相对 packages/ui/src）
 * 之后运行 pnpm exports 重新生成入口，再跑类型检查与测试。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const pkg = join(root, 'packages/ui');
const src = join(pkg, 'src');

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('用法：node scripts/structure/move.mjs base/Button.tsx …');
  process.exit(1);
}

/** 旧绝对路径 → 新绝对路径 */
const moves = new Map();
for (const target of targets) {
  const from = join(src, target);
  if (!existsSync(from)) throw new Error(`没有这个文件：${target}`);
  const name = basename(target).replace(/\.tsx?$/, '');
  const folder = join(dirname(from), name);
  moves.set(from, join(folder, basename(from)));
  // 同名的测试：Button.test.tsx、Button.test-d.tsx、Button.browser.test.tsx
  const tests = join(dirname(from), '.test');
  if (!existsSync(tests)) continue;
  for (const file of readdirSync(tests)) {
    if (file.startsWith(`${name}.`)) moves.set(join(tests, file), join(folder, 'test', file));
  }
}

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sources(path);
    return /\.(tsx?|mts)$/.test(entry.name) ? [path] : [];
  });
}

/** 相对导入指向的文件（补全扩展名）；不是文件时返回 undefined */
function resolveImport(importer, specifier) {
  const base = resolve(dirname(importer), specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

/** 从 from 文件指向 to 文件的导入路径：去掉 .ts / .tsx，保留原来是否写了扩展名 */
function specifierFor(from, to, keepExtension) {
  let path = relative(dirname(from), to).split('\\').join('/');
  if (!keepExtension) path = path.replace(/\.tsx?$/, '');
  return path.startsWith('.') ? path : `./${path}`;
}

const IMPORT = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\bvi\.mock\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;

const rewrites = new Map();
for (const file of sources(src)) {
  const text = readFileSync(file, 'utf8');
  const newFile = moves.get(file) ?? file;
  const next = text.replace(IMPORT, (whole, prefix, quote, specifier) => {
    const [path, query = ''] = specifier.split(/(?=\?)/);
    const target = resolveImport(file, path);
    if (!target) return whole;
    const newTarget = moves.get(target) ?? target;
    if (newTarget === target && newFile === file) return whole;
    const keepExtension = /\.tsx?$/.test(path);
    return `${prefix}${quote}${specifierFor(newFile, newTarget, keepExtension)}${query}${quote}`;
  });
  if (next !== text) rewrites.set(file, next);
}

for (const [from, to] of moves) {
  mkdirSync(dirname(to), { recursive: true });
  execFileSync('git', ['mv', from, to], { cwd: root });
}
for (const [file, text] of rewrites) writeFileSync(moves.get(file) ?? file, text);

console.log(
  `移动 ${moves.size} 个文件，改写 ${rewrites.size} 个文件的导入：\n` +
    [...moves].map(([from, to]) => `  ${relative(src, from)} → ${relative(src, to)}`).join('\n'),
);
