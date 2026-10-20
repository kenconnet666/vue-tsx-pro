/** JSX 属性：属性={_bind(x)} 换成 Vue 的 v-model；Vue 指令报错并给出 TSX 写法 */
import { types as t, type NodePath } from '@babel/core';
import { fail } from './errors.ts';
import { memberChain } from './runes.ts';

/** Vue 指令在 TSX 里都有更自然的写法 */
const DIRECTIVE_HINTS: Record<string, string> = {
  model:
    '双向绑定请写成 属性={_bind(x)}，例如 <Switch checked={_bind(on)} />、<input value={_bind.trim(name)} />',
  show: '显示与隐藏请用原生属性 hidden={!visible}，或条件渲染 {visible && <X />}',
  slots: '没有插槽：内容写成子节点（children），具名内容作为 JSX prop 传入',
  html: '请改用 innerHTML={html}',
  text: '请直接把文本写成子节点 {text}',
};

/** TSX 里有更自然写法的 Vue 指令属性（v-html、v-text…）直接报错，并给出替代写法 */
export function rejectDirective(attribute: NodePath<t.JSXAttribute>) {
  const { name } = attribute.node;
  const full = t.isJSXNamespacedName(name) ? `${name.namespace.name}:${name.name.name}` : name.name;
  if (!full.startsWith('v-')) return;
  const directive = full.slice(2).split(/[:_]/)[0]!;
  throw fail(
    attribute,
    DIRECTIVE_HINTS[directive] ?? `不支持 Vue 指令 ${full}：请改用 ref 回调或组合式函数`,
  );
}

/**
 * 属性={_bind(x)} → Vue 的 v-model 协议（此时 x 已改写为 x.value）：
 *   <Switch checked={_bind(on)} />      → <Switch checked={on.value} onUpdate:checked={($event) => (on.value = $event)} />
 *   <input value={_bind.trim(name)} />  → <input v-model_trim={name.value} />
 * 组件直接写出值与更新回调（同 vue-jsx 对 v-model:x 的输出），回调就能被渲染优化缓存；
 * 原生输入框仍交给 vue-jsx 的 v-model 指令。属性名就是 prop 本身，补全、跳转、重命名都由 TypeScript 原生支持。
 */
export function rewriteBind(call: NodePath<t.CallExpression>) {
  const container = call.parentPath;
  const attribute = container.parentPath;
  if (
    !container.isJSXExpressionContainer() ||
    !attribute?.isJSXAttribute() ||
    !t.isJSXIdentifier(attribute.node.name)
  ) {
    throw fail(call, '_bind(x) 只能写在 JSX 属性的值里，例如 <Switch checked={_bind(on)} />');
  }
  if (call.node.arguments.length === 2) {
    rewriteFunctionBind(call, attribute);
    return;
  }
  const [target, ...extra] = call.node.arguments;
  if (!t.isMemberExpression(target) || extra.length) {
    throw fail(
      call,
      '_bind 的参数必须是 let 声明的响应式变量（_state / _bindable / _fromRef）或对象属性，例如 _bind(form.name)',
    );
  }

  const prop = attribute.node.name.name;
  const modifiers = memberChain(call.node.callee)!.slice(1);
  const tag = (attribute.parent as t.JSXOpeningElement).name;
  if (t.isJSXIdentifier(tag) && /^[a-z]/.test(tag.name)) {
    if (prop !== 'value' && prop !== 'checked') {
      throw fail(attribute, `原生元素只能绑定 value 或 checked，不能绑定 ${prop}`);
    }
    attribute.node.name = t.jsxIdentifier(['v-model', ...modifiers].join('_'));
  } else {
    if (modifiers.length) throw fail(call, '_bind 的修饰符只用于原生输入元素');
    const event = t.identifier('$event');
    const update = t.arrowFunctionExpression(
      [event],
      t.assignmentExpression('=', t.cloneNode(target), t.identifier('$event')),
    );
    attribute.insertAfter(
      t.jsxAttribute(
        t.jsxNamespacedName(t.jsxIdentifier('onUpdate'), t.jsxIdentifier(prop)),
        t.jsxExpressionContainer(update),
      ),
    );
  }
  call.replaceWith(target);
}

/**
 * 函数绑定 属性={_bind(get, set)}（同 Svelte 5）：值是 get 的结果，写回交给 set：
 *   <Select value={_bind(() => status, (next) => switchTo(next))} />
 *   → <Select value={status.value} onUpdate:value={(next) => switchTo(next)} />
 * 原生输入元素走 v-model 指令，不支持。
 */
function rewriteFunctionBind(
  call: NodePath<t.CallExpression>,
  attribute: NodePath<t.JSXAttribute>,
) {
  const [get, set] = call.node.arguments;
  if (!isFunction(get) || !isFunction(set) || get.params.length) {
    throw fail(
      call,
      '_bind(get, set) 的两个参数都是函数，get 不带参数，例如 _bind(() => status, (next) => switchTo(next))',
    );
  }
  const tag = (attribute.parent as t.JSXOpeningElement).name;
  if (t.isJSXIdentifier(tag) && /^[a-z]/.test(tag.name)) {
    throw fail(call, '原生元素不支持 _bind(get, set)：请写 value={…} 与 onInput={…}');
  }
  const prop = (attribute.node.name as t.JSXIdentifier).name;
  attribute.insertAfter(
    t.jsxAttribute(
      t.jsxNamespacedName(t.jsxIdentifier('onUpdate'), t.jsxIdentifier(prop)),
      t.jsxExpressionContainer(set),
    ),
  );
  // 箭头函数直接返回表达式时取出表达式本身（渲染时读到的响应式变量照常被追踪），否则调用它
  call.replaceWith(
    t.isArrowFunctionExpression(get) && t.isExpression(get.body)
      ? get.body
      : t.callExpression(get, []),
  );
}

function isFunction(
  node: t.Node | undefined,
): node is t.ArrowFunctionExpression | t.FunctionExpression {
  return t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);
}
