import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { defaultFonts } from './light';
import type { Theme } from './theme';
import { colors, radii, shadows } from './tokens.stylex';

/**
 * 樱花主题的颜色：淡粉的页面、樱粉的品牌色。中性色按 slate 各级亮度换成粉色相（oklch 355°），品牌色取 Radix pink 色阶，实色加深到白字够对比度。
 * 先按风格取色，再按对比度要求调深浅（pnpm themes:check 校验）
 */
export const sakuraColors = stylex.createTheme(colors, {
  background: '#fffafc',
  surface: '#fffafc',
  surfaceMuted: '#fef7f9',
  surfaceRaised: '#fffafc',
  fill: '#f9edf1',
  fillHover: '#f1e5e9',
  fillActive: '#eadee2',
  text: '#281b20',
  textMuted: '#6f5f64',
  textPlaceholder: '#8f7e84',
  textDisabled: '#c4b8bc',
  borderMuted: '#e2d6da',
  border: '#d7cbcf',
  borderStrong: '#c4b8bc',
  accent: '#cd3797',
  accentHover: '#ad2d7f',
  accentContrast: '#ffffff',
  accentText: '#b91e82',
  accentSoft: '#fee9f5',
  accentSoftHover: '#fbdcef',
  accentBorder: '#e7acd0',
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
  inverseSurface: '#281b20',
  inverseText: '#fffafc',
  focusRing: '#cd3797',
  overlay: 'rgba(40, 27, 32, 0.4)',
  selection: '#f6cee7',
  highlight: '#ffee9c',
  surfaceTranslucent: 'rgba(255, 250, 252, 0.8)',
  codeKeyword: '#b91e82',
  codeString: '#147a51',
  codeNumber: '#bf4100',
  codeFunction: '#6550b9',
  codeType: '#007590',
  codeComment: '#6f5f64',
  codeTag: '#cb1d63',
  codeAttribute: '#815e46',
  codeInserted: '#e6f6eb',
  codeDeleted: '#feebec',
  chart1: '#cd3797',
  chart2: '#a144af',
  chart3: '#df3478',
  chart4: '#654dc4',
  chart5: '#0d9b8a',
  chart6: '#ef5f00',
  chart7: '#309dba',
  chart8: '#3e9b4f',
});

/** 樱花主题的阴影：带主色调的投影 */
export const sakuraShadows = stylex.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 1px 0 rgba(90, 20, 50, 0.04), 0 2px 1px -1px rgba(90, 20, 50, 0.05), 0 1px 3px 0 rgba(90, 20, 50, 0.05)',
  sm: '0 2px 3px -2px rgba(90, 20, 50, 0.06), 0 3px 12px -4px rgba(90, 20, 50, 0.1), 0 4px 16px -8px rgba(90, 20, 50, 0.1)',
  md: '0 8px 40px rgba(90, 20, 50, 0.05), 0 12px 32px -16px rgba(90, 20, 50, 0.08)',
  lg: '0 12px 60px rgba(90, 20, 50, 0.15), 0 12px 32px -16px rgba(90, 20, 50, 0.12)',
  xl: '0 12px 60px rgba(90, 20, 50, 0.15), 0 16px 64px rgba(90, 20, 50, 0.04), 0 16px 36px -20px rgba(90, 20, 50, 0.2)',
});

/** 樱花主题的圆角：比默认更圆 */
export const sakuraRadii = stylex.createTheme(radii, {
  none: '0',
  xs: '0.2em',
  sm: '0.35em',
  md: '0.55em',
  lg: '0.85em',
  xl: '1.2em',
  full: '9999px',
});

/** 樱花主题：淡粉底、樱粉品牌色、圆润的圆角；浏览器配色按亮色 */
export const sakuraTheme: Theme = {
  name: 'sakura',
  colorScheme: 'light',
  styles: [sakuraColors, sakuraShadows, defaultFonts, sakuraRadii],
  overrides: {},
};
