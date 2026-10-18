/**
 * 主题：一组 token 的取值。内置主题由 StyleX 在编译期生成（没有运行时开销）；
 * defineTheme 的局部修改在运行时写成 CSS 变量，作用在 Provider 的容器上。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { Theme as CompiledTheme } from '@vue-tsx-pro/tsx/stylex';
import { colors, fonts, motion, shadows, sizes } from './tokens.stylex';

const groups = { colors, sizes, fonts, shadows, motion };
type Groups = typeof groups;

/** 按分组覆盖部分 token：`{ colors: { accent: '#e5484d' }, sizes: { fontSize: '16px' } }` */
export type ThemeOverrides = {
  [Group in keyof Groups]?: { [Token in keyof Groups[Group]['__tokens']]?: string };
};

export interface Theme {
  /** 主题名，写在容器的 data-theme 上，便于调试与宿主 CSS 定位 */
  readonly name: string;
  /** 浏览器配色方案，影响原生表单控件与滚动条 */
  readonly colorScheme: 'light' | 'dark';
  /** 编译期生成的主题样式（createTheme 的结果）；亮色主题即默认值，为 null */
  readonly styles: CompiledTheme<typeof colors> | null;
  /** 运行时覆盖的取值 */
  readonly overrides: ThemeOverrides;
}

const darkColors = stylex.createTheme(colors, {
  background: '#111113',
  surface: '#18181b',
  surfaceRaised: '#222226',
  surfaceHover: '#27272b',
  text: '#ececef',
  textMuted: '#a0a0ab',
  border: '#3a3a40',
  borderStrong: '#55555d',
  accent: '#5b7ff0',
  accentHover: '#7593f3',
  accentText: '#ffffff',
  danger: '#f0605d',
  success: '#3dd68c',
  warning: '#ffb224',
  focusRing: '#7593f3',
  overlay: 'rgb(0 0 0 / 0.6)',
});

/** 亮色主题：即 tokens 的默认值 */
export const lightTheme: Theme = {
  name: 'light',
  colorScheme: 'light',
  styles: null,
  overrides: {},
};

/** 暗色主题 */
export const darkTheme: Theme = {
  name: 'dark',
  colorScheme: 'dark',
  styles: darkColors,
  overrides: {},
};

/**
 * 基于已有主题局部修改：`defineTheme(lightTheme, { colors: { accent: '#e5484d' } })`。
 * 修改按分组合并，未提到的 token 沿用基础主题。
 */
export function defineTheme(
  base: Theme,
  overrides: ThemeOverrides,
  meta: Partial<Pick<Theme, 'name' | 'colorScheme'>> = {},
): Theme {
  // 分组的键各不相同，按普通对象逐组合并
  const merged: Record<string, Record<string, string | undefined>> = { ...base.overrides };
  for (const [group, values] of Object.entries(overrides)) {
    merged[group] = { ...merged[group], ...values };
  }
  return { ...base, ...meta, overrides: merged as ThemeOverrides };
}

/** 主题落到容器元素上的属性：编译期主题的 class、运行时覆盖的 CSS 变量与配色方案 */
export function themeAttrs(theme: Theme) {
  const compiled = stylex.attrs(theme.styles);
  return {
    class: compiled.class,
    style: [compiled.style, themeVariables(theme)],
    'data-theme': theme.name,
  };
}

/** 运行时覆盖的 token 写成 CSS 变量，并带上配色方案 */
export function themeVariables(theme: Theme): Record<string, string> {
  const variables: Record<string, string> = { 'color-scheme': theme.colorScheme };
  for (const [group, values] of Object.entries(theme.overrides)) {
    const tokens = groups[group as keyof Groups] as unknown as Record<string, string>;
    for (const [token, value] of Object.entries(values ?? {})) {
      variables[variableName(tokens[token]!)] = value as string;
    }
  }
  return variables;
}

/** 编译后的 token 在运行时是 `var(--x1abc)`，取出变量名 `--x1abc` 才能在行内覆盖 */
function variableName(token: string) {
  const match = /^var\((--[\w-]+)\)$/.exec(token);
  if (!match) throw new Error(`无法识别的主题变量：${token}`);
  return match[1]!;
}
