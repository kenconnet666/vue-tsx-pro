/**
 * 防闪烁脚本与内置主题的底色：生成 HTML 时（构建脚本、服务端模板）在 Node 里调用，所以这个模块不依赖样式引擎与 Vue，
 * 另有子路径入口 `@zerodep-dev/vue-tsx-pro-ui/theme-boot`。
 *
 *   import { builtinThemeBootColors, themeBootScript } from '@zerodep-dev/vue-tsx-pro-ui/theme-boot';
 *   const html = `<script>${themeBootScript({ themes: builtinThemeBootColors })}</script>`;
 */
// 只取类型：这个模块要在 Node 里运行，不能带上主题文件（样式引擎）
import type { BuiltinThemeName } from './builtin';
import type { ColorSchemes } from './theme';

/** 跟随系统的取值 */
export const SYSTEM_THEME = 'system';

/** 记住主题选择的默认 localStorage 键（createThemePreference 与 themeBootScript 共用） */
export const DEFAULT_THEME_STORAGE_KEY = 'vue-tsx-pro-theme';

/** themeBootScript 要知道的每套主题的取值：主题的颜色编译后是 CSS 变量，脚本在应用加载前拿不到 */
export interface ThemeBootColors {
  /** 页面背景色 */
  background: string;
  /** 文字色 */
  text: string;
  /** 浏览器配色方案 */
  colorScheme: keyof ColorSchemes;
}

/**
 * 防闪烁：生成一段内联到 HTML <head> 的脚本，应用加载前按记住的偏好设好页面底色、文字色与配色方案，
 * 并写上 data-theme。应用挂载后 createUi 接手（paintDocument 时去掉这里写的行内颜色）。
 */
export function themeBootScript<Name extends string>(options: {
  /** 各主题的取值 */
  themes: Record<Name, ThemeBootColors>;
  /** 跟随系统时用哪两套，默认 light、dark */
  system?: { light: Name; dark: Name };
  /** 与 createThemePreference 相同的存储键 */
  storageKey?: string;
  /** 没记过时的偏好，默认跟随系统 */
  fallback?: Name | typeof SYSTEM_THEME;
}): string {
  const config = JSON.stringify({
    themes: options.themes,
    system: options.system ?? { light: 'light', dark: 'dark' },
    key: options.storageKey ?? DEFAULT_THEME_STORAGE_KEY,
    fallback: options.fallback ?? SYSTEM_THEME,
  });
  return `(()=>{const c=${config};let p;try{p=localStorage.getItem(c.key)}catch(e){}if(p!=='system'&&!c.themes[p])p=c.fallback;const n=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?c.system.dark:c.system.light):p;const t=c.themes[n];if(!t)return;const r=document.documentElement;r.dataset.theme=n;r.style.colorScheme=t.colorScheme;r.style.backgroundColor=t.background;r.style.color=t.text})()`;
}

/**
 * 内置主题（builtinThemes）的底色、文字色与配色方案，给 themeBootScript 用。
 * 与主题文件里的 background、text 一致（pnpm themes:check 核对）
 */
export const builtinThemeBootColors = {
  light: { background: '#fcfcfd', text: '#1c2024', colorScheme: 'light' },
  dark: { background: '#111113', text: '#edeef0', colorScheme: 'dark' },
  paper: { background: '#f5efdf', text: '#3b2f20', colorScheme: 'light' },
  midnight: { background: '#0d1321', text: '#eef2fa', colorScheme: 'dark' },
  'high-contrast': { background: '#ffffff', text: '#000000', colorScheme: 'light' },
  ocean: { background: '#f7fdff', text: '#10222c', colorScheme: 'light' },
  forest: { background: '#f9fef9', text: '#182318', colorScheme: 'light' },
  lemon: { background: '#fefdf2', text: '#232010', colorScheme: 'light' },
  sakura: { background: '#fffafc', text: '#281b20', colorScheme: 'light' },
  festive: { background: '#fffaf6', text: '#2c1b13', colorScheme: 'light' },
  cyberpunk: { background: '#110e20', text: '#ede9ff', colorScheme: 'dark' },
  coffee: { background: '#180f0a', text: '#ffe9dc', colorScheme: 'dark' },
} as const satisfies Record<BuiltinThemeName, ThemeBootColors>;
