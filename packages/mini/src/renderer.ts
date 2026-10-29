/**
 * Vue 的自定义渲染器：虚拟节点落到 MiniNode 树上（node.ts），组件、组合式 API、样式引擎都照常工作。
 * 属性按 Vue 运行时 DOM 的规则归类：class、style、on* 事件，其余是元素属性。
 */
import { createRenderer, type App, type Component } from 'vue';
import { MiniNode, type Listener } from './node.ts';

/** 'onClick' → 'click'，'onTouchstart' → 'touchstart'；去掉 Once / Capture / Passive 修饰（同 Vue 运行时 DOM） */
const eventName = (key: string) =>
  key
    .slice(2)
    .replace(/(?:Once|Capture|Passive)+$/, '')
    .replace(/\B([A-Z])/g, '-$1')
    .toLowerCase();

/** 'ariaBusy' → 'aria-busy'：组件里两种写法都有，条件判定按连字符查 */
const attributeName = (key: string) =>
  /^(?:aria|data)[A-Z]/.test(key) ? key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`) : key;

/** style 绑定的值 → [属性, 值]；字符串按分号切开，对象的 camelCase 转连字符 */
function styleEntries(value: unknown): [string, string][] {
  if (!value) return [];
  if (typeof value === 'string') {
    return value
      .split(';')
      .map((item) => item.split(/:(.*)/s).map((part) => part.trim()))
      .filter(([name, text]) => name && text)
      .map(([name, text]) => [name!, text!]);
  }
  if (Array.isArray(value)) return value.flatMap(styleEntries);
  return Object.entries(value as Record<string, unknown>)
    .filter(([, text]) => text !== undefined && text !== null && text !== '')
    .map(([name, text]) => [
      name.startsWith('--') ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
      String(text),
    ]);
}

function patchStyle(node: MiniNode, previous: unknown, next: unknown) {
  for (const [name] of styleEntries(previous)) node.inline.delete(name);
  for (const [name, value] of styleEntries(next)) node.inline.set(name, value);
  node.changed();
}

function patchHandler(node: MiniNode, key: string, next: unknown) {
  const type = eventName(key);
  const list = (Array.isArray(next) ? next : [next]).filter(
    (handler): handler is Listener => typeof handler === 'function',
  );
  if (list.length) node.handlers.set(type, list);
  else node.handlers.delete(type);
}

const renderer = createRenderer<MiniNode, MiniNode>({
  createElement: (tag) => new MiniNode(tag),
  createText: (text) => MiniNode.text(text),
  createComment: () => new MiniNode('#comment'),
  setText(node, text) {
    node.text = text;
    node.changed();
  },
  setElementText(node, text) {
    node.setChildren(text ? [MiniNode.text(text)] : []);
  },
  insert: (child, parent, anchor) => parent.insertBefore(child, anchor ?? null),
  remove: (child) => child.parent?.removeChild(child),
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.nextSibling,
  patchProp(node, key, previous, next) {
    if (key === 'class') {
      node.className = (next as string | null) ?? '';
      node.changed();
    } else if (key === 'style') patchStyle(node, previous, next);
    else if (/^on[A-Z]/.test(key)) patchHandler(node, key, next);
    else {
      const name = attributeName(key);
      if (next === undefined || next === null) node.attrs.delete(name);
      else node.attrs.set(name, next);
      node.changed();
    }
  },
});

/** 建一个渲染到 MiniNode 树上的 Vue 应用 */
export const createMiniApp = (
  component: Component,
  props?: Record<string, unknown>,
): App<MiniNode> => renderer.createApp(component, props);
