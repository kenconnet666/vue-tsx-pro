/**
 * 站点的主题：主题偏好（全部内置主题或跟随系统）加上主题编辑器的设置，都记在 localStorage。
 * index.html 里的防闪烁脚本用同一个偏好存储键；编辑器的设置在应用加载后套上。
 */
import {
  builtinThemes,
  createThemePreference,
  usePersistentState,
  useReducedMotion,
  type Theme,
} from '@zerodep-dev/vue-tsx-pro-ui';
import type { customizeTheme, ThemeSettings } from '@zerodep-dev/vue-tsx-pro-ui/theme-customize';
import { effectScope, shallowRef, watch } from 'vue';

export const preference = createThemePreference({ themes: builtinThemes });

/** 主题编辑器的设置：改动立即生效，并记下来 */
export const themeSettings = usePersistentState<ThemeSettings>('vue-tsx-pro-theme-settings', {});

// 套用设置要用颜色库与 Radix 色板：访客改过设置才加载，没改过的首屏不带它们
const customize = shallowRef<typeof customizeTheme>();
let loading: Promise<void> | undefined;

function loadCustomize(): Promise<void> {
  loading ??= import('@zerodep-dev/vue-tsx-pro-ui/theme-customize').then((module) => {
    customize.value = module.customizeTheme;
  });
  return loading;
}

const customized = () => Object.values(themeSettings.value).some((value) => value !== undefined);

// 跟随系统的监听不属于哪个组件，放在自己的作用域里
const reducedMotion = effectScope(true).run(() => {
  watch(customized, (yes) => {
    if (yes) void loadCustomize();
  });
  return useReducedMotion();
})!;

/** 挂载前等改过的设置可以套用，免得先闪一下没定制的主题；没改过的不用等 */
export function siteThemeReady(): Promise<void> {
  return customized() ? loadCustomize() : Promise.resolve();
}

/** 实际生效的主题：明暗偏好选出的主题，套上编辑器的设置 */
export function siteTheme(): Theme {
  const apply = customize.value;
  if (!apply) return preference.theme;
  return apply(preference.theme, themeSettings.value, { reducedMotion: reducedMotion.value });
}
