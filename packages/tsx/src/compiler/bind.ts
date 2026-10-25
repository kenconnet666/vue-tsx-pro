/** JSX 属性：属性={_bind(x)} 换成 Vue 的 v-model；Vue 指令报错并给出 TSX 写法 */
import { types as t, type NodePath } from '@babel/core';
import { fail } from './errors.ts';
import { memberChain } from './runes.ts';

/** Vue 指令在 TSX 里都有更自然的写法 */
const DIRECTIVE_HINTS: Record<string, string> = {
  model:
    '双向绑定请写成 _属性={_bind(x)}，例如 <Switch _checked={_bind(on)} />、<input _value={_bind.trim(name)} />',
  show: '显示与隐藏请用原生属性 hidden={!visible}，或条件渲染 {visible && <X />}',
  slots: '没有插槽：内容写成子节点（children），具名内容作为 JSX prop 传入',
  html: '请改用 innerHTML={html}',
  text: '请直接把文本写成子节点 {text}',
};

/**
 * 每个 JSX 属性的检查：TSX 里有更自然写法的 Vue 指令属性（v-html、v-text…）直接报错并给出替代写法；
 * 原生元素上下划线开头的属性只用于双向绑定（_value={_bind(x)}），只给值时写元素自己的属性
 */
export function checkAttribute(attribute: NodePath<t.JSXAttribute>) {
  const { name } = attribute.node;
  const full = t.isJSXNamespacedName(name) ? `${name.namespace.name}:${name.name.name}` : name.name;
  const tag = (attribute.parent as t.JSXOpeningElement).name;
  if (
    full.startsWith('_') &&
    t.isJSXIdentifier(tag) &&
    /^[a-z]/.test(tag.name) &&
    !isBindCall(attribute.node.value)
  ) {
    throw fail(
      attribute,
      `原生元素的 ${full} 只用于双向绑定 ${full}={_bind(x)}；只给值时写 ${full.slice(1)}={…}`,
    );
  }
  if (!full.startsWith('v-')) return;
  const directive = full.slice(2).split(/[:_]/)[0]!;
  throw fail(
    attribute,
    DIRECTIVE_HINTS[directive] ?? `不支持 Vue 指令 ${full}：请改用 ref 回调或组合式函数`,
  );
}

/** 属性值是不是 _bind(…)、_bind.trim(…) 这类调用 */
function isBindCall(value: t.JSXAttribute['value']): boolean {
  if (!t.isJSXExpressionContainer(value) || !t.isCallExpression(value.expression)) return false;
  return memberChain(value.expression.callee)?.[0] === '_bind';
}

/**
 * _属性={_bind(x)} → Vue 的 v-model 协议（此时 x 已改写为 x.value）：
 *   <Switch _checked={_bind(on)} />      → <Switch _checked={on.value} onUpdate:_checked={($event) => (on.value = $event)} />
 *   <input _value={_bind.trim(name)} />  → <input v-model_trim={name.value} />
 * 可双向绑定的属性一律以下划线开头（组件的 _bindable prop 本身就叫 _value、_open；原生元素的 _value、_checked、
 * <details> 的 _open、文件输入的 _files 是绑定专用的写法），一眼看出哪些属性在双向绑定；写在别的属性上编译报错。
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
    throw fail(call, '_bind(x) 只能写在 JSX 属性的值里，例如 <Switch _checked={_bind(on)} />');
  }
  const name = attribute.node.name.name;
  if (!name.startsWith('_')) {
    throw fail(
      attribute,
      `可双向绑定的属性以下划线开头：写成 _${name}={_bind(…)}（组件的 prop 用 _bindable 声明为 _${name}）`,
    );
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

  const prop = name;
  const modifiers = memberChain(call.node.callee)!.slice(1);
  const tag = (attribute.parent as t.JSXOpeningElement).name;
  if (t.isJSXIdentifier(tag) && /^[a-z]/.test(tag.name)) {
    // 原生元素：去掉下划线就是元素自己的属性
    const property = prop.slice(1);
    const native = NATIVE_BINDINGS[property];
    if (native && native.tag !== tag.name) {
      throw fail(attribute, `${prop}={_bind(x)} 只能写在 <${native.tag}> 上`);
    }
    if (native) {
      if (modifiers.length) throw fail(call, `${prop} 的绑定没有修饰符`);
      bindNativeProperty(call, attribute, target, property, native);
      return;
    }
    if (property !== 'value' && property !== 'checked') {
      throw fail(
        attribute,
        `原生元素能绑定 _value、_checked（多选组绑到数组）、<details> 的 _open、文件输入的 _files，不能绑定 ${prop}；单选组请用 RadioGroup，或 checked={x === 值} 加 onChange`,
      );
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

/** v-model 以外、原生元素能绑定的属性：只能写在哪个标签上，元素上哪个事件之后读回，读回时能不能写到元素上 */
const NATIVE_BINDINGS: Record<string, { tag: string; event: string; readonly: boolean }> = {
  // 展开收起：用户点开、代码设置都触发 toggle（同 Svelte 的 bind:open）
  open: { tag: 'details', event: 'onToggle', readonly: false },
  // 选中的文件：只读（文件列表只能由用户选，写回元素要借 DataTransfer，不做）
  files: { tag: 'input', event: 'onChange', readonly: true },
};

