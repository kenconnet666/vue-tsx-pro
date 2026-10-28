/** 页面取数据的组合式函数：类型来自 loaders.ts（只导入类型，loader 本身不进浏览器的包） */
import { pageDataHook } from './framework/data.ts';
import type { loaders } from './loaders.ts';

export const usePageData = pageDataHook<typeof loaders>();
