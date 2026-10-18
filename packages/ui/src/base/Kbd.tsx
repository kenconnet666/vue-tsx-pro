/**
 * 按键：键盘快捷键的说明。组合键写成几个 Kbd：
 *
 *   <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type PartProps } from '../utils/props';

/** 未声明的属性落到 kbd 上 */
export interface KbdProps extends PartProps<'kbd'> {
  children?: VNodeChild;
}

const styles = stylex.create({
  root: {
    display: 'inline-block',
    // 单个字母的键也接近方形
    minWidth: '1.6em',
    paddingInline: '_xs',
    borderWidth: '_xs',
    borderBottomWidth: '_sm',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_sm',
    backgroundColor: '_surface',
    color: '_text',
    fontFamily: '_mono',
    // 相对周围文字略小：是比例不是字号档位
    fontSize: '0.85em',
    lineHeight: '_snug',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
});

/** 按键（kbd）：快捷键说明，组合键写成几个 Kbd */
export const Kbd = _component(({ children, ...rest }: KbdProps) => () => (
  <kbd {...elementProps(mergeProps<'kbd'>({ sx: styles.root }, rest))}>{children}</kbd>
));
