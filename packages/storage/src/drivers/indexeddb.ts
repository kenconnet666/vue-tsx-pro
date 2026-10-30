import { keyList, type StorageDriver } from '../driver.ts';
import { memoryDriver } from './memory.ts';

/** indexedDbDriver 的选项 */
export interface IndexedDbDriverOptions {
  /** 数据库名，默认 'zerodep-storage' */
  name?: string;
  /** 对象仓库名，默认 'kv'：同一个库里可以有几个仓库，各自一个驱动 */
  store?: string;
  /**
   * 写入的持久性：'relaxed' 不等落盘就算写完（Chrome 上快很多，断电可能丢最后几笔），适合丢了只是重新请求的缓存；
   * 默认 'default'，由浏览器决定
   */
  durability?: 'default' | 'strict' | 'relaxed';
  /**
   * IndexedDB 打不开时（隐私模式、禁用存储、不是浏览器）改用的驱动，默认 memoryDriver()；
   * 给 null 时不退回，读写以打开时的错误失败。available() 能查到退回了没有
   */
  fallback?: StorageDriver | null;
}

/** IndexedDB 驱动多出来的 */
export interface IndexedDbDriver extends StorageDriver {
  /** IndexedDB 能用：false 表示打不开、读写都交给了 fallback */
  available(): Promise<boolean>;
}

/** IDBRequest 转 Promise */
function settle<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB 的驱动（直接用浏览器的接口，不依赖 idb / idb-keyval）：键是字符串，值按结构化克隆原样存，
 * Date、Map、Blob、ArrayBuffer 都保留，容量按磁盘的比例算（远大于 localStorage）。
 *
 *   const drafts = indexedDbDriver({ name: 'app', store: 'drafts' });
 *   await drafts.set('order:7', form);
 *
 * - 第一次读写时才打开库；仓库不在时升一个版本建上（几个仓库共用一个库也行）
 * - 别的标签页要升级这个库时，这边先关掉连接、下次读写再打开，不会把对方卡住
 * - 写完经 BroadcastChannel 告诉同一个库的别的标签页，watch 收到改了的键
 * - 每次读写一个事务，事务里不等别的东西（IndexedDB 的事务在没有待办请求时自动提交）
 */
