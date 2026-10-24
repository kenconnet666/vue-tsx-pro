import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { Theme } from './theme';
import { colors, fonts, radii, shadows } from './tokens.stylex';

/**
 * 赛博朋克主题的颜色：深紫黑的页面、霓虹品红的品牌色 `#ff2bd6`（配深色字）、霓虹青的焦点环与信息色。中性色按 slate 暗色各级亮度换成紫色相（oklch 290°）并加大色度；图表与代码高亮用荧光色。
 * 先按风格取色，再按对比度要求调深浅（pnpm themes:check 校验）
 */
export const cyberpunkColors = stylex.createTheme(colors, {
  background: '#110e20',
  surface: '#191628',
  surfaceMuted: '#191628',
  surfaceRaised: '#191628',
  fill: '#221c3d',
  fillHover: '#2a2445',
  fillActive: '#312b4d',
  text: '#ede9ff',
  textMuted: '#b3afd2',
  textPlaceholder: '#7a7697',
  textDisabled: '#5f5b80',
  borderMuted: '#393457',
  border: '#474266',
  borderStrong: '#5f5b80',
  accent: '#ff2bd6',
  accentHover: '#ff55dc',
  accentContrast: '#110e20',
  accentText: '#ff7ae6',
  accentSoft: '#37172f',
  accentSoftHover: '#4b143d',
  accentBorder: '#833869',
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
  successContrast: '#110e20',
  successSoftHover: '#113b29',
  warningText: '#ffca16',
  warningSoft: '#302008',
  warningBorder: '#714f19',
  warning: '#ffc53d',
  warningHover: '#ffcd5f',
  warningContrast: '#110e20',
  warningSoftHover: '#3f2700',
  infoText: '#4ccce6',
  infoSoft: '#082c36',
  infoBorder: '#12677e',
  info: '#00a2c7',
  infoHover: '#42adce',
  infoContrast: '#110e20',
  infoSoftHover: '#003848',
  inverseSurface: '#ede9ff',
  inverseText: '#110e20',
  focusRing: '#00e5ff',
  overlay: 'rgba(0, 0, 0, 0.6)',
  selection: '#591c47',
  highlight: '#302008',
  surfaceTranslucent: 'rgba(17, 14, 32, 0.8)',
  codeKeyword: '#ff7ae6',
  codeString: '#39ff14',
  codeNumber: '#f8e71c',
  codeFunction: '#baa7ff',
  codeType: '#00e5ff',
  codeComment: '#b3afd2',
  codeTag: '#ff92ad',
  codeAttribute: '#dbb594',
  codeInserted: '#132d21',
  codeDeleted: '#3b1219',
  chart1: '#ff2bd6',
  chart2: '#00e5ff',
  chart3: '#f8e71c',
  chart4: '#39ff14',
  chart5: '#ff6b35',
  chart6: '#b388ff',
  chart7: '#00ffa3',
  chart8: '#ff3864',
});

/** 赛博朋克主题的阴影：一圈霓虹光晕加深色投影，浮层像在发光 */
export const cyberpunkShadows = stylex.createTheme(shadows, {
  none: 'none',
  xs: '0 0 0 1px rgba(255, 43, 214, 0.18), 0 1px 3px 0 rgba(0, 0, 0, 0.5)',
  sm: '0 0 0 1px rgba(255, 43, 214, 0.22), 0 0 10px -2px rgba(255, 43, 214, 0.35), 0 4px 12px -4px rgba(0, 0, 0, 0.6)',
  md: '0 0 0 1px rgba(255, 43, 214, 0.25), 0 0 24px -4px rgba(255, 43, 214, 0.35), 0 12px 32px -16px rgba(0, 0, 0, 0.7)',
  lg: '0 0 0 1px rgba(255, 43, 214, 0.3), 0 0 40px -6px rgba(255, 43, 214, 0.4), 0 12px 32px -16px rgba(0, 0, 0, 0.8)',
  xl: '0 0 0 1px rgba(255, 43, 214, 0.35), 0 0 60px -8px rgba(255, 43, 214, 0.45), 0 16px 36px -20px rgba(0, 0, 0, 0.9)',
});

/** 赛博朋克主题的字体：标题用等宽字体，像终端与仪表盘；写全每个变量（嵌套在别的主题里时不继承外层的），正文、等宽、衬线与默认相同 */
export const cyberpunkFonts = stylex.createTheme(fonts, {
  sans: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
  mono: 'ui-monospace, "Cascadia Code", "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  serif: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", STSong, "SimSun", Georgia, serif',
  heading:
    'ui-monospace, "Cascadia Code", "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
});

/** 赛博朋克主题的圆角：几乎是直角，线条硬朗 */
export const cyberpunkRadii = stylex.createTheme(radii, {
  none: '0',
  xs: '0',
  sm: '0.1em',
  md: '0.15em',
  lg: '0.25em',
  xl: '0.4em',
  full: '9999px',
});

/** 赛博朋克主题：深紫黑底、霓虹品红与青色、发光的阴影、近乎直角、等宽字体的标题；浏览器配色按暗色 */
export const cyberpunkTheme: Theme = {
  name: 'cyberpunk',
  colorScheme: 'dark',
  styles: [cyberpunkColors, cyberpunkShadows, cyberpunkFonts, cyberpunkRadii],
  overrides: {},
};
