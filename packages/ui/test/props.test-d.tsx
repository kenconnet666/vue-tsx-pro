// 类型：几个标签共用的部件属性（AsProps、PartProps 的标签联合）能直接展开到变量标签上
import type { PartProps } from '../src/utils/props';

type LinkOrButton = PartProps<'a' | 'button'>;

// 同名属性取每个标签都接受的值：type 只能是 <button> 认的值
export const submit: LinkOrButton = { type: 'submit' };
// @ts-expect-error <button> 不接受任意字符串的 type
export const wrongType: LinkOrButton = { type: 'text/html' };
// @ts-expect-error href 只属于 <a>，不是共有属性
export const href: LinkOrButton = { href: '/' };

// 事件的 currentTarget 是几种元素之一
export const click: LinkOrButton = {
  onClick: (event) => {
    const element: HTMLAnchorElement | HTMLButtonElement = event.currentTarget;
    return element;
  },
};

// 展开到同一组标签里的任意一个
export function render(props: LinkOrButton, tag: 'a' | 'button') {
  const Tag = tag;
  return <Tag {...props}>x</Tag>;
}
