/**
 * 处理组件收到的内容（children 经插槽传来时是 VNode 数组，不是字符串）：
 * plainText 取出纯文字，用于拼无障碍名称（如 Tag 的“移除 上海”）；childNodes 展开成一层 VNode 列表。
 */
import {
  Comment,
  createTextVNode,
  Fragment,
  isVNode,
  Text,
  type VNode,
  type VNodeChild,
} from 'vue';

/** 内容只由文字组成时返回拼起来的文字，否则返回 undefined */
export function plainText(content: VNodeChild): string | undefined {
  if (typeof content === 'string' || typeof content === 'number') return String(content);
  if (Array.isArray(content)) {
    const parts = content.map((part) => plainText(part as VNodeChild));
    return parts.every((part) => part !== undefined) ? parts.join('') : undefined;
  }
  if (isVNode(content) && content.type === Text && typeof content.children === 'string') {
    return content.children;
  }
  return undefined;
}

/**
 * 把内容展开成一层 VNode 列表：数组、Fragment（<>…</>、v-for）都拆开，去掉 null、布尔与注释节点。
 * 给按子元素个数排布的组件用（AvatarGroup 只显示前几个）。
 */
export function childNodes(content: VNodeChild): VNode[] {
  if (Array.isArray(content)) return content.flatMap((part) => childNodes(part as VNodeChild));
  if (!isVNode(content)) {
    return typeof content === 'string' || typeof content === 'number'
      ? [createTextVNode(String(content))]
      : [];
  }
  if (content.type === Comment) return [];
  if (content.type === Fragment) return childNodes(content.children as VNodeChild);
  return [content];
}
