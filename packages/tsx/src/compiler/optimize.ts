/**
 * 第 6 步：渲染优化。JSX 交给 vue-jsx 后没有模板编译器的那几项优化，父组件一重新渲染，
 * 子组件就跟着重新渲染（插槽每次都是新的、没有 $stable；内联函数每次都是新的，props 比较时总算“变了”）。
 * 这里在不改变语义的前提下补上两项：
 *
 *   1. 稳定插槽：组件的子节点只用到“不会随这次渲染变”的变量时，插槽标 $stable，
 *      父组件因为别的状态重新渲染时，子组件不再跟着重做（内容里读到的响应式数据由子组件自己追踪）。
 *        <Box><Btn label="保存" /></Box>
 *        → <Box>{{ default: () => [<Btn label="保存" />], $stable: true }}</Box>
 *   2. 缓存：JSX 属性里的函数与常量数组、对象，只用到“不会随这次渲染变”的变量时，每个实例只创建一次。
 *        onPress={() => n++}  →  onPress={_cache[0] || (_cache[0] = () => n.value++)}
 *
 * “这次渲染才有的值”（渲染函数里的变量、map 回调的参数）一旦用到就不优化，保持 vue-jsx 原来的输出。
 * 稳定插槽还要求内容不读非响应式的可变数据（普通 let、...rest、字面量初始化的 const）：
 * 这类数据变了不会通知任何组件，以前靠父组件碰巧重新渲染才刷新。
 */
import { types as t, type NodePath } from '@babel/core';
import {
  isComponentSetup,
  isStyleNamespace,
  prependToBody,
  STYLE_SOURCE,
  type Binding,
} from './ast.ts';
import type { RuntimeImports } from './imports.ts';
import type { TrackedInfo } from './runes.ts';

/** 渲染优化要用到的前几步结果 */
export interface OptimizeContext {
  /** 生成运行时函数（forwardChildren、childrenStable）的导入 */
  imports: RuntimeImports;
  /** 符文与 props 的绑定（第 2 步解析出的） */
  tracked: Map<Binding, TrackedInfo>;
  /** ...rest 解构出的绑定：Vue 的 attrs，不是响应式的 */
  rest: Set<Binding>;
}

/** 一个变量对优化意味着什么 */
type Kind =
  /** 模块或组件 setup 里不会变的值：导入、函数、组合式函数的结果 */
  | 'constant'
  /** 符文与 props：读的是 .value，值会变，但读取会被追踪 */
  | 'reactive'
  /** 组件的 children：内容来自上层，稳不稳定要看上层（运行时判断） */
  | 'children'
  /** 会变、又不会通知任何组件的值：普通 let、...rest、字面量初始化的 const */
  | 'mutable'
  /** 这次渲染（或某次回调）才有的值：渲染函数里的变量、回调参数 */
  | 'local';

/** 子节点不能当插槽对象传的内置组件 */
const VUE_BUILTINS = new Set(['Teleport', 'KeepAlive', 'Suspense']);

/**
 * 元素里引用到、声明在它外面的变量（this 记为 null）：每个 JSX 元素退出时算一次，外层元素直接用，
 * 不再把里层整个子树重新遍历一遍（深层嵌套时那样是立方级）
 */
type Summaries = WeakMap<t.Node, readonly (Binding | null)[]>;

