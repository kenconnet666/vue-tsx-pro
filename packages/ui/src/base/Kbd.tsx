/**
 * 按键：键盘快捷键的说明。组合键写成几个 Kbd：
 *
 *   <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到 kbd 上 */
export interface KbdProps extends PartProps<'kbd'> {
  children?: VNodeChild;
}

/** Kbd 的样式：root */
export const kbdStyles = css.create({
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
  <kbd {...mergeAttrs<'kbd'>({ sx: kbdStyles.root }, rest)}>{children}</kbd>
));
