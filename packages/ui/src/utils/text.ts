/**
 * 从组件收到的内容里取出纯文字：children 经插槽传来时是 VNode 数组，不是字符串。
 * 用于拼无障碍名称（如 Tag 的“移除 上海”）；内容里有元素等非文字部分时返回 undefined。
 */
import { isVNode, Text, type VNodeChild } from 'vue';

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