/** 第 6 步的入口：稳定插槽与属性值缓存，改动直接写在 AST 上（规则见文件开头） */
export function optimizeRender(program: NodePath<t.Program>, context: OptimizeContext) {
  const caches = new Map<NodePath<t.Function>, { id: t.Identifier; size: number }>();
  const summaries: Summaries = new WeakMap();
  // 按位置生成的 key：同一个文件里各处不同
  let sites = 0;
  const siteKey = () => `__site${sites++}`;

  /** setup 里的缓存数组：用到时才声明 */
  const cacheSlot = (setup: NodePath<t.Function>, value: t.Expression) => {
    let cache = caches.get(setup);
    if (!cache) {
      cache = { id: setup.scope.generateUidIdentifier('cache'), size: 0 };
      caches.set(setup, cache);
    }
    const slot = t.memberExpression(
      t.identifier(cache.id.name),
      t.numericLiteral(cache.size++),
      true,
    );
    // _cache[i] || (_cache[i] = value)：第一次渲染用到时创建
    return t.logicalExpression('||', slot, t.assignmentExpression('=', t.cloneNode(slot), value));
  };

  program.traverse({
    JSXAttribute(path) {
      cacheAttributeValue(path, context, cacheSlot);
    },
    JSXElement: {
      exit(path) {
        // 先汇总（看的是改写前的子节点），再改写子节点
        const external = externalReferences(path, summaries).filter(
          (binding) => binding === null || !declaredWithin(binding, path),
        );
        stabilizeChildren(path, context, summaries, siteKey);
        summaries.set(path.node, external);
      },
    },
  });

  for (const [setup, cache] of caches) {
    const declaration = t.variableDeclaration('const', [
      t.variableDeclarator(t.identifier(cache.id.name), t.arrayExpression([])),
    ]);
    prependToBody(setup, [declaration]);
  }
}

type CacheSlot = (setup: NodePath<t.Function>, value: t.Expression) => t.Expression;

// ───────────────────────── 缓存属性值 ─────────────────────────

/** attr={() => …}、attr={[a, b]}、attr={{ … }}：只用到实例内不变的值时，每个实例只创建一次 */
function cacheAttributeValue(
  attribute: NodePath<t.JSXAttribute>,
  context: OptimizeContext,
  cacheSlot: CacheSlot,
) {
  const container = attribute.get('value');
  if (!container.isJSXExpressionContainer()) return;
  const value = container.get('expression');
  const isFunction = value.isArrowFunctionExpression() || value.isFunctionExpression();
  if (!isFunction && !value.isArrayExpression() && !value.isObjectExpression()) return;
  const setup = enclosingSetup(attribute);
  if (!setup) return;
  if (!isCacheable(value as NodePath<t.Expression>, setup, context)) return;
  // 不跳过：函数里的 JSX（trigger={(props) => <Button …>}）接着优化
  value.replaceWith(cacheSlot(setup, value.node as t.Expression));
}

/**
 * 函数：闭包读的都是活的绑定，只要不用到这次渲染才有的变量就能缓存。
 * 数组、对象：直接读到的值（不在函数里的）必须是不会变的常量；符文的值会变，不能缓存。
 * 常量本身不变，它里面的属性却可能变（组合式函数返回的 store、导入的 _state 对象）：
 * 读它的成员、把它展开都不缓存，只有 css.create 的样式表与命名空间导入的一层成员例外
 */
function isCacheable(
  value: NodePath<t.Expression>,
  setup: NodePath<t.Function>,
  context: OptimizeContext,
) {
  let cacheable = true;
  forEachReference(value, setup, context, (kind, insideFunction, reference) => {
    if (kind === 'local') cacheable = false;
    else if (insideFunction) return;
    else if (kind !== 'constant') cacheable = false;
    else if (readsInside(reference) && !isFrozenRead(reference)) cacheable = false;
  });
  // 数组、对象里直接的调用、new、自增等每次可能得到不同的值
  if (cacheable && !value.isFunction()) {
    value.traverse({
      Function(inner) {
        inner.skip();
      },
      'CallExpression|NewExpression|TaggedTemplateExpression|UpdateExpression|AssignmentExpression|AwaitExpression|YieldExpression'() {
        cacheable = false;
      },
    });
  }
  return cacheable;
}

/** 读的是常量里面的东西：obj.x、obj?.x、...obj */
function readsInside(reference: NodePath) {
  const parent = reference.parentPath;
  if (!parent) return false;
  if (parent.isSpreadElement()) return true;
  return (
    (parent.isMemberExpression() || parent.isOptionalMemberExpression()) &&
    parent.node.object === reference.node
  );
}

