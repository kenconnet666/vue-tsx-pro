import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { defaultFonts } from './light';
import type { Theme } from './theme';
import { colors, radii, shadows } from './tokens';

/**
 * 薰衣草主题的颜色：淡紫白的页面、紫罗兰的品牌色。中性色按 Radix mauve 各级的亮度略微加紫，品牌色取 Radix violet 色阶。
 * 先按风格取色，再按对比度要求调深浅（pnpm themes:check 校验）
 */
export const lavenderColors = css.createTheme(colors, {
  background: '#fbf9ff',
  surface: '#fbf9ff',
  surfaceMuted: '#f7f4fc',
  surfaceRaised: '#fbf9ff',
  fill: '#efebf7',
  fillHover: '#e8e3f1',
  fillActive: '#e1dbeb',
  text: '#211b30',
  textMuted: '#5f5770',
  textPlaceholder: '#5f5770',
  textDisabled: '#bbb5c8',
  borderMuted: '#dcd6e7',
  border: '#d0c9dd',
  borderStrong: '#bbb5c8',
  accent: '#6e56cf',
  accentHover: '#5b45b5',
  accentContrast: '#ffffff',
  accentText: '#5f49bd',
  accentSoft: '#f4f0fe',
  accentSoftHover: '#ebe4ff',
  accentBorder: '#c2b5f5',
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
  inverseSurface: '#211b30',
  inverseText: '#fbf9ff',
  focusRing: '#6e56cf',
  overlay: 'rgba(33, 27, 48, 0.4)',
  selection: '#e1d9ff',
  highlight: '#ffee9c',
  surfaceTranslucent: 'rgba(251, 249, 255, 0.8)',
  codeKeyword: '#5f49bd',
  codeString: '#147a51',
  codeNumber: '#bf4100',
  codeFunction: '#0069c2',
  codeType: '#007590',
  codeComment: '#5f5770',
  codeTag: '#cb1d63',
  codeAttribute: '#815e46',
  codeInserted: '#e6f6eb',
  codeDeleted: '#feebec',
  chart1: '#6e56cf',
  chart2: '#d6409f',
  chart3: '#0797b9',
  chart4: '#b87a00',
  chart5: '#3358d4',
  chart6: '#0d9b8a',
  chart7: '#e5484d',
  chart8: '#8e4ec6',
});

/** 薰衣草主题的阴影：带一点紫调的柔和投影 */
export const lavenderShadows = css.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 1px 0 rgba(47, 38, 95, 0.04), 0 2px 1px -1px rgba(47, 38, 95, 0.05), 0 1px 3px 0 rgba(47, 38, 95, 0.05)',
  sm: '0 2px 3px -2px rgba(47, 38, 95, 0.06), 0 3px 12px -4px rgba(47, 38, 95, 0.1), 0 4px 16px -8px rgba(47, 38, 95, 0.1)',
  md: '0 8px 40px rgba(47, 38, 95, 0.05), 0 12px 32px -16px rgba(47, 38, 95, 0.08)',
  lg: '0 12px 60px rgba(47, 38, 95, 0.15), 0 12px 32px -16px rgba(47, 38, 95, 0.12)',
  xl: '0 12px 60px rgba(47, 38, 95, 0.15), 0 16px 64px rgba(47, 38, 95, 0.04), 0 16px 36px -20px rgba(47, 38, 95, 0.2)',
});

/** 薰衣草主题的圆角：比默认稍圆，显得柔和 */
export const lavenderRadii = css.createTheme(radii, {
  none: '0',
  xs: '0.2em',
  sm: '0.3em',
  md: '0.5em',
  lg: '0.75em',
  xl: '1.05em',
  full: '9999px',
});

/** 薰衣草主题：淡紫白底、紫罗兰品牌色、柔和的圆角、带紫调的阴影；浏览器配色按亮色 */
export const lavenderTheme: Theme = {
  name: 'lavender',
  colorScheme: 'light',
  styles: [lavenderColors, lavenderShadows, defaultFonts, lavenderRadii],
  overrides: {},
};
