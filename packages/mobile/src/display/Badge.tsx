/**
 * 徽标：右上角的数字或红点，挂在图标、头像、按钮上；也可以单独用。
 *
 *   <Badge content={5}><Icon icon={Bell} /></Badge>
 *   <Badge content={120} max={99}><Avatar … /></Badge>   显示 99+
 *   <Badge dot><Icon icon={MessageCircle} /></Badge>
 *   <Badge content="新" tone="success" />                 单独使用
 *
 * 内容是 0 时默认不显示（showZero 显示）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { t } from '../theme/tokens';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到外层（span）上 */
export interface BadgeProps extends PartProps<'span'> {
  /** 数字或文字 */
  content?: number | string;
  /** 数字超过它时显示 `max+` */
  max?: number;
  /** 只显示一个小红点 */
  dot?: boolean;
  /** 内容是 0 时也显示 */
  showZero?: boolean;
  /**
   * 色调
   * @default 'danger'
   */
  tone?: 'danger' | 'accent' | 'success' | 'warning' | 'neutral';
  /** 相对右上角的偏移（px）：[向右, 向下] */
  offset?: readonly [number, number];
  /** 被标记的内容；没有时徽标单独显示（行内） */
  children?: VNodeChild;
  /** 徽标本身的部件属性 */
  propsBadge?: PartProps<'span'>;
}

/** Badge 的样式：root、badge、corner、dot、各色调 */
export const badgeStyles = css.create({
  root: { position: 'relative', display: 'inline-flex', verticalAlign: 'middle' },
  badge: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '1.4em',
    height: '1.4em',
    paddingInline: '0.35em',
    borderRadius: '_full',
    fontSize: '_xs',
    fontWeight: '_medium',
    lineHeight: '_none',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    // 白边把徽标从下面的图标、头像上分出来
    boxShadow: `0 0 0 1px ${t.colors.surface}`,
  },
  corner: {
    position: 'absolute',
    insetBlockStart: 0,
    insetInlineEnd: 0,
    transform: 'translate(50%, -50%)',
    transformOrigin: '100% 0',
    zIndex: 1,
  },
  dot: { minWidth: '8px', width: '8px', height: '8px', padding: 0 },
  danger: { color: '_dangerContrast', backgroundColor: '_danger' },
  accent: { color: '_accentContrast', backgroundColor: '_accent' },
  success: { color: '_successContrast', backgroundColor: '_success' },
  warning: { color: '_warningContrast', backgroundColor: '_warning' },
  neutral: { color: '_inverseText', backgroundColor: '_inverseSurface' },
});

/** 徽标（span > 内容 + 徽标） */
export const Badge = _component(
  ({
    content,
    max,
    dot = false,
    showZero = false,
    tone = 'danger',
    offset,
    children,
    propsBadge,
    ...rest
  }: BadgeProps) =>
    () => {
      const text =
        typeof content === 'number' && max != null && content > max ? `${max}+` : content;
      const visible = dot || (content != null && content !== '' && (content !== 0 || showZero));
      const attached = hasContent(children);
      const badge = visible && (
        <span
          {...mergeAttrs<'span'>(
            {
              sx: [
                badgeStyles.badge,
                badgeStyles[tone],
                attached && badgeStyles.corner,
                dot && badgeStyles.dot,
              ],
            },
            propsBadge,
            {
              style: offset && {
                marginInlineEnd: `${-offset[0]}px`,
                marginBlockStart: `${offset[1]}px`,
              },
            },
          )}
        >
          {dot ? null : text}
        </span>
      );
      if (!attached) return badge || null;
      return (
        <span {...mergeAttrs<'span'>({ sx: badgeStyles.root }, rest)}>
          {children}
          {badge}
        </span>
      );
    },
);