/** 样式入口里结果不再变的工厂 */
const STYLE_FACTORIES = new Set(['create', 'createTheme', 'defineVars', 'defineMarker', 'recipe']);

/**
 * 读的成员不会变：同一文件里 css.create（等）的结果；命名空间导入（import * as icons，样式入口的 import { css }）的一层成员。
 * 再往下一层（icons.X.y）、或别的常量的成员都可能会变
 */
function isFrozenRead(reference: NodePath) {
  if (!reference.isIdentifier()) return false;
  const binding = reference.scope.getBinding(reference.node.name);
  if (!binding) return false;
  const member = reference.parentPath!;
  const styleEntry =
    isStyleNamespace(binding.path.node) &&
    t.isImportDeclaration(binding.path.parent) &&
    binding.path.parent.source.value === STYLE_SOURCE;
  if (binding.path.isImportNamespaceSpecifier() || styleEntry) {
    const outer = member.parentPath;
    const deeper =
      (outer?.isMemberExpression() || outer?.isOptionalMemberExpression()) &&
      outer.node.object === member.node;
    return member.isMemberExpression() && !deeper;
  }
  const init = binding.path.isVariableDeclarator() ? unwrapTypes(binding.path.node.init) : null;
  // 模块顶层字面量写的数据（setup 里的字面量是 mutable，到不了这里）
  if (t.isObjectExpression(init) || t.isArrayExpression(init)) return true;
  if (!t.isCallExpression(init) || !t.isMemberExpression(init.callee)) return false;
  const { object, property } = init.callee;
  if (!t.isIdentifier(property) || !STYLE_FACTORIES.has(property.name)) return false;
  if (!t.isIdentifier(object)) return false;
  const source = binding.scope.getBinding(object.name)?.path.parent;
  return t.isImportDeclaration(source) && source.source.value === STYLE_SOURCE;
}

// ───────────────────────── 稳定插槽 ─────────────────────────

/** 组件元素的子节点改成显式的插槽对象，按用到的变量标 $stable */
function stabilizeChildren(
  element: NodePath<t.JSXElement>,
  context: OptimizeContext,
  summaries: Summaries,
  siteKey: () => string,
) {
  if (!isComponentElement(element)) return;
  if (element.node.children.some((child) => t.isJSXSpreadChild(child))) return;
  const children = t.react.buildChildren(element.node) as t.Expression[];
  if (!children.length) return;
  // 已经是插槽对象（作者自己写的，或之前生成的）
  if (children.length === 1 && t.isObjectExpression(children[0])) return;

  const setup = enclosingSetup(element);
  const childPaths = element.get('children');
  let dynamic = false;
  let usesChildren = false;
  for (const child of childPaths) {
    if (child.isJSXText()) continue;
    for (const binding of externalReferences(child, summaries)) {
      // 子节点自己里面声明的（回调参数、局部变量）不算
      if (binding && declaredWithin(binding, child)) continue;
      const kind = binding ? kindOf(binding, setup, context) : 'local';
      if (kind === 'local' || kind === 'mutable') dynamic = true;
      if (kind === 'children') usesChildren = true;
    }
  }
  // 用到了这次渲染才有的值：保持 vue-jsx 原来的输出
  if (dynamic) return;

  const only = children.length === 1 ? children[0]! : undefined;
  let slots: t.Expression;
  if (only && isChildrenRead(only, element, context)) {
    // <X>{children}</X>：原样转交，稳不稳定跟着上层（运行时判断），带参数的渲染函数原样交出
    if (!setup) return;
    slots = context.imports.runtime('forwardChildren', [propsOf(setup)]);
    // vue-jsx 只对带源码位置的调用子节点做运行时的插槽判断（_isSlot），没有位置的当成内容再包一层。
    // 分几遍编译时重新解析会补上位置，同一遍里接着跑 vue-jsx（代码演练场）就要自己借元素的
    slots.loc = element.node.loc;
  } else {
    // 唯一的子节点是导入的标识符：可能是渲染函数，也可能是内容，看不出来，保持 vue-jsx 的运行时判断（_isSlot）
    if (only && t.isIdentifier(only) && isImported(only, element)) return;
    const content =
      only && (isFunctionNode(only) || bindsFunction(only, element))
        ? only // 函数子节点（含绑定到函数的变量 {renderRow}）：带参数的是渲染函数，由子组件调用
        : t.arrowFunctionExpression([], t.arrayExpression(children));
    const stable = usesChildren
      ? context.imports.runtime('childrenStable', [])
      : t.booleanLiteral(true);
    // 必须是对象字面量：vue-jsx 只把字面量（与调用的结果）当插槽对象，别的表达式会被当成内容再包一层
    slots = t.objectExpression([
      t.objectProperty(t.identifier('default'), content),
      t.objectProperty(t.identifier('$stable'), stable),
    ]);
    keyBySite(element, setup, siteKey);
  }
  element.node.children = [t.jsxExpressionContainer(slots)];
}

