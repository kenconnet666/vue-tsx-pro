/**
 * 内置主题：名字 → 主题。createThemePreference 的 themes 可以直接用它，也可以挑几套：
 *
 *   createThemePreference({ themes: builtinThemes })
 *   createThemePreference({ themes: { light: lightTheme, dark: darkTheme, ocean: oceanTheme } })
 *
 * 名字与各主题的 name、防闪烁脚本的 builtinThemeBootColors、ThemeSwitcher 的默认文字和图标一一对应。
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
