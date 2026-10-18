import type { InjectionKey } from 'vue';

/** 宿主在应用层 provide 的站点名，TSX 页面直接 inject（演示与宿主共享 provide / inject） */
export const siteNameKey: InjectionKey<string> = Symbol('siteName');
