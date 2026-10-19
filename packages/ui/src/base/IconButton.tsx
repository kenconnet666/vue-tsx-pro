/**
 * 只有图标的按钮（button）：宽高相等，类型上必须给 aria-label（读屏要知道它是做什么的）。
 * 外观与 Button 共用（button-core.ts），默认 ghost 样式。关闭、清除这类常用的见 CloseButton、ClearButton。
 *
 *   <IconButton icon={Settings} aria-label="设置" />
 */
import { _component } from '@vue-tsx-pro/tsx';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { useRipple } from '../utils/dom/ripple';
import {
  buttonContent,
  buttonSx,
  guardClick,
  useButtonAppearance,
  type ButtonOptions,
} from './button-core';
import type { IconData, IconProps } from './Icon';

/** 不可用、忙碌由组件管理；aria-label 必填，单独声明 */
export type IconButtonManaged = 'disabled' | 'aria-disabled' | 'aria-busy' | 'aria-label';

/** 未声明的属性落到 button 上 */
export interface IconButtonProps extends PartProps<'button', IconButtonManaged>, ButtonOptions {
  /** 图标：`import { Settings } from '@lucide/icons'` */
  icon: IconData;
  /** 按钮的无障碍名称（读屏念的），必填 */
  'aria-label': string;
  /** 不可用：原生 disabled，不能聚焦 */
  disabled?: boolean;
  /** 不可用时仍可聚焦：改用 aria-disabled，点击无效（见 Button） */
  focusableWhenDisabled?: boolean;
  /** 按钮类型，默认 button */
  type?: 'button' | 'submit' | 'reset';
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
}

/** 只有图标的按钮（button）：方形，必须有 aria-label */
export const IconButton = _component(
  ({
    icon,
    'aria-label': label,
    variant,
    tone,
    size,
    radius,
    loading = false,
    ripple,
    disabled = false,
    focusableWhenDisabled = false,
    type = 'button',
    propsIcon,
    propsSpinner,
    onClick,
    ...rest
  }: IconButtonProps) => {
    const appearance = useButtonAppearance(() => ({ variant, tone, size, radius }), 'ghost');
    const rippleHandlers = useRipple(() => ripple);
    const click = guardClick(
      () => loading || (disabled && focusableWhenDisabled),
      () => onClick,
    );

    return () => (
      <button
        {...elementProps(
          mergeProps<'button'>(
            { sx: buttonSx(appearance(), { disabled, square: true }), type },
            rest,
            {
              'aria-label': label,
              disabled: disabled && !focusableWhenDisabled,
              'aria-disabled': (disabled && focusableWhenDisabled) || undefined,
              'aria-busy': loading || undefined,
              onClick: click,
              ...rippleHandlers,
            },
          ),
        )}
        data-loading={loading || undefined}
        data-disabled={disabled || undefined}
      >
        {buttonContent({ icon, propsIcon }, { loading, propsSpinner })}
      </button>
    );
  },
);
