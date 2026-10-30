import { jsonCodec, keyList, type StorageDriver, type TextCodec } from '../driver.ts';

/**
 * 同步的、只能存文字的键值存储：localStorage 与各家小程序的 storage 都包成这个形状，
 * 前缀、编码、错误与同步转异步由 textDriver 统一处理
 */
export interface TextStore {
  /** 没有时 undefined */
  read(key: string): string | undefined;
  write(key: string, text: string): void;
  remove(key: string): void;
  /** 全部的键（不管前缀） */
  keys(): string[];
  clear(): void;
}

/** 存文字的驱动共有的选项 */
export interface TextDriverOptions {
  /** 键前缀：和别的数据分开，clear 只清前缀下的；默认没有前缀 */
  prefix?: string;
  /** 值写成文字的方式，默认 JSON */
  codec?: TextCodec;
}

/** 在一个文字存储上建驱动；open 取不到存储时（隐私模式、禁用存储）读写以带驱动名的错误失败 */
export function textDriver(
  name: string,
  open: () => TextStore,
  options: TextDriverOptions = {},
): StorageDriver {
  const { prefix = '', codec = jsonCodec } = options;
  const own = (store: TextStore) => store.keys().filter((key) => key.startsWith(prefix));
  // 同步的错误也以 rejected Promise 交出去，和别的驱动一样
  const run = <T>(work: (store: TextStore) => T): Promise<T> => {
    try {
      let store: TextStore;
      try {
        store = open();
      } catch (cause) {
        throw new Error(`${name}: storage is not available`, { cause });
      }
      return Promise.resolve(work(store));
    } catch (error) {
      return Promise.reject(error);
    }
  };

  return {
    name,
    get<T>(key: string) {
      return run((store) => {
        const text = store.read(prefix + key);
        if (text === undefined) return undefined;
        try {
          return codec.decode(text) as T;
        } catch {
          // 被手改坏了、换过编码：当作没有
          return undefined;
        }
      });
    },
    set(key, value) {
      return run((store) => {
        if (value === undefined) return store.remove(prefix + key);
        try {
          store.write(prefix + key, codec.encode(value));
        } catch (cause) {
          const reason = 'storage full, entry too large or disabled';
          throw new Error(`${name}: cannot write "${key}" (${reason})`, { cause });
        }
      });
    },
    delete(keys) {
      return run((store) => {
        for (const key of keyList(keys)) store.remove(prefix + key);
      });
    },
    keys(match = '') {
      return run((store) =>
        own(store)
          .map((key) => key.slice(prefix.length))
          .filter((key) => key.startsWith(match)),
      );
    },
    clear() {
      return run((store) => {
        if (!prefix) return store.clear();
        for (const key of own(store)) store.remove(key);
      });
    },
  };
}
