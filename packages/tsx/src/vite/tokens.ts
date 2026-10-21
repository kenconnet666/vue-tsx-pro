/**
 * 主题 tokens 字符串写法（`fontSize: '_xs'`）的 Vite 插件：找到 token 模块、读出各组 token 名，
 * 交给编译器改写成 token 变量（compiler/tokens.ts）。
 *
 * 生成的 import 写什么路径：
 *   - 与 token 模块在同一个包里（组件库自己的源码）→ 相对路径，构建产物里也是相对路径
 *   - 其他包（使用方应用）→ 原样写选项里的包名，如 '@vue-tsx-pro/ui/tokens.stylex'
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { parseSync, types as t } from '@babel/core';
import type { Plugin } from 'vite';
import { compileTokens, type TokenModule } from '../compiler/index.ts';
import { packageRoot, requireFrom, resolveFromExports } from './stylex-resolution.ts';

/** token 字符串写法的 Vite 插件；specifier 是 token 模块的包名或相对项目根目录的路径 */
export function themeTokens(specifier: string): Plugin {
  let root = process.cwd();
  return {
    name: 'vue-tsx-pro:tokens',
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
    },
    async transform(code, id) {
      const file = id.split('?')[0]!;
      if (!/\.[cm]?[jt]sx?$/.test(file) || file.includes('/node_modules/')) return;
      return compileTokens(code, file, () => {
        const module = tokenModule(specifier, file, root);
        if (module) this.addWatchFile(module.file);
        return module;
      });
    },
  };
}

const isPath = (specifier: string) => specifier.startsWith('.') || isAbsolute(specifier);

function tokenModule(
  specifier: string,
  importer: string,
  root: string,
): (TokenModule & { file: string }) | null {
  const file = isPath(specifier) ? resolve(root, specifier) : resolvePackage(specifier, importer);
  if (!file || !existsSync(file)) return null;
  const samePackage = isPath(specifier) || packageRoot(file) === packageRoot(importer);
  return {
    file,
    importPath: samePackage ? relativeImport(importer, file) : specifier,
    groups: readGroups(file),
  };
}

/** 优先找源码（exports 里的源码条件，仓库内开发时产物可能还没构建或已过期），没有再按 Node 规则找产物 */
function resolvePackage(specifier: string, importer: string) {
  const source = resolveFromExports(specifier, importer);
  if (source && existsSync(source)) return source;
  try {
    return requireFrom(importer).resolve(specifier);
  } catch {
    return undefined;
  }
}

/** 与手写一致：相对路径、不带扩展名（'../../config/theme/tokens.stylex'） */
function relativeImport(importer: string, file: string) {
  const path = relative(dirname(importer), file)
    .replaceAll('\\', '/')
    .replace(/\.(ts|tsx|js|mjs)$/, '');
  return path.startsWith('.') ? path : `./${path}`;
}

const groupsCache = new Map<string, { mtime: number; groups: TokenModule['groups'] }>();

/** 顶层的 `const 组 = stylex.defineVars({ … })` → 组名 → token 名；源码与产物都适用 */
function readGroups(file: string): TokenModule['groups'] {
  const mtime = statSync(file).mtimeMs;
  const cached = groupsCache.get(file);
  if (cached?.mtime === mtime) return cached.groups;

  const ast = parseSync(readFileSync(file, 'utf8'), {
    filename: file,
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['typescript'] },
  });
  const groups = new Map<string, Set<string>>();
  for (const statement of ast?.program.body ?? []) {
    const declaration = t.isExportNamedDeclaration(statement) ? statement.declaration : statement;
    if (!t.isVariableDeclaration(declaration)) continue;
    for (const { id, init } of declaration.declarations) {
      if (!t.isIdentifier(id) || !t.isCallExpression(init) || !isDefineVars(init.callee)) continue;
      const tokens = init.arguments[0];
      if (t.isObjectExpression(tokens))
        groups.set(id.name, new Set(tokens.properties.flatMap(keyName)));
    }
  }
  groupsCache.set(file, { mtime, groups });
  return groups;
}

function isDefineVars(callee: t.Node) {
  if (t.isIdentifier(callee)) return callee.name === 'defineVars';
  return t.isMemberExpression(callee) && t.isIdentifier(callee.property, { name: 'defineVars' });
}

function keyName(property: t.Node): string[] {
  if (!t.isObjectProperty(property) || property.computed) return [];
  if (t.isIdentifier(property.key)) return [property.key.name];
  return t.isStringLiteral(property.key) ? [property.key.value] : [];
}