/**
 * 标了 $stable 的组件按 JSX 的位置给一个 key：两处同类型的组件出现在同一位置时（`cond ? <Grid>A</Grid> : <Grid>B</Grid>`、
 * 分支里的第 n 个子元素、`wide ? sidebarA() : sidebarB()` 两个渲染片段），没有 key 会被当成同一个节点更新，
 * 稳定插槽又让子组件（以及它转交 children 的下一层）跳过重渲染，显示的还是另一处的内容。
 * 模板编译器给 v-if 的各个分支加 key 是同样的道理。只给每次渲染最多出现一次的元素加：渲染函数里直接写的、
 * 无参的渲染片段里直接写的；回调（map）、循环里的元素与带参数的函数会重复出现，同一位置的 key 相同会冲突；已经写了 key 的不动
 */
function keyBySite(
  element: NodePath<t.JSXElement>,
  setup: NodePath<t.Function> | null,
  siteKey: () => string,
) {
  const attributes = element.node.openingElement.attributes;
  if (attributes.some((attribute) => t.isJSXAttribute(attribute) && attribute.name.name === 'key'))
    return;
  const render = element.getFunctionParent();
  if (!render || !(isRenderFunction(render, setup) || isRenderFragment(render, setup))) return;
  const stop = element.findParent((parent) => parent.node === render.node || parent.isLoop());
  if (stop?.node !== render.node) return;
  attributes.push(t.jsxAttribute(t.jsxIdentifier('key'), t.stringLiteral(siteKey())));
}

/** setup 返回的渲染函数：`return () => …`，或 setup 直接写成 `() => () => …` */
function isRenderFunction(fn: NodePath<t.Function>, setup: NodePath<t.Function> | null) {
  if (!setup) return false;
  if (fn.parentPath?.node === setup.node) return true;
  return fn.parentPath?.isReturnStatement() === true && fn.getFunctionParent()?.node === setup.node;
}

/**
 * 无参的渲染片段：setup 里或模块顶层用 const 声明的无参函数（`const header = () => <Bar>…</Bar>`），
 * 渲染时调用、拼进渲染函数的结果，每次渲染最多出现一次（带参数的可能对几项各调一次，不算）
 */
function isRenderFragment(fn: NodePath<t.Function>, setup: NodePath<t.Function> | null) {
  if (fn.node.params.length > 0) return false;
  const declarator = fn.parentPath;
  if (!declarator?.isVariableDeclarator() || declarator.node.init !== fn.node) return false;
  const declaration = declarator.parentPath;
  if (!declaration?.isVariableDeclaration() || declaration.node.kind !== 'const') return false;
  const owner = declaration.getFunctionParent();
  return owner === null ? setup === null : owner.node === setup?.node;
}

const isFunctionNode = (node: t.Node) =>
  t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);

