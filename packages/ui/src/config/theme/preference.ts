/**
 * 主题偏好：用户选“跟随系统”或某一套主题，记在本地存储里，下次打开、其他标签页都沿用。
 * 在创建应用前调用，把 theme 交给 createUi：
 *
 *   const preference = createThemePreference({ themes: { light: lightTheme, dark: darkTheme, paper: paperTheme } });
 *   app.use(createUi({ theme: () => preference.theme, paintDocument: true }));
 *   preference.set('paper', { origin: { x: event.clientX, y: event.clientY } });   // 从点击处圆形展开
 *
 * 页面加载时先闪一下默认主题：在 HTML 的 <head> 里内联 themeBootScript(…) 生成的脚本，应用加载前就把底色设对（见 boot.ts）。
 */
import { computed, effectScope, shallowRef } from 'vue';
import { revealTransition, type RevealOrigin } from '../../utils/motion/reveal';
import { usePrefersDark } from '../../utils/dom/media-query';
import { DEFAULT_THEME_STORAGE_KEY, SYSTEM_THEME } from './boot';
import type { Theme } from './theme';

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

/** 创建主题偏好；在应用的生命周期里一直有效（跟随系统与其他标签页的监听不撤销） */
export function createThemePreference<Name extends string>(
  options: ThemePreferenceOptions<Name>,
): ThemePreference<Name> {
  const names = Object.keys(options.themes) as Name[];
  const system =
    options.system ?? ({ light: 'light', dark: 'dark' } as { light: Name; dark: Name });
  const storageKey = options.storageKey ?? DEFAULT_THEME_STORAGE_KEY;
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
