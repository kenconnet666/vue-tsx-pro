/**
 * 页面里用的服务端能力：取页面数据、调用 action。类型来自 loaders.ts、actions.ts（只导入类型，它们本身不进浏览器的包）
 */
import { actionClient, pageDataHook } from '@zerodep-dev/vue-tsx-pro-kit';
import type { actions as serverActions } from './actions.ts';
import type { loaders } from './loaders.ts';

export const usePageData = pageDataHook<typeof loaders>();
export const actions = actionClient<typeof serverActions>();
