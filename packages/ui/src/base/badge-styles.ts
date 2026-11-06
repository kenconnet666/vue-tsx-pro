/**
 * Badge 与 Tag 共用的外观（配方）：样式 × 色调取共用的色表（组合档位，statusToneCompound）；字号、圆角是共用的档位。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { radiusStyles, variantOf, type Radius } from '../utils/style/styles';
import {
  statusToneBorderStyles,
  statusToneCompound,
  type StatusTone,
  type StatusVariant,
} from '../utils/style/tone-styles';

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
  name: 'Badge',
  parts: ['root', 'dot'],
  base: {
    root: [
      statusToneBorderStyles.bordered,
      {
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
    ],
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
    variant: { solid: {}, soft: {}, surface: {}, outline: {} },
    tone: { neutral: {}, accent: {}, info: {}, success: {}, warning: {}, danger: {} },
    size: variantOf(fontSizeStyles, 'root'),
    radius: variantOf(radiusStyles, 'root'),
  },
  // 样式 × 色调取共用的色表（中性色的实底是反色表面）
  compound: statusToneCompound(['root']),
  defaults: { variant: 'soft', tone: 'neutral', size: 'xs', radius: 'sm' },
});

/** 标记的部件（createUi / Provider 的 styles.Badge 按它定制） */
export type BadgePart = (typeof badgeRecipe.parts)[number];
