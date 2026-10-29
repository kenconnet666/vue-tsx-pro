/**
 * 仅供本仓库使用，发布包的使用方不需要：
 *   - 解析 @zerodep-dev/vue-tsx-pro-* 时直接读源码（exports 里的 @vue-tsx-pro/source 条件），改了组件库不用先构建
 *   - 开发服务器与测试里，包入口（桶文件）的具名导入改成直接导入所在模块：
 *     `import { Button } from '@zerodep-dev/vue-tsx-pro-ui'` → `import { Button } from '<ui>/src/base/Button.tsx'`。
 *     经过桶文件导入时，组件库里不是组件的模块（样式、状态、工具函数、主题、工厂函数做的组件）改了，
 *     热更新沿着桶文件 → main.ts 一路走到没人接受更新的地方，整页刷新；直接导入时停在用到它的组件上。
 *     构建时不改：lazyBarrel 本来就只编译用到的再导出。
 *   - 按源码读的包，它自己导入的第三方依赖一开始就预构建（包在 package.json 的 vueTsxPro.optimizeDeps 里声明）
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { normalizePath, parseSync, type Plugin, type Rollup } from 'vite';

/** 桶文件：导出名 → 所在模块与那里的名字；副作用导入照样保留 */
interface Barrel {
  exports: Map<string, { file: string; name: string }>;
  sideEffects: string[];
}

type Barrels = Map<string, Promise<Barrel | null>>;
type Node = ReturnType<typeof parseSync>['program']['body'][number];

/** 解析出顶层语句；有语法错误时为 undefined */
function statements(filename: string, code: string): Node[] | undefined {
  const result = parseSync(filename, code);
  return result.errors.length ? undefined : result.program.body;
}

