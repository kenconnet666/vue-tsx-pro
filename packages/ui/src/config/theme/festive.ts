import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { paperFonts } from './paper';
import { defaultRadii } from './light';
import type { Theme } from './theme';
import { colors, shadows } from './tokens';

/**
 * 喜庆主题的颜色：暖白宣纸色的页面、朱红的品牌色 `#c42b1c`（按钮、链接同一色系）、赤金点缀（焦点环、选中、高亮）。
 * 中性色按 slate 各级亮度换成暖色相（oklch 45°）；危险色用 ruby，和品牌色区分开。
 * 图表色按传统色排：朱红配黛青（石青）开头，赤金放第三：浅底上金色要到 3:1 只能压暗，紧挨着红色会显得发土。
 * 先按风格取色，再按对比度要求调深浅（pnpm themes:check 校验）
 */
export const festiveColors = css.createTheme(colors, {
  background: '#fff7f3',
  surface: '#ffffff',
  surfaceMuted: '#fef2ed',
  surfaceRaised: '#ffffff',
  fill: '#fdede6',
  fillHover: '#f5e5de',
  fillActive: '#eeded7',
  text: '#2c1b13',
  textMuted: '#735f56',
  textPlaceholder: '#735f56',
  textDisabled: '#c7b8b1',
  borderMuted: '#e6d6cf',
  border: '#dbcbc4',
  borderStrong: '#c7b8b1',
  accent: '#c42b1c',
  accentHover: '#a32216',
  accentContrast: '#ffffff',
  accentText: '#b3261a',
  accentSoft: '#fdede9',
  accentSoftHover: '#fbdcd5',
  accentBorder: '#eeaa9c',
  danger: '#d8375a',
  dangerHover: '#b62d4b',
  dangerContrast: '#ffffff',
  dangerText: '#c51c49',
  dangerSoft: '#feeaed',
  dangerSoftHover: '#ffdce1',
  dangerBorder: '#efacb8',
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
  inverseSurface: '#2c1b13',
  inverseText: '#fffaf6',
  focusRing: '#a8760c',
  overlay: 'rgba(44, 27, 19, 0.4)',
  selection: '#f8e0a8',
  highlight: '#fbe6a2',
  surfaceTranslucent: 'rgba(255, 247, 243, 0.8)',
  codeKeyword: '#b3261a',
  codeString: '#147a51',
  codeNumber: '#bf4100',
  codeFunction: '#6550b9',
  codeType: '#007590',
  codeComment: '#735f56',
  codeTag: '#cb1d63',
  codeAttribute: '#815e46',
  codeInserted: '#e6f6eb',
  codeDeleted: '#feebec',
  chart1: '#c42b1c',
  chart2: '#1f6f6b',
  chart3: '#a8760c',
  chart4: '#2c4f8f',
  chart5: '#3c8a5a',
  chart6: '#8e3b6b',
  chart7: '#d9661a',
  chart8: '#9a7656',
});

/** 喜庆主题的阴影：带主色调的投影 */
export const festiveShadows = css.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 1px 0 rgba(110, 20, 10, 0.04), 0 2px 1px -1px rgba(110, 20, 10, 0.05), 0 1px 3px 0 rgba(110, 20, 10, 0.05)',
  sm: '0 2px 3px -2px rgba(110, 20, 10, 0.06), 0 3px 12px -4px rgba(110, 20, 10, 0.1), 0 4px 16px -8px rgba(110, 20, 10, 0.1)',
  md: '0 8px 40px rgba(110, 20, 10, 0.05), 0 12px 32px -16px rgba(110, 20, 10, 0.08)',
  lg: '0 12px 60px rgba(110, 20, 10, 0.15), 0 12px 32px -16px rgba(110, 20, 10, 0.12)',
  xl: '0 12px 60px rgba(110, 20, 10, 0.15), 0 16px 64px rgba(110, 20, 10, 0.04), 0 16px 36px -20px rgba(110, 20, 10, 0.2)',
});

/** 喜庆主题：暖白底、朱红品牌色、赤金点缀、衬线标题（庄重）；浏览器配色按亮色 */
export const festiveTheme: Theme = {
  name: 'festive',
  colorScheme: 'light',
  styles: [festiveColors, festiveShadows, paperFonts, defaultRadii],
  overrides: {},
};
