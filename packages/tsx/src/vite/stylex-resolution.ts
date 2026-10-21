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

/** StyleX 插件的 unstable_moduleResolution 选项：src 与 dist 下的同一模块规范成同一个名字 */
export function stylexModuleResolution() {
  return {
    type: 'custom' as const,
    filePathResolver,
    getCanonicalFilePath,
  };
}

/**
 * 从某个文件出发按 Node 规则解析。Vite 给的路径是正斜杠，Windows 上 Node 从这种路径找不到所在的包，
 * 包按名字引用自己（组件库源码导入 '@vue-tsx-pro/ui/tokens.stylex'）就会失败；先规范成本机的分隔符
 */
export const requireFrom = (file: string) => createRequire(resolve(file));

function filePathResolver(importPath: string, sourceFilePath: string): string | undefined {
  if (importPath.startsWith('.')) {
    const base = resolve(dirname(sourceFilePath), importPath);
    return EXTENSIONS.map((extension) => base + extension).find(existsSync);
  }
  try {
    return requireFrom(sourceFilePath).resolve(importPath);
  } catch {
    // 产物还没构建时按 exports 里的源码条件找到源文件；规范名相同，找哪个都行
    return resolveFromExports(importPath, sourceFilePath);
  }
}

/** 按包的 exports 里的源码条件（@vue-tsx-pro/source）解析导入路径；找不到时返回 undefined */
export function resolveFromExports(importPath: string, sourceFilePath: string): string | undefined {
  const segments = importPath.split('/');
  const name = importPath.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0]!;
  const subpath = `.${importPath.slice(name.length)}`;
  try {
    const manifest = requireFrom(sourceFilePath).resolve(`${name}/package.json`);
    const target = readManifest(manifest).exports?.[subpath];
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

// 每个导入 token 模块的文件都要解析、规范一次：package.json 与包的根目录按进程缓存（同 Node 的模块解析，改了要重启）
const manifests = new Map<string, Manifest>();
const roots = new Map<string, string | undefined>();

function readManifest(path: string): Manifest {
  let manifest = manifests.get(path);
  if (!manifest) {
    manifest = JSON.parse(readFileSync(path, 'utf8')) as Manifest;
    manifests.set(path, manifest);
  }
  return manifest;
}

function getCanonicalFilePath(filePath: string): string {
  const directory = packageRoot(filePath);
  if (!directory) return filePath.replaceAll('\\', '/');
  const { name } = readManifest(join(directory, 'package.json'));
  const path = relative(directory, filePath)
    .replaceAll('\\', '/')
    .replace(/^(src|dist)\//, '')
    .replace(/\.(ts|tsx|js|mjs)$/, '');
  return `${name ?? directory}:${path}`;
}

/** 文件所在包的根目录（最近的 package.json 所在目录） */
export function packageRoot(filePath: string): string | undefined {
  const start = dirname(filePath);
  if (roots.has(start)) return roots.get(start);
  let root: string | undefined;
  for (let directory = start; ; directory = dirname(directory)) {
    if (existsSync(join(directory, 'package.json'))) {
      root = directory;
      break;
    }
    if (dirname(directory) === directory) break;
  }
  roots.set(start, root);
  return root;
}
