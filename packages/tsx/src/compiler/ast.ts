/** 与符文无关的 AST 判断与改写工具 */
import { types as t, type NodePath, type Scope } from '@babel/core';
import { fail } from './errors.ts';

/** 作用域里的一个绑定（@babel/traverse 的 Binding；本包只依赖 @babel/core，从 Scope 取它的类型） */
export type Binding = NonNullable<ReturnType<Scope['getBinding']>>;

/** 文件的语言：.tsx、.jsx 才编译 JSX，.tsx 才在编译时去掉类型（.ts 的类型由打包工具去掉） */
export type Language = 'ts' | 'tsx' | 'js' | 'jsx';

/** 认作 StyleX 的导入来源：官方包与本包带中文注释的入口（运行时相同，见 src/stylex） */
export const STYLEX_SOURCES: readonly string[] = ['@stylexjs/stylex', '@vue-tsx-pro/tsx/stylex'];

/**
 * 模块的语言：Vue 单文件组件里的脚本（X.vue?vue&type=script&lang.tsx）看查询参数，其他看扩展名；
 * 不是脚本时返回 undefined
 */
export function languageOf(id: string): Language | undefined {
  const [file = '', query = ''] = id.split('?');
  const match = /(?:^|&)lang\.([jt]sx?)(?:&|$)/.exec(query) ?? /\.[cm]?([jt]sx?)$/.exec(file);
  return match?.[1] as Language | undefined;
}

/** Babel 解析插件：.ts 不能开 JSX，否则 <T>value 类型断言、<T>(x) => x 泛型箭头函数会被当作 JSX 解析 */
export function parserPlugins(lang: Language | undefined): ('jsx' | 'typescript')[] {
  return lang === 'ts' ? ['typescript'] : ['jsx', 'typescript'];
}

/** 组件边界：第一个参数是 setup 函数的调用 */
const COMPONENT_CALLEES = new Set(['_component', 'defineComponent']);

/** 是否是组件（_component 或 Vue 的 defineComponent）的 setup 函数 */
export function isComponentSetup(path: NodePath<t.Function>) {
  const call = path.parentPath;
  return (
    !!call?.isCallExpression() &&
    call.node.arguments[0] === path.node &&
    t.isIdentifier(call.node.callee) &&
    COMPONENT_CALLEES.has(call.node.callee.name)
  );
}

/** 由我们编译 props 的组件：_component(setup)。Vue 自己的 defineComponent 保持原样 */
export function isPropsComponent(path: NodePath<t.Function>) {
  const call = path.parentPath;
  return (
    !!call?.isCallExpression() &&
    call.node.arguments[0] === path.node &&
    t.isIdentifier(call.node.callee, { name: '_component' })
  );
}

/**
 * 是否位于组件的渲染函数（setup 返回的函数）之内，包括其中嵌套的回调。
 * 渲染函数每次更新都会重新执行，在里面创建的状态会被重置。
 */
export function isInsideRender(path: NodePath): boolean {
  return renderFunctionOf(path) !== null;
}

/** path 所在的渲染函数（组件函数体返回的那个函数）；不在渲染函数里时 null */
export function renderFunctionOf(path: NodePath): NodePath<t.Function> | null {
  for (let fn = path.getFunctionParent(); fn; fn = fn.parentPath?.getFunctionParent() ?? null) {
    const parent = fn.parentPath;
    // _component(() => { ...; return () => <div /> })
    if (parent?.isReturnStatement()) {
      const owner = parent.getFunctionParent();
      if (owner && isComponentSetup(owner)) return fn;
    }
    // _component(() => () => <div />)
    if (
      parent?.isArrowFunctionExpression() &&
      parent.node.body === fn.node &&
      isComponentSetup(parent)
    ) {
      return fn;
    }
  }
  return null;
}

/** 是否是组件元素（大写开头或 a.B 形式的标签）的直接子节点表达式 */
export function isComponentChild(container: NodePath) {
  const element = container.parentPath;
  if (!container.isJSXExpressionContainer() || !element?.isJSXElement()) return false;
  const name = element.node.openingElement.name;
  return t.isJSXMemberExpression(name) || (t.isJSXIdentifier(name) && /^[A-Z]/.test(name.name));
}