/** 标识符绑定到函数：const renderRow = (row) => …、function renderRow() {} */
function bindsFunction(node: t.Expression, element: NodePath) {
  if (!t.isIdentifier(node)) return false;
  const binding = element.scope.getBinding(node.name);
  if (!binding?.constant) return false;
  if (binding.path.isFunctionDeclaration()) return true;
  const init = binding.path.isVariableDeclarator() ? binding.path.node.init : null;
  return !!init && isFunctionNode(init);
}

/** 标识符来自 import */
function isImported(node: t.Identifier, element: NodePath) {
  const path = element.scope.getBinding(node.name)?.path;
  return (
    !!path &&
    (path.isImportSpecifier() ||
      path.isImportDefaultSpecifier() ||
      path.isImportNamespaceSpecifier())
  );
}

/** 大写开头或 a.B 形式的标签；Vue 的 Teleport、KeepAlive、Suspense 子节点不是插槽 */
function isComponentElement(element: NodePath<t.JSXElement>) {
  const name = element.node.openingElement.name;
  if (t.isJSXMemberExpression(name)) return true;
  if (!t.isJSXIdentifier(name) || !/^[A-Z]/.test(name.name)) return false;
  const binding = element.scope.getBinding(name.name);
  const specifier = binding?.path;
  if (
    specifier?.isImportSpecifier() &&
    (specifier.parent as t.ImportDeclaration).source.value === 'vue' &&
    t.isIdentifier(specifier.node.imported) &&
    VUE_BUILTINS.has(specifier.node.imported.name)
  ) {
    return false;
  }
  return !VUE_BUILTINS.has(name.name);
}

/** 子节点就是 children（第 3 步已改写成 unref(children)） */
function isChildrenRead(node: t.Expression, element: NodePath, context: OptimizeContext) {
  const read = t.isCallExpression(node) && node.arguments.length === 1 ? node.arguments[0] : node;
  if (!t.isIdentifier(read)) return false;
  const binding = element.scope.getBinding(read.name);
  return !!binding && !!context.tracked.get(binding)?.childrenOf;
}

/** setup 的第一个参数（第 1 步生成的 __props） */
function propsOf(setup: NodePath<t.Function>) {
  const first = setup.node.params[0];
  return t.isIdentifier(first) ? t.identifier(first.name) : t.objectExpression([]);
}

// ───────────────────────── 变量分析 ─────────────────────────

/** 所在的组件 setup（_component 的参数函数）；不在组件里时为 null */
function enclosingSetup(path: NodePath): NodePath<t.Function> | null {
  for (let fn = path.getFunctionParent(); fn; fn = fn.parentPath?.getFunctionParent() ?? null) {
    if (isComponentSetup(fn)) return fn;
  }
  return null;
}

/**
 * 子树里引用的变量（含 this，记为 null；全局变量不算）。已经汇总过的元素用它的汇总、不再进去，
 * 所以每个引用只在声明它的地方以内逐层往上传，不会被每一层祖先各遍历一次
 */
function externalReferences(path: NodePath, summaries: Summaries): (Binding | null)[] {
  // 已经汇总过的元素（子节点就是一个元素时）直接用：进到它里面会碰到改写插槽时新建的函数，Babel 要重新建它的作用域
  const own = summaries.get(path.node);
  if (own) return [...own];
  const found: (Binding | null)[] = [];
  const add = (reference: NodePath, name: string) => {
    const binding = reference.scope.getBinding(name);
    if (binding) found.push(binding);
  };
  if (path.isIdentifier()) add(path, path.node.name);
  path.traverse({
    JSXElement(inner) {
      const summary = summaries.get(inner.node);
      if (!summary) return;
      found.push(...summary);
      inner.skip();
    },
    Identifier(reference) {
      if (reference.isReferencedIdentifier()) add(reference, reference.node.name);
    },
    JSXIdentifier(reference) {
      if (reference.isReferencedIdentifier()) add(reference, reference.node.name);
    },
    ThisExpression() {
      found.push(null);
    },
  });
  return found;
}

