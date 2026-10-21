/**
 * 仅供本仓库使用，发布包的使用方不需要：
 *   - 解析 @vue-tsx-pro/* 时直接读源码（exports 里的 @vue-tsx-pro/source 条件），改了组件库不用先构建
 *   - 开发服务器与测试里，包入口（桶文件）的具名导入改成直接导入所在模块：
 *     `import { Button } from '@vue-tsx-pro/ui'` → `import { Button } from '<ui>/src/base/Button.tsx'`。
 *     经过桶文件导入时，组件库里不是组件的模块（样式、状态、工具函数、主题、工厂函数做的组件）改了，
 *     热更新沿着桶文件 → main.ts 一路走到没人接受更新的地方，整页刷新；直接导入时停在用到它的组件上。
 *     构建时不改：lazyBarrel 本来就只编译用到的再导出。
 */
import { readFileSync } from 'node:fs';
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

/** 解析 @vue-tsx-pro/* 用源码；开发与测试时桶文件的具名导入改成直接导入（见文件开头） */
export function workspaceSource(): Plugin {
  const condition = '@vue-tsx-pro/source';
  let serve = false;
  /** 解析后的包入口 → 桶文件（不是纯粹的再导出时为 null）；入口文件改了重新读 */
  const barrels: Barrels = new Map();
  return {
    name: 'vue-tsx-pro:workspace-source',
    config() {
      return {
        resolve: { conditions: [condition, 'module', 'browser', 'development|production'] },
        // 按源码读 tsx 包时，它运行时导入的 @stylexjs/stylex 不会被启动时的扫描发现（发布包则会随包预构建）：
        // 爬取时才发现会丢掉已经做完的预构建、整体重来，冷启动多等二十秒。
        // 写不带前缀的名字：爬取时记下的就是这个名字，写成“@vue-tsx-pro/tsx > …”会被当成另一个依赖，照样重来
        optimizeDeps: { include: ['@stylexjs/stylex'] },
        ssr: { resolve: { conditions: [condition, 'module', 'node', 'development|production'] } },
      };
    },
    configResolved(config) {
      serve = config.command === 'serve';
    },
    // 已经改写过的模块不重新改写：入口里挪了位置的导出要重启才对得上（入口由 pnpm exports 生成，很少挪）
    watchChange(id) {
      barrels.delete(normalizePath(id));
    },
    transform: {
      // 普通插件：在编译插件（enforce: 'pre'）与 Vite 去掉 .ts 的类型之后，拿到的是 JS
      filter: {
        id: { include: /\.(?:[cm]?[jt]sx?|vue)(?:\?|$)/, exclude: /\/node_modules\// },
        code: '@vue-tsx-pro/',
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
    if (!source.startsWith('@vue-tsx-pro/') || !node.specifiers.length) continue;
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
