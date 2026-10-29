/**
 * 样式的热更新原地生效（开发服务器、运行时样式模式）：
 *
 *   const styles = css.create({ … })
 *   → const styles = __hotStyles("src/Button.tsx#styles", css.create({ … }))
 *
 * 模块重新执行时 hotStyles 按 id 找到旧对象，把新声明写进旧片段、改写已插入的规则（styles/hot.ts），
 * 类名不变，组件不用重新渲染。同时算出“骨架”：去掉这些调用的参数后的源码哈希，写进 file.metadata.styleSkeleton；
 * 热更新时骨架没变（只改了样式）就原地接住，变了才照常让导入方重新执行（vite/hmr.ts）。
 * 只认顶层声明里的 create、recipe：函数里的调用每次执行都是新对象，不能按 id 合并。
 */
import { types as t, type NodePath, type PluginObject, type PluginPass } from '@babel/core';
import { isStyleNamespace, STYLE_SOURCE } from './ast.ts';

/** 能原地更新的样式函数 */
const HOT_FUNCTIONS = new Set(['create', 'recipe']);

/** 编译的第一遍、符文之前加的 Babel 插件；moduleId 是相对项目根目录的模块路径（见文件开头） */
export function styleHotPlugin(moduleId: string): PluginObject<PluginPass> {
  return {
    name: 'vue-tsx-pro-style-hot',
    visitor: {
      Program(program, state) {
        const imports = hotImports(program);
        if (!imports.namespace && !imports.named.size) return;
        const code = state.file.code;
        const removed: [number, number][] = [];
        let wrapper: t.Identifier | undefined;
        for (const statement of program.get('body')) {
          const declaration = statement.isExportNamedDeclaration()
            ? statement.get('declaration')
            : statement;
          if (!declaration.isVariableDeclaration() || declaration.node.kind !== 'const') continue;
          for (const declarator of declaration.get('declarations')) {
            const id = declarator.node.id;
            const init = declarator.get('init');
            if (!t.isIdentifier(id) || !init.isCallExpression() || !isHotCall(init.node, imports))
              continue;
            const args = init.node.arguments;
            const first = args[0];
            const last = args.at(-1);
            if (first?.start == null || last?.end == null) continue;
            removed.push([first.start, last.end]);
            wrapper ??= program.scope.generateUidIdentifier('hotStyles');
            init.replaceWith(
              t.callExpression(t.cloneNode(wrapper), [
                t.stringLiteral(`${moduleId}#${id.name}`),
                init.node,
              ]),
            );
          }
        }
        if (!wrapper) return;
        program.unshiftContainer(
          'body',
          t.importDeclaration(
            [t.importSpecifier(wrapper, t.identifier('hotStyles'))],
            t.stringLiteral(imports.source),
          ),
        );
        (state.file.metadata as { styleSkeleton?: string }).styleSkeleton = skeleton(code, removed);
      },
    },
  };
}

interface HotImports {
  source: string;
  namespace?: string;
  named: Set<string>;
}

function hotImports(program: NodePath<t.Program>): HotImports {
  const found: HotImports = { source: STYLE_SOURCE, named: new Set() };
  for (const statement of program.node.body) {
    if (!t.isImportDeclaration(statement) || statement.source.value !== STYLE_SOURCE) continue;
    found.source = statement.source.value;
    for (const specifier of statement.specifiers) {
      if (isStyleNamespace(specifier)) found.namespace = specifier.local.name;
      else if (
        t.isImportSpecifier(specifier) &&
        t.isIdentifier(specifier.imported) &&
        HOT_FUNCTIONS.has(specifier.imported.name)
      )
        found.named.add(specifier.local.name);
    }
  }
  return found;
}

function isHotCall(node: t.CallExpression, imports: HotImports) {
  const callee = node.callee;
  if (t.isIdentifier(callee)) return imports.named.has(callee.name);
  return (
    t.isMemberExpression(callee) &&
    !callee.computed &&
    t.isIdentifier(callee.object, { name: imports.namespace }) &&
    t.isIdentifier(callee.property) &&
    HOT_FUNCTIONS.has(callee.property.name)
  );
}

/** 去掉样式参数后的源码的哈希（FNV-1a；编译器也在浏览器里跑，不用 node:crypto） */
function skeleton(code: string, removed: readonly [number, number][]) {
  let text = '';
  let from = 0;
  for (const [start, end] of removed) {
    text += code.slice(from, start);
    from = end;
  }
  text += code.slice(from);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
