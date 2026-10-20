/**
 * 复制按钮（button）：点击把 value 复制到剪贴板，图标换成对勾（缩放弹出），读屏播报“已复制”，几秒后复原。
 * 外观同 IconButton（button-core.ts），默认 ghost 样式。
 *
 *   <CopyButton value={apiKey} />
 *   <CopyButton value={() => editor.getText()} aria-label="复制全文" />
 */
import { Check, Copy } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useLang } from '../config/context';
import { useClipboard } from '../utils/dom/clipboard';
import { mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import {
  buttonContent,
  buttonSx,
  useButtonAppearance,
  useButtonBehavior,
  type ButtonOptions,
} from './button-core';
import type { IconProps } from './Icon';
import { VisuallyHidden, type VisuallyHiddenProps } from './VisuallyHidden';

/** 不可用、忙碌由组件管理；value 是要复制的文字（不是原生 value） */
export type CopyButtonManaged = 'disabled' | 'aria-disabled' | 'aria-busy' | 'value' | 'type';

/** 未声明的属性落到 button 上 */
export interface CopyButtonProps
  extends PartProps<'button', CopyButtonManaged>, Omit<ButtonOptions, 'loading' | 'propsSpinner'> {
  /** 要复制的文字；给函数时点击时才取值 */
  value: string | (() => string);
  /** 按钮的无障碍名称，默认取语言包（复制） */
  'aria-label'?: string;
  /** 对勾保持多久（毫秒）后复原，默认 2000 */
  timeout?: number;
  /** 不可用 */
  disabled?: boolean;
  /** 复制完成后调用，参数是是否成功（不安全的上下文、用户拒绝权限时失败） */
  onCopied?: (success: boolean) => void;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 读屏播报区（按钮里的隐藏文字，复制后念“已复制”）的部件属性 */
  propsStatus?: Partial<VisuallyHiddenProps>;
}

const pop = stylex.keyframes({ from: { transform: 'scale(0.5)', opacity: 0 } });

/** CopyButton 的样式：copied（对勾弹出；减少动态效果时时长为 0） */
export const copyButtonStyles = stylex.create({
  copied: {
    animationName: pop,
    animationDuration: '_durations.md',
    animationTimingFunction: '_easings.enter',
  },
});

/** 复制按钮：复制后显示对勾并播报 */
export const CopyButton = _component(
  ({
    value,
    'aria-label': label,
    timeout,
    variant,
    tone,
    size,
    radius,
    ripple,
    disabled = false,
    onCopied,
    propsIcon,
    propsStatus,
    ...rest
  }: CopyButtonProps) => {
    const lang = useLang();
    const clipboard = useClipboard({ timeout: _untrack(timeout) });
    const appearance = useButtonAppearance(() => ({ variant, tone, size, radius }), 'ghost');
    const behavior = useButtonBehavior(
      () => ({ disabled, loading: false, ripple }),
      () => () => void copy(),
    );

    async function copy() {
      const success = await clipboard.copy(typeof value === 'function' ? value() : value);
      onCopied?.(success);
    }

    return () => (
      <button
        {...mergeAttrs<'button'>(
          {
            sx: buttonSx(appearance(), { disabled, square: true }),
            'aria-label': label ?? lang.copy,
          },
          rest,
          { ...behavior(), type: 'button' },
        )}
        data-state={clipboard.copied ? 'copied' : 'idle'}
      >
        {buttonContent(
          {
            icon: clipboard.copied ? Check : Copy,
            // 换图标时换一个元素，弹出动画才会重播
            propsIcon: mergePartProps<Partial<IconProps>>(propsIcon ?? {}, {
              key: clipboard.copied ? 'copied' : 'copy',
              sx: clipboard.copied && copyButtonStyles.copied,
            }),
          },
          { loading: false },
        )}
        <VisuallyHidden
          {...mergeProps<Partial<VisuallyHiddenProps>>(propsStatus ?? {}, {
            'aria-live': 'polite',
          })}
        >
          {clipboard.copied ? lang.copied : ''}
        </VisuallyHidden>
      </button>
    );
  },
);
