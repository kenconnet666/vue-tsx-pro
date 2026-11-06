// 文档页两列示例的平衡：照着 docs:review 的报告（node_modules/.cache/docs-review/report.json 里的 columns），
// 把建议挪的 <Example> 从长的那列移到短的那列末尾，直接改各页的 docs.tsx。改完再跑一遍 docs:review 看齐了没有。
//
//   node scripts/docs/balance-columns.mjs            只列出要挪什么
//   node scripts/docs/balance-columns.mjs --apply    改文件
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { root } from '../lib/repo.mjs';

const apply = process.argv.includes('--apply');
const report = JSON.parse(
  readFileSync(join(root, 'node_modules/.cache/docs-review/report.json'), 'utf8'),
);

/** 文档站的路由名 → docs.tsx（同 apps/docs/src/site/nav.ts 的 kebab） */
const kebab = (name) => name.replace(/(?<=[a-z0-9])([A-Z])/g, '-$1').toLowerCase();
const files = new Map(
  globSync('apps/docs/src/components/*/*/docs.tsx', { cwd: root }).map((file) => [
    `/components/${kebab(basename(dirname(file)))}`,
    join(root, file),
  ]),
);

/** 一个 <Example id="…"> 的整段（含开头的缩进与结尾的换行）：自闭合的到 />，否则到 </Example> */
function exampleBlock(text, id) {
  const tag = text.indexOf(`<Example id="${id}"`);
  if (tag < 0) return undefined;
  const start = text.lastIndexOf('\n', tag) + 1;
  // 开始标签的 >：跳过花括号里的表达式与字符串
  let index = tag;
  let depth = 0;
  let quote = '';
  for (; index < text.length; index++) {
    const char = text[index];
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '{') depth++;
    else if (char === '}') depth--;
    else if (char === '>' && depth === 0) break;
  }
  let end =
    text[index - 1] === '/' ? index + 1 : text.indexOf('</Example>', index) + '</Example>'.length;
  if (text[end] === '\n') end++;
  return { start, end };
}

let changed = 0;
for (const page of report) {
  const file = files.get(page.path);
  if (!file || !page.columns?.length) continue;
  let text = readFileSync(file, 'utf8');
  for (const { left, right, move } of page.columns) {
    const target = move.from === 'left' ? right : left;
    const blocks = move.ids.map((id) => exampleBlock(text, id));
    if (blocks.some((block) => !block) || !target.length) {
      console.log(`✗ ${page.path}：找不到 ${move.ids.join('、')}，跳过`);
      continue;
    }
    const moved = blocks.map(({ start, end }) => text.slice(start, end)).join('');
    // 从后往前删，前面的位置不变
    for (const { start, end } of [...blocks].sort((a, b) => b.start - a.start))
      text = text.slice(0, start) + text.slice(end);
    // 插到短的那列的 </ExampleColumn> 前面：从那列最后一个示例往后找
    const anchor = exampleBlock(text, target.at(-1).id);
    const close = text.indexOf('</ExampleColumn>', anchor.end);
    const lineStart = text.lastIndexOf('\n', close) + 1;
    text = text.slice(0, lineStart) + moved + text.slice(lineStart);
    console.log(
      `${page.path}：${move.ids.join('、')} 从${move.from === 'left' ? '左' : '右'}列挪到另一列（底边差 ${Math.round(move.before)} → ${Math.round(move.after)} px）`,
    );
    changed++;
  }
  if (apply) writeFileSync(file, text);
}
console.log(apply ? `改了 ${changed} 处` : `要挪 ${changed} 处（加 --apply 改文件）`);
