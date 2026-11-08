import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { defaultFonts } from './light';
import type { Theme } from './theme';
import { colors, radii, shadows } from './tokens';

/**
 * 大屏主题的颜色：饱和的深蓝底、高亮的青蓝品牌色（配深色字），面板比底色亮一档、边框带蓝，远处也分得清层级。
 * 图表色都够亮、色相拉开，深底上一眼能分辨；文字比午夜主题更白。
 * 先按风格取色，再按对比度要求调深浅（pnpm -C packages/ui check:themes 校验）
 */
export const bigScreenColors = css.createTheme(colors, {
  background: '#061332',
  surface: '#0b1e47',
  surfaceMuted: '#0b1e47',
  surfaceRaised: '#0f2655',
  fill: '#132c60',
  fillHover: '#19356f',
  fillActive: '#1f3e7e',
  text: '#f0f6ff',
  textMuted: '#b4c7e6',
  textPlaceholder: '#b4c7e6',
  textDisabled: '#5c749f',
  borderMuted: '#1f3b73',
  border: '#2c4c8c',
  borderStrong: '#4a6dab',
  accent: '#22b8ff',
  accentHover: '#55c8ff',
  accentContrast: '#061332',
  accentText: '#6ed3ff',
  accentSoft: '#0c2f5e',
  accentSoftHover: '#103a72',
  accentBorder: '#1f6aa8',
  danger: '#cf3f47',
  dangerHover: '#b8353d',
  dangerContrast: '#ffffff',
  dangerText: '#ff9a97',
  dangerSoft: '#3d1630',
  dangerSoftHover: '#511a38',
  dangerBorder: '#94384a',
  successText: '#4ee3a0',
  successSoft: '#0c3338',
  successBorder: '#1f7560',
  success: '#2fc98a',
  successHover: '#52d7a0',
  successContrast: '#061332',
  successSoftHover: '#0e4043',
  warningText: '#ffd24a',
  warningSoft: '#2f2a2a',
  warningBorder: '#7a6020',
  warning: '#ffc53d',
  warningHover: '#ffcd5f',
  warningContrast: '#061332',
  warningSoftHover: '#3d3528',
  infoText: '#8ab9ff',
  infoSoft: '#102c63',
  infoBorder: '#2f5fb0',
  info: '#5a9bff',
  infoHover: '#7aafff',
  infoContrast: '#061332',
  infoSoftHover: '#143674',
  inverseSurface: '#f0f6ff',
  inverseText: '#061332',
  focusRing: '#22b8ff',
  overlay: 'rgba(2, 8, 26, 0.7)',
  selection: '#14508f',
  highlight: '#4a3c12',
  surfaceTranslucent: 'rgba(6, 19, 50, 0.8)',
  codeKeyword: '#6ed3ff',
  codeString: '#4ee3a0',
  codeNumber: '#ffb26b',
  codeFunction: '#c0b0ff',
  codeType: '#8ab9ff',
  codeComment: '#b4c7e6',
  codeTag: '#ff9ab8',
  codeAttribute: '#ffd24a',
  codeInserted: '#0c3338',
  codeDeleted: '#3d1630',
  chart1: '#22b8ff',
  chart2: '#2fe0b0',
  chart3: '#ffc53d',
  chart4: '#ff7d6b',
  chart5: '#a78bff',
  chart6: '#5a9bff',
  chart7: '#ff77c8',
  chart8: '#9be15d',
});

/** 大屏主题的阴影：一圈青色细边加柔和的光晕，面板像在深色背景上发光 */
export const bigScreenShadows = css.createTheme(shadows, {
  none: 'none',
  xs: '0 0 0 1px rgba(34, 184, 255, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.5)',
  sm: '0 0 0 1px rgba(34, 184, 255, 0.16), 0 0 10px -2px rgba(34, 184, 255, 0.2), 0 4px 12px -4px rgba(0, 0, 0, 0.6)',
  md: '0 0 0 1px rgba(34, 184, 255, 0.18), 0 0 24px -4px rgba(34, 184, 255, 0.22), 0 12px 32px -16px rgba(0, 0, 0, 0.7)',
  lg: '0 0 0 1px rgba(34, 184, 255, 0.22), 0 0 40px -6px rgba(34, 184, 255, 0.26), 0 12px 32px -16px rgba(0, 0, 0, 0.8)',
  xl: '0 0 0 1px rgba(34, 184, 255, 0.26), 0 0 60px -8px rgba(34, 184, 255, 0.3), 0 16px 36px -20px rgba(0, 0, 0, 0.9)',
});

/** 大屏主题的圆角：偏小，线条利落，像仪表面板 */
export const bigScreenRadii = css.createTheme(radii, {
  none: '0',
  xs: '0.1em',
  sm: '0.2em',
  md: '0.3em',
  lg: '0.45em',
  xl: '0.65em',
  full: '9999px',
});

/** 大屏主题：适合数据大屏的深蓝底、青蓝品牌色、发光的面板与鲜明的图表色；浏览器配色按暗色 */
export const bigScreenTheme: Theme = {
  name: 'big-screen',
  colorScheme: 'dark',
  styles: [bigScreenColors, bigScreenShadows, defaultFonts, bigScreenRadii],
  overrides: {},
};
