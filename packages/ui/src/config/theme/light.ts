import * as css from '@vue-tsx-pro/tsx/styles';
import type { Theme } from './theme';
import { colors, fonts, radii, shadows } from './tokens';

// 取值与 tokens.ts 的默认值相同（pnpm themes:check 核对）。默认值本来不用再写一遍，但 Provider 套在别的主题里时，
// 只有显式写出的变量才能盖过外层继承下来的：每套内置主题都写全颜色、阴影、字体、圆角四组，没改的组用这里的默认值。
/** 亮色主题的颜色（默认值） */
export const lightColors = css.createTheme(colors, {
  background: '#fcfcfd',
  surface: '#fcfcfd',
  surfaceMuted: '#f9f9fb',
  surfaceRaised: '#fcfcfd',
  fill: '#f0f0f3',
  fillHover: '#e8e8ec',
  fillActive: '#e0e1e6',
  text: '#1c2024',
  textMuted: '#60646c',
  textPlaceholder: '#80838d',
  textDisabled: '#b9bbc6',
  borderMuted: '#d9d9e0',
  border: '#cdced6',
  borderStrong: '#b9bbc6',
  accent: '#3e63dd',
  accentHover: '#3358d4',
  accentContrast: '#ffffff',
  accentText: '#3a5bc7',
  accentSoft: '#edf2fe',
  accentSoftHover: '#e1e9ff',
  accentBorder: '#abbdf9',
  danger: '#ce2c31',
  dangerHover: '#b8272c',
  dangerContrast: '#ffffff',
  dangerText: '#b8272c',
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
  inverseSurface: '#1c2024',
  inverseText: '#fcfcfd',
  focusRing: '#3e63dd',
  overlay: 'rgba(0, 0, 0, 0.4)',
  selection: '#d2deff',
  highlight: '#ffee9c',
  surfaceTranslucent: 'rgba(252, 252, 253, 0.8)',
  codeKeyword: '#3a5bc7',
  codeString: '#1c7a51',
  codeNumber: '#bb4500',
  codeFunction: '#6550b9',
  codeType: '#007590',
  codeComment: '#60646c',
  codeTag: '#cb1d63',
  codeAttribute: '#815e46',
  codeInserted: '#e6f6eb',
  codeDeleted: '#feebec',
  chart1: '#3e63dd',
  chart2: '#0d9b8a',
  chart3: '#ef5f00',
  chart4: '#e93d82',
  chart5: '#6e56cf',
  chart6: '#0797b9',
  chart7: '#3e9b4f',
  chart8: '#ab6400',
});

/** 亮色主题的阴影（默认值） */
export const lightShadows = css.createTheme(shadows, {
  none: 'none',
  xs: '0 1px 1px 0 #00005506, 0 2px 1px -1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 2px 3px -2px #0000330f, 0 3px 12px -4px rgba(0, 0, 0, 0.1), 0 4px 16px -8px rgba(0, 0, 0, 0.1)',
  md: '0 8px 40px rgba(0, 0, 0, 0.05), 0 12px 32px -16px #0000330f',
  lg: '0 12px 60px rgba(0, 0, 0, 0.15), 0 12px 32px -16px #0009321f',
  xl: '0 12px 60px rgba(0, 0, 0, 0.15), 0 16px 64px #00005506, 0 16px 36px -20px #00062e32',
});

/** 默认字体：标题与正文都是无衬线 */
export const defaultFonts = css.createTheme(fonts, {
  sans: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
  mono: 'ui-monospace, "Cascadia Code", "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  serif: '"Noto Serif SC", "Source Han Serif SC", "Songti SC", STSong, "SimSun", Georgia, serif',
  heading:
    'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
});

/** 默认圆角 */
export const defaultRadii = css.createTheme(radii, {
  none: '0',
  xs: '0.15em',
  sm: '0.25em',
  md: '0.4em',
  lg: '0.7em',
  xl: '1em',
  full: '9999px',
});

/** 亮色主题（默认）：即 tokens.ts 里的默认值 */
export const lightTheme: Theme = {
  name: 'light',
  colorScheme: 'light',
  styles: [lightColors, lightShadows, defaultFonts, defaultRadii],
  overrides: {},
};
