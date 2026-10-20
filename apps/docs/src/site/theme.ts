/**
 * 站点的主题：主题偏好（全部内置主题或跟随系统）加上主题编辑器的设置，都记在 localStorage。
 * index.html 里的防闪烁脚本用同一个偏好存储键；编辑器的设置在应用加载后套上。
 */
import {
  builtinThemes,
  createThemePreference,
  customizeTheme,
  useReducedMotion,
  type Theme,
  type ThemeSettings,
} from '@vue-tsx-pro/ui';
import { effectScope, ref, watch } from 'vue';

export const preference = createThemePreference({ themes: builtinThemes });

const SETTINGS_KEY = 'vue-tsx-pro-theme-settings';

function readSettings(): ThemeSettings {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as ThemeSettings;
  } catch {
    return {};
  }
}

/** 主题编辑器的设置：改动立即生效，并记下来 */
export const themeSettings = ref<ThemeSettings>(readSettings());

// 跟随系统的监听不属于哪个组件，放在自己的作用域里
const reducedMotion = effectScope(true).run(() => {
  watch(
    themeSettings,
    (settings) => {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        // 隐私模式、禁用存储：不记
      }
    },
    { deep: true },
  );
  return useReducedMotion();
})!;

/** 实际生效的主题：明暗偏好选出的主题，套上编辑器的设置 */
export function siteTheme(): Theme {
  return customizeTheme(preference.theme, themeSettings.value, {
    reducedMotion: reducedMotion.value,
  });
}
