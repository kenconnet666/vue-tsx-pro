import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { defaultFonts } from './light';
import type { Theme } from './theme';
import { colors, radii, shadows } from './tokens';

/**
 * 高对比主题的颜色：纯白底、纯黑字，文字与底色都到 7:1（WCAG AAA），边框到 3:1 以上，
 * 弱视、强光下、投影时也看得清；品牌色是深蓝，提示色都取深的一档
 */
export const highContrastColors = css.createTheme(colors, {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f2f2f2',
  surfaceRaised: '#ffffff',
  fill: '#ebebeb',
  fillHover: '#dedede',
  fillActive: '#d1d1d1',
  text: '#000000',
  textMuted: '#333333',
  textPlaceholder: '#575757',
  textDisabled: '#8a8a8a',
  borderMuted: '#8f8f8f',
  border: '#666666',
  borderStrong: '#1f1f1f',
  accent: '#0036a3',
  accentHover: '#002a80',
  accentContrast: '#ffffff',
  accentText: '#0036a3',
  accentSoft: '#e6edfb',
  accentSoftHover: '#d5e0f8',
  accentBorder: '#4a6fc2',
  danger: '#a8001c',
  dangerHover: '#870017',
  dangerContrast: '#ffffff',
  dangerText: '#8f0018',
  dangerSoft: '#fcebee',
  dangerSoftHover: '#f8d8de',
  dangerBorder: '#c94157',
  successText: '#0a5520',
  successSoft: '#e4f4e8',
  successBorder: '#3f8a52',
  success: '#0a5520',
  successHover: '#074619',
  successContrast: '#ffffff',
  successSoftHover: '#c0dcc6',
  warningText: '#663800',
  warningSoft: '#fff2d9',
  warningBorder: '#a86d14',
  warning: '#663800',
  warningHover: '#552e00',
  warningContrast: '#ffffff',
  warningSoftHover: '#ecd4b1',
  infoText: '#003a70',
  infoSoft: '#e4f0fc',
  infoBorder: '#3b77b5',
  info: '#003a70',
  infoHover: '#002f5d',
  infoContrast: '#ffffff',
  infoSoftHover: '#bed5ed',
  inverseSurface: '#000000',
  inverseText: '#ffffff',
  focusRing: '#0036a3',
  overlay: 'rgba(0, 0, 0, 0.6)',
  selection: '#bcd0f5',
  highlight: '#ffe066',
  surfaceTranslucent: 'rgba(255, 255, 255, 0.92)',
  codeKeyword: '#0036a3',
  codeString: '#0a5520',
  codeNumber: '#853600',
  codeFunction: '#5f1a8f',
  codeType: '#00525e',
  codeComment: '#454545',
  codeTag: '#8f0018',
  codeAttribute: '#663800',
  codeInserted: '#d8f1de',
  codeDeleted: '#fadadf',
  chart1: '#0036a3',
  chart2: '#00756a',
  chart3: '#c23d00',
  chart4: '#ad1457',
  chart5: '#5e35b1',
  chart6: '#00798a',
  chart7: '#2e7d32',
  chart8: '#8a6500',
});

/** 高对比主题的阴影：边框已经足够分出层次，阴影收淡 */
export const highContrastShadows = css.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.12)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.16)',
  md: '0 4px 12px rgba(0, 0, 0, 0.18)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.22)',
  xl: '0 12px 40px rgba(0, 0, 0, 0.26)',
});

/** 高对比主题的圆角：收小，轮廓更利落 */
export const highContrastRadii = css.createTheme(radii, {
  none: '0',
  xs: '0.1em',
  sm: '0.15em',
  md: '0.25em',
  lg: '0.4em',
  xl: '0.6em',
  full: '9999px',
});

/** 高对比主题：纯白底纯黑字、文字 7:1、边框加深、圆角收小；浏览器配色按亮色 */
export const highContrastTheme: Theme = {
  name: 'high-contrast',
  colorScheme: 'light',
  styles: [highContrastColors, highContrastShadows, defaultFonts, highContrastRadii],
  overrides: {},
};
