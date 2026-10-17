import type { InjectionKey } from 'vue';

export type Theme = 'light' | 'dark';

/** 宿主在应用层 provide 的主题，TSX 页面直接 inject */
export const themeKey: InjectionKey<Theme> = Symbol('theme');
