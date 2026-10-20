/**
 * 源码文字检查：源码里不直接写不可见字符、双向控制符与从右往左的文字，要写就用 \uXXXX 转义。
 * 它们在编辑器里看不见或会改变显示顺序（“Trojan Source”），代码看起来和实际执行的不一样，审代码时发现不了；
 * IDEA 也会对这类文件提示“双向文本”。
 *
 * 用法：pnpm text:check。检查 git 跟踪的文件，本地加上还没提交的新文件。
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const INCLUDE = [
  '*.ts',
  '*.tsx',
  '*.mts',
  '*.mjs',
  '*.js',
  '*.vue',
  '*.json',
  '*.md',
  '*.css',
  '*.yml',
];

/** 字符 → 说明；从右往左的文字（希伯来文、阿拉伯文，含阿拉伯-印度数字）按区段判断 */
const NAMED = new Map([
  [0x061c, '阿拉伯字母标记'],
  [0x200b, '零宽空格'],
  [0x200c, '零宽不连字'],
  [0x200d, '零宽连字'],
  [0x200e, '从左往右标记'],
  [0x200f, '从右往左标记'],
  [0x202a, '从左往右嵌入'],
  [0x202b, '从右往左嵌入'],
  [0x202c, '方向格式结束'],
  [0x202d, '从左往右覆盖'],
  [0x202e, '从右往左覆盖'],
  [0x2066, '从左往右隔离'],
  [0x2067, '从右往左隔离'],
  [0x2068, '首字方向隔离'],
  [0x2069, '方向隔离结束'],
  [0xfeff, '字节顺序标记（BOM）'],
]);
const isRtl = (code) =>
  (code >= 0x0590 && code <= 0x08ff) ||
  (code >= 0xfb1d && code <= 0xfdff) ||
  (code >= 0xfe70 && code <= 0xfefc);

const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', ...INCLUDE],
  { cwd: root, encoding: 'utf8' },
)
  .split('\n')
  .filter(Boolean);

const problems = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(join(root, file), 'utf8');
  } catch {
    continue; // 已删除但还在索引里
  }
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    for (const char of line) {
      const code = char.codePointAt(0);
      const name = NAMED.get(code) ?? (isRtl(code) ? '从右往左的文字' : undefined);
      if (!name) continue;
      // 文件开头的 BOM 是编码标记，不在代码里
      if (code === 0xfeff && index === 0 && line.startsWith(char)) continue;
      const escaped = `\\u${code.toString(16).toUpperCase().padStart(4, '0')}`;
      problems.push(`${file}:${index + 1}  ${name}，改写成 ${escaped}`);
    }
  });
}

if (problems.length) {
  console.error(`源码里有不可见或双向字符（共 ${problems.length} 处），请改用 \\uXXXX 转义：`);
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`文字检查通过：${files.length} 个文件`);
}
