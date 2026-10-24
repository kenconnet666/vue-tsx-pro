/**
 * 样式的响应式绑定：渲染函数的 JSX 里，随状态变的样式改成绑定，状态变化时由元素上的 effect 直接改元素，组件不重新渲染
 * （styles/dynamic.ts 的 bind、select，styles/bindings.ts 的 effect）。
 *
 *   动态样式的参数：<div {...css.attrs(styles.bar(item.width))} />
 *     → <div {...css.attrs(css.bind(styles.bar, () => [item.width]))} />       参数变化只改元素上的 CSS 变量
 *   按状态选样式：<div {...css.attrs(styles.row, item.hot && styles.hot)} />
 *     → <div {...css.attrs(styles.row, css.select(() => item.hot && styles.hot))} />   状态变化就地换组合类
 *
 * 只认本文件顶层 `const styles = css.create({ … })` 的样式（能静态确定是样式、哪些命名空间是动态样式）。
 * 动态样式的参数全是字面量时不改（不会变）。按状态选样式只改交给 attrs 或 sx 的（`cond && styles.x`、
 * `cond ? styles.a : styles.b`、`styles[key]`），而且读到的状态在渲染里没有别处用到：别处也读的话组件反正要重新渲染，
 * 绑定只会多一个 effect。
 */
import { types as t, type NodePath, type PluginObject } from '@babel/core';
import { renderFunctionOf, STYLE_SOURCE } from './ast.ts';

