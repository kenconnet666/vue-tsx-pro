/**
 * 内置主题：名字 → 主题。createThemePreference 的 themes 可以直接用它，也可以挑几套：
 *
 *   createThemePreference({ themes: builtinThemes })
 *   createThemePreference({ themes: { light: lightTheme, dark: darkTheme, ocean: oceanTheme } })
 *
 * 加一套内置主题：在这里登记，再补上语言包里的名字（builtinThemeLabel）、boot.ts 的底色、ThemeSwitcher 的图标——
 * 后三处按 BuiltinThemeName 写成完整的表，漏了类型检查会报错；pnpm themes:check 从这里读出主题文件核对颜色。
 */
import { coffeeTheme } from './coffee';
import { cyberpunkTheme } from './cyberpunk';
import { darkTheme } from './dark';
import { festiveTheme } from './festive';
import { forestTheme } from './forest';
import { highContrastTheme } from './high-contrast';
import { lemonTheme } from './lemon';
import { lightTheme } from './light';
import { midnightTheme } from './midnight';
import { oceanTheme } from './ocean';
import { paperTheme } from './paper';
import { sakuraTheme } from './sakura';
import type { Lang } from '../lang/lang';
import type { Theme } from './theme';

/** 全部内置主题，按亮色、暗色、纸张、午夜、高对比，再到各风格主题排列（ThemeSwitcher 按这个顺序列出） */
export const builtinThemes = {
  light: lightTheme,
  dark: darkTheme,
  paper: paperTheme,
  midnight: midnightTheme,
  'high-contrast': highContrastTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  lemon: lemonTheme,
  sakura: sakuraTheme,
  festive: festiveTheme,
  cyberpunk: cyberpunkTheme,
  coffee: coffeeTheme,
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
    ocean: lang.themeOcean,
    forest: lang.themeForest,
    lemon: lang.themeLemon,
    sakura: lang.themeSakura,
    festive: lang.themeFestive,
    cyberpunk: lang.themeCyberpunk,
    coffee: lang.themeCoffee,
  };
  return labels[name];
}
