/**
 * P12（层层合并、层层转发、复用基础组件）的候选清单：只报告，不失败。结果写到 .claude/reports/p12-candidates.md，逐个组件过。
 *   - 手写的基础节点：base 目录以外的 <button>、<a href>、<time>、内联 <svg>、直接调 format.relative
 *   - 没转发部件属性的子组件：组件里渲染了 Avatar、Badge、Button、Icon… 却没经 mergePartProps 合并使用方的 propsXxx
 *   - 没有部件标记的内部节点：直接 {...css.attrs(…)} 而同一元素上没有 xxxPart(…)
 *
 * 用法：node scripts/structure/p12-candidates.mjs
 */
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../lib/repo.mjs';

const files = globSync('packages/ui/src/**/*.tsx', { cwd: root })
  .map((file) => file.replaceAll('\\', '/'))
  .filter((file) => !/\/\.test\/|\/docs-kit\/|\/three\/|\/testing\//.test(file));

// 基础组件：子组件用到它们时应当转发部件属性（使用方能改到这一层）
const BASE = [
  'Avatar',
  'Badge',
  'Button',
  'ButtonBase',
  'IconButton',
  'Icon',
  'Spinner',
  'Empty',
  'Link',
  'Kbd',
  'Tag',
  'Checkbox',
  'Switch',
  'Progress',
  'Skeleton',
  'RelativeTime',
  'DateTime',
];

/** 从 < 开始找到这个开标签的结尾（跳过 {} 里的表达式） */
function openingTag(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return text.slice(start, i + 1);
  }
  return text.slice(start);
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;
/** 这个位置在注释里（文档注释里的示例、行尾注释） */
const inComment = (text, index) => {
  const line = text.slice(text.lastIndexOf('\n', index) + 1, index);
  return /^\s*(\*|\/\/)/.test(line) || line.includes('//');
};

const handWritten = [];
const unforwarded = [];
const unmarked = new Map();
for (const file of files) {
  const text = readFileSync(join(root, file), 'utf8');
  const inBase = file.includes('/base/');
  if (!inBase) {
    for (const [pattern, what] of [
      [/<button[\s>]/g, '<button>'],
      [/<a\s[^>]*href/g, '<a href>'],
      [/<time[\s>]/g, '<time>'],
      [/<svg[\s>]/g, '<svg>'],
      [/format\.relative\(/g, 'format.relative'],
    ])
      for (const match of text.matchAll(pattern))
        if (!inComment(text, match.index))
          handWritten.push(`${file}:${lineOf(text, match.index)} ${what}`);
  }
  for (const name of BASE) {
    // 多态组件里的局部变量 Tag（as 决定的标签）不是 Tag 组件
    if (name === 'Tag' && !/import \{[^}]*\bTag\b[^}]*\} from/.test(text)) continue;
    for (const match of text.matchAll(new RegExp(`<${name}[\\s/>]`, 'g'))) {
      if (inComment(text, match.index)) continue;
      const tag = openingTag(text, match.index);
      // 经 mergePartProps 合并、展开现成的 props，或展开一个合并好的辅助函数（button({…})）都算转发了
      if (/mergePartProps|\{\.\.\.(props|rest|own|part|trigger)\b|\{\.\.\.\w+\(/.test(tag))
        continue;
      unforwarded.push(`${file}:${lineOf(text, match.index)} <${name}>`);
    }
  }
  for (const match of text.matchAll(/\{\.\.\.css\.attrs\(/g)) {
    const tag = openingTag(text, text.lastIndexOf('<', match.index));
    if (/Part\(/.test(tag)) continue;
    unmarked.set(file, (unmarked.get(file) ?? 0) + 1);
  }
}

const section = (title, rows) =>
  `## ${title}（${rows.length}）\n\n${rows.length ? rows.map((row) => `- ${row}`).join('\n') : '（无）'}\n`;
const report = [
  '# P12 候选（scripts/structure/p12-candidates.mjs 生成）\n',
  '逐条看：能换成基础组件的换；子组件该转发部件属性的加 `propsXxx`（mergePartProps 合并）；内部节点补标记或改成配方。',
  '有理由保留的（几百个格子为性能直接写、语义不同）在旁边注明，不必改。\n',
  section('手写的基础节点', handWritten),
  section('没转发部件属性的子组件', unforwarded),
  section(
    '没有部件标记的内部节点（按文件计数）',
    [...unmarked].sort((a, b) => b[1] - a[1]).map(([file, count]) => `${file}：${count}`),
  ),
].join('\n');
writeFileSync(join(root, '.claude/reports/p12-candidates.md'), report);
console.log(
  `P12 候选：手写节点 ${handWritten.length}，没转发 ${unforwarded.length}，没标记的文件 ${unmarked.size}`,
);
