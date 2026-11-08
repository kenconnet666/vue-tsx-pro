/**
 * 部件名的写法：data-part 一律是小驼峰（triggerIcon、headerCell），与配方的部件键、props 名（propsTriggerIcon）一致；
 * data-scope 由 partAttrs 从组件名转成连字符小写。CSharpUi、Blazor 的对照按这条规则配对，写成连字符（day-head）就配不上。
 * 检查组件库里写死的部件名：xxxPart('…')、partAttrs(…, '…')、data-part="…" 与 'data-part': '…'。
 *
 * 用法：node scripts/structure/part-names.mjs（pnpm -C packages/ui check:parts）
 */
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from '../lib/repo.mjs';

const PATTERNS = [
  /Part\(\s*'([^']+)'/g,
  /partAttrs\([^,()]+(?:\([^)]*\))?,\s*'([^']+)'/g,
  /data-part="([^"]+)"/g,
  /'data-part':\s*'([^']+)'/g,
];
const CAMEL = /^[a-z][a-zA-Z0-9]*$/;

const bad = [];
for (const file of globSync('packages/{ui,mobile}/src/**/*.{ts,tsx}', { cwd: root })) {
  if (/[\\/]\.test[\\/]/.test(file)) continue;
  const text = readFileSync(join(root, file), 'utf8');
  for (const pattern of PATTERNS)
    for (const match of text.matchAll(pattern))
      if (!CAMEL.test(match[1])) {
        const line = text.slice(0, match.index).split('\n').length;
        bad.push(`${file.replaceAll('\\', '/')}:${line} ${match[1]}`);
      }
}
if (bad.length) {
  console.error(`部件名要写成小驼峰（data-part），这些不是：\n  ${bad.join('\n  ')}`);
  process.exit(1);
}
console.log('部件名：都是小驼峰');
