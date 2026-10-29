/**
 * 元素的最终样式：引擎的组合类展开成行内样式（小程序不能在运行时插规则），条件由这里按节点状态判定；
 * 其余类名原样保留给使用方自己的样式表。
 *
 * 条件只认组件库实际写得出来的几种（见 tsx 的 declarations.ts 的条件别名）：
 *   - 伪类：:active 看节点是否按着；:disabled、:checked 看布尔属性；:first-child、:last-child、:only-child 看元素兄弟；
 *     :hover、:focus 系列在触屏上不成立
 *   - 属性选择器 [name]、[name="value"]，以及 :is / :where / :not 包着的组合
 *   - @media：宽度按窗口算，prefers-color-scheme 按系统的深浅色；减少动效、强制颜色、悬停能力一律不成立
 */
import { inlineStyle } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { baseClassOf } from './elements.ts';
import type { MiniNode } from './node.ts';

/** 节点模板上的 class 与 style */
export interface ResolvedStyle {
  readonly className: string;
  readonly style: string;
}

/** 窗口宽度（px），@media 的宽度条件用；页面初始化时设一次（page.ts） */
let windowWidth = 375;
export const setWindowWidth = (width: number) => {
  windowWidth = width;
};

/** 系统的深浅色，prefers-color-scheme 用；页面初始化与系统切换时设（page.ts） */
let colorScheme: 'light' | 'dark' = 'light';
export const setColorScheme = (scheme: 'light' | 'dark') => {
  colorScheme = scheme;
};

export function resolveStyle(node: MiniNode): ResolvedStyle {
  const classes = [baseClassOf(node.tag)];
  const declarations: string[] = [];
  for (const name of node.className.split(/\s+/)) {
    if (!name) continue;
    const inline = inlineStyle(name, (condition) => matchCondition(node, condition));
    if (inline === undefined) classes.push(name);
    else if (inline) declarations.push(inline);
  }
  for (const [name, value] of node.inline) declarations.push(`${name}:${value}`);
  return { className: classes.filter(Boolean).join(' '), style: declarations.join(';') };
}

/** 判定条件链里的一段：@ 规则或选择器（伪类、属性选择器的组合） */
export function matchCondition(node: MiniNode, condition: string): boolean {
  if (condition.startsWith('@media')) return matchMedia(condition.slice('@media'.length));
  if (condition.startsWith('@')) return false;
  return matchCompound(node, condition);
}

/** 媒体查询：and 连接的各项都成立才成立；只认宽度与深浅色，其余能力在小程序里当作没有 */
function matchMedia(query: string): boolean {
  return query.split(/\s+and\s+/).every((feature) => {
    const scheme = /\(\s*prefers-color-scheme\s*:\s*(light|dark)\s*\)/.exec(feature);
    if (scheme) return scheme[1] === colorScheme;
    const match = /\(\s*(min|max)-width\s*:\s*([\d.]+)px\s*\)/.exec(feature);
    if (!match) return false;
    const limit = Number(match[2]);
    return match[1] === 'min' ? windowWidth >= limit : windowWidth <= limit;
  });
}

/** 复合选择器（`:hover:not([x])`、`[a="b"]`）：每一段都成立才成立 */
function matchCompound(node: MiniNode, selector: string): boolean {
  let index = 0;
  while (index < selector.length) {
    const char = selector[index];
    if (char === '[') {
      const end = closing(selector, index, '[', ']');
      if (!matchAttribute(node, selector.slice(index + 1, end))) return false;
      index = end + 1;
    } else if (char === ':') {
      const name = /^:([a-z-]+)/.exec(selector.slice(index))![1]!;
      index += name.length + 1;
      let argument = '';
      if (selector[index] === '(') {
        const end = closing(selector, index, '(', ')');
        argument = selector.slice(index + 1, end);
        index = end + 1;
      }
      if (!matchPseudo(node, name, argument)) return false;
    } else {
      // 标签、类名、组合符：组件库的条件里不会出现，按不成立处理
      return false;
    }
  }
  return true;
}

function matchPseudo(node: MiniNode, name: string, argument: string): boolean {
  switch (name) {
    case 'is':
    case 'where':
      return splitList(argument).some((part) => matchCompound(node, part));
    case 'not':
      return !splitList(argument).some((part) => matchCompound(node, part));
    case 'active':
      return node.pressed;
    case 'first-child':
      return elementSiblings(node)[0] === node;
    case 'last-child':
      return elementSiblings(node).at(-1) === node;
    case 'only-child':
      return elementSiblings(node).length === 1;
    case 'disabled':
    case 'checked':
    case 'indeterminate':
      return node.attribute(name) !== undefined;
    default:
      // :hover、:focus、:focus-visible、:focus-within、:dir(rtl)…：触屏、从左到右的小程序里不成立
      return false;
  }
}

/** 元素兄弟（含自己）：结构伪类同 CSS，不算文本与注释节点（Vue 的片段锚点） */
const elementSiblings = (node: MiniNode): MiniNode[] =>
  node.parent ? node.parent.children.filter((sibling) => !sibling.tag.startsWith('#')) : [node];

/** `name`、`name="value"`、`name=value` */
function matchAttribute(node: MiniNode, body: string): boolean {
  const equals = body.indexOf('=');
  if (equals < 0) return node.attribute(body.trim()) !== undefined;
  const name = body.slice(0, equals).trim();
  const expected = body
    .slice(equals + 1)
    .trim()
    .replace(/^(["'])(.*)\1$/, '$2');
  return node.attribute(name) === expected;
}

/** 从 open 处找到配对的 close（跳过引号里的内容） */
function closing(text: string, start: number, open: string, close: string): number {
  let depth = 0;
  let quote = '';
  for (let index = start; index < text.length; index++) {
    const char = text[index]!;
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === open) depth++;
    else if (char === close && --depth === 0) return index;
  }
  throw new Error(`样式条件的括号不配对：${text}`);
}

/** 选择器列表按顶层逗号切开 */
function splitList(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < list.length; index++) {
    const char = list[index];
    if (char === '(' || char === '[') depth++;
    else if (char === ')' || char === ']') depth--;
    else if (char === ',' && depth === 0) {
      parts.push(list.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(list.slice(start).trim());
  return parts;
}
