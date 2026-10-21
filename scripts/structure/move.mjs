/**
 * 移动 packages/ui/src 里的文件，并改写所有受影响的相对导入（import、export from、import()、vi.mock，保留 ?raw 这类后缀）。
 * 用 git mv 移动，历史跟得上；移走后空下来的目录一并删掉。
 *
 * 用法：pnpm move <旧路径>=<新路径> …（路径相对 packages/ui/src）
 *   pnpm move display/Card.tsx=layout/Card.tsx display/.test/Card.test.tsx=layout/.test/Card.test.tsx
 * 之后运行 pnpm exports 重新生成入口，再跑类型检查与测试。
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { root } from '../lib/repo.mjs';

const src = join(root, 'packages/ui/src');

const pairs = process.argv.slice(2).map((arg) => arg.split('='));
if (!pairs.length || pairs.some((pair) => pair.length !== 2)) {
  console.error('用法：pnpm move <旧路径>=<新路径> …');
  process.exit(1);
}

/** 旧绝对路径 → 新绝对路径 */
const moves = new Map();
for (const [from, to] of pairs) {
  if (!existsSync(join(src, from))) throw new Error(`没有这个文件：${from}`);
  if (existsSync(join(src, to))) throw new Error(`目标已存在：${to}`);
  moves.set(join(src, from), join(src, to));
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

// 移走后空下来的目录：逐级往上删，直到 src
for (const from of moves.keys()) {
  for (let dir = dirname(from); dir !== src && existsSync(dir); dir = dirname(dir)) {
    if (readdirSync(dir).length) break;
    rmdirSync(dir);
  }
}

console.log(
  `移动 ${moves.size} 个文件，改写 ${rewrites.size} 个文件的导入：\n` +
    [...moves].map(([from, to]) => `  ${relative(src, from)} → ${relative(src, to)}`).join('\n'),
);
