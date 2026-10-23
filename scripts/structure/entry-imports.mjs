/**
 * 应用（apps/、tests/consumer）里从组件库入口导入的名字，改到真正导出它的入口：组件在主入口与子路径之间挪动后用。
 * 名字在所有入口里全局唯一（pnpm exports 保证），所以按名字就能找到它现在属于哪个入口。
 *
 *   import { AppShell, Button } from '@vue-tsx-pro/ui';
 *   → import { Button } from '@vue-tsx-pro/ui';
 *     import { AppShell } from '@vue-tsx-pro/ui/patterns';
 *
 * 只改 import 声明；文档页 `imports="…"` 这类字符串里的导入由文档站的 pages 测试检查，手动改。
 * pnpm move 挪完文件后会自动调用；也可以单独运行：node scripts/structure/entry-imports.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import prettier from 'prettier';
import * as ts from 'typescript/ast';
import { parseSource, root, uiEntries } from '../lib/repo.mjs';

const src = join(root, 'packages/ui/src');

/** 一个入口文件导出的名字（`export { a, type B } from …` 与直接导出的声明） */
function exportedNames(file) {
  const source = parseSource(file);
  const names = new Set();
  for (const node of source.statements) {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) names.add(element.name.text);
    } else if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isVariableStatement(node)) {
        for (const d of node.declarationList.declarations) names.add(d.name.getText(source));
      } else if (node.name) names.add(node.name.text);
    }
  }
  return names;
}

function appSources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return ['node_modules', 'dist', '.cache'].includes(entry.name) ? [] : appSources(path);
    }
    return /\.(tsx?|mts)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [path] : [];
  });
}

/** 改写所有应用里的导入（改过的文件用 Prettier 排好）；返回改过的文件（绝对路径） */
export async function fixEntryImports() {
  const entries = uiEntries();
  const exportsByEntry = new Map(
    entries.map(({ name, source }) => [name, exportedNames(join(src, source))]),
  );
  const ownerOf = (name) => entries.find((entry) => exportsByEntry.get(entry.name).has(name))?.name;

  const changed = [];
  const files = [...appSources(join(root, 'apps')), ...appSources(join(root, 'tests'))];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes('@vue-tsx-pro/ui')) continue;
    const source = parseSource(file, text);
    const declarations = source.statements.flatMap((node) => {
      const bindings = node.importClause?.namedBindings;
      if (!ts.isImportDeclaration(node) || !bindings || !ts.isNamedImports(bindings)) return [];
      const entry = node.moduleSpecifier.text;
      if (!exportsByEntry.has(entry)) return [];
      const typeOnly = node.importClause.phaseModifier === ts.SyntaxKind.TypeKeyword;
      const names = bindings.elements.map((element) => ({
        imported: (element.propertyName ?? element.name).text,
        text: element.getText(source),
      }));
      return [{ node, entry, typeOnly, names, key: `${typeOnly}:${entry}` }];
    });
    /** 每条声明最后应该写的名字；挪走的名字优先并进已有的、同一入口的声明 */
    const target = new Map(declarations.map((d) => [d, []]));
    const added = new Map();
    let moved = false;
    for (const declaration of declarations) {
      for (const { imported, text: nameText } of declaration.names) {
        const owner = exportsByEntry.get(declaration.entry).has(imported)
          ? declaration.entry
          : ownerOf(imported);
        if (!owner) throw new Error(`${relative(root, file)}：组件库的入口都没有导出 ${imported}`);
        if (owner === declaration.entry) {
          target.get(declaration).push(nameText);
          continue;
        }
        moved = true;
        const key = `${declaration.typeOnly}:${owner}`;
        const existing = declarations.find((d) => d.key === key);
        if (existing) target.get(existing).push(nameText);
        else added.set(key, [...(added.get(key) ?? []), nameText]);
      }
    }
    if (!moved) continue;
    const statement = (typeOnly, entry, names) =>
      `import ${typeOnly ? 'type ' : ''}{ ${names.join(', ')} } from '${entry}';`;
    /** [start, end, 新文字]，从后往前替换 */
    const edits = declarations.map((d) => [
      d.node.getStart(source),
      d.node.getEnd(),
      target.get(d).length ? statement(d.typeOnly, d.entry, target.get(d)) : '',
    ]);
    const last = edits.at(-1);
    for (const [key, names] of added) {
      const [typeOnly, entry] = key.split(/:(.*)/);
      last[2] += `\n${statement(typeOnly === 'true', entry, names)}`;
    }
    let next = text;
    for (const [start, end, replacement] of edits.reverse()) {
      next = next.slice(0, start) + replacement + next.slice(end);
    }
    const config = await prettier.resolveConfig(file);
    writeFileSync(file, await prettier.format(next, { ...config, filepath: file }));
    changed.push(file);
  }
  return changed;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const changed = await fixEntryImports();
  console.log(
    changed.length
      ? `改写了 ${changed.length} 个文件的入口导入：\n` +
          changed.map((file) => `  ${relative(root, file)}`).join('\n')
      : '应用里的入口导入都对',
  );
}
