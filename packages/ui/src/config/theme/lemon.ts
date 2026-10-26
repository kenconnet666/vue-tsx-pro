import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { defaultFonts } from './light';
import type { Theme } from './theme';
import { colors, radii, shadows } from './tokens';

/**
 * 柠檬主题的颜色：奶油黄的页面、柠檬黄的浅底、金柠檬色的品牌色 `#aa9200`（配深色字）。中性色按 slate 各级亮度换成黄绿色相（oklch 100°），品牌色取 Radix yellow 色阶；亮柠檬黄在浅色表面上到不了图形要的 3:1，实色取到得了的最亮一档。
 * 先按风格取色，再按对比度要求调深浅（pnpm themes:check 校验）
 */
export const lemonColors = css.createTheme(colors, {
  background: '#fefdf2',
  surface: '#fefdf2',
  surfaceMuted: '#fbfaef',
  surfaceRaised: '#fefdf2',
  fill: '#f3f1e2',
  fillHover: '#ebe9da',
  fillActive: '#e4e2d3',
  text: '#232010',
  textMuted: '#676552',
  textPlaceholder: '#878471',
  textDisabled: '#bebcae',
  borderMuted: '#dddacc',
  border: '#d1cfc1',
  borderStrong: '#bebcae',
  accent: '#9f8700',
  accentHover: '#aa9539',
  accentContrast: '#232010',
  accentText: '#956300',
  accentSoft: '#fffab8',
  accentSoftHover: '#fff394',
  accentBorder: '#e4c767',
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
  infoText: '#113264',
  infoSoft: '#e6f4fe',
  infoBorder: '#8ec8f6',
  info: '#0073e0',
  infoHover: '#0060bd',
  infoContrast: '#ffffff',
  infoSoftHover: '#d5efff',
  inverseSurface: '#232010',
  inverseText: '#fefdf2',
  focusRing: '#9f8700',
  overlay: 'rgba(35, 32, 16, 0.4)',
  selection: '#ffe770',
  highlight: '#e2f0bd',
  surfaceTranslucent: 'rgba(254, 253, 242, 0.8)',
  codeKeyword: '#956300',
  codeString: '#147a51',
  codeNumber: '#bf4100',
  codeFunction: '#6550b9',
  codeType: '#007590',
  codeComment: '#676552',
  codeTag: '#cb1d63',
  codeAttribute: '#815e46',
  codeInserted: '#e6f6eb',
  codeDeleted: '#feebec',
  chart1: '#9f8700',
  chart2: '#6fa000',
  chart3: '#3e9b4f',
  chart4: '#ef5f00',
  chart5: '#0797b9',
  chart6: '#cf3897',
  chart7: '#0d9b8a',
  chart8: '#c68400',
});

/** 柠檬主题的阴影：带主色调的投影 */
export const lemonShadows = css.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 1px 0 rgba(80, 72, 10, 0.028), 0 2px 1px -1px rgba(80, 72, 10, 0.035), 0 1px 3px 0 rgba(80, 72, 10, 0.035)',
  sm: '0 2px 3px -2px rgba(80, 72, 10, 0.042), 0 3px 12px -4px rgba(80, 72, 10, 0.07), 0 4px 16px -8px rgba(80, 72, 10, 0.07)',
  md: '0 8px 40px rgba(80, 72, 10, 0.035), 0 12px 32px -16px rgba(80, 72, 10, 0.056)',
  lg: '0 12px 60px rgba(80, 72, 10, 0.105), 0 12px 32px -16px rgba(80, 72, 10, 0.084)',
  xl: '0 12px 60px rgba(80, 72, 10, 0.105), 0 16px 64px rgba(80, 72, 10, 0.028), 0 16px 36px -20px rgba(80, 72, 10, 0.14)',
});

/** 柠檬主题的圆角：更圆润，清新柔和 */
export const lemonRadii = css.createTheme(radii, {
  none: '0',
  xs: '0.25em',
  sm: '0.45em',
  md: '0.75em',
  lg: '1.1em',
  xl: '1.5em',
  full: '9999px',
});

/** 柠檬主题：奶油黄底、柠檬黄品牌色、更圆的圆角、很轻的阴影；浏览器配色按亮色 */
export const lemonTheme: Theme = {
  name: 'lemon',
  colorScheme: 'light',
  styles: [lemonColors, lemonShadows, defaultFonts, lemonRadii],
  overrides: {},
};
