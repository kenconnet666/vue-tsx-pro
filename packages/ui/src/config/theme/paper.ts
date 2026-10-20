import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { defaultRadii } from './light';
import type { Theme } from './theme';
import { colors, fonts, shadows } from './tokens.stylex';

// StyleX 要求 createTheme 的结果赋给变量；导出是为了防止组件库构建时被内联（见 dark.ts）

/**
 * 纸张主题的颜色：米黄纸色的页面、深棕墨色的文字、墨蓝的品牌色。
 * 中性色是自定的暖色 12 级（按 Radix 的用途约定：1–2 背景，3–5 填充，6–8 边框，11–12 文字），
 * 提示色在 Radix 色阶上往暖、往暗调过，都在纸色上满足 4.5:1（scripts/themes/check.mjs 校验）
 */
export const paperColors = stylex.createTheme(colors, {
  background: '#f5efdf',
  surface: '#faf5e8',
  surfaceMuted: '#efe7d3',
  surfaceRaised: '#fbf8ee',
  fill: '#ebe2cb',
  fillHover: '#e4d9be',
  fillActive: '#dccfb0',
  text: '#3b2f20',
  textMuted: '#6b5a43',
  textPlaceholder: '#76644a',
  textDisabled: '#b3a383',
  borderMuted: '#ddd0b2',
  border: '#cfbf9b',
  borderStrong: '#9c8762',
  accent: '#2f4b8f',
  accentHover: '#27407c',
  accentContrast: '#ffffff',
  accentText: '#2a4480',
  accentSoft: '#e6e3d6',
  accentSoftHover: '#dcdacd',
  accentBorder: '#a3adc4',
  danger: '#a8321f',
  dangerHover: '#922a19',
  dangerContrast: '#ffffff',
  dangerText: '#962c1d',
  dangerSoft: '#f3dccb',
  dangerSoftHover: '#ecceb9',
  dangerBorder: '#d39c84',
  successText: '#2f4a17',
  successSoft: '#e3e6c6',
  successBorder: '#a9b67a',
  warningText: '#5a3a12',
  warningSoft: '#f3e2b0',
  warningBorder: '#d4b265',
  infoText: '#1f3b63',
  infoSoft: '#dfe3db',
  infoBorder: '#9fb0c4',
  inverseSurface: '#3b2f20',
  inverseText: '#fbf7ec',
  focusRing: '#2f4b8f',
  overlay: 'rgba(59, 47, 32, 0.35)',
  selection: '#dcd3b4',
  highlight: '#f2d98a',
  surfaceTranslucent: 'rgba(245, 239, 223, 0.82)',
  codeKeyword: '#2a4480',
  codeString: '#45601c',
  codeNumber: '#8a4510',
  codeFunction: '#6b3a6a',
  codeType: '#235a5e',
  codeComment: '#6b5a43',
  codeTag: '#962c1d',
  codeAttribute: '#764f14',
  codeInserted: '#e3e6c6',
  codeDeleted: '#f3dccb',
  // 图表系列：纸色上取能到 3:1 的一级，偏冷的几种取 11 级
  chart1: '#2f4b8f',
  chart2: '#008573',
  chart3: '#cc4e00',
  chart4: '#e93d82',
  chart5: '#6e56cf',
  chart6: '#107d98',
  chart7: '#3e9b4f',
  chart8: '#ab6400',
});

/** 纸张主题的阴影：暖棕色，比亮色更轻，像纸放在桌面上 */
export const paperShadows = stylex.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 1px 0 rgba(80, 60, 30, 0.05), 0 1px 3px 0 rgba(80, 60, 30, 0.05)',
  sm: '0 2px 3px -2px rgba(80, 60, 30, 0.08), 0 3px 12px -4px rgba(80, 60, 30, 0.1)',
  md: '0 8px 32px rgba(80, 60, 30, 0.06), 0 12px 28px -16px rgba(80, 60, 30, 0.12)',
  lg: '0 12px 48px rgba(80, 60, 30, 0.14), 0 12px 32px -16px rgba(80, 60, 30, 0.18)',
  xl: '0 12px 60px rgba(80, 60, 30, 0.16), 0 16px 36px -20px rgba(80, 60, 30, 0.24)',
});

/** 纸张主题的字体：标题用衬线，正文仍是无衬线（屏幕上长文更好读）；StyleX 的 createTheme 要给全每个变量，正文与等宽与默认相同 */
export const paperFonts = stylex.createTheme(fonts, {
  sans: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
  mono: 'ui-monospace, "Cascadia Code", "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  serif: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", STSong, "SimSun", Georgia, serif',
  heading: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", STSong, "SimSun", Georgia, serif',
});

/** 纸张主题：米黄纸色、深棕墨色文字、墨蓝品牌色、衬线标题；浏览器配色按亮色 */
export const paperTheme: Theme = {
  name: 'paper',
  colorScheme: 'light',
  styles: [paperColors, paperShadows, paperFonts, defaultRadii],
  overrides: {},
};
