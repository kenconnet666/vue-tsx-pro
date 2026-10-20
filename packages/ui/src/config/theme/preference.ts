/**
 * 主题偏好：用户选“跟随系统”或某一套主题，记在本地存储里，下次打开、其他标签页都沿用。
 * 在创建应用前调用，把 theme 交给 createUi：
 *
 *   const preference = createThemePreference({ themes: { light: lightTheme, dark: darkTheme, paper: paperTheme } });
 *   app.use(createUi({ theme: () => preference.theme, paintDocument: true }));
 *   preference.set('paper', { origin: { x: event.clientX, y: event.clientY } });   // 从点击处圆形展开
 *
 * 页面加载时先闪一下默认主题：在 HTML 的 <head> 里内联 themeBootScript(…) 生成的脚本，应用加载前就把底色设对。
 */
import { computed, effectScope, shallowRef } from 'vue';
import { revealTransition, type RevealOrigin } from '../../utils/motion/reveal';
import { usePrefersDark } from '../../utils/dom/media-query';
import type { ColorSchemes, Theme } from './theme';

/** 跟随系统的取值 */
export const SYSTEM_THEME = 'system';

/** createThemePreference 的选项 */
export interface ThemePreferenceOptions<Name extends string> {
  /** 可选的主题：名字 → 主题 */
  themes: Record<Name, Theme>;
  /** 跟随系统时，亮色与暗色各用哪一套；默认 light、dark */
  system?: { light: NoInfer<Name>; dark: NoInfer<Name> };
  /** 记住选择的 localStorage 键，默认 'vue-tsx-pro-theme'；false 不记 */
  storageKey?: string | false;
  /** 没记过（或记的主题已经没有了）时的偏好，默认跟随系统 */
  fallback?: NoInfer<Name> | typeof SYSTEM_THEME;
}

/** 主题偏好：当前的选择、解析出的主题，以及切换 */
export interface ThemePreference<Name extends string> {
  /** 可选的主题名，按 themes 里的顺序（ThemeSwitcher 据此列出选项） */
  readonly names: readonly Name[];
  /** 当前的选择：某一套主题，或 'system' */
  readonly preference: Name | typeof SYSTEM_THEME;
  /** 解析出的主题名（跟随系统时按系统明暗） */
  readonly name: Name;
  /** 解析出的主题，交给 createUi 或 Provider */
  readonly theme: Theme;
  /** 切换；给了 origin 时从那里圆形展开新主题（见 revealTransition） */
  set(preference: Name | typeof SYSTEM_THEME, options?: { origin?: RevealOrigin }): Promise<void>;
}

const DEFAULT_STORAGE_KEY = 'vue-tsx-pro-theme';

/** 创建主题偏好；在应用的生命周期里一直有效（跟随系统与其他标签页的监听不撤销） */
export function createThemePreference<Name extends string>(
  options: ThemePreferenceOptions<Name>,
): ThemePreference<Name> {
  const names = Object.keys(options.themes) as Name[];
  const system =
    options.system ?? ({ light: 'light', dark: 'dark' } as { light: Name; dark: Name });
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const fallback = options.fallback ?? SYSTEM_THEME;
  const isChoice = (value: unknown): value is Name | typeof SYSTEM_THEME =>
    value === SYSTEM_THEME || names.includes(value as Name);

  const read = () => {
    const stored = storageKey ? safeStorage()?.getItem(storageKey) : null;
    return isChoice(stored) ? stored : fallback;
  };
  const preference = shallowRef<Name | typeof SYSTEM_THEME>(read());

  // 跟随系统的监听不属于哪个组件，放在自己的作用域里
  const scope = effectScope(true);
  const name = scope.run(() => {
    const prefersDark = usePrefersDark();
    return computed<Name>(() =>
      preference.value === SYSTEM_THEME
        ? prefersDark.value
          ? system.dark
          : system.light
        : preference.value,
    );
  })!;

  // 其他标签页改了偏好：跟着变
  if (storageKey && typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === storageKey) preference.value = read();
    });
  }

  return {
    names,
    get preference() {
      return preference.value;
    },
    get name() {
      return name.value;
    },
    get theme() {
      return options.themes[name.value];
    },
    set(next, { origin } = {}) {
      if (!isChoice(next)) throw new Error(`没有名为 ${String(next)} 的主题`);
      if (storageKey) safeStorage()?.setItem(storageKey, next);
      return revealTransition(() => (preference.value = next), origin);
    },
  };
}

/** 隐私模式、禁用存储时 localStorage 会抛错：当作没有存储 */
function safeStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

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
    key: options.storageKey ?? DEFAULT_STORAGE_KEY,
    fallback: options.fallback ?? SYSTEM_THEME,
  });
  return `(()=>{const c=${config};let p;try{p=localStorage.getItem(c.key)}catch(e){}if(p!=='system'&&!c.themes[p])p=c.fallback;const n=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?c.system.dark:c.system.light):p;const t=c.themes[n];if(!t)return;const r=document.documentElement;r.dataset.theme=n;r.style.colorScheme=t.colorScheme;r.style.backgroundColor=t.background;r.style.color=t.text})()`;
}