/** 变量是不是在 path 里面声明的：有源码位置时比较位置（不用逐层往上找），生成的节点退回 isDescendant */
function declaredWithin(binding: Binding, path: NodePath) {
  const scope = binding.scope.path.node;
  const outer = path.node;
  if (scope.start != null && scope.end != null && outer.start != null && outer.end != null) {
    return scope.start >= outer.start && scope.end <= outer.end;
  }
  return isWithin(binding.scope.path, path);
}

/** 表达式用到的外部变量逐个回调：变量的性质、引用是否在表达式里的函数中，以及引用本身 */
function forEachReference(
  expression: NodePath,
  setup: NodePath<t.Function> | null,
  context: OptimizeContext,
  visit: (kind: Kind, insideFunction: boolean, reference: NodePath) => void,
) {
  const check = (reference: NodePath, name: string) => {
    const binding = reference.scope.getBinding(name);
    // 全局变量（Math、window）
    if (!binding) return;
    // 表达式自己里面声明的（回调参数、局部变量）
    if (isWithin(binding.scope.path, expression)) return;
    visit(kindOf(binding, setup, context), isInsideFunction(reference, expression), reference);
  };
  if (expression.isIdentifier()) check(expression, expression.node.name);
  if (expression.isThisExpression()) visit('local', false, expression);
  expression.traverse({
    Identifier(reference) {
      if (reference.isReferencedIdentifier()) check(reference, reference.node.name);
    },
    JSXIdentifier(reference) {
      if (reference.isReferencedIdentifier()) check(reference, reference.node.name);
    },
    ThisExpression(reference) {
      visit('local', isInsideFunction(reference, expression), reference);
    },
  });
}

function kindOf(
  binding: Binding,
  setup: NodePath<t.Function> | null,
  context: OptimizeContext,
): Kind {
  const tracked = context.tracked.get(binding);
  if (tracked) return tracked.childrenOf ? 'children' : 'reactive';
  if (context.rest.has(binding)) return 'mutable';
  const owner = binding.scope.getFunctionParent()?.path ?? null;
  // 模块顶层，或组件外层的函数（工厂函数的参数与局部变量，对组件来说是固定的）
  const outside = owner === null || (setup !== null && isWithin(setup, owner) && owner !== setup);
  if (outside) return binding.constant ? 'constant' : 'mutable';
  if (owner !== setup) return 'local';
  // 组件 setup 里。第一个参数是 props（第 1 步生成的 __props）：只出现在转交 children 的生成代码里
  if (binding.kind === 'param')
    return binding.path.node === setup?.node.params[0] ? 'children' : 'mutable';
  if (!binding.constant) return 'mutable';
  if (binding.kind === 'hoisted' || binding.kind === 'module') return 'constant';
  const declarator = binding.path;
  const init = declarator.isVariableDeclarator() ? unwrapTypes(declarator.node.init) : null;
  // 字面量建的对象、数组可能被直接改（push、赋属性），改了不会通知谁
  if (t.isObjectExpression(init) || t.isArrayExpression(init) || t.isNewExpression(init)) {
    return 'mutable';
  }
  return 'constant';
}

/** 去掉只影响类型的外壳：[] as T[]、{…} satisfies S、x!、(x) */
function unwrapTypes(node: t.Expression | null | undefined): t.Expression | null | undefined {
  let current = node;
  while (
    t.isTSAsExpression(current) ||
    t.isTSSatisfiesExpression(current) ||
    t.isTSNonNullExpression(current) ||
    t.isTSTypeAssertion(current) ||
    t.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

/** inner 是否就是 outer 或在它里面 */
function isWithin(inner: NodePath, outer: NodePath) {
  return inner === outer || inner.isDescendant(outer);
}

/** 引用是否在表达式里的某个函数中（调用时才读取） */
function isInsideFunction(reference: NodePath, expression: NodePath) {
  for (let path = reference.parentPath; path && path !== expression; path = path.parentPath) {
    if (path.isFunction()) return true;
  }
  return expression.isFunction() && reference !== expression;
}
