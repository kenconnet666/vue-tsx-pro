/**
 * 页面里用的服务端能力：取页面数据、调用 action。类型来自 loaders.ts、actions.ts（只导入类型，它们本身不进浏览器的包）。
 * 还有前端缓存：存在 IndexedDB，服务端推来改了的表名时按表名失效（kit 的失效推送）
 */
import { createCache, indexedDbDriver } from '@zerodep-dev/storage';
import { actionClient, listenInvalidation, pageDataHook } from '@zerodep-dev/vue-tsx-pro-kit';
import type { actions as serverActions } from './actions.ts';
import type { loaders } from './loaders.ts';

export const usePageData = pageDataHook<typeof loaders>();
export const actions = actionClient<typeof serverActions>();

/** 前端缓存：五分钟内新鲜（表改了会提前失效） */
export const cache = createCache(indexedDbDriver({ name: 'fullstack-demo' }), { ttl: 5 * 60_000 });

// 只在浏览器里连：服务端渲染时什么也不做
listenInvalidation((tags) => void (tags ? cache.invalidateTag(tags) : cache.invalidatePrefix('')));
