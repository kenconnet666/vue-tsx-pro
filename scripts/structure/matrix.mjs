/**
 * 组件的达标矩阵（COMPONENTS.md §8 的完成标准，能用脚本看的几项）：每个导出的组件有没有
 *   - unit：组件库的单元测试（packages/ui/src/**\/.test）里用到它
 *   - docs：某个文档页的 API 表列了它（virtual:api/XxxProps 或 XxxBaseProps）
 *   - keyboard：组件自己处理按键（onKeydown）时，列它的文档页有键盘一节（KeyboardReference）
 *   - browser：组件自己处理按键时，有浏览器测试（文档站、宿主示例的 *.browser.test）用到它
 *   - types：泛型组件（_component(<T…>)）有类型测试（*.test-d.tsx）用到它
 * 已知的缺项记在 matrix-baseline.json：出现基线里没有的缺项时报错（新组件要达标）；基线里的缺项补上了也报，
 * 提示用 --write 收紧基线。
 *
 * 用法：node scripts/structure/matrix.mjs [--write] [--report]
 *   --write   按现状重写基线
 *   --report  整张表写到 .claude/reports/matrix.md
 */
import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BASELINE = join(root, 'scripts/structure/matrix-baseline.json');
const read = (path) => readFileSync(join(root, path), 'utf8');
const files = (pattern) =>
  globSync(pattern, { cwd: root }).map((path) => path.split('\\').join('/'));

// 导出的组件：入口（index.ts）里转出的名字
const exported = new Set(
  files('packages/ui/src/{index.ts,*/index.ts}').flatMap((path) =>
    [...read(path).matchAll(/\b([A-Z]\w*)\b/g)].map((match) => match[1]),
  ),
);

/** 组件：名字、所在文件、自己那一段源码（到下一个组件为止） */
const components = files('packages/ui/src/**/*.tsx')
  .filter((path) => !path.includes('/.test/') && !path.includes('/template/'))
  .flatMap((path) => {
    const text = read(path);
    const starts = [...text.matchAll(/export const ([A-Z]\w*) = _component\(/g)];
    return starts
      .filter((match) => exported.has(match[1]))
      .map((match, index) => {
        const body = text.slice(match.index, starts[index + 1]?.index ?? text.length);
        return {
          name: match[1],
          path,
          generic: /^export const \w+ = _component\(\s*</.test(body),
          keyboard: /onKeydown|handle\w*Keydown/.test(body),
        };
      });
  });

const joined = (pattern, exclude) =>
  files(pattern)
    .filter((path) => !exclude?.test(path))
    .map(read)
    .join('\n');
// Node 的 glob 里 ** 不进以点开头的目录：测试目录 .test 一层层写出来；类型测试（.test-d）不算单元测试
const unitTests = joined('packages/ui/src/{,*/,*/*/}.test/*.{ts,tsx}', /\.test-d\.tsx?$/);
const typeTests = joined('packages/*/src/{,*/,*/*/}.test/*.test-d.{ts,tsx}');
const browserTests = joined(
  '{apps/docs/src/**/*.browser.test.{ts,tsx},apps/host-demo/test/**/*.browser.test.{ts,tsx}}',
);
const docPages = files('apps/docs/src/{components,pages}/**/docs.tsx').map((path) => read(path));
const mentions = (text, name) => new RegExp(`\\b${name}\\b`).test(text);

/** 列这个组件 API 的文档页 */
const pagesOf = (name) =>
  docPages.filter((text) => new RegExp(`virtual:api/${name}(Base)?Props['"]`).test(text));

const gaps = Object.fromEntries(
  components.map(({ name, generic, keyboard }) => {
    const pages = pagesOf(name);
    const missing = [];
    if (!mentions(unitTests, name)) missing.push('unit');
    // 没有自己的 Props 接口（直接用原生元素的属性，如 TableHead）的列不进 API 表
    const hasProps = exported.has(`${name}Props`) || exported.has(`${name}BaseProps`);
    if (hasProps && pages.length === 0) missing.push('docs');
    if (keyboard && pages.length > 0 && !pages.some((text) => text.includes('KeyboardReference')))
      missing.push('keyboard');
    if (keyboard && !mentions(browserTests, name)) missing.push('browser');
    if (generic && !mentions(typeTests, name)) missing.push('types');
    return [name, missing];
  }),
);

const args = process.argv.slice(2);

if (args.includes('--report')) {
  const rows = components.map(({ name, path }) => {
    const missing = gaps[name];
    const cell = (item) => (missing.includes(item) ? '✗' : '');
    return `| ${name} | ${path.replace('packages/ui/src/', '')} | ${['unit', 'docs', 'keyboard', 'browser', 'types'].map(cell).join(' | ')} |`;
  });
  writeFileSync(
    join(root, '.claude/reports/matrix.md'),
    `# 组件达标矩阵（scripts/structure/matrix.mjs 生成）\n\n✗ 是缺的项。\n\n| 组件 | 文件 | 单元测试 | 文档 | 键盘一节 | 浏览器测试 | 类型测试 |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`,
  );
}

const current = Object.fromEntries(
  Object.entries(gaps)
    .filter(([, missing]) => missing.length > 0)
    .sort(([a], [b]) => a.localeCompare(b)),
);

if (args.includes('--write')) {
  writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`达标矩阵：基线已按现状重写（${Object.keys(current).length} 个组件有缺项）`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const added = [];
const fixed = [];
for (const [name, missing] of Object.entries(gaps)) {
  const known = baseline[name] ?? [];
  for (const item of missing) if (!known.includes(item)) added.push(`${name}：${item}`);
  for (const item of known) if (!missing.includes(item)) fixed.push(`${name}：${item}`);
}
for (const name of Object.keys(baseline))
  if (!(name in gaps)) fixed.push(`${name}：（组件已不存在）`);

if (added.length || fixed.length) {
  if (added.length)
    console.error(
      `达标矩阵有新的缺项（COMPONENTS.md §8；见 scripts/structure/matrix.mjs 的说明）：\n  ${added.join('\n  ')}`,
    );
  if (fixed.length)
    console.error(
      `这些缺项已经补上，用 node scripts/structure/matrix.mjs --write 收紧基线：\n  ${fixed.join('\n  ')}`,
    );
  process.exit(1);
}
console.log(
  `达标矩阵检查通过：${components.length} 个组件，${Object.keys(current).length} 个还有已知缺项`,
);
