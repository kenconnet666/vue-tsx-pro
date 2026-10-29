/**
 * Badge 与 Tag 共用的外观（配方）：样式 × 色调逐项写主题 token（组合档位）；字号、圆角另外叠加。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { PartLayer } from '../config/styles';
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
  name: 'Badge',
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
    variant: { solid: {}, soft: {}, surface: {}, outline: {} },
    tone: { neutral: {}, accent: {}, info: {}, success: {}, warning: {}, danger: {} },
  },
  // 样式 × 色调逐项写主题 token；中性色的实底是反色表面
  compound: [
    {
      when: { variant: 'solid', tone: 'neutral' },
      root: { color: '_inverseText', backgroundColor: '_inverseSurface' },
    },
    {
      when: { variant: 'solid', tone: 'accent' },
      root: { color: '_accentContrast', backgroundColor: '_accent' },
    },
    {
      when: { variant: 'solid', tone: 'info' },
      root: { color: '_infoContrast', backgroundColor: '_info' },
    },
    {
      when: { variant: 'solid', tone: 'success' },
      root: { color: '_successContrast', backgroundColor: '_success' },
    },
    {
      when: { variant: 'solid', tone: 'warning' },
      root: { color: '_warningContrast', backgroundColor: '_warning' },
    },
    {
      when: { variant: 'solid', tone: 'danger' },
      root: { color: '_dangerContrast', backgroundColor: '_danger' },
    },
    {
      when: { variant: 'soft', tone: 'neutral' },
      root: { color: '_text', backgroundColor: '_fill' },
    },
    {
      when: { variant: 'soft', tone: 'accent' },
      root: { color: '_accentText', backgroundColor: '_accentSoft' },
    },
    {
      when: { variant: 'soft', tone: 'info' },
      root: { color: '_infoText', backgroundColor: '_infoSoft' },
    },
    {
      when: { variant: 'soft', tone: 'success' },
      root: { color: '_successText', backgroundColor: '_successSoft' },
    },
    {
      when: { variant: 'soft', tone: 'warning' },
      root: { color: '_warningText', backgroundColor: '_warningSoft' },
    },
    {
      when: { variant: 'soft', tone: 'danger' },
      root: { color: '_dangerText', backgroundColor: '_dangerSoft' },
    },
    {
      when: { variant: 'surface', tone: 'neutral' },
      root: { color: '_text', backgroundColor: '_surface', borderColor: '_border' },
    },
    {
      when: { variant: 'surface', tone: 'accent' },
      root: { color: '_accentText', backgroundColor: '_accentSoft', borderColor: '_accentBorder' },
    },
    {
      when: { variant: 'surface', tone: 'info' },
      root: { color: '_infoText', backgroundColor: '_infoSoft', borderColor: '_infoBorder' },
    },
    {
      when: { variant: 'surface', tone: 'success' },
      root: {
        color: '_successText',
        backgroundColor: '_successSoft',
        borderColor: '_successBorder',
      },
    },
    {
      when: { variant: 'surface', tone: 'warning' },
      root: {
        color: '_warningText',
        backgroundColor: '_warningSoft',
        borderColor: '_warningBorder',
      },
    },
    {
      when: { variant: 'surface', tone: 'danger' },
      root: { color: '_dangerText', backgroundColor: '_dangerSoft', borderColor: '_dangerBorder' },
    },
    {
      when: { variant: 'outline', tone: 'neutral' },
      root: { color: '_text', borderColor: '_border' },
    },
    {
      when: { variant: 'outline', tone: 'accent' },
      root: { color: '_accentText', borderColor: '_accentBorder' },
    },
    {
      when: { variant: 'outline', tone: 'info' },
      root: { color: '_infoText', borderColor: '_infoBorder' },
    },
    {
      when: { variant: 'outline', tone: 'success' },
      root: { color: '_successText', borderColor: '_successBorder' },
    },
    {
      when: { variant: 'outline', tone: 'warning' },
      root: { color: '_warningText', borderColor: '_warningBorder' },
    },
    {
      when: { variant: 'outline', tone: 'danger' },
      root: { color: '_dangerText', borderColor: '_dangerBorder' },
    },
  ],
  defaults: { variant: 'soft', tone: 'neutral' },
});

/** 标记的部件（createUi / Provider 的 styles.Badge 按它定制） */
export type BadgePart = (typeof badgeRecipe.parts)[number];

/**
 * 标记的各部件：配方（样式 × 色调）+ 字号 + 圆角，带部件标记。recipe 是 useRecipe(badgeRecipe) 的结果（带上主题定制），
 * 结果直接作部件属性的默认层：`mergeAttrs<'span'>(styles.root, rest)`
 */
export function badgeParts(
  { variant = 'soft', tone = 'neutral', size = 'xs', radius = 'sm' }: BadgeOptions,
  recipe: (selection: {
    variant: StatusVariant;
    tone: StatusTone;
  }) => Readonly<Record<BadgePart, PartLayer>>,
) {
  const parts = recipe({ variant, tone });
  return {
    root: {
      ...parts.root,
      sx: [parts.root.sx, fontSizeStyles[size], radiusStyles[radius]] as css.SxStyles,
    },
    dot: parts.dot,
  } as const;
}
