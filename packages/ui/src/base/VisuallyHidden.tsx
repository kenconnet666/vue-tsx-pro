/**
 * 只给读屏器看的内容：视觉上不占位，读屏照常朗读。
 * 用于图标按钮的名称、“在新窗口打开”这类补充说明。渲染为 span（行内文字，与 Radix 一致）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import type { StyleTable } from '../utils/style/styles';

/** 未声明的属性落到 span 上 */
export interface VisuallyHiddenProps extends PartProps<'span'> {
  children?: VNodeChild;
}

/** VisuallyHidden 的样式：hidden */
export const visuallyHiddenStyles: StyleTable<'hidden'> = stylex.create({
  // 不用 display: none / visibility: hidden：那样读屏也读不到
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: 0,
  },
});

/** 只给读屏器看的文字（span）：视觉上不占位 */
export const VisuallyHidden = _component(({ children, ...rest }: VisuallyHiddenProps) => () => (
  <span {...elementProps(mergeProps<'span'>({ sx: visuallyHiddenStyles.hidden }, rest))}>
    {children}
  </span>
));
