import type { StorageDriver } from '../driver.ts';
import { textDriver, type TextDriverOptions, type TextStore } from './text-store.ts';

/** webStorageDriver 的选项 */
export interface WebStorageDriverOptions extends TextDriverOptions {
  /** 用哪个：默认 localStorage；sessionStorage 只在这个标签页里记 */
  storage?: () => Storage;
}

/**
 * localStorage / sessionStorage 的驱动：同步接口包成异步，值经 codec 写成文字（每个源约 5MB）。
 * 隐私模式、禁用存储时取 storage 就会抛错：读写以带驱动名的错误失败（要静默兜底就换 indexedDbDriver 的 fallback 或自己 catch）。
 * 别的标签页改了同一个存储时浏览器发 storage 事件，watch 收听它
 */
export function webStorageDriver(options: WebStorageDriverOptions = {}): StorageDriver {
  const { prefix = '' } = options;
  const area = () => (options.storage ? options.storage() : globalThis.localStorage);
  const open = (): TextStore => {
    const storage = area();
    return {
      read: (key) => storage.getItem(key) ?? undefined,
      write: (key, text) => storage.setItem(key, text),
      remove: (key) => storage.removeItem(key),
      keys: () => Array.from({ length: storage.length }, (_, i) => storage.key(i)!),
      clear: () => storage.clear(),
    };
  };

  return {
    ...textDriver(prefix ? `webStorage(${prefix})` : 'webStorage', open, options),
    watch(listener) {
      if (typeof window === 'undefined') return () => {};
      const onStorage = (event: StorageEvent) => {
        if (event.storageArea !== area()) return;
        // key 为 null 是别处调了 clear()
        if (event.key === null) listener(undefined);
        else if (event.key.startsWith(prefix)) listener([event.key.slice(prefix.length)]);
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    },
  };
}
