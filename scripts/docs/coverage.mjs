// 每个文档页：API 表里的属性（prop / event / content）哪些在本页的示例源码与说明里一次都没出现，按缺口比例排序。
// 补示例时找缺口用，不进 CI：children、open、placement、lazy 这类透传属性不必每个都演示。
//
//   pnpm docs:coverage            全部页面
//   pnpm docs:coverage input/     只看路径里含 input/ 的页面
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const docs = join(import.meta.dirname, '../../apps/docs/src');
const { extractComponentApi } = await import(
  pathToFileURL(join(import.meta.dirname, '../../apps/docs/build/api.ts')).href
);
const filter = process.argv[2] ?? '';

const rows = [];
for (const page of globSync('components/*/*/docs.tsx', { cwd: docs })
  .map((path) => path.split('\\').join('/'))
  .sort()) {
  if (!page.includes(filter)) continue;
  const dir = page.replace('/docs.tsx', '');
  const text = readFileSync(join(docs, page), 'utf8');
  const sources = globSync(`${dir}/**/*.tsx`, { cwd: docs })
    .map((file) => readFileSync(join(docs, file), 'utf8'))
    .join('\n');
  const missing = [];
  let total = 0;
  for (const [, name] of text.matchAll(/virtual:api\/(\w+)/g)) {
    const api = extractComponentApi(name);
    for (const prop of api.props) {
      if (prop.kind === 'part') continue;
      total++;
      if (!new RegExp(`\\b${prop.name}\\b`).test(sources))
        missing.push(`${api.component}.${prop.name}`);
    }
  }
  if (missing.length) rows.push({ page: dir.replace('components/', ''), total, missing });
}
rows.sort((a, b) => b.missing.length / b.total - a.missing.length / a.total);
for (const row of rows)
  console.log(
    `${row.page.padEnd(28)} ${row.missing.length}/${row.total}  ${row.missing.join(' ')}`,
  );
