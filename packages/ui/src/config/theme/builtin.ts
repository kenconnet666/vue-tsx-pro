/**
 * 内置主题：名字 → 主题。createThemePreference 的 themes 可以直接用它，也可以挑几套：
 *
 *   createThemePreference({ themes: builtinThemes })
 *   createThemePreference({ themes: { light: lightTheme, dark: darkTheme, forest: forestTheme } })
 *
 * 加一套内置主题：在这里登记，再补上语言包里的名字（builtinThemeLabel）、boot.ts 的底色、ThemeSwitcher 的图标——
 * 后三处按 BuiltinThemeName 写成完整的表，漏了类型检查会报错；pnpm -C packages/ui check:themes 从这里读出主题文件核对颜色。
 */
import { bigScreenTheme } from './big-screen';
import { celadonTheme } from './celadon';
import { cyberpunkTheme } from './cyberpunk';
import { darkTheme } from './dark';
import { emberTheme } from './ember';
import { festiveTheme } from './festive';
import { forestTheme } from './forest';
import { highContrastTheme } from './high-contrast';
import { highContrastDarkTheme } from './high-contrast-dark';
import { lavenderTheme } from './lavender';
import { lemonTheme } from './lemon';
import { lightTheme } from './light';
import { midnightTheme } from './midnight';
import { monoTheme } from './mono';
import { paperTheme } from './paper';
import { sakuraTheme } from './sakura';
import type { Lang } from '../lang/lang';
import type { Theme } from './theme';

/** 全部内置主题，按亮色、暗色、纸张、午夜、高对比（亮、暗），再到各风格主题排列（ThemeSwitcher 按这个顺序列出） */
export const builtinThemes = {
  light: lightTheme,
  dark: darkTheme,
  paper: paperTheme,
  midnight: midnightTheme,
  'high-contrast': highContrastTheme,
  'high-contrast-dark': highContrastDarkTheme,
  forest: forestTheme,
  lemon: lemonTheme,
  sakura: sakuraTheme,
  festive: festiveTheme,
  cyberpunk: cyberpunkTheme,
  'big-screen': bigScreenTheme,
  lavender: lavenderTheme,
  ember: emberTheme,
  mono: monoTheme,
  celadon: celadonTheme,
} as const satisfies Record<string, Theme>;

/** 内置主题的名字 */
export type BuiltinThemeName = keyof typeof builtinThemes;

/** 内置主题在当前语言下的名字：`builtinThemeLabel(lang, 'high-contrast')` → “高对比” */
export function builtinThemeLabel(lang: Lang, name: BuiltinThemeName): string {
  const labels: Record<BuiltinThemeName, string> = {
    light: lang.themeLight,
    dark: lang.themeDark,
    paper: lang.themePaper,
    midnight: lang.themeMidnight,
    'high-contrast': lang.themeHighContrast,
    'high-contrast-dark': lang.themeHighContrastDark,
    forest: lang.themeForest,
    lemon: lang.themeLemon,
    sakura: lang.themeSakura,
    festive: lang.themeFestive,
    cyberpunk: lang.themeCyberpunk,
    'big-screen': lang.themeBigScreen,
    lavender: lang.themeLavender,
    ember: lang.themeEmber,
    mono: lang.themeMono,
    celadon: lang.themeCeladon,
  };
  return labels[name];
}
