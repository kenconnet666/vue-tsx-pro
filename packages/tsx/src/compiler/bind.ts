/**
 * JSX 的双向绑定：下划线属性（_value、_open…）的值是可写的位置时编译成 Vue 的 v-model 协议；
 * 原生输入框的修饰符写成 _bind.trim(x)；Vue 指令报错并给出 TSX 写法
 */
import { types as t, type NodePath } from '@babel/core';
import { fail } from './errors.ts';
import { memberChain } from './runes.ts';

/** Vue 指令在 TSX 里都有更自然的写法 */
const DIRECTIVE_HINTS: Record<string, string> = {
  model:
    '双向绑定直接写下划线属性：<Switch _checked={on} />、<input _value={name} />；去空白等修饰符写 _value={_bind.trim(name)}',
  show: '显示与隐藏请用原生属性 hidden={!visible}，或条件渲染 {visible && <X />}',
  slots: '没有插槽：内容写成子节点（children），具名内容作为 JSX prop 传入',
  html: '请改用 innerHTML={html}',
  text: '请直接把文本写成子节点 {text}',
};

/** 每个 JSX 属性的检查：TSX 里有更自然写法的 Vue 指令属性（v-html、v-model…）直接报错，并给出替代写法 */
export function checkAttribute(attribute: NodePath<t.JSXAttribute>) {
  const { name } = attribute.node;
  const full = t.isJSXNamespacedName(name) ? `${name.namespace.name}:${name.name.name}` : name.name;
  if (!full.startsWith('v-')) return;
  const directive = full.slice(2).split(/[:_]/)[0]!;
  throw fail(
    attribute,
    DIRECTIVE_HINTS[directive] ?? `不支持 Vue 指令 ${full}：请改用 ref 回调或组合式函数`,
  );
}

/** 第 1 步：_bind 只剩原生输入框的修饰符写法（_bind.trim / .number / .lazy，可以连写） */
export function checkBindCall(call: NodePath<t.CallExpression>) {
  if (memberChain(call.node.callee)!.length > 1) return;
  if (call.node.arguments.length === 2) {
    throw fail(
      call,
      '不再需要 _bind(get, set)：写成 _value={取值} onUpdate:_value={(next) => …}，写了 onUpdate:_value 就由它处理更新',
    );
  }
  throw fail(
    call,
    '不用再写 _bind：下划线属性的值是可写的变量或对象属性时自动双向绑定，直接写 _value={x}；_bind 只用于原生输入框的修饰符（_bind.trim / .number / .lazy）',
  );
}

/** 一个标识符是不是可以整体赋值的响应式变量（let 声明的 _state / _derived / _fromRef、_bindable 的 prop） */
export type WritableIdentifier = (identifier: NodePath<t.Identifier>) => boolean;

/**
 * 下划线属性的值是可写的位置时包成 _bind(x)，之后与修饰符写法一起按 rewriteBind 改写（第 1 步之后、建立绑定之前）：
 *   <Switch _checked={on} />          → 双向（on 是 let 声明的 _state）
 *   <TextField _value={form.name} />  → 双向（对象属性）
 *   <Select _value="a" /> <Steps _current={step + 1} />  → 单向：字面量、表达式、函数调用、const 派生、普通 prop
 * 组件上另写了 onUpdate:_x（或展开的对象里有这个键）时由它处理更新，不再自动写回。
 * 原生元素的 _value、_checked、<details> 的 _open、文件输入的 _files 只用于绑定，值不可写时报错；
 * <input type="number"> 与 type="range" 的 _value 自动按数字读回（同 Svelte）。返回是否包过：包过要重建作用域
 */
export function wrapAutoBinds(program: NodePath<t.Program>, writable: WritableIdentifier): boolean {
  let wrapped = false;
  program.traverse({
    JSXAttribute(attribute) {
      const { name } = attribute.node;
      if (!t.isJSXIdentifier(name) || !name.name.startsWith('_')) return;
      const opening = attribute.parent as t.JSXOpeningElement;
      const native = isNativeTag(opening.name);
      const value = attribute.get('value');
      if (!value.isJSXExpressionContainer()) {
        if (native) throw fail(attribute, nativeMessage(name.name));
        return;
      }
      const expression = value.get('expression');
      if (expression.isJSXEmptyExpression()) return;
      // 写明了修饰符：_bind.trim(x)
      if (expression.isCallExpression() && memberChain(expression.node.callee)?.[0] === '_bind')
        return;
      if (!native && hasUpdateHandler(opening, name.name)) return;
      const target = unwrapTypes(expression as NodePath<t.Expression>);
      if (!isWritableTarget(target, writable)) {
        if (native) throw fail(attribute, nativeMessage(name.name));
        return;
      }
      const numeric = native && name.name === '_value' && isNumericInput(opening);
      const callee = numeric
        ? t.memberExpression(t.identifier('_bind'), t.identifier('number'))
        : t.identifier('_bind');
      expression.replaceWith(t.callExpression(callee, [target.node]));
      wrapped = true;
    },
  });
  return wrapped;
}

