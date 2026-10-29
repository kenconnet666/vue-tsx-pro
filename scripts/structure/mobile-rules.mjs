/**
 * 移动端组件库的写法检查（MOBILE.md §4、§6）：小程序把样式展开成行内样式、按标签选模板，
 * 所以组件里只能用运行时判定得了的条件、渲染得了的元素。
 *
 *   - 元素：div、span、button、img、input、textarea、svg（JSX 里的小写标签）
 *   - 样式条件：不能用 :hover、:focus 系列、伪元素、:nth-child 一类结构伪类，以及 _hover、_focus 系列、_placeholder 别名
 *
 * 用法：node scripts/structure/mobile-rules.mjs（pnpm layers:check 里一起跑）
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { root } from '../lib/repo.mjs';

const SOURCE = join(root, 'packages/mobile/src');

/** 小程序运行时有模板的元素 */
const ELEMENTS = new Set(['div', 'span', 'button', 'img', 'input', 'textarea', 'svg']);

/** 不能用的条件：写在样式对象的键里（含 :not、:is 里面的） */
const FORBIDDEN_CONDITIONS = [
  { pattern: /:hover\b/, reason: '触屏没有悬停，按压用 :active' },
  { pattern: /:focus(?:-visible|-within)?\b/, reason: '小程序里不成立' },
  { pattern: /::[a-z-]+/, reason: '伪元素进不了行内样式' },
  {
    pattern: /:(?:nth-[a-z-]+|empty|has)\(?/,
    reason: '运行时只认 :first-child、:last-child、:only-child',
  },
  {
    pattern: /\b_(?:hover|focus|focusVisible|focusWithin|placeholder)\b/,
    reason: '小程序里展开不了',
  },
];

function sources(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '.test' ? [] : sources(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [path] : [];
  });
}

const problems = [];
for (const file of sources(SOURCE)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    const at = `${relative(root, file)}:${index + 1}`;
    // JSX 的小写标签：`<div`、`<span>`。泛型（Record<keyof …>、Promise<void>）的 < 紧跟在标识符后面，不算
    for (const match of line.matchAll(/(?<![\w)\].])<([a-z][a-z0-9]*)(?=[\s>/])/g)) {
      if (!ELEMENTS.has(match[1]))
        problems.push(`${at} 用了 <${match[1]}>：小程序运行时没有它的模板`);
    }
    // 样式对象里的条件键：引号里以 : 或 @ 开头，或条件别名
    for (const match of line.matchAll(/'([:@][^']*)'\s*:|\b(_[a-zA-Z]+)\s*:/g)) {
      const key = match[1] ?? match[2];
      for (const { pattern, reason } of FORBIDDEN_CONDITIONS)
        if (pattern.test(key)) problems.push(`${at} 的样式条件 ${key}：${reason}`);
    }
  });
}

if (problems.length) {
  console.error(
    `移动端写法检查没通过（${problems.length} 处，见 packages/mobile/MOBILE.md §4、§6）：`,
  );
  for (const problem of problems) console.error(`  ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`移动端写法检查通过：${sources(SOURCE).length} 个文件`);
}
