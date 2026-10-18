/**
 * StyleX 的模块解析（unstable_moduleResolution: custom）。
 *
 * StyleX 按“包名:文件路径”给 defineVars 的变量算哈希，引用方按导入路径解析到文件再算同样的哈希。
 * 仓库内 Vite 编译的是源码（src/config/theme/x.stylex.ts），使用方编译的是产物（dist/config/theme/x.stylex.js），
 * 而 StyleX 解析包导入时按 exports 找到的是 dist —— 两边算出的变量名就对不上。
 * 这里把 src 与 dist 下的同一个模块规范成同一个名字（去掉 src/ 或 dist/ 前缀与扩展名），
 * 变量名就与从源码还是产物编译无关。
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';

/** 仓库内的源码条件，与 workspaceSource() 一致 */
const SOURCE_CONDITION = '@vue-tsx-pro/source';
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.mjs'];

export function stylexModuleResolution() {
  return {
    type: 'custom' as const,
    filePathResolver,
    getCanonicalFilePath,
  };
}

function filePathResolver(importPath: string, sourceFilePath: string): string | undefined {
  if (importPath.startsWith('.')) {
    const base = resolve(dirname(sourceFilePath), importPath);
    return EXTENSIONS.map((extension) => base + extension).find(existsSync);
  }
  try {
    return createRequire(sourceFilePath).resolve(importPath);
  } catch {
    // 产物还没构建时按 exports 里的源码条件找到源文件；规范名相同，找哪个都行
    return resolveFromExports(importPath, sourceFilePath);
  }
}

export function resolveFromExports(importPath: string, sourceFilePath: string): string | undefined {
  const segments = importPath.split('/');
  const name = importPath.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]!;
  const subpath = `.${importPath.slice(name.length)}`;
  try {
    const manifest = createRequire(sourceFilePath).resolve(`${name}/package.json`);
    const target = (JSON.parse(readFileSync(manifest, 'utf8')) as Manifest).exports?.[subpath];
    const file =
      typeof target === 'string' ? target : (target?.[SOURCE_CONDITION] ?? target?.default);
    return file ? join(dirname(manifest), file) : undefined;
  } catch {
    return undefined;
  }
}

interface Manifest {
  name?: string;
  exports?: Record<string, string | Record<string, string>>;
}

function getCanonicalFilePath(filePath: string): string {
  const directory = packageRoot(filePath);
  if (!directory) return filePath.replaceAll('\\', '/');
  const { name } = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')) as Manifest;
  const path = relative(directory, filePath)
    .replaceAll('\\', '/')
    .replace(/^(src|dist)\//, '')
    .replace(/\.(ts|tsx|js|mjs)$/, '');
  return `${name ?? directory}:${path}`;
}

/** 文件所在包的根目录（最近的 package.json 所在目录） */
export function packageRoot(filePath: string): string | undefined {
  for (let directory = dirname(filePath); ; directory = dirname(directory)) {
    if (existsSync(join(directory, 'package.json'))) return directory;
    if (dirname(directory) === directory) return undefined;
  }
}
