import { jsonCodec, keyList, type StorageDriver, type TextCodec } from '../driver.ts';

/** webStorageDriver 的选项 */
export interface WebStorageDriverOptions {
  /** 用哪个：默认 localStorage；sessionStorage 只在这个标签页里记 */
  storage?: () => Storage;
  /** 键前缀：和页面上别的 localStorage 数据分开，clear 只清前缀下的；默认没有前缀 */
  prefix?: string;
  /** 值写成文字的方式，默认 JSON */
  codec?: TextCodec;
}

/**
 * localStorage / sessionStorage 的驱动：同步接口包成异步，值经 codec 写成文字（每个源约 5MB）。
 * 隐私模式、禁用存储时取 storage 就会抛错：读写以带驱动名的错误失败（要静默兜底就换 indexedDbDriver 的 fallback 或自己 catch）。
 * 别的标签页改了同一个存储时浏览器发 storage 事件，watch 收听它
 */
export function webStorageDriver(options: WebStorageDriverOptions = {}): StorageDriver {
  const { prefix = '', codec = jsonCodec } = options;
  const name = prefix ? `webStorage(${prefix})` : 'webStorage';
  const area = (): Storage => {
    try {
      return options.storage ? options.storage() : globalThis.localStorage;
    } catch (cause) {
      throw new Error(`${name}: web storage is not available`, { cause });
    }
  };
  const own = (storage: Storage) => {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null && key.startsWith(prefix)) keys.push(key);
    }
    return keys;
  };
  // 同步的错误也以 rejected Promise 交出去，和别的驱动一样
  const run = <T>(work: (storage: Storage) => T): Promise<T> => {
    try {
      return Promise.resolve(work(area()));
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    name,
    get<T>(key: string) {
      return run((storage) => {
        const text = storage.getItem(prefix + key);
        if (text === null) return undefined;
        try {
          return codec.decode(text) as T;
        } catch {
          // 被手改坏了、换过编码：当作没有
          return undefined;
        }
      });
    },
    set(key, value) {
      return run((storage) => {
        if (value === undefined) return storage.removeItem(prefix + key);
        try {
          storage.setItem(prefix + key, codec.encode(value));
        } catch (cause) {
          throw new Error(`${name}: cannot write "${key}" (storage full or disabled)`, { cause });
        }
      });
    },
    delete(keys) {
      return run((storage) => {
        for (const key of keyList(keys)) storage.removeItem(prefix + key);
      });
    },
    keys(match = '') {
      return run((storage) =>
        own(storage)
          .map((key) => key.slice(prefix.length))
          .filter((key) => key.startsWith(match)),
      );
    },
    clear() {
      return run((storage) => {
        if (!prefix) return storage.clear();
        for (const key of own(storage)) storage.removeItem(key);
      });
    },
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
