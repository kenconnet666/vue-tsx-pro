/**
 * 暗色主题与"跟随系统"：只改颜色与阴影两组变量的类，挂在 ThemeProvider 的根元素上（或任意祖先上），换主题不用重新渲染组件。
 * 取值同 Radix Colors 的暗色色阶（与 tokens.ts 注释里写的暗色值一致）。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { colors, shadows } from './tokens';

/** 暗色主题的颜色 */
const darkColors = {
  background: '#111113',
  surface: '#18191b',
  surfaceMuted: '#212225',
  fill: '#272a2d',
  fillActive: '#2e3135',
  text: '#edeef0',
  textMuted: '#b0b4ba',
  textPlaceholder: '#777b84',
  textDisabled: '#5a6169',
  border: '#363a3f',
  borderStrong: '#43484e',
  accent: '#3e63dd',
  accentActive: '#3758d4',
  accentContrast: '#ffffff',
  accentText: '#9eb1ff',
  accentSoft: '#182449',
  accentSoftActive: '#1d2e62',
  accentBorder: '#3a4f97',
  danger: '#b54548',
  dangerActive: '#a33b3e',
  dangerContrast: '#ffffff',
  dangerText: '#ff9592',
  dangerSoft: '#3b1219',
  dangerSoftActive: '#500f1c',
  dangerBorder: '#8c333a',
  success: '#30a46c',
  successActive: '#52af7d',
  successContrast: '#111113',
  successText: '#3dd68c',
  successSoft: '#132d21',
  successSoftActive: '#113b29',
  successBorder: '#28684a',
  warning: '#ffc53d',
  warningActive: '#ffcd5f',
  warningContrast: '#111113',
  warningText: '#ffca16',
  warningSoft: '#302008',
  warningSoftActive: '#3f2700',
  warningBorder: '#714f19',
  info: '#0090ff',
  infoActive: '#3d9fff',
  infoContrast: '#111113',
  infoText: '#70b8ff',
  infoSoft: '#0d2847',
  infoSoftActive: '#003362',
  infoBorder: '#205d9e',
  inverseSurface: '#edeef0',
  inverseText: '#111113',
  overlay: 'rgba(0, 0, 0, 0.7)',
  focusRing: '#3e63dd',
} satisfies Record<Extract<keyof typeof colors, string>, string>;

/** 暗色主题里阴影看不出来，靠表面的层级区分 */
const darkShadows = { sm: 'none', md: 'none', lg: '0 12px 40px -8px rgba(0, 0, 0, 0.6)' };

const SYSTEM_DARK = '@media (prefers-color-scheme: dark)';

/** 按系统偏好取值：亮色时不改，系统是暗色时换成暗色值 */
const followSystem = (values: Record<string, string>) =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { [SYSTEM_DARK]: value }]));

/** 暗色主题：颜色与阴影两个类，一起挂上 */
export const darkTheme = [
  css.createTheme(colors, darkColors),
  css.createTheme(shadows, darkShadows),
];

/** 跟随系统：系统是暗色时用暗色值 */
export const systemTheme = [
  css.createTheme(colors, followSystem(darkColors)),
  css.createTheme(shadows, followSystem(darkShadows)),
];
