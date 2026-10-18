/**
 * 只给读屏器看的内容：视觉上不占位，读屏照常朗读。
 * 用于图标按钮的名称、“在新窗口打开”这类补充说明。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { h, type VNodeChild } from 'vue';
import { elementProps, mergeProps, type AsProps } from '../../utils/props';

export interface VisuallyHiddenProps extends AsProps<'span' | 'div'> {
  children?: VNodeChild;
}

const styles = stylex.create({
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

export const VisuallyHidden = _component(
  ({ as = 'span', children, ...rest }: VisuallyHiddenProps) =>
    () =>
      h(as, elementProps(mergeProps<'span' | 'div'>({ sx: styles.hidden }, rest)), [children]),
);
