import { builtinThemes, createThemePreference } from '@vue-tsx-pro/ui';

/** 主题偏好：全部内置主题或跟随系统，记在 localStorage */
export const preference = createThemePreference({ themes: builtinThemes });