export function indexedDbDriver(options: IndexedDbDriverOptions = {}): IndexedDbDriver {
  const { name: dbName = 'zerodep-storage', store = 'kv', durability = 'default' } = options;
  const fallback = options.fallback === undefined ? memoryDriver() : options.fallback;
  const name = `indexedDb(${dbName}/${store})`;
  let opening: Promise<IDBDatabase | undefined> | undefined;
  let channel: BroadcastChannel | undefined;
  const listeners = new Set<(keys: readonly string[] | undefined) => void>();

  /**
   * 跨标签页的通知用一个频道对象收发：BroadcastChannel 收不到自己发的消息，所以 watch 只听到别处的写入
   */
  function broadcast(): BroadcastChannel | undefined {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    if (!channel) {
      channel = new BroadcastChannel(`zerodep-storage:${dbName}/${store}`);
      channel.onmessage = (event: MessageEvent<readonly string[] | null>) => {
        for (const listener of listeners) listener(event.data ?? undefined);
      };
      // Node 里开着的频道会让进程不退出（测试、服务端渲染）；浏览器没有这个方法
      (channel as { unref?: () => void }).unref?.();
    }
    return channel;
  }

  /** 打开库，仓库不在时升版本建上；打不开时有 fallback 就给 undefined */
  function database(): Promise<IDBDatabase | undefined> {
    opening ??= connect().catch((error: unknown) => {
      if (fallback) return undefined;
      opening = undefined;
      throw new Error(`${name}: cannot open IndexedDB`, { cause: error });
    });
    return opening;
  }

  async function connect(version?: number): Promise<IDBDatabase> {
    const factory = globalThis.indexedDB;
    if (!factory) throw new Error('indexedDB is not defined');
    const request = factory.open(dbName, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store);
    };
    const db = await settle(request);
    if (!db.objectStoreNames.contains(store)) {
      // 库已经有了、少这个仓库：升一个版本，在 upgradeneeded 里建
      const next = db.version + 1;
      db.close();
      return connect(next);
    }
    db.onversionchange = () => {
      db.close();
      opening = undefined;
    };
    // 浏览器异常关掉连接（清了站点数据、磁盘出错）：下次读写重新打开
    db.onclose = () => (opening = undefined);
    return db;
  }

  /** 在一个事务里做一件事；写入等事务提交了才算完 */
  async function transact<T>(
    db: IDBDatabase,
    mode: IDBTransactionMode,
    work: (objects: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const tx = db.transaction(store, mode, { durability });
    const result = settle(work(tx.objectStore(store)));
    if (mode === 'readonly') return result;
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
    return result;
  }

  /** 读写时 IndexedDB 不能用就交给 fallback */
  async function route<T>(
    viaIndexedDb: (db: IDBDatabase) => Promise<T>,
    viaFallback: (driver: StorageDriver) => Promise<T>,
  ): Promise<T> {
    const db = await database();
    // database() 只在有 fallback 时给 undefined
    return db ? viaIndexedDb(db) : viaFallback(fallback!);
  }

  function announce(keys: readonly string[] | undefined) {
    broadcast()?.postMessage(keys ?? null);
  }

  function write(keys: readonly string[] | undefined, work: () => Promise<unknown>): Promise<void> {
    return work().then(
      () => announce(keys),
      (cause: unknown) => {
        const quota = cause instanceof DOMException && cause.name === 'QuotaExceededError';
        throw new Error(
          `${name}: cannot write ${keys ? keys.map((k) => `"${k}"`).join(', ') : 'all keys'}` +
            (quota ? ' (storage quota exceeded)' : ''),
          { cause },
        );
      },
    );
  }

  return {
    name,
    available: async () => (await database()) !== undefined,
    get<T>(key: string) {
      return route(
        (db) =>
          transact(db, 'readonly', (objects) => objects.get(key) as IDBRequest<T | undefined>),
        (driver) => driver.get<T>(key),
      );
    },
    set(key, value) {
      return route(
        (db) =>
          write([key], () =>
            transact(
              db,
              'readwrite',
              (objects) =>
                // 结果用不到：只等事务提交
                (value === undefined
                  ? objects.delete(key)
                  : objects.put(value, key)) as IDBRequest<unknown>,
            ),
          ),
        (driver) => driver.set(key, value),
      );
    },
    delete(keys) {
      const list = keyList(keys);
      return route(
        async (db) => {
          if (list.length === 0) return;
          // 一个事务删完：最后一个请求的结果就是事务的结果
          await write(list, () =>
            transact(db, 'readwrite', (objects) => {
              let last!: IDBRequest<undefined>;
              for (const key of list) last = objects.delete(key);
              return last;
            }),
          );
        },
        (driver) => driver.delete(list),
      );
    },
    keys(prefix = '') {
      return route(
        async (db) => {
          // 字符串键按码元排序：[prefix, prefix + U+FFFF] 是以它开头的全部键
          const range = prefix ? IDBKeyRange.bound(prefix, `${prefix}￿`) : undefined;
          const keys = await transact(db, 'readonly', (objects) => objects.getAllKeys(range));
          return keys.filter((key): key is string => typeof key === 'string');
        },
        (driver) => driver.keys(prefix),
      );
    },
    clear() {
      return route(
        (db) => write(undefined, () => transact(db, 'readwrite', (objects) => objects.clear())),
        (driver) => driver.clear(),
      );
    },
    watch(listener) {
      if (!broadcast()) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * 申请持久存储（这个源的数据不被浏览器在空间紧张时清掉；Safari 7 天没打开过的网站数据也会被清，装到主屏的 PWA 例外）。
 * 浏览器可能直接同意、按使用情况决定或弹窗问；不支持时 false
 */
export async function persistStorage(): Promise<boolean> {
  const storage = globalThis.navigator?.storage;
  if (!storage?.persist) return false;
  return (await storage.persisted()) || storage.persist();
}
