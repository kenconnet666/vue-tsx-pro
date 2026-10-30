/**
 * 可插拔的前端存储与缓存（ROADMAP 22）：一套异步驱动接口，底下是 IndexedDB、localStorage、内存（小程序存储以后接）；
 * 缓存建在驱动上，换存储不换用法。零依赖、不绑框架。
 */
export { jsonCodec, type StorageDriver, type TextCodec } from './driver.ts';
export { memoryDriver } from './drivers/memory.ts';
export { webStorageDriver, type WebStorageDriverOptions } from './drivers/web-storage.ts';
export {
  indexedDbDriver,
  persistStorage,
  type IndexedDbDriver,
  type IndexedDbDriverOptions,
} from './drivers/indexeddb.ts';
export {
  Cache,
  createCache,
  type CacheEntryOptions,
  type CacheHit,
  type CacheOptions,
} from './cache.ts';
export { cacheStore, type FieldStore } from './cache-store.ts';
