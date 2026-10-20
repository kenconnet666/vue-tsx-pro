/** _component 的 props：参数解构换成 prop 访问器，并补上组件名与 props 声明 */
import { types as t, type NodePath } from '@babel/core';
import { prependToBody } from './ast.ts';
import { fail } from './errors.ts';
import type { RuntimeImports } from './imports.ts';
import { runeOf, type TrackedInfo } from './runes.ts';

interface PropsContext {
  imports: RuntimeImports;
  filename: string | undefined;
  /** 登记解构出的变量，之后统一把读写改写成 .value */
  track: (declarator: t.VariableDeclarator, info: TrackedInfo) => void;
  /** 登记 ...rest：渲染优化要知道它是不会通知更新的 attrs */
  trackRest: (declarator: t.VariableDeclarator) => void;
}

/**
 * 参数解构 → 实例内的 prop 访问器（参考 Svelte 5 的 $.prop）：
 *
 *   _component(({ size = 'md', icon = pick(size), checked = _bindable(false), ...rest }) => …)
 *   ↓
 *   _component((__props, __ctx) => {
 *     const size = prop(__props, 'size', () => 'md')
 *     const icon = prop(__props, 'icon', () => pick(size.value))
 *     const checked = bindable(__props, 'checked', () => false, __ctx.emit)
 *     const rest = restProps(__props, __ctx, true)   // attrs 加上 children；已单独解构 children 时为 false
 *     …
 *   }, { name: 'Toggle', props: ['size', 'icon', 'checked', 'onUpdate:checked'] })
 *
 * 默认值在实例内惰性求值：可以是任意表达式，也可以引用前面的 prop。
 */
export function declareProps(setup: NodePath<t.Function>, context: PropsContext) {
  const params = setup.get('params');
  const pattern = params[0];
  const names: string[] = [];

  if (pattern) {
    if (params.length > 1) throw fail(params[1]!, '组件只接收一个参数：props 解构');
    if (!pattern.isObjectPattern()) {
      throw fail(
        pattern,
        '请解构 props，例如 _component(({ size = "md", ...rest }) => …)；解构出的变量会保持响应式',
      );
    }

    const propsId = setup.scope.generateUidIdentifier('props');
    const ctxId = setup.scope.generateUidIdentifier('ctx');
    const declarations: t.Statement[] = [];

    for (const property of pattern.get('properties')) {
      // ...rest：没有声明为 prop 的属性（attrs），没有单独解构 children 时再加上 children，与 TS 推出的类型一致
      if (property.isRestElement()) {
        const local = property.node.argument;
        if (!t.isIdentifier(local)) throw fail(property, '...rest 需要是一个变量名');
        const withChildren = t.booleanLiteral(!destructuresChildren(pattern.node));
        const init = context.imports.runtime('restProps', [propsId, ctxId, withChildren]);
        const declarator = t.variableDeclarator(local, init);
        context.trackRest(declarator);
        declarations.push(t.variableDeclaration('const', [declarator]));
        continue;
      }

      const { key, local, fallback, isBindable } = readPropPattern(property);
      // children 来自默认插槽（见 runtime/component.ts），不是真正的 Vue prop
      if (key !== 'children') names.push(key);
      if (isBindable) names.push(`onUpdate:${key}`);

      const thunk = fallback && t.arrowFunctionExpression([], fallback);
      const init =
        key === 'children' && !isBindable
          ? context.imports.runtime('childrenProp', [propsId, ...(thunk ? [thunk] : [])])
          : isBindable
            ? context.imports.runtime('bindable', [
                propsId,
                t.stringLiteral(key),
                thunk ?? t.identifier('undefined'),
                t.memberExpression(ctxId, t.identifier('emit')),
              ])
            : context.imports.runtime('prop', [
                propsId,
                t.stringLiteral(key),
                ...(thunk ? [thunk] : []),
              ]);
      const declarator = t.variableDeclarator(t.identifier(local), init);
      context.track(declarator, {
        // 普通 prop 也可以写：只改组件本地，父级传入新值时以父级为准（同 Svelte）；children 是父级的内容，只读
        writable: key !== 'children',
        source: isBindable ? '_bindable' : 'prop',
        childrenOf: key === 'children' ? setup.node : undefined,
      });
      declarations.push(t.variableDeclaration('const', [declarator]));
    }

    // 参数换成 (__props: 原类型, __ctx)，声明按书写顺序放到函数体开头
    propsId.typeAnnotation = pattern.node.typeAnnotation;
    setup.node.params = [propsId, ctxId];
    prependToBody(setup, declarations);
  }

  addComponentOptions(setup.parentPath as NodePath<t.CallExpression>, names, context.filename);
}

