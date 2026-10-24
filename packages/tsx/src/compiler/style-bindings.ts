/**
 * 动态样式的响应式绑定（运行时样式模式）：渲染函数的 JSX 里调用动态样式时，参数改成读取函数，
 *
 *   <div {...css.attrs(styles.bar(item.width))} />
 *   → <div {...css.attrs(css.bind(styles.bar, () => [item.width]))} />
 *
 * 渲染时只算类名、不追踪参数；参数变化时由元素上的 effect 只改那个 CSS 变量，组件不重新渲染（styles/dynamic.ts 的 bind）。
 * 只认本文件顶层 `const styles = css.create({ … })` 里写成函数的命名空间（能静态确定是动态样式）；
 * 参数全是字面量时不改（不会变，不值得起 effect）。
 */
import { types as t, type NodePath, type PluginObject } from '@babel/core';
import { renderFunctionOf, STYLE_SOURCE } from './ast.ts';

/** 粗筛：文件里有样式入口的导入、也有 create 调用 */
export const needsStyleBindings = (code: string) =>
  code.includes(STYLE_SOURCE) && /\bcreate\s*\(/.test(code);

/** 编译的第一遍、符文之前加的 Babel 插件（见文件开头） */
export function styleBindingsPlugin(): PluginObject {
  return {
    name: 'vue-tsx-pro-style-bindings',
    visitor: {
      Program(program) {
        const imports = styleImports(program);
        if (!imports) return;
        const dynamic = dynamicNamespaces(program, imports);
        if (!dynamic.size) return;
        let bind: t.Expression | undefined;
        program.traverse({
          CallExpression(path) {
            const callee = path.node.callee;
            if (
              !t.isMemberExpression(callee) ||
              callee.computed ||
              !t.isIdentifier(callee.object) ||
              !t.isIdentifier(callee.property)
            )
              return;
            const binding = path.scope.getBinding(callee.object.name);
            const names = binding && dynamic.get(binding.identifier);
            if (!names?.has(callee.property.name)) return;
            const render = inJsxAttribute(path) ? renderFunctionOf(path) : null;
            if (!render) return;
            const args = path.node.arguments;
            if (args.every((arg) => t.isLiteral(arg) && !t.isTemplateLiteral(arg))) return;
            if (args.some((arg) => t.isSpreadElement(arg) || t.isArgumentPlaceholder(arg))) return;
            const stable = readsOutsideRender(path, render);
            bind ??= bindReference(program, imports);
            path.replaceWith(
              t.callExpression(t.cloneNode(bind), [
                callee,
                t.arrowFunctionExpression([], t.arrayExpression(args as t.Expression[])),
                ...(stable ? [t.booleanLiteral(true)] : []),
              ]),
            );
            path.skip();
          },
        });
      },
    },
  };
}

interface StyleImports {
  /** 命名空间导入的本地名（import * as css） */
  namespace?: string;
  /** 具名导入的 create 的本地名 */
  create?: string;
  /** 导入来源（加 bind 的导入时用同一个） */
  source: string;
}

function styleImports(program: NodePath<t.Program>): StyleImports | undefined {
  for (const statement of program.node.body) {
    if (!t.isImportDeclaration(statement) || statement.source.value !== STYLE_SOURCE) continue;
    const found: StyleImports = { source: statement.source.value };
    for (const specifier of statement.specifiers) {
      if (t.isImportNamespaceSpecifier(specifier)) found.namespace = specifier.local.name;
      else if (
        t.isImportSpecifier(specifier) &&
        t.isIdentifier(specifier.imported) &&
        specifier.imported.name === 'create'
      )
        found.create = specifier.local.name;
    }
    if (found.namespace || found.create) return found;
  }
  return undefined;
}

/** 顶层 `const 名 = css.create({ … })`：名字的声明节点 → 写成函数的命名空间 */
function dynamicNamespaces(program: NodePath<t.Program>, imports: StyleImports) {
  const result = new Map<t.Identifier, Set<string>>();
  for (const statement of program.node.body) {
    const declaration = t.isExportNamedDeclaration(statement) ? statement.declaration : statement;
    if (!t.isVariableDeclaration(declaration) || declaration.kind !== 'const') continue;
    for (const declarator of declaration.declarations) {
      if (!t.isIdentifier(declarator.id) || !isCreateCall(declarator.init, imports)) continue;
      const [styles] = declarator.init.arguments;
      if (!t.isObjectExpression(styles)) continue;
      const names = new Set<string>();
      for (const property of styles.properties) {
        const key =
          t.isObjectProperty(property) || t.isObjectMethod(property) ? property.key : null;
        if (!t.isIdentifier(key) && !t.isStringLiteral(key)) continue;
        const name = t.isIdentifier(key) ? key.name : key.value;
        if (
          t.isObjectMethod(property) ||
          (t.isObjectProperty(property) &&
            (t.isArrowFunctionExpression(property.value) || t.isFunctionExpression(property.value)))
        )
          names.add(name);
      }
      if (names.size) result.set(declarator.id, names);
    }
  }
  return result;
}

function isCreateCall(
  node: t.Node | null | undefined,
  imports: StyleImports,
): node is t.CallExpression {
  if (!t.isCallExpression(node)) return false;
  const callee = node.callee;
  if (t.isIdentifier(callee)) return callee.name === imports.create;
  return (
    t.isMemberExpression(callee) &&
    !callee.computed &&
    t.isIdentifier(callee.object, { name: imports.namespace }) &&
    t.isIdentifier(callee.property, { name: 'create' })
  );
}

/**
 * 参数只读渲染函数外面声明的东西（组件函数体里的状态、props、模块里的常量）：每次渲染生成的读取函数读的是同一批来源，
 * 运行时重新渲染时只换读取函数、不必重跑 effect 收集依赖（css.bind 的第三个参数）。
 * 读了渲染函数里的局部变量、map 回调的参数时不算：它们每次渲染可能指向不同的响应式来源
 */
function readsOutsideRender(call: NodePath<t.CallExpression>, render: NodePath<t.Function>) {
  let stable = true;
  for (const arg of call.get('arguments')) {
    const check = (path: NodePath<t.Identifier>) => {
      if (!path.isReferencedIdentifier()) return;
      const binding = path.scope.getBinding(path.node.name);
      if (binding && (binding.path === render || binding.path.isDescendant(render))) stable = false;
    };
    if (arg.isIdentifier()) check(arg);
    else arg.traverse({ Identifier: check });
  }
  return stable;
}

/** 在 JSX 属性（sx={…}、{...css.attrs(…)}）里：渲染时用到的样式 */
const inJsxAttribute = (path: NodePath) =>
  !!path.findParent((parent) => parent.isJSXAttribute() || parent.isJSXSpreadAttribute());

/** bind 的引用：有命名空间导入时用 css.bind，否则补一个具名导入 */
function bindReference(program: NodePath<t.Program>, imports: StyleImports): t.Expression {
  if (imports.namespace) {
    return t.memberExpression(t.identifier(imports.namespace), t.identifier('bind'));
  }
  const local = program.scope.generateUidIdentifier('bind');
  program.unshiftContainer(
    'body',
    t.importDeclaration(
      [t.importSpecifier(local, t.identifier('bind'))],
      t.stringLiteral(imports.source),
    ),
  );
  return local;
}
