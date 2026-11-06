import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { defaultFonts } from './light';
import type { Theme } from './theme';
import { colors, radii, shadows } from './tokens';

/**
 * 墨白主题的颜色：纯白的页面、墨黑的品牌色，中性色不带色相。只有提示色和图表保留颜色，
 * 其余靠黑白灰和线条分层次。先按风格取色，再按对比度要求调深浅（pnpm themes:check 校验）
 */
export const monoColors = css.createTheme(colors, {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#fafafa',
  surfaceRaised: '#ffffff',
  fill: '#f4f4f4',
  fillHover: '#ececec',
  fillActive: '#e3e3e3',
  text: '#171717',
  textMuted: '#5c5c5c',
  textPlaceholder: '#5c5c5c',
  textDisabled: '#b8b8b8',
  borderMuted: '#e3e3e3',
  border: '#d4d4d4',
  borderStrong: '#b8b8b8',
  accent: '#171717',
  accentHover: '#3d3d3d',
  accentContrast: '#ffffff',
  accentText: '#171717',
  accentSoft: '#f4f4f4',
  accentSoftHover: '#e3e3e3',
  accentBorder: '#a3a3a3',
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
  inverseSurface: '#171717',
  inverseText: '#ffffff',
  focusRing: '#171717',
  overlay: 'rgba(0, 0, 0, 0.4)',
  selection: '#d4d4d4',
  highlight: '#ffee9c',
  surfaceTranslucent: 'rgba(255, 255, 255, 0.8)',
  codeKeyword: '#171717',
  codeString: '#147a51',
  codeNumber: '#bf4100',
  codeFunction: '#0069c2',
  codeType: '#6550b9',
  codeComment: '#5c5c5c',
  codeTag: '#cb1d63',
  codeAttribute: '#815e46',
  codeInserted: '#e6f6eb',
  codeDeleted: '#feebec',
  chart1: '#171717',
  chart2: '#3358d4',
  chart3: '#d83a3f',
  chart4: '#008751',
  chart5: '#c68400',
  chart6: '#8e4ec6',
  chart7: '#0797b9',
  chart8: '#777777',
});

/** 墨白主题的阴影：很淡，主要靠边框分层 */
export const monoShadows = css.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
  md: '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
  lg: '0 12px 28px -6px rgba(0, 0, 0, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.06)',
  xl: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
});

/** 墨白主题的圆角：小而克制 */
export const monoRadii = css.createTheme(radii, {
  none: '0',
  xs: '0.1em',
  sm: '0.2em',
  md: '0.3em',
  lg: '0.45em',
  xl: '0.6em',
  full: '9999px',
});

/** 墨白主题：纯白底、墨黑品牌色、无色相的中性色、小圆角、很淡的阴影；浏览器配色按亮色 */
export const monoTheme: Theme = {
  name: 'mono',
  colorScheme: 'light',
  styles: [monoColors, monoShadows, defaultFonts, monoRadii],
  overrides: {},
};
