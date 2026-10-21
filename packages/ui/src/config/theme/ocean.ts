import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { defaultFonts } from './light';
import type { Theme } from './theme';
import { colors, radii, shadows } from './tokens.stylex';

// StyleX 要求 createTheme 的结果赋给变量；导出是为了防止组件库构建时被内联（见 dark.ts）

/**
 * 海洋主题的颜色：天空蓝的页面、深海蓝的品牌色。中性色按 slate 各级亮度换成蓝色相（oklch 235°），品牌色取 Radix blue 色阶、实色加深到深海蓝 `#0b5cad`。
 * 先按风格取色，再按对比度要求调深浅（pnpm themes:check 校验）
 */
export const oceanColors = stylex.createTheme(colors, {
  background: '#f7fdff',
  surface: '#f7fdff',
  surfaceMuted: '#f4fafe',
  surfaceRaised: '#f7fdff',
  fill: '#e7f2fa',
  fillHover: '#dfebf2',
  fillActive: '#d8e3eb',
  text: '#10222c',
  textMuted: '#546773',
  textPlaceholder: '#738793',
  textDisabled: '#b2bec5',
  borderMuted: '#d0dce3',
  border: '#c5d1d8',
  borderStrong: '#b2bec5',
  accent: '#0b5cad',
  accentHover: '#084c91',
  accentContrast: '#ffffff',
  accentText: '#0069c2',
  accentSoft: '#e6f4fe',
  accentSoftHover: '#d5efff',
  accentBorder: '#8ec8f6',
  danger: '#d83a3f',
  dangerHover: '#b62f34',
  dangerContrast: '#ffffff',
  dangerText: '#c31e28',
  dangerSoft: '#feebec',
  dangerSoftHover: '#ffdbdc',
  dangerBorder: '#f4a9aa',
  successText: '#193b2d',
  successSoft: '#e6f6eb',
  successBorder: '#8eceaa',
  success: '#008751',
  successHover: '#007143',
  successContrast: '#ffffff',
  successSoftHover: '#d6f1df',
  warningText: '#4f3422',
  warningSoft: '#fff7c2',
  warningBorder: '#e9c162',
  warning: '#ffc53d',
  warningHover: '#ffcd5f',
  warningContrast: '#4f3422',
  warningSoftHover: '#ffee9c',
  infoText: '#1d3e56',
  infoSoft: '#e1f6fd',
  infoBorder: '#8dcae3',
  info: '#7ce2fe',
  infoHover: '#8fe6fe',
  infoContrast: '#1d3e56',
  infoSoftHover: '#d1f0fa',
  inverseSurface: '#10222c',
  inverseText: '#f7fdff',
  focusRing: '#0b5cad',
  overlay: 'rgba(16, 34, 44, 0.4)',
  selection: '#c2e5ff',
  highlight: '#ffee9c',
  surfaceTranslucent: 'rgba(247, 253, 255, 0.8)',
  codeKeyword: '#0069c2',
  codeString: '#147a51',
  codeNumber: '#bf4100',
  codeFunction: '#6550b9',
  codeType: '#007590',
  codeComment: '#546773',
  codeTag: '#cb1d63',
  codeAttribute: '#815e46',
  codeInserted: '#e6f6eb',
  codeDeleted: '#feebec',
  chart1: '#0b5cad',
  chart2: '#0797b9',
  chart3: '#3358d4',
  chart4: '#0d9b8a',
  chart5: '#309dba',
  chart6: '#654dc4',
  chart7: '#26997b',
  chart8: '#c68400',
});

/** 海洋主题的阴影：带主色调的投影 */
export const oceanShadows = stylex.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 1px 0 rgba(12, 42, 84, 0.04), 0 2px 1px -1px rgba(12, 42, 84, 0.05), 0 1px 3px 0 rgba(12, 42, 84, 0.05)',
  sm: '0 2px 3px -2px rgba(12, 42, 84, 0.06), 0 3px 12px -4px rgba(12, 42, 84, 0.1), 0 4px 16px -8px rgba(12, 42, 84, 0.1)',
  md: '0 8px 40px rgba(12, 42, 84, 0.05), 0 12px 32px -16px rgba(12, 42, 84, 0.08)',
  lg: '0 12px 60px rgba(12, 42, 84, 0.15), 0 12px 32px -16px rgba(12, 42, 84, 0.12)',
  xl: '0 12px 60px rgba(12, 42, 84, 0.15), 0 16px 64px rgba(12, 42, 84, 0.04), 0 16px 36px -20px rgba(12, 42, 84, 0.2)',
});

/** 海洋主题的圆角：比默认更圆，像水波 */
export const oceanRadii = stylex.createTheme(radii, {
  none: '0',
  xs: '0.2em',
  sm: '0.35em',
  md: '0.6em',
  lg: '0.9em',
  xl: '1.25em',
  full: '9999px',
});

/** 海洋主题：天空蓝底、深海蓝品牌色、圆润的圆角、带蓝调的阴影；浏览器配色按亮色 */
export const oceanTheme: Theme = {
  name: 'ocean',
  colorScheme: 'light',
  styles: [oceanColors, oceanShadows, defaultFonts, oceanRadii],
  overrides: {},
};