/** 是否是从 vue 导入的 watch 的监听源：watch(x, …) 或 watch([x, y], …) */
export function isVueWatchSource(path: NodePath) {
  const parent = path.parentPath;
  const call = parent?.isArrayExpression() ? parent.parentPath : parent;
  if (!call?.isCallExpression()) return false;
  const source = call.node.arguments[0];
  if (source !== path.node && source !== parent?.node) return false;
  const callee = call.node.callee;
  if (!t.isIdentifier(callee)) return false;
  const binding = call.scope.getBinding(callee.name);
  const specifier = binding?.path;
  return (
    !!specifier?.isImportSpecifier() &&
    t.isIdentifier(specifier.node.imported, { name: 'watch' }) &&
    (specifier.parent as t.ImportDeclaration).source.value === 'vue'
  );
}

/** 引用出现在类型里（typeof x、类型注解）：不是运行时读取，不改写 */
export function isInTypePosition(path: NodePath) {
  return !!path.findParent(
    (p) => p.isTSType() || p.isTSTypeQuery() || p.isTSInterfaceDeclaration(),
  );
}

/** 路径对应的节点是否仍在树上（避免对已被替换的旧路径重复改写） */
export function isAttached(path: NodePath) {
  const container = path.container as any;
  if (!container) return false;
  const value = path.listKey ? container[path.key as number] : container[path.key as string];
  return value === path.node;
}

/** 箭头函数简写体先补成块，再在开头插入声明 */
export function prependToBody(fn: NodePath<t.Function>, statements: t.Statement[]) {
  if (!statements.length) return;
  const body = fn.get('body');
  if (body.isBlockStatement()) {
    body.unshiftContainer('body', statements);
  } else {
    body.replaceWith(
      t.blockStatement([...statements, t.returnStatement(body.node as t.Expression)]),
    );
  }
}

/** 把标识符 x 改成 x.value（JSX 标签名改成 <x.value />，对象简写改成 { x: x.value }） */
export function replaceWithValue(path: NodePath) {
  const node = path.node;
  if (t.isJSXIdentifier(node)) {
    path.replaceWith(t.jsxMemberExpression(t.jsxIdentifier(node.name), t.jsxIdentifier('value')));
    return;
  }
  if (!t.isIdentifier(node)) return;
  // 对象简写 { x }、带默认值的简写 { x = 1 }（解构赋值里）：改写后不再是简写
  const parent = path.parentPath;
  const property = parent?.isAssignmentPattern() ? parent.parentPath : parent;
  const value = parent?.isAssignmentPattern() ? parent.node : node;
  if (property?.isObjectProperty() && property.node.shorthand && property.node.value === value) {
    property.node.shorthand = false;
  }
  path.replaceWith(t.memberExpression(t.identifier(node.name), t.identifier('value')));
  path.skip();
}

/**
 * 一次写入里，属于该绑定的所有目标标识符。
 * 支持 x = 1、x += 1、x++、[a, b] = [b, a]、({ x } = obj)、for (x of list)
 */
export function writeTargets(violation: NodePath, binding: Binding): NodePath[] {
  let target: NodePath;
  switch (violation.node.type) {
    case 'AssignmentExpression':
    case 'ForOfStatement':
    case 'ForInStatement':
      target = violation.get('left') as NodePath;
      break;
    case 'UpdateExpression':
      target = violation.get('argument') as NodePath;
      break;
    default:
      throw fail(violation, `不支持这种方式修改响应式变量 ${binding.identifier.name}`);
  }
  if (target.isIdentifier()) return [target];

  // 解构赋值：只挑出解析到同一绑定、且处于“被赋值”位置的标识符
  const found: NodePath[] = [];
  target.traverse({
    Identifier(path) {
      const parent = path.parentPath;
      // 属性名不是写入目标：{ x: y } 的 x、简写 { x } 里与值分开的那个键节点
      const isKey =
        parent.isObjectProperty() && parent.node.key === path.node && !parent.node.computed;
      if (isKey || path.node.name !== binding.identifier.name) return;
      if (path.scope.getBinding(path.node.name) === binding) found.push(path);
    },
  });
  return found;
}

/** 在一条变量声明里找到声明 name 的那一项 */
export function findDeclarator(declaration: NodePath<t.VariableDeclaration>, name: string) {
  return declaration.node.declarations.find((d) =>
    Object.keys(t.getBindingIdentifiers(d.id)).includes(name),
  );
}
