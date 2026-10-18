/**
 * Badge 与 Tag 共用的外观：行内的小标记，字号默认比周围小一档，内部尺寸按 em 缩放。
 * 颜色取 utils/tone-styles.ts 的状态色调。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { statusToneSx, type StatusTone, type StatusVariant } from '../utils/tone-styles';
import { fontSizeStyles, type TextSize } from '../utils/typography';

/** 标记的圆角 */
export interface BadgeRadii {
  /** 小圆角（默认） */
  sm: unknown;
  /** 胶囊形 */
  full: unknown;
}

/** Badge、Tag 共用的外观选项；可以用 createUi / Provider 的 defaults.Badge 统一改默认值 */
export interface BadgeOptions {
  /** 样式，默认 soft */
  variant?: StatusVariant;
  /** 色调，默认 neutral */
  tone?: StatusTone;
  /** 字号档位，默认 xs */
  size?: TextSize;
  /** 圆角，默认 sm */
  radius?: keyof BadgeRadii;
}

const styles: Readonly<Record<'root' | 'sm' | 'full', StyleXStyles>> = stylex.create({
  root: {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
    paddingInline: '_sm',
    // 一行的高度：不随内容的图标、按钮撑高
    minHeight: '1.75em',
    fontWeight: '_medium',
    lineHeight: '_tight',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
  sm: { borderRadius: '_sm' },
  full: { borderRadius: '_full' },
});

/** 合并后的外观 → 样式 */
export function badgeSx({
  variant = 'soft',
  tone = 'neutral',
  size = 'xs',
  radius = 'sm',
}: BadgeOptions): StyleXStyles {
  return [
    styles.root,
    statusToneSx(variant, tone),
    fontSizeStyles[size],
    styles[radius],
  ] as StyleXStyles;
}