/**
 * 原生元素上 v-model 管不到的属性：值照常交给元素（只读的不交），元素的事件之后把属性读回变量：
 *   <details _open={_bind(expanded)} /> → <details open={expanded.value} onToggle={(e) => (expanded.value = e.currentTarget.open)} />
 *   <input type="file" _files={_bind(picked)} /> → <input type="file" onChange={(e) => (picked.value = e.currentTarget.files)} />
 */
function bindNativeProperty(
  call: NodePath<t.CallExpression>,
  attribute: NodePath<t.JSXAttribute>,
  target: t.MemberExpression,
  prop: string,
  native: { event: string; readonly: boolean },
) {
  const opening = attribute.parent as t.JSXOpeningElement;
  const taken = opening.attributes.some(
    (other) => t.isJSXAttribute(other) && t.isJSXIdentifier(other.name, { name: native.event }),
  );
  if (taken) {
    throw fail(
      attribute,
      `_${prop}={_bind(x)} 要占用 ${native.event}：请去掉 ${native.event}，或不用 _bind、在 ${native.event} 里自己读回 ${prop}`,
    );
  }
  const event = t.identifier('event');
  const update = t.arrowFunctionExpression(
    [event],
    t.assignmentExpression(
      '=',
      t.cloneNode(target),
      t.memberExpression(
        t.memberExpression(event, t.identifier('currentTarget')),
        t.identifier(prop),
      ),
    ),
  );
  attribute.insertAfter(
    t.jsxAttribute(t.jsxIdentifier(native.event), t.jsxExpressionContainer(update)),
  );
  if (native.readonly) attribute.remove();
  else {
    attribute.node.name = t.jsxIdentifier(prop);
    call.replaceWith(target);
  }
}

/**
 * 函数绑定 _属性={_bind(get, set)}（同 Svelte 5）：值是 get 的结果，写回交给 set：
 *   <Select _value={_bind(() => status, (next) => switchTo(next))} />
 *   → <Select _value={status.value} onUpdate:_value={(next) => switchTo(next)} />
 * 原生输入元素走 v-model 指令，不支持。
 */
function rewriteFunctionBind(
  call: NodePath<t.CallExpression>,
  attribute: NodePath<t.JSXAttribute>,
) {
  const [get, set] = call.node.arguments;
  // get 要写成函数字面量：_bind(n, …) 多半是把普通绑定写错了。set 可以是函数名（_bind(() => on, toggle)）
  if (!isFunction(get) || get.params.length || !t.isExpression(set)) {
    throw fail(
      call,
      '_bind(get, set)：get 是不带参数的函数，set 是写回的函数，例如 _bind(() => status, (next) => switchTo(next))',
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
