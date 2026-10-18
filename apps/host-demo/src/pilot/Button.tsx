// 试点组件：验证 em 尺寸、部件透传（propsIcon）、href 渲染为链接，不进组件库
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  elementProps,
  focusRingStyles,
  fontSizeStyles,
  Icon,
  mergeProps,
  type IconData,
  type IconProps,
  type PartProps,
} from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';

/** 未声明的属性落到按钮元素上，传了 href 时落到链接上：属性取两者共有的部分，事件的 currentTarget 是两者之一 */
export interface ButtonProps extends PartProps<'button' | 'a', 'disabled'> {
  variant?: 'solid' | 'outline' | 'ghost';
  /** 不写时继承上下文字号 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  /** 加载中：不可点击，并告知读屏 */
  loading?: boolean;
  /** 传了就渲染为链接 */
  href?: string;
  /** 前置图标 */
  icon?: IconData;
  propsIcon?: Partial<IconProps>;
  children?: VNodeChild;
}

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_sm',
    minHeight: 'max(_control, _minTarget)',
    paddingBlock: '_xs',
    paddingInline: '_lg',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '_md',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: '_semibold',
    lineHeight: '_tight',
    textDecoration: 'none',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: '_sm',
  },
  solid: {
    color: '_accentContrast',
    backgroundColor: { default: '_accent', ':hover': '_accentHover' },
  },
  outline: {
    color: '_text',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
    borderColor: '_border',
  },
  ghost: {
    color: '_text',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
  },
  disabled: { opacity: '_disabled', cursor: 'not-allowed' },
});

export const Button = _component(
  ({
    variant = 'solid',
    size,
    disabled = false,
    loading = false,
    href,
    icon,
    propsIcon,
    children,
    ...rest
  }: ButtonProps) => {
    const inactive = _derived(disabled || loading);

    // 链接没有 disabled 属性：用 aria-disabled 并拦截点击
    function blockInactive(event: MouseEvent) {
      if (inactive) event.preventDefault();
    }

    return () => {
      // 使用方的点击回调先于组件执行，不可用时要先拿掉，否则禁用的链接仍会触发它
      const user = inactive ? { ...rest, onClick: undefined } : rest;
      const props = elementProps(
        mergeProps<'button' | 'a'>(
          {
            sx: [
              styles.base,
              focusRingStyles.visible,
              styles[variant],
              size && fontSizeStyles[size],
            ],
            type: href ? undefined : 'button',
          },
          user,
          {
            sx: inactive && styles.disabled,
            'aria-busy': loading || undefined,
            ...(href
              ? {
                  href: inactive ? undefined : href,
                  'aria-disabled': inactive || undefined,
                  onClick: blockInactive,
                }
              : { disabled: inactive }),
          },
        ),
      );
      const Tag = href ? 'a' : 'button';
      return (
        <Tag {...props}>
          {icon && <Icon icon={icon} {...propsIcon} />}
          {children}
        </Tag>
      );
    };
  },
);
