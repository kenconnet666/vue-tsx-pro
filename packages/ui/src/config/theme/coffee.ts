import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { darkShadows } from './dark';
import { paperFonts } from './paper';
import { defaultRadii } from './light';
import type { Theme } from './theme';
import { colors } from './tokens.stylex';

// StyleX 要求 createTheme 的结果赋给变量；导出是为了防止组件库构建时被内联（见 dark.ts）

/**
 * 咖啡主题的颜色：浓缩咖啡色的页面、焦糖色的品牌色 `#c8915a`（配深色字）、奶泡色的文字。中性色按 slate 暗色各级亮度换成暖棕色相（oklch 55°），品牌色取 Radix brown 色阶。
 * 先按风格取色，再按对比度要求调深浅（pnpm themes:check 校验）
 */
export const coffeeColors = stylex.createTheme(colors, {
  background: '#180f0a',
  surface: '#201711',
  surfaceMuted: '#201711',
  surfaceRaised: '#201711',
  fill: '#2c1f16',
  fillHover: '#34261d',
  fillActive: '#3b2d24',
  text: '#ffe9dc',
  textMuted: '#c4afa2',
  textPlaceholder: '#8a776a',
  textDisabled: '#6c5d52',
  borderMuted: '#45362d',
  border: '#53443a',
  borderStrong: '#6c5d52',
  accent: '#c8915a',
  accentHover: '#cf9e6e',
  accentContrast: '#180f0a',
  accentText: '#e3b98c',
  accentSoft: '#28211d',
  accentSoftHover: '#322922',
  accentBorder: '#614a39',
  danger: '#b54548',
  dangerHover: '#98393b',
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
  successContrast: '#180f0a',
  successSoftHover: '#113b29',
  warningText: '#ffca16',
  warningSoft: '#302008',
  warningBorder: '#714f19',
  warning: '#ffc53d',
  warningHover: '#ffcd5f',
  warningContrast: '#180f0a',
  warningSoftHover: '#3f2700',
  infoText: '#70b8ff',
  infoSoft: '#0d2847',
  infoBorder: '#205d9e',
  info: '#0090ff',
  infoHover: '#3d9fff',
  infoContrast: '#180f0a',
  infoSoftHover: '#003362',
  inverseSurface: '#ffe9dc',
  inverseText: '#180f0a',
  focusRing: '#c8915a',
  overlay: 'rgba(0, 0, 0, 0.6)',
  selection: '#3e3128',
  highlight: '#302008',
  surfaceTranslucent: 'rgba(24, 15, 10, 0.8)',
  codeKeyword: '#e3b98c',
  codeString: '#3dd68c',
  codeNumber: '#ffa057',
  codeFunction: '#baa7ff',
  codeType: '#4ccce6',
  codeComment: '#c4afa2',
  codeTag: '#ff92ad',
  codeAttribute: '#dbb594',
  codeInserted: '#132d21',
  codeDeleted: '#3b1219',
  chart1: '#c8915a',
  chart2: '#ffc53d',
  chart3: '#f76b15',
  chart4: '#a18072',
  chart5: '#978365',
  chart6: '#e54d2e',
  chart7: '#46a758',
  chart8: '#7ce2fe',
});

/** 咖啡主题：浓缩咖啡底、焦糖品牌色、暖色的深阴影、衬线标题；浏览器配色按暗色 */
export const coffeeTheme: Theme = {
  name: 'coffee',
  colorScheme: 'dark',
  styles: [coffeeColors, darkShadows, paperFonts, defaultRadii],
  overrides: {},
};
