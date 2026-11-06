import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { defaultRadii } from './light';
import { paperFonts } from './paper';
import type { Theme } from './theme';
import { colors, shadows } from './tokens';

/**
 * 青瓷主题的颜色：青白釉的淡青页面、青瓷绿的品牌色，衬线标题，和纸张、喜庆是一组中式风格。
 * 中性色带一点青调、饱和度低，长时间看不累；图表色取赭石、青花蓝、赤金这些传统色，和青绿拉开。
 * 先按风格取色，再按对比度要求调深浅（pnpm themes:check 校验）
 */
export const celadonColors = css.createTheme(colors, {
  background: '#f0f6f3',
  surface: '#ffffff',
  surfaceMuted: '#ebf3ef',
  surfaceRaised: '#ffffff',
  fill: '#e6efeb',
  fillHover: '#dde8e3',
  fillActive: '#d3e1db',
  text: '#16302a',
  textMuted: '#4c645e',
  textPlaceholder: '#4c645e',
  textDisabled: '#b0c1bb',
  borderMuted: '#d3e0db',
  border: '#c4d4ce',
  borderStrong: '#b0c1bb',
  accent: '#1d7568',
  accentHover: '#166055',
  accentContrast: '#ffffff',
  accentText: '#18695d',
  accentSoft: '#e1f2ed',
  accentSoftHover: '#d0eae2',
  accentBorder: '#8ccbbc',
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
  inverseSurface: '#16302a',
  inverseText: '#f5f9f7',
  focusRing: '#1d7568',
  overlay: 'rgba(22, 48, 42, 0.4)',
  selection: '#c7e8de',
  highlight: '#fbeeb0',
  surfaceTranslucent: 'rgba(240, 246, 243, 0.8)',
  codeKeyword: '#18695d',
  codeString: '#3a7229',
  codeNumber: '#a3481f',
  codeFunction: '#2f5597',
  codeType: '#7a4e9a',
  codeComment: '#4c645e',
  codeTag: '#b8325a',
  codeAttribute: '#8a6420',
  codeInserted: '#e6f6eb',
  codeDeleted: '#feebec',
  chart1: '#1d7568',
  chart2: '#b4532a',
  chart3: '#2f5597',
  chart4: '#a8780f',
  chart5: '#7a4e9a',
  chart6: '#3f8a4c',
  chart7: '#b8325a',
  chart8: '#5d7a86',
});

/** 青瓷主题的阴影：带一点青调的柔和投影 */
export const celadonShadows = css.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 1px 0 rgba(20, 60, 52, 0.04), 0 2px 1px -1px rgba(20, 60, 52, 0.05), 0 1px 3px 0 rgba(20, 60, 52, 0.05)',
  sm: '0 2px 3px -2px rgba(20, 60, 52, 0.06), 0 3px 12px -4px rgba(20, 60, 52, 0.1), 0 4px 16px -8px rgba(20, 60, 52, 0.1)',
  md: '0 8px 40px rgba(20, 60, 52, 0.05), 0 12px 32px -16px rgba(20, 60, 52, 0.08)',
  lg: '0 12px 60px rgba(20, 60, 52, 0.15), 0 12px 32px -16px rgba(20, 60, 52, 0.12)',
  xl: '0 12px 60px rgba(20, 60, 52, 0.15), 0 16px 64px rgba(20, 60, 52, 0.04), 0 16px 36px -20px rgba(20, 60, 52, 0.2)',
});

/** 青瓷主题：青白釉的淡青底、青瓷绿品牌色、衬线标题、带青调的阴影；浏览器配色按亮色 */
export const celadonTheme: Theme = {
  name: 'celadon',
  colorScheme: 'light',
  styles: [celadonColors, celadonShadows, paperFonts, defaultRadii],
  overrides: {},
};
