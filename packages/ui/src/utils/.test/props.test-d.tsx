// 类型：几个标签共用的部件属性（PartProps 的标签联合，工厂生成的组件共用实现时）能直接展开到变量标签上
import type { PartProps } from '../props';

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

// 原生元素专用的双向绑定（_value、_checked…）不进部件属性：组件上写错绑定名在类型检查时就报错
// @ts-expect-error 经组件转交到 input 上的 _value 不起作用
export const nativeValue: PartProps<'input'> = { _value: 'x' };
// @ts-expect-error 同上：勾选的绑定由组件自己声明（Switch、Checkbox 的 _checked）
export const nativeChecked: PartProps<'input'> = { _checked: true };
// @ts-expect-error details 的 _open 也是原生元素自己的绑定
export const nativeOpen: PartProps<'details'> = { _open: true };
