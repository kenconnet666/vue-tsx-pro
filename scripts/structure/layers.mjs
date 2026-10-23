/**
 * 组件库的分层检查（ROADMAP“分层”）：packages/ui/src 里的运行时导入要满足四条规则，只导入类型的不算。
 *
 *   1. 基础设施（utils/、config/）不导入组件
 *   2. 核心（主入口的分类目录）不导入扩展
 *   3. 扩展（带目录的子路径：charts/、patterns/…）只依赖核心与基础设施；扩展之间的依赖要在 SUBPATH_DEPS 登记
 *   4. 模块之间没有环
 *
 * 扩展有哪些以 package.json 的 exports 为准；入口文件（index.ts）只是转出，不检查。
 * 用法：node scripts/structure/layers.mjs（pnpm layers:check，在 pnpm check 里）
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import * as ts from 'typescript/ast';
import { parseSource, root, uiEntries } from '../lib/repo.mjs';

const src = join(root, 'packages/ui/src');

const INFRA = new Set(['utils', 'config']);
const CORE = new Set([
  'base',
  'layout',
  'display',
  'feedback',
  'overlay',
  'navigation',
  'input',
  'date',
  'form',
  'table',
]);
/** 扩展之间允许的依赖：扩展 → 它能导入的扩展 */
const SUBPATH_DEPS = {};

const SUBPATHS = new Set(
  uiEntries()
    .filter((entry) => entry.source.endsWith('/index.ts'))
    .map((entry) => entry.source.slice(0, -'/index.ts'.length)),
);

const toPath = (file) => relative(src, file).split('\\').join('/');
const layerOf = (path) => path.split('/')[0];

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '.test' ? [] : sources(path);
    const isModule = /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts');
    return isModule && entry.name !== 'index.ts' ? [path] : [];
  });
}

function resolveImport(importer, specifier) {
  const base = resolve(dirname(importer), specifier.split('?')[0]);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

/** 一个模块在运行时导入的组件库模块（只导入类型的声明与 `{ type A }` 都去掉） */
function runtimeImports(file) {
  const source = parseSource(file);
  const specifiers = [];
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause;
      const typeOnly =
        clause?.phaseModifier === ts.SyntaxKind.TypeKeyword ||
        (clause &&
          !clause.name &&
          clause.namedBindings &&
          ts.isNamedImports(clause.namedBindings) &&
          clause.namedBindings.elements.length > 0 &&
          clause.namedBindings.elements.every((element) => element.isTypeOnly));
      if (!typeOnly) specifiers.push(node.moduleSpecifier.text);
      return;
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && !node.isTypeOnly) {
      specifiers.push(node.moduleSpecifier.text);
      return;
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    node.forEachChild(visit);
  };
  visit(source);
  return specifiers
    .filter((specifier) => specifier.startsWith('.'))
    .map((specifier) => resolveImport(file, specifier))
    .filter((target) => target && target.startsWith(src))
    .map(toPath);
}

const graph = new Map(sources(src).map((file) => [toPath(file), runtimeImports(file)]));

const problems = [];
for (const [from, targets] of graph) {
  const fromLayer = layerOf(from);
  for (const to of targets) {
    const toLayer = layerOf(to);
    if (fromLayer === toLayer || to.endsWith('/index.ts')) continue;
    if (INFRA.has(fromLayer) && !INFRA.has(toLayer)) {
      problems.push(`${from} → ${to}：基础设施不导入组件（规则 1）`);
    } else if (CORE.has(fromLayer) && SUBPATHS.has(toLayer)) {
      problems.push(`${from} → ${to}：核心不导入扩展（规则 2）`);
    } else if (SUBPATHS.has(fromLayer) && SUBPATHS.has(toLayer)) {
      if (!SUBPATH_DEPS[fromLayer]?.includes(toLayer)) {
        problems.push(`${from} → ${to}：扩展之间的依赖要在 SUBPATH_DEPS 登记（规则 3）`);
      }
    } else if (!INFRA.has(toLayer) && !CORE.has(toLayer) && !SUBPATHS.has(toLayer)) {
      problems.push(`${from} → ${to}：目录 ${toLayer} 不在任何一层里，在 layers.mjs 登记`);
    }
  }
}

// 规则 4：Tarjan 求强连通分量，大于一个模块的就是环
let index = 0;
const indices = new Map();
const lowlinks = new Map();
const stack = [];
const onStack = new Set();
function strongConnect(node) {
  indices.set(node, index);
  lowlinks.set(node, index);
  index++;
  stack.push(node);
  onStack.add(node);
  for (const next of graph.get(node) ?? []) {
    if (!graph.has(next)) continue;
    if (!indices.has(next)) {
      strongConnect(next);
      lowlinks.set(node, Math.min(lowlinks.get(node), lowlinks.get(next)));
    } else if (onStack.has(next)) {
      lowlinks.set(node, Math.min(lowlinks.get(node), indices.get(next)));
    }
  }
  if (lowlinks.get(node) !== indices.get(node)) return;
  const component = [];
  let member;
  do {
    member = stack.pop();
    onStack.delete(member);
    component.push(member);
  } while (member !== node);
  if (component.length > 1)
    problems.push(
      `模块之间有环（规则 4）：${component.sort((a, b) => a.localeCompare(b)).join('、')}`,
    );
}
for (const node of graph.keys()) if (!indices.has(node)) strongConnect(node);

if (problems.length) {
  console.error(
    `分层检查没通过（${problems.length} 处）：\n${problems.map((p) => `  ${p}`).join('\n')}`,
  );
  process.exitCode = 1;
} else {
  console.log(`分层检查通过：${graph.size} 个模块`);
}