/** 粗筛：文件里有样式入口的导入、也有 create 调用 */
export const needsStyleBindings = (code: string) =>
  code.includes(STYLE_SOURCE) && /\bcreate\s*\(/.test(code);

/** 顶层 create 的一张样式表：写成函数的命名空间（动态样式） */
interface StyleTable {
  dynamic: Set<string>;
}

/** 编译的第一遍、符文之前加的 Babel 插件（见文件开头） */
export function styleBindingsPlugin(): PluginObject {
  return {
    name: 'vue-tsx-pro-style-bindings',
    visitor: {
      Program(program) {
        const imports = styleImports(program);
        if (!imports) return;
        const tables = styleTables(program, imports);
        if (!tables.size) return;
        const reference = (name: 'bind' | 'select') => helperReference(program, imports, name);
        const tableOf = (node: t.Node) => {
          if (!t.isMemberExpression(node) || !t.isIdentifier(node.object)) return undefined;
          const binding = program.scope.getBinding(node.object.name);
          return binding && tables.get(binding.identifier);
        };
        const select = (path: NodePath<t.Expression>, condition: NodePath) => {
          const render = renderFunctionOf(path);
          if (
            !render ||
            !inStyleSlot(path, imports) ||
            !worthBinding(condition, render, (other) => inAnyStyleSlot(other, imports))
          )
            return;
          const stable = readsOutsideRender(condition, render);
          path.replaceWith(
            t.callExpression(reference('select'), [
              t.arrowFunctionExpression([], path.node),
              ...(stable ? [t.booleanLiteral(true)] : []),
            ]),
          );
          path.skip();
        };
        /** 样式表里的一段静态样式：`styles.x`（不是动态样式），或表里没有动态样式时的 `styles[key]` */
        const isStyle = (node: t.Node) => {
          const table = tableOf(node);
          if (!table || !t.isMemberExpression(node)) return false;
          if (node.computed) return !table.dynamic.size;
          return t.isIdentifier(node.property) && !table.dynamic.has(node.property.name);
        };
        const isStyleOrNothing = (node: t.Node) =>
          isStyle(node) ||
          t.isNullLiteral(node) ||
          t.isBooleanLiteral(node, { value: false }) ||
          t.isIdentifier(node, { name: 'undefined' });

        program.traverse({
          CallExpression(path) {
            const callee = path.node.callee;
            if (t.isMemberExpression(callee) && callee.computed) return;
            const table = tableOf(callee);
            if (!table || !t.isMemberExpression(callee) || !t.isIdentifier(callee.property)) return;
            if (!table.dynamic.has(callee.property.name)) return;
            const render = inJsxAttribute(path) ? renderFunctionOf(path) : null;
            if (!render) return;
            const args = path.node.arguments;
            if (args.every((arg) => t.isLiteral(arg) && !t.isTemplateLiteral(arg))) return;
            if (args.some((arg) => t.isSpreadElement(arg) || t.isArgumentPlaceholder(arg))) return;
            const stable = path.get('arguments').every((arg) => readsOutsideRender(arg, render));
            path.replaceWith(
              t.callExpression(reference('bind'), [
                callee,
                t.arrowFunctionExpression([], t.arrayExpression(args as t.Expression[])),
                ...(stable ? [t.booleanLiteral(true)] : []),
              ]),
            );
            path.skip();
          },
          LogicalExpression(path) {
            if (path.node.operator === '&&' && isStyle(path.node.right)) {
              select(path, path.get('left'));
            }
          },
          ConditionalExpression(path) {
            const { consequent, alternate } = path.node;
            if (
              (isStyle(consequent) || isStyle(alternate)) &&
              isStyleOrNothing(consequent) &&
              isStyleOrNothing(alternate)
            )
              select(path, path.get('test'));
          },
          MemberExpression(path) {
            if (!path.node.computed || !isStyle(path.node)) return;
            const key = path.get('property');
            if (key.isLiteral() && !key.isTemplateLiteral()) return;
            select(path, key);
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
  /** 具名导入的 attrs 的本地名 */
  attrs?: string;
  /** 导入来源（加 bind、select 的导入时用同一个） */
  source: string;
}

function styleImports(program: NodePath<t.Program>): StyleImports | undefined {
  for (const statement of program.node.body) {
    if (!t.isImportDeclaration(statement) || statement.source.value !== STYLE_SOURCE) continue;
    const found: StyleImports = { source: statement.source.value };
    for (const specifier of statement.specifiers) {
      if (t.isImportNamespaceSpecifier(specifier)) found.namespace = specifier.local.name;
      else if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported)) {
        if (specifier.imported.name === 'create') found.create = specifier.local.name;
        if (specifier.imported.name === 'attrs') found.attrs = specifier.local.name;
      }
    }
    if (found.namespace || found.create) return found;
  }
  return undefined;
}

/** 顶层 `const 名 = css.create({ … })`：名字的声明节点 → 样式表 */
function styleTables(program: NodePath<t.Program>, imports: StyleImports) {
  const result = new Map<t.Identifier, StyleTable>();
  for (const statement of program.node.body) {
    const declaration = t.isExportNamedDeclaration(statement) ? statement.declaration : statement;
    if (!t.isVariableDeclaration(declaration) || declaration.kind !== 'const') continue;
    for (const declarator of declaration.declarations) {
      if (!t.isIdentifier(declarator.id) || !isCreateCall(declarator.init, imports)) continue;
      const [styles] = declarator.init.arguments;
      if (!t.isObjectExpression(styles)) continue;
      // 展开、计算出来的键：认不全有哪些命名空间，整张表不认
      if (styles.properties.some((p) => t.isSpreadElement(p) || p.computed)) continue;
      const dynamic = new Set<string>();
      for (const property of styles.properties) {
        if (t.isSpreadElement(property)) continue;
        const key = property.key;
        if (!t.isIdentifier(key) && !t.isStringLiteral(key)) continue;
        const name = t.isIdentifier(key) ? key.name : key.value;
        if (
          t.isObjectMethod(property) ||
          t.isArrowFunctionExpression(property.value) ||
          t.isFunctionExpression(property.value)
        )
          dynamic.add(name);
      }
      result.set(declarator.id, { dynamic });
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
 * 交给 attrs 或 sx 的样式：attrs 的参数、sx 属性（JSX 的 sx={…}、对象里的 sx: …）的值，中间可以隔着数组。
 * 别处（传给组件的其他 prop、拿去比较）不改：那里要的是样式本身
 */
function inStyleSlot(path: NodePath, imports: StyleImports) {
  let current: NodePath = path;
  while (current.parentPath?.isArrayExpression()) current = current.parentPath;
  const parent = current.parentPath;
  if (!parent) return false;
  if (parent.isCallExpression() && current.listKey === 'arguments') {
    const callee = parent.node.callee;
    return (
      t.isIdentifier(callee, { name: imports.attrs }) ||
      (t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object, { name: imports.namespace }) &&
        t.isIdentifier(callee.property, { name: 'attrs' }))
    );
  }
  if (parent.isJSXExpressionContainer()) {
    const attribute = parent.parentPath;
    return !!attribute?.isJSXAttribute() && t.isJSXIdentifier(attribute.node.name, { name: 'sx' });
  }
  return (
    parent.isObjectProperty() &&
    current.key === 'value' &&
    !parent.node.computed &&
    t.isIdentifier(parent.node.key, { name: 'sx' })
  );
}

/** 在交给 attrs 或 sx 的样式里（往上找到 JSX 属性为止） */
function inAnyStyleSlot(path: NodePath, imports: StyleImports) {
  for (let current: NodePath | null = path; current; current = current.parentPath) {
    // 改写过的 select、bind 的读取函数也在样式里：往上越过函数，到 JSX 属性为止
    if (current.isJSXAttribute() || current.isJSXSpreadAttribute()) return false;
    if (current.isExpression() && inStyleSlot(current, imports)) return true;
  }
  return false;
}

/**
 * 改成绑定值不值得：条件读到的状态（`item.hot`、`active`）至少有一个在渲染里没有别处读到。别处也读的话组件反正要
 * 重新渲染，绑定只会多一个 effect。组件自己的 prop 整个值不算（值变了 Vue 照样重新渲染子组件）。交给样式的那些读（attrs、sx 里，同样会改成绑定）、事件回调里的、赋值的不算“别处”。
 * 只读模块常量的条件不会变；读了渲染里算出来的局部变量的，它的来源已经被渲染追踪
 */
function worthBinding(
  condition: NodePath,
  render: NodePath<t.Function>,
  inStyles: (path: NodePath) => boolean,
) {
  const keys = new Set<string>();
  let local = false;
  const visit = (path: NodePath<t.Identifier>) => {
    if (!path.isReferencedIdentifier()) return;
    const binding = path.scope.getBinding(path.node.name);
    if (!binding || binding.scope.path.isProgram()) return;
    const inRender = binding.path === render || binding.path.isDescendant(render);
    if (inRender && binding.kind !== 'param') local = true;
    const chain = chainOf(path);
    // 参数整个值：组件自己的 prop（size、active）值变了 Vue 反正重新渲染子组件，绑定省不下什么；
    // 渲染里辅助函数、回调的参数是普通值。参数对象里的属性（item.hot，对象原地改）才省得下
    if (binding.kind === 'param' && !chain.includes('.') && !isCalled(path)) return;
    // 普通常量（inject 来的字符串、布尔值）不会变；_derived、_fromRef 的结果与调用的 getter（compact()）会
    if (
      binding.kind === 'const' &&
      !chain.includes('.') &&
      !isCalled(path) &&
      !isReactiveInit(binding.path)
    )
      return;
    keys.add(chain);
  };
  if (condition.isIdentifier()) visit(condition);
  else condition.traverse({ Identifier: visit });
  if (local || !keys.size) return false;

  const elsewhere = new Set<string>();
  render.traverse({
    Identifier(path) {
      if (!path.isReferencedIdentifier() || inStyles(path)) return;
      if (inEventHandler(path, render) || isWritten(path)) return;
      const chain = chainOf(path);
      for (const key of keys) if (chain === key || chain.startsWith(`${key}.`)) elsewhere.add(key);
    },
  });
  return elsewhere.size < keys.size;
}

/** 被调用：`compact()` 这类读状态的 getter */
const isCalled = (path: NodePath) =>
  !!path.parentPath?.isCallExpression() && path.parentPath.node.callee === path.node;

/** 常量的初值是响应式的：_derived、_derived.by、_fromRef 的结果 */
function isReactiveInit(declarator: NodePath) {
  if (!declarator.isVariableDeclarator()) return false;
  const init = declarator.node.init;
  if (!t.isCallExpression(init)) return false;
  // _derived(…)、_derived.by(…)、_fromRef(…)
  const callee = t.isMemberExpression(init.callee) ? init.callee.object : init.callee;
  return t.isIdentifier(callee) && (callee.name === '_derived' || callee.name === '_fromRef');
}

/** 从标识符起的成员链：`item.hot` → 'item.hot'；计算属性、调用处截断 */
function chainOf(path: NodePath<t.Identifier>) {
  let chain = path.node.name;
  let current: NodePath = path;
  while (
    current.parentPath?.isMemberExpression() &&
    current.parentPath.node.object === current.node &&
    !current.parentPath.node.computed &&
    t.isIdentifier(current.parentPath.node.property)
  ) {
    current = current.parentPath;
    chain += `.${(current.node as t.MemberExpression & { property: t.Identifier }).property.name}`;
  }
  return chain;
}

/** 在事件回调（onXxx={() => …}）里：渲染时不执行，不算渲染读到的 */
function inEventHandler(path: NodePath, render: NodePath<t.Function>) {
  for (
    let fn = path.getFunctionParent();
    fn && fn !== render;
    fn = fn.parentPath?.getFunctionParent() ?? null
  ) {
    // 函数 → JSXExpressionContainer → JSXAttribute
    const attribute = fn.parentPath?.parentPath;
    if (
      attribute?.isJSXAttribute() &&
      t.isJSXIdentifier(attribute.node.name) &&
      /^on[A-Z]/.test(attribute.node.name.name)
    )
      return true;
  }
  return false;
}

/** 被赋值、自增的那一处（写，不是读） */
function isWritten(path: NodePath) {
  let current: NodePath = path;
  while (
    current.parentPath?.isMemberExpression() &&
    current.parentPath.node.object === current.node
  )
    current = current.parentPath;
  const parent = current.parentPath;
  return (
    (!!parent?.isAssignmentExpression() && current.key === 'left') || !!parent?.isUpdateExpression()
  );
}

/**
 * 只读渲染函数外面声明的东西（组件函数体里的状态、props、模块里的常量）：每次渲染生成的读取函数读的是同一批来源，
 * 运行时重新渲染时只换读取函数、不必重跑 effect 收集依赖（bind、select 的最后一个参数）。
 * 读了渲染函数里的局部变量、map 回调的参数时不算：它们每次渲染可能指向不同的响应式来源
 */
function readsOutsideRender(expression: NodePath, render: NodePath<t.Function>) {
  let stable = true;
  const check = (path: NodePath<t.Identifier>) => {
    if (!path.isReferencedIdentifier()) return;
    const binding = path.scope.getBinding(path.node.name);
    if (binding && (binding.path === render || binding.path.isDescendant(render))) stable = false;
  };
  if (expression.isIdentifier()) check(expression);
  else expression.traverse({ Identifier: check });
  return stable;
}

/** 在 JSX 属性（sx={…}、{...css.attrs(…)}）里：渲染时用到的样式 */
const inJsxAttribute = (path: NodePath) =>
  !!path.findParent((parent) => parent.isJSXAttribute() || parent.isJSXSpreadAttribute());

/** bind、select 的引用：有命名空间导入时用 css.bind，否则补一个具名导入（同一文件只补一次） */
function helperReference(
  program: NodePath<t.Program>,
  imports: StyleImports & { helpers?: Map<string, t.Identifier> },
  name: 'bind' | 'select',
): t.Expression {
  if (imports.namespace) {
    return t.memberExpression(t.identifier(imports.namespace), t.identifier(name));
  }
  imports.helpers ??= new Map();
  let local = imports.helpers.get(name);
  if (!local) {
    local = program.scope.generateUidIdentifier(name);
    imports.helpers.set(name, local);
    program.unshiftContainer(
      'body',
      t.importDeclaration(
        [t.importSpecifier(local, t.identifier(name))],
        t.stringLiteral(imports.source),
      ),
    );
  }
  return t.cloneNode(local);
}
