/**
 * 状态色点：一个小圆点标出状态或类别（未读、新到、退回、图例），比 Badge 更轻。
 *
 *   <StatusDot tone="danger" />                        装饰：对读屏隐藏，含义写在旁边的文字里
 *   <StatusDot tone="accent" label="未读" />            点本身就是信息：读屏念 label
 *
 * 色调与 Badge 同名（neutral 是次要文字色）；color 给任意 CSS 颜色（图表的系列色）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { mergeAttrs, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';

/** 色点的大小 */
export interface StatusDotSizes {
  /** 0.5rem（默认）：列表、通知 */
  sm: unknown;
  /** 0.625rem：图例 */
  md: unknown;
}

/** 未声明的属性落到 span 上 */
export interface StatusDotProps extends PartProps<'span', 'role' | 'aria-hidden'> {
  /**
   * 色调
   * @default 'accent'
   */
  tone?: StatusTone;
  /** 任意 CSS 颜色；写了时不看 tone */
  color?: string;
  /**
   * 大小
   * @default 'sm'
   */
  size?: keyof StatusDotSizes;
  /** 读屏念的含义；不写时色点只是装饰（aria-hidden） */
  label?: string;
}

/** StatusDot 的样式：root、sm、md */
export const statusDotStyles = css.create({
  root: { display: 'inline-block', flexShrink: 0, borderRadius: '_full' },
  sm: { width: '0.5rem', height: '0.5rem' },
  md: { width: '0.625rem', height: '0.625rem' },
});

/** StatusDot 的色调 */
export const statusDotToneStyles = css.create({
  neutral: { backgroundColor: '_textMuted' },
  accent: { backgroundColor: '_accent' },
  info: { backgroundColor: '_info' },
  success: { backgroundColor: '_success' },
  warning: { backgroundColor: '_warning' },
  danger: { backgroundColor: '_danger' },
});

/** StatusDot 的动态样式：任意颜色 */
export const statusDotDynamicStyles = css.create({
  color: (color: string) => ({ backgroundColor: color }),
});

/** 状态色点 */
export const StatusDot = _component(
  ({ tone = 'accent', color, size = 'sm', label, ...rest }: StatusDotProps) =>
    () => (
      <span
        {...mergeAttrs<'span'>(
          {
            sx: [
              statusDotStyles.root,
              statusDotStyles[size],
              color ? statusDotDynamicStyles.color(color) : statusDotToneStyles[tone],
            ],
          },
          rest,
          label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true },
        )}
        data-tone={color ? undefined : tone}
      />
    ),
);
