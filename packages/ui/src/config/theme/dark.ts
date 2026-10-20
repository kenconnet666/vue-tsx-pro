import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { defaultFonts, defaultRadii } from './light';
import type { Theme } from './theme';
import { colors, shadows } from './tokens.stylex';

// StyleX 要求 createTheme 的结果赋给变量；导出是为了防止组件库构建时被内联进对象字面量
// （只用一次的常量会被打包工具内联，使用方编译 dist 时 StyleX 就会报错）

// Radix Colors 的暗色色阶，各 token 对应的级别见 tokens.stylex.ts
/** 暗色主题的颜色（Radix Colors 暗色色阶） */
export const darkColors = stylex.createTheme(colors, {
  background: '#111113',
  surface: '#18191b',
  surfaceMuted: '#18191b',
  surfaceRaised: '#18191b',
  fill: '#212225',
  fillHover: '#272a2d',
  fillActive: '#2e3135',
  text: '#edeef0',
  textMuted: '#b0b4ba',
  textPlaceholder: '#777b84',
  textDisabled: '#5a6169',
  borderMuted: '#363a3f',
  border: '#43484e',
  borderStrong: '#5a6169',
  accent: '#3e63dd',
  accentHover: '#3758d4',
  accentContrast: '#ffffff',
  accentText: '#9eb1ff',
  accentSoft: '#182449',
  accentSoftHover: '#1d2e62',
  accentBorder: '#3a4f97',
  danger: '#b54548',
  dangerHover: '#a33b3e',
  dangerContrast: '#ffffff',
  dangerText: '#ff9592',
  dangerSoft: '#3b1219',
  dangerSoftHover: '#500f1c',
  dangerBorder: '#8c333a',
  successText: '#3dd68c',
  successSoft: '#132d21',
  successBorder: '#28684a',
  success: '#30a46c',
  successHover: '#52af7d',
  successContrast: '#111113',
  successSoftHover: '#113b29',
  warningText: '#ffca16',
  warningSoft: '#302008',
  warningBorder: '#714f19',
  warning: '#ffc53d',
  warningHover: '#ffcd5f',
  warningContrast: '#111113',
  warningSoftHover: '#3f2700',
  infoText: '#70b8ff',
  infoSoft: '#0d2847',
  infoBorder: '#205d9e',
  info: '#0090ff',
  infoHover: '#3d9fff',
  infoContrast: '#111113',
  infoSoftHover: '#003362',
  inverseSurface: '#edeef0',
  inverseText: '#111113',
  focusRing: '#3e63dd',
  overlay: 'rgba(0, 0, 0, 0.6)',
  selection: '#253974',
  highlight: '#3f2700',
  surfaceTranslucent: 'rgba(17, 17, 19, 0.8)',
  codeKeyword: '#9eb1ff',
  codeString: '#3dd68c',
  codeNumber: '#ffa057',
  codeFunction: '#baa7ff',
  codeType: '#4ccce6',
  codeComment: '#b0b4ba',
  codeTag: '#ff92ad',
  codeAttribute: '#dbb594',
  codeInserted: '#132d21',
  codeDeleted: '#3b1219',
  chart1: '#3e63dd',
  chart2: '#12a594',
  chart3: '#f76b15',
  chart4: '#e93d82',
  chart5: '#6e56cf',
  chart6: '#00a2c7',
  chart7: '#46a758',
  chart8: '#ffc53d',
});

// Radix Themes 的暗色阴影：深色背景上阴影要更重才看得出层次
/** 暗色主题的阴影 */
export const darkShadows = stylex.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 1px 0 rgba(0, 0, 0, 0.4), 0 2px 1px -1px rgba(0, 0, 0, 0.4), 0 1px 3px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 2px 3px -2px rgba(0, 0, 0, 0.15), 0 3px 8px -2px rgba(0, 0, 0, 0.4), 0 4px 12px -4px rgba(0, 0, 0, 0.5)',
  md: '0 8px 40px rgba(0, 0, 0, 0.15), 0 12px 32px -16px rgba(0, 0, 0, 0.3)',
  lg: '0 12px 60px rgba(0, 0, 0, 0.3), 0 12px 32px -16px rgba(0, 0, 0, 0.5)',
  xl: '0 12px 60px rgba(0, 0, 0, 0.2), 0 16px 64px rgba(0, 0, 0, 0.4), 0 16px 36px -20px rgba(0, 0, 0, 0.9)',
});

/** 暗色主题 */
export const darkTheme: Theme = {
  name: 'dark',
  colorScheme: 'dark',
  styles: [darkColors, darkShadows, defaultFonts, defaultRadii],
  overrides: {},
};
