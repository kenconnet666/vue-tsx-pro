/**
 * 没有外观的按钮（button）：去掉浏览器的默认样式，统一焦点环、波纹、悬停与按下的颜色过渡，
 * 以及不可用（原生 disabled 或可聚焦的 aria-disabled）、加载中、状态 data 属性。
 * 菜单项、标签页、折叠面板的标题、步骤、表头的排序按钮这类“长得不像按钮的按钮”都建在它上面，
 * 外观由各组件经 sx 给出；要按钮外观时用 Button。
 *
 *   <ButtonBase sx={styles.trigger} aria-expanded={open} onClick={toggle}>{label}</ButtonBase>
 *
 * Button、IconButton、LinkButton 不包这一层（页面上按钮最多，少一层组件实例），
 * 但共用同一套样式（buttonBaseStyles）与行为（useButtonBehavior）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import { rippleHostStyles } from '../utils/dom/ripple';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { interactionTransitions } from '../utils/style/transitions';
import type { ButtonManaged } from './Button';
import { buttonBaseStyles, useButtonBehavior } from './button-core';

/** 不可用、忙碌由组件按 disabled、loading 管理（同 Button） */
export type ButtonBaseManaged = ButtonManaged;

/** 未声明的属性落到 button 上 */
export interface ButtonBaseProps extends PartProps<'button', ButtonBaseManaged> {
  /** 不可用：原生 disabled，不能聚焦 */
  disabled?: boolean;
  /** 不可用时仍可聚焦：改用 aria-disabled，点击无效（在一组键盘导航里不希望焦点跳过它时用） */
  focusableWhenDisabled?: boolean;
  /** 加载中：点击无效，带 aria-busy 与 data-loading（加载指示由使用方放进内容） */
  loading?: boolean;
  /** 按下时的波纹；不写时沿用 createUi / Provider 的 ripple */
  ripple?: boolean;
  /** 按钮类型，默认 button（不是浏览器默认的 submit） */
  type?: 'button' | 'submit' | 'reset';
  children?: VNodeChild;
}

/** 没有外观的按钮：焦点环、波纹、颜色过渡、不可用与加载中 */
export const ButtonBase = _component(
  ({
    disabled = false,
    focusableWhenDisabled = false,
    loading = false,
    ripple,
    type = 'button',
    onClick,
    children,
    ...rest
  }: ButtonBaseProps) => {
    const behavior = useButtonBehavior(
      () => ({ disabled, loading, focusableWhenDisabled, ripple }),
      () => onClick,
    );
    return () => (
      <button
        {...mergeAttrs<'button'>(
          {
            sx: [
              buttonBaseStyles.root,
              focusRingStyles.visible,
              rippleHostStyles.host,
              interactionTransitions.colors,
              disabled && buttonBaseStyles.disabled,
            ],
            type,
          },
          rest,
          behavior(),
        )}
      >
        {children}
      </button>
    );
  },
);