function destructuresChildren(pattern: t.ObjectPattern) {
  return pattern.properties.some(
    (property) =>
      t.isObjectProperty(property) &&
      !property.computed &&
      (t.isIdentifier(property.key, { name: 'children' }) ||
        t.isStringLiteral(property.key, { value: 'children' })),
  );
}

/** 读取一项 props 解构：键名（驼峰）、本地变量名、默认值，以及是否 _bindable */
function readPropPattern(property: NodePath) {
  if (!property.isObjectProperty() || property.node.computed) {
    throw fail(property, 'props 解构不支持计算属性名');
  }
  const keyNode = property.node.key;
  const key = t.isIdentifier(keyNode)
    ? keyNode.name
    : t.isStringLiteral(keyNode)
      ? keyNode.value
      : null;
  if (key === null) throw fail(property, 'props 的键名需要是标识符或字符串');

  let value = property.get('value') as NodePath;
  let fallback: t.Expression | undefined;
  let isBindable = false;
  if (value.isAssignmentPattern()) {
    const right = value.get('right');
    if (right.isCallExpression() && runeOf(right) === '_bindable') {
      isBindable = true;
      fallback = right.node.arguments[0] as t.Expression | undefined;
    } else {
      fallback = right.node;
    }
    value = value.get('left');
  }
  if (!value.isIdentifier()) {
    throw fail(value, 'props 不支持嵌套解构：先解构出整个值，再在函数体里读取它的属性');
  }
  // Vue 把声明的 prop 名与传入的属性名都转成驼峰：'aria-label' 要按 ariaLabel 读取
  const camelKey = key.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
  return { key: camelKey, local: value.node.name, fallback, isBindable };
}

/**
 * 给 _component 补上第二个参数：组件名（取自 const X = _component(...)）与 props 声明。
 * 作者已经写了选项对象时，只补充其中缺少的项。
 */
function addComponentOptions(
  call: NodePath<t.CallExpression>,
  names: string[],
  filename: string | undefined,
) {
  const generated: t.ObjectProperty[] = [];
  const name = componentName(call, filename);
  if (name) generated.push(t.objectProperty(t.identifier('name'), t.stringLiteral(name)));
  if (names.length) {
    const list = t.arrayExpression(names.map((n) => t.stringLiteral(n)));
    generated.push(t.objectProperty(t.identifier('props'), list));
  }
  if (!generated.length) return;

  const existing = call.node.arguments[1];
  if (!existing) {
    call.node.arguments.push(t.objectExpression(generated));
  } else if (t.isObjectExpression(existing)) {
    const has = (name: string) =>
      existing.properties.some((p) => t.isObjectProperty(p) && t.isIdentifier(p.key, { name }));
    existing.properties.unshift(...generated.filter((p) => !has((p.key as t.Identifier).name)));
  } else {
    call.node.arguments[1] = t.objectExpression([
      ...generated,
      t.spreadElement(existing as t.Expression),
    ]);
  }
}

/** const X = _component(...) 取变量名；export default _component(...) 取文件名，index.tsx 取所在目录名 */
function componentName(call: NodePath<t.CallExpression>, filename: string | undefined) {
  const parent = call.parentPath;
  if (parent?.isVariableDeclarator() && t.isIdentifier(parent.node.id)) return parent.node.id.name;
  if (!parent?.isExportDefaultDeclaration() || !filename) return undefined;
  const parts = filename.split(/[\\/]/);
  const base = parts.at(-1)!.replace(/\.[^.]+$/, '');
  const name = base === 'index' ? parts.at(-2) : base;
  return name && /^[A-Za-z]/.test(name) ? name : undefined;
}
