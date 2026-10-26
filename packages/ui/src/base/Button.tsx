/**
 * 按钮（button）。外观与内容排布和 LinkButton、IconButton 共用（button-core.ts）；
 * 跳转到别的页面用 LinkButton（a），只有图标用 IconButton。
 *
 *   <Button onClick={save}>保存</Button>
 *   <Button variant="outline" tone="neutral" icon={Plus}>新建</Button>
 *   <Button type="submit" loading={saving}>提交</Button>
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  buttonContent,
  buttonPart,
  buttonSx,
  useButtonAppearance,
  useButtonBehavior,
  type ButtonContentOptions,
  type ButtonOptions,
} from './button-core';

/** 不可用、忙碌由组件按 disabled、loading 管理 */
export type ButtonManaged = 'disabled' | 'aria-disabled' | 'aria-busy';

/** 未声明的属性落到 button 上 */
export interface ButtonProps
  extends PartProps<'button', ButtonManaged>, ButtonOptions, ButtonContentOptions {
  /** 不可用：原生 disabled，不能聚焦 */
  disabled?: boolean;
  /**
   * 不可用时仍可聚焦：改用 aria-disabled，点击无效。需要用 Tooltip 说明“为什么不能点”时用，
   * 或者按钮在一组键盘导航里、不希望焦点跳过它
   */
  focusableWhenDisabled?: boolean;
  /** 按钮类型，默认 button（不是浏览器默认的 submit），表单里的提交按钮写 type="submit" */
  type?: 'button' | 'submit' | 'reset';
}

/** 按钮（button）：样式、色调、尺寸、圆角、图标、加载中、波纹 */
export const Button = _component(
  ({
    variant,
    tone,
    size,
    radius,
    loading = false,
    ripple,
    icon,
    iconEnd,
    fullWidth = false,
    propsContent,
    propsIcon,
    propsIconEnd,
    propsSpinner,
    disabled = false,
    focusableWhenDisabled = false,
    type = 'button',
    onClick,
    children,
    ...rest
  }: ButtonProps) => {
    const appearance = useButtonAppearance(() => ({ variant, tone, size, radius }), 'solid');
    // 很快完成的加载不换成加载指示；点击拦截、aria-busy 仍按 loading 立即生效
    const spinner = useDelayedLoading(() => loading);
    const behavior = useButtonBehavior(
      () => ({ disabled, loading, focusableWhenDisabled, ripple }),
      () => onClick,
    );

    return () => (
      <button
        {...mergeAttrs<'button'>(
          { ...buttonPart, sx: buttonSx(appearance(), { disabled, fullWidth }), type },
          rest,
          behavior(),
        )}
      >
        {buttonContent(
          { icon, iconEnd, children, propsContent, propsIcon, propsIconEnd },
          { loading: spinner.value, propsSpinner },
        )}
      </button>
    );
  },
);
