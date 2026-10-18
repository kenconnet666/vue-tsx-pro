import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { Theme } from './theme';
import { colors, shadows } from './tokens.stylex';

// Radix Colors 的暗色色阶，各 token 对应的级别见 tokens.stylex.ts
const darkColors = stylex.createTheme(colors, {
  background: '#111113',
  surface: '#18191b',
  surfaceMuted: '#18191b',
  surfaceRaised: '#212225',
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
  accentHover: '#5472e4',
  accentContrast: '#ffffff',
  accentText: '#9eb1ff',
  accentSoft: '#182449',
  accentSoftHover: '#1d2e62',
  accentBorder: '#3a4f97',
  danger: '#e5484d',
  dangerHover: '#ec5d5e',
  dangerContrast: '#ffffff',
  dangerText: '#ff9592',
  dangerSoft: '#3b1219',
  dangerSoftHover: '#500f1c',
  dangerBorder: '#8c333a',
  successText: '#3dd68c',
  successSoft: '#132d21',
  successBorder: '#28684a',
  warningText: '#ffca16',
  warningSoft: '#302008',
  warningBorder: '#714f19',
  infoText: '#70b8ff',
  infoSoft: '#0d2847',
  infoBorder: '#205d9e',
  focusRing: '#3e63dd',
  overlay: 'rgba(0, 0, 0, 0.6)',
});

// Radix Themes 的暗色阴影：深色背景上阴影要更重才看得出层次
const darkShadows = stylex.createTheme(shadows, {
  card: '0 1px 1px 0 rgba(0, 0, 0, 0.4), 0 2px 1px -1px rgba(0, 0, 0, 0.4), 0 1px 3px 0 rgba(0, 0, 0, 0.3)',
  popover: '0 12px 60px rgba(0, 0, 0, 0.3), 0 12px 32px -16px rgba(0, 0, 0, 0.5)',
  dialog:
    '0 12px 60px rgba(0, 0, 0, 0.2), 0 16px 64px rgba(0, 0, 0, 0.4), 0 16px 36px -20px rgba(0, 0, 0, 0.9)',
});

/** 暗色主题 */
export const darkTheme: Theme = {
  name: 'dark',
  colorScheme: 'dark',
  styles: [darkColors, darkShadows],
  overrides: {},
};