/** 解析 @zerodep-dev/vue-tsx-pro-* 用源码；开发与测试时桶文件的具名导入改成直接导入（见文件开头） */
export function workspaceSource(): Plugin {
  const condition = '@vue-tsx-pro/source';
  let serve = false;
  /** 解析后的包入口 → 桶文件（不是纯粹的再导出时为 null）；入口文件改了重新读 */
  const barrels: Barrels = new Map();
  return {
    name: 'vue-tsx-pro:workspace-source',
    config(user) {
      return {
        resolve: { conditions: [condition, 'module', 'browser', 'development|production'] },
        optimizeDeps: sourceDependencies(user.root ?? process.cwd()),
        ssr: { resolve: { conditions: [condition, 'module', 'node', 'development|production'] } },
      };
    },
    configResolved(config) {
      serve = config.command === 'serve';
    },
    // 入口改了重新读；新建、删除（含改名）文件时全部重读：映射里存的是解析后的文件，旧文件可能已经不在了。
    // 已经改写过的模块不重新改写：入口里挪了位置的导出要重启才对得上（入口由 pnpm exports 生成，很少挪）
    watchChange(id, change) {
      if (change.event === 'update') barrels.delete(normalizePath(id));
      else barrels.clear();
    },
    transform: {
      // 普通插件：在编译插件（enforce: 'pre'）与 Vite 去掉 .ts 的类型之后，拿到的是 JS
      filter: {
        id: { include: /\.(?:[cm]?[jt]sx?|vue)(?:\?|$)/, exclude: /\/node_modules\// },
        code: '@zerodep-dev/vue-tsx-pro-',
      },
      handler(code, id) {
        if (!serve || id.startsWith('\0')) return;
        return directImports(this, code, id, barrels);
      },
    },
  };
}

/** 把模块里从桶文件的具名导入改成直接导入；没有可改的时返回 undefined */
export async function directImports(
  context: Pick<Rollup.PluginContext, 'resolve'>,
  code: string,
  id: string,
  barrels: Barrels,
) {
  // 按 TS 解析：普通 JS 照样能解析，万一前面的插件留了类型写法也不出错；解析不了的交给后面的插件报错
  const body = statements('module.ts', code);
  if (!body) return undefined;
  const edits: { start: number; end: number; text: string }[] = [];
  for (const node of body) {
    if (node.type !== 'ImportDeclaration' || node.importKind === 'type') continue;
    const source = node.source.value;
    // 默认导入、命名空间导入、副作用导入要的就是整个入口
    if (!source.startsWith('@zerodep-dev/vue-tsx-pro-') || !node.specifiers.length) continue;
    if (!node.specifiers.every((specifier) => specifier.type === 'ImportSpecifier')) continue;
    const resolved = await context.resolve(source, id);
    if (!resolved || resolved.external) continue;
    const barrel = await barrelOf(context, resolved.id, barrels);
    if (!barrel) continue;
    const byFile = new Map<string, string[]>();
    const rest: string[] = [];
    for (const specifier of node.specifiers) {
      if (specifier.type !== 'ImportSpecifier' || specifier.importKind === 'type') continue;
      const local = specifier.local.name;
      const imported =
        specifier.imported.type === 'Identifier' ? specifier.imported.name : undefined;
      const target = imported === undefined ? undefined : barrel.exports.get(imported);
      // 入口里没有的名字（或写成字符串的导出名）留给入口：报错照旧
      if (!target) {
        rest.push(code.slice(specifier.start, specifier.end));
        continue;
      }
      const names = byFile.get(target.file) ?? [];
      names.push(target.name === local ? local : `${target.name} as ${local}`);
      byFile.set(target.file, names);
    }
    const statements = [
      ...barrel.sideEffects.map((file) => `import ${JSON.stringify(file)};`),
      ...[...byFile].map(
        ([file, names]) => `import { ${names.join(', ')} } from ${JSON.stringify(file)};`,
      ),
      ...(rest.length ? [`import { ${rest.join(', ')} } from ${JSON.stringify(source)};`] : []),
    ];
    // 行数不变：后面代码的位置不动，source map 照旧可用
    const lines = code.slice(node.start, node.end).split('\n').length - 1;
    edits.push({
      start: node.start,
      end: node.end,
      text: statements.join(' ') + '\n'.repeat(lines),
    });
  }
  if (!edits.length) return undefined;
  let next = code;
  for (const edit of edits.reverse()) {
    next = next.slice(0, edit.start) + edit.text + next.slice(edit.end);
  }
  return { code: next, map: null };
}

function barrelOf(context: Pick<Rollup.PluginContext, 'resolve'>, id: string, barrels: Barrels) {
  let barrel = barrels.get(id);
  if (!barrel) {
    barrel = readBarrel(context, id);
    barrels.set(id, barrel);
  }
  return barrel;
}

/**
 * 读入口文件：只有从本包相对路径的再导出（`export { … } from './x'`）与副作用导入时才算桶文件；
 * 有自己的声明、`export *`、从别的包再导出时返回 null，不改写
 */
async function readBarrel(
  context: Pick<Rollup.PluginContext, 'resolve'>,
  id: string,
): Promise<Barrel | null> {
  const file = id.split('?')[0]!;
  let body: Node[] | undefined;
  try {
    body = statements(file, readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
  if (!body) return null;
  const barrel: Barrel = { exports: new Map(), sideEffects: [] };
  const resolve = async (source: string) => {
    if (!source.startsWith('.')) return undefined;
    const resolved = await context.resolve(source, id);
    return resolved && !resolved.external ? resolved.id : undefined;
  };
  for (const node of body) {
    if (node.type === 'ImportDeclaration' && !node.specifiers.length) {
      const file = await resolve(node.source.value);
      if (!file) return null;
      barrel.sideEffects.push(file);
      continue;
    }
    if (node.type !== 'ExportNamedDeclaration' || !node.source || node.declaration) return null;
    if (node.exportKind === 'type') continue;
    const file = await resolve(node.source.value);
    if (!file) return null;
    for (const specifier of node.specifiers) {
      if (specifier.exportKind === 'type') continue;
      if (specifier.local.type !== 'Identifier' || specifier.exported.type !== 'Identifier') {
        return null;
      }
      barrel.exports.set(specifier.exported.name, { file, name: specifier.local.name });
    }
  }
  return barrel;
}

/** 本仓库按源码读的包：package.json 里声明的预构建依赖 */
interface Manifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  /** include 写导入时的说法，可以带子路径（'zod/v4/core'）；exclude 是不要预构建的（只按需加载其中几个的语言表） */
  vueTsxPro?: { optimizeDeps?: { include?: string[]; exclude?: string[] } };
}

/**
 * 按源码读的 @zerodep-dev/vue-tsx-pro-* 包自己导入的第三方依赖：不声明的话 Vite 要等页面（或浏览器测试）用到才发现，
 * 发现时重新预构建、刷新页面，正在初始化的测试页会卡住。写成“包 > 依赖”，从包的目录解析，应用不必自己安装；
 * 没装的可选依赖（three、shiki 等）跳过，免得 Vite 报解析不到
 */
function sourceDependencies(root: string) {
  const include: string[] = [];
  const exclude: string[] = [];
  const own = readManifest(join(root, 'package.json'));
  if (!own) return { include, exclude };
  const require = createRequire(join(root, 'package.json'));
  for (const name of Object.keys({ ...own.dependencies, ...own.devDependencies })) {
    if (!name.startsWith('@zerodep-dev/vue-tsx-pro-')) continue;
    let manifest: string;
    try {
      manifest = require.resolve(`${name}/package.json`);
    } catch {
      continue; // exports 里没有 package.json
    }
    const declared = readManifest(manifest)?.vueTsxPro?.optimizeDeps;
    for (const dependency of declared?.include ?? []) {
      if (installed(packageName(dependency), dirname(manifest)))
        include.push(`${name} > ${dependency}`);
    }
    exclude.push(...(declared?.exclude ?? []));
  }
  return { include, exclude };
}

/** 导入说法里的包名：'zod/v4/core' → 'zod'，'@lucide/icons/x' → '@lucide/icons' */
function packageName(specifier: string) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!;
}

/** 从某个目录往上找得到这个包（Node 的解析方式；不经 exports，只看装没装） */
function installed(name: string, from: string): boolean {
  for (let directory = from; ; directory = dirname(directory)) {
    if (existsSync(join(directory, 'node_modules', name, 'package.json'))) return true;
    if (dirname(directory) === directory) return false;
  }
}

function readManifest(path: string): Manifest | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Manifest;
  } catch {
    return undefined;
  }
}
