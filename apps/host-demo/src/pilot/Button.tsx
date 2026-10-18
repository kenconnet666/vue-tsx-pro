// 试点组件：验证 em 尺寸、部件透传（propsIcon）、href 渲染为链接，不进组件库
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  elementProps,
  Icon,
  mergeProps,
  type IconData,
  type IconProps,
  type PartProps,
} from '@vue-tsx-pro/ui';
import {
  colors,
  controls,
  durations,
  fontSizes,
  fontWeights,
  lineHeights,
  radii,
  space,
} from '@vue-tsx-pro/ui/tokens.stylex';
import type { VNodeChild } from 'vue';

/** 未声明的属性落到按钮（或链接）元素上 */
export interface ButtonProps extends PartProps<'button', 'disabled'> {
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
    gap: space.sm,
    minHeight: `max(${controls.height}, ${controls.minTarget})`,
    paddingBlock: space.xs,
    paddingInline: space.lg,
    borderWidth: controls.borderWidth,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: radii.md,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    textDecoration: 'none',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: durations.sm,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: controls.focusRingWidth,
    outlineColor: colors.focusRing,
    outlineOffset: controls.focusRingOffset,
  },
  solid: {
    color: colors.accentContrast,
    backgroundColor: { default: colors.accent, ':hover': colors.accentHover },
  },
  outline: {
    color: colors.text,
    backgroundColor: { default: 'transparent', ':hover': colors.fillHover },
    borderColor: colors.border,
  },
  ghost: {
    color: colors.text,
    backgroundColor: { default: 'transparent', ':hover': colors.fillHover },
  },
  disabled: { opacity: controls.disabledOpacity, cursor: 'not-allowed' },
  xs: { fontSize: fontSizes.xs },
  sm: { fontSize: fontSizes.sm },
  md: { fontSize: fontSizes.md },
  lg: { fontSize: fontSizes.lg },
  xl: { fontSize: fontSizes.xl },
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
        mergeProps(
          {
            sx: [styles.base, styles[variant], size && styles[size]],
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
      const content = (
        <>
          {icon && <Icon icon={icon} {...propsIcon} />}
          {children}
        </>
      );
      return href ? <a {...props}>{content}</a> : <button {...props}>{content}</button>;
    };
  },
);
