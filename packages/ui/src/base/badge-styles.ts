/**
 * Badge 与 Tag 共用的外观（配方版）：variant × tone 不再是一张矩阵——tone 挂一个色调类（toneThemes），
 * 四种样式各写一遍、引用 toneVars；字号、圆角是档位。
 */
import * as css from '@vue-tsx-pro/tsx/styles';
import { toneThemes } from '../utils/style/tone-themes';
import { toneVars } from '../utils/style/tone-vars';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { radiusStyles, type Radius } from '../utils/style/styles';
import type { StatusTone, StatusVariant } from '../utils/style/tone-styles';

/** Badge、Tag 的外观选项 */
export interface BadgeOptions {
  /** 样式，默认 soft */
  variant?: StatusVariant;
  /** 色调，默认 neutral */
  tone?: StatusTone;
  /** 字号档位，默认 xs */
  size?: TextSize;
  /** 圆角，默认 sm；表格、密集列表里的状态常用 none，与表格的直线对齐 */
  radius?: Radius;
}

/** 标记的配方：部件 root（外层）、dot（圆点） */
export const badgeRecipe = css.recipe({
  parts: ['root', 'dot'],
  base: {
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
      borderWidth: '_xs',
      borderStyle: 'solid',
      borderColor: 'transparent',
    },
    // 跟着文字色：soft、outline 是色调色，solid 是反白
    dot: {
      flexShrink: 0,
      width: '0.5em',
      height: '0.5em',
      borderRadius: '_full',
      backgroundColor: 'currentColor',
    },
  },
  variants: {
    variant: {
      solid: { root: { color: toneVars.contrast, backgroundColor: toneVars.solid } },
      soft: { root: { color: toneVars.text, backgroundColor: toneVars.soft } },
      surface: {
        root: {
          color: toneVars.text,
          backgroundColor: toneVars.surface,
          borderColor: toneVars.border,
        },
      },
      outline: { root: { color: toneVars.text, borderColor: toneVars.border } },
    },
  },
  defaults: { variant: 'soft' },
});

/** 标记的样式：色调类 + 配方 + 字号 + 圆角 */
export function badgeSx({
  variant = 'soft',
  tone = 'neutral',
  size = 'xs',
  radius = 'sm',
}: BadgeOptions) {
  const parts = badgeRecipe({ variant });
  return {
    root: [toneThemes[tone], parts.root, fontSizeStyles[size], radiusStyles[radius]],
    dot: parts.dot,
  } as const satisfies Record<string, css.SxStyles>;
}