const isNativeTag = (tag: t.JSXOpeningElement['name']) =>
  t.isJSXIdentifier(tag) && /^[a-z]/.test(tag.name);

const nativeMessage = (name: string) =>
  `原生元素的 ${name} 用于双向绑定，值要是可写的变量或对象属性；只给值时写 ${name.slice(1)}={…}`;

/** 去掉只给类型检查看的外壳：x!、x as T、x satisfies T、(x) */
function unwrapTypes(path: NodePath<t.Expression>): NodePath<t.Expression> {
  let current = path;
  while (
    current.isTSNonNullExpression() ||
    current.isTSAsExpression() ||
    current.isTSSatisfiesExpression() ||
    current.isTSTypeAssertion() ||
    current.isParenthesizedExpression()
  ) {
    current = current.get('expression') as NodePath<t.Expression>;
  }
  return current;
}

/** 可写的位置：能整体赋值的响应式变量，或对象属性（form.name、rows[i].qty；可选链 a?.b 不能赋值） */
function isWritableTarget(path: NodePath<t.Expression>, writable: WritableIdentifier): boolean {
  if (path.isMemberExpression()) return true;
  return path.isIdentifier() && writable(path);
}

/** 元素上写了 onUpdate:_x：属性 onUpdate:_x={…}，或展开的对象字面量里有 'onUpdate:_x' 键 */
function hasUpdateHandler(opening: t.JSXOpeningElement, prop: string): boolean {
  const event = `onUpdate:${prop}`;
  return opening.attributes.some((attribute) => {
    if (t.isJSXAttribute(attribute)) {
      const { name } = attribute;
      return (
        t.isJSXNamespacedName(name) && name.namespace.name === 'onUpdate' && name.name.name === prop
      );
    }
    return (
      t.isObjectExpression(attribute.argument) &&
      attribute.argument.properties.some(
        (property) =>
          t.isObjectProperty(property) && t.isStringLiteral(property.key, { value: event }),
      )
    );
  });
}

/** <input type="number"> 或 type="range"：读回的值按数字 */
function isNumericInput(opening: t.JSXOpeningElement): boolean {
  if (!t.isJSXIdentifier(opening.name, { name: 'input' })) return false;
  return opening.attributes.some(
    (attribute) =>
      t.isJSXAttribute(attribute) &&
      t.isJSXIdentifier(attribute.name, { name: 'type' }) &&
      t.isStringLiteral(attribute.value) &&
      (attribute.value.value === 'number' || attribute.value.value === 'range'),
  );
}

/**
 * _属性={_bind(x)} → Vue 的 v-model 协议（此时 x 已改写为 x.value）；_bind(x) 由 wrapAutoBinds 包上，
 * 修饰符写法 _bind.trim(x) 由作者写：
 *   <Switch _checked={on} />             → <Switch _checked={on.value} onUpdate:_checked={($event) => (on.value = $event)} />
 *   <input _value={_bind.trim(name)} />  → <input v-model_trim={name.value} />
 * 可双向绑定的属性一律以下划线开头（组件的 _bindable prop 本身就叫 _value、_open；原生元素的 _value、_checked、
 * <details> 的 _open、文件输入的 _files 是绑定专用的写法），一眼看出哪些属性能双向绑定。
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
    throw fail(
      call,
      '_bind 的修饰符只能写在 JSX 属性的值里，例如 <input _value={_bind.trim(name)} />',
    );
  }
  const name = attribute.node.name.name;
  if (!name.startsWith('_')) {
    throw fail(attribute, `可双向绑定的属性以下划线开头：写成 _${name}={…}`);
  }
  const [target, ...extra] = call.node.arguments;
  if (!t.isMemberExpression(target) || extra.length) {
    throw fail(
      call,
      '_bind 修饰符的参数必须是 let 声明的响应式变量（_state / _bindable / _fromRef）或对象属性，例如 _bind.trim(form.name)',
    );
  }

  const prop = name;
  const modifiers = memberChain(call.node.callee)!.slice(1);
  const tag = (attribute.parent as t.JSXOpeningElement).name;
  if (isNativeTag(tag)) {
    // 原生元素：去掉下划线就是元素自己的属性
    const property = prop.slice(1);
    const native = NATIVE_BINDINGS[property];
    if (native && native.tag !== (tag as t.JSXIdentifier).name) {
      throw fail(attribute, `${prop} 的绑定只能写在 <${native.tag}> 上`);
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
 *   <details _open={expanded} /> → <details open={expanded.value} onToggle={(e) => (expanded.value = e.currentTarget.open)} />
 *   <input type="file" _files={picked} /> → <input type="file" onChange={(e) => (picked.value = e.currentTarget.files)} />
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
      `_${prop} 的绑定要占用 ${native.event}：请去掉 ${native.event}，或改写 ${prop}={…} 并在 ${native.event} 里自己读回 ${prop}`,
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
