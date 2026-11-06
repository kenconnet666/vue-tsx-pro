import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { highContrastRadii } from './high-contrast';
import { defaultFonts } from './light';
import type { Theme } from './theme';
import { colors, shadows } from './tokens';

/**
 * 高对比暗色主题的颜色：纯黑底、纯白字，文字与底色都到 7:1（WCAG AAA），边框到 3:1 以上；
 * 实色（按钮、实底徽标）取亮的一档配黑字，提示色的文字取浅的一档。暗处、OLED 屏、怕刺眼又要看得清时用
 */
export const highContrastDarkColors = css.createTheme(colors, {
  background: '#000000',
  surface: '#000000',
  surfaceMuted: '#0d0d0d',
  surfaceRaised: '#0d0d0d',
  fill: '#1f1f1f',
  fillHover: '#2e2e2e',
  fillActive: '#3d3d3d',
  text: '#ffffff',
  textMuted: '#e0e0e0',
  textPlaceholder: '#e0e0e0',
  textDisabled: '#8a8a8a',
  borderMuted: '#8f8f8f',
  border: '#b8b8b8',
  borderStrong: '#ebebeb',
  accent: '#9ebcff',
  accentHover: '#bccfff',
  accentContrast: '#000000',
  accentText: '#a8c3ff',
  accentSoft: '#0f1f45',
  accentSoftHover: '#182c5e',
  accentBorder: '#7396ea',
  danger: '#ff8f8f',
  dangerHover: '#ffadad',
  dangerContrast: '#000000',
  dangerText: '#ffa3a3',
  dangerSoft: '#3d0a10',
  dangerSoftHover: '#541019',
  dangerBorder: '#e8606f',
  successText: '#7fe5a3',
  successSoft: '#0a2e17',
  successBorder: '#3fb26b',
  success: '#62da8f',
  successHover: '#86e7a9',
  successContrast: '#000000',
  successSoftHover: '#0f4021',
  warningText: '#ffd970',
  warningSoft: '#332400',
  warningBorder: '#cc9c1f',
  warning: '#ffd25f',
  warningHover: '#ffdf8a',
  warningContrast: '#000000',
  warningSoftHover: '#473300',
  infoText: '#8fd0ff',
  infoSoft: '#06223d',
  infoBorder: '#4194db',
  info: '#7cc4ff',
  infoHover: '#a1d4ff',
  infoContrast: '#000000',
  infoSoftHover: '#0b3257',
  inverseSurface: '#ffffff',
  inverseText: '#000000',
  focusRing: '#ffd60a',
  overlay: 'rgba(0, 0, 0, 0.75)',
  selection: '#264aa0',
  highlight: '#5c4500',
  surfaceTranslucent: 'rgba(0, 0, 0, 0.92)',
  codeKeyword: '#a8c3ff',
  codeString: '#7fe5a3',
  codeNumber: '#ffb27a',
  codeFunction: '#d4bcff',
  codeType: '#80e2f2',
  codeComment: '#d1d1d1',
  codeTag: '#ffa3c4',
  codeAttribute: '#f2cc9e',
  codeInserted: '#0d3319',
  codeDeleted: '#4a0f18',
  chart1: '#9ebcff',
  chart2: '#4fe0c9',
  chart3: '#ffa066',
  chart4: '#ff85b8',
  chart5: '#c4abff',
  chart6: '#5ad8f2',
  chart7: '#8fe293',
  chart8: '#ffd25f',
});

/**
 * 高对比暗色主题的阴影：黑底上阴影看不见，换成一圈浅色的描边，浮起的卡片、浮层仍分得出边界
 */
export const highContrastDarkShadows = css.createTheme(shadows, {
  none: 'none',
  xs: '0 0 0 1px rgba(255, 255, 255, 0.4)',
  sm: '0 0 0 1px rgba(255, 255, 255, 0.5)',
  md: '0 0 0 1px rgba(255, 255, 255, 0.6)',
  lg: '0 0 0 1px rgba(255, 255, 255, 0.6)',
  xl: '0 0 0 1px rgba(255, 255, 255, 0.7)',
});

/**
 * 高对比暗色主题：纯黑底纯白字、文字 7:1、边框加亮、阴影换成描边、圆角收小（同高对比）；焦点环用黄色，在黑底与亮色的实色按钮旁都醒目；
 * 浏览器配色按暗色
 */
export const highContrastDarkTheme: Theme = {
  name: 'high-contrast-dark',
  colorScheme: 'dark',
  styles: [highContrastDarkColors, highContrastDarkShadows, defaultFonts, highContrastRadii],
  overrides: {},
};
