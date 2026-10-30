/**
 * 建在驱动上的缓存：换驱动不换用法。存进去的是 `{ value, expires, until }`，过期时间由这里算，驱动不用支持 TTL。
 *
 *   const cache = createCache(indexedDbDriver({ name: 'app' }), { ttl: 60_000, stale: 86_400_000 });
 *   const provinces = await cache.load('provinces', () => api.get('/provinces'));   // 新鲜的直接给，否则请求并写回
 *   const hit = await cache.read('user:7');   // { value, fresh }：过期了但还在 stale 窗口里也给，先显示再刷新
 *   await cache.invalidate('user:7'); await cache.invalidatePrefix('user:');
 *
 * 组件库的 useRequest 的 cache 选项按 read / set 对接（先显示缓存，新鲜的不再请求，过期的后台刷新）。
 */
import { keyList, type StorageDriver } from './driver.ts';

/** createCache 的选项 */
export interface CacheOptions {
  /** 键前缀：同一个驱动里和别的数据分开，默认 'cache:' */
  prefix?: string;
  /** 新鲜多久（毫秒），默认 5 分钟；Infinity 是一直新鲜，直到失效 */
  ttl?: number;
  /** 过期之后还留多久给 read 用（先显示旧的、后台刷新），默认 0：一过期就不要了 */
  stale?: number;
  /** 当前时间，测试时换成假时钟 */
  now?: () => number;
}

/** 单次写入时改过期时间 */
export interface CacheEntryOptions {
  ttl?: number;
  stale?: number;
}

/** read 的结果：fresh 为 false 时是过期但还能先用的旧值 */
export interface CacheHit<T> {
  value: T;
  fresh: boolean;
}

/** 存在驱动里的一条；时间是毫秒时间戳，Infinity 写成 MAX_SAFE_INTEGER（JSON 存不了 Infinity） */
interface Entry {
  value: unknown;
  expires: number;
  until: number;
}

const FOREVER = Number.MAX_SAFE_INTEGER;

function checkDuration(name: string, ms: number): number {
  if (!(ms >= 0)) throw new Error(`cache ${name} must be a non-negative number of milliseconds`);
  return ms;
}

export class Cache {
  private readonly driver: StorageDriver;
  private readonly prefix: string;
  private readonly ttl: number;
  private readonly stale: number;
  private readonly now: () => number;
  /** 正在 load 的键：同一个键并发 load 只调一次 loader */
  private readonly loading = new Map<string, Promise<unknown>>();

  constructor(driver: StorageDriver, options: CacheOptions = {}) {
    this.driver = driver;
    this.prefix = options.prefix ?? 'cache:';
    this.ttl = checkDuration('ttl', options.ttl ?? 300_000);
    this.stale = checkDuration('stale', options.stale ?? 0);
    this.now = options.now ?? Date.now;
  }

  /** 新鲜的值；没有或过期了 undefined */
  async get<T>(key: string): Promise<T | undefined> {
    const hit = await this.read<T>(key);
    return hit?.fresh ? hit.value : undefined;
  }

  /** 新鲜的或还在 stale 窗口里的值；连窗口也过了就删掉、给 undefined */
  async read<T>(key: string): Promise<CacheHit<T> | undefined> {
    const entry = await this.driver.get<Entry>(this.prefix + key);
    if (!entry || typeof entry.expires !== 'number') return undefined;
    const now = this.now();
    if (entry.until <= now) {
      await this.driver.delete(this.prefix + key);
      return undefined;
    }
    return { value: entry.value as T, fresh: entry.expires > now };
  }

  /** 写入；value 为 undefined 等于失效 */
  async set(key: string, value: unknown, options: CacheEntryOptions = {}): Promise<void> {
    if (value === undefined) return this.invalidate(key);
    const ttl = checkDuration('ttl', options.ttl ?? this.ttl);
    const stale = checkDuration('stale', options.stale ?? this.stale);
    const expires = Math.min(this.now() + ttl, FOREVER);
    const entry: Entry = { value, expires, until: Math.min(expires + stale, FOREVER) };
    await this.driver.set(this.prefix + key, entry);
  }

  /** 新鲜的直接给；否则调 loader 并写回。同一个键同时 load 只调一次 loader，loader 失败不写 */
  load<T>(key: string, loader: () => Promise<T>, options?: CacheEntryOptions): Promise<T> {
    const pending = this.loading.get(key);
    if (pending) return pending as Promise<T>;
    const run = (async () => {
      const hit = await this.read<T>(key);
      if (hit?.fresh) return hit.value;
      const value = await loader();
      await this.set(key, value, options);
      return value;
    })().finally(() => this.loading.delete(key));
    this.loading.set(key, run);
    return run;
  }

  /** 让这几个键失效 */
  invalidate(keys: string | readonly string[]): Promise<void> {
    return this.driver.delete(keyList(keys).map((key) => this.prefix + key));
  }

  /** 让以 prefix 开头的键全部失效；给 '' 清空整个缓存 */
  async invalidatePrefix(prefix: string): Promise<void> {
    await this.driver.delete(await this.driver.keys(this.prefix + prefix));
  }

  /**
   * 别的标签页改了或失效了缓存时回调：keys 是缓存的键（不带前缀），undefined 表示整个存储清空了。
   * 驱动不支持跨标签页通知时不回调
   */
  watch(listener: (keys: readonly string[] | undefined) => void): () => void {
    if (!this.driver.watch) return () => {};
    return this.driver.watch((keys) => {
      if (!keys) return listener(undefined);
      const own = keys
        .filter((key) => key.startsWith(this.prefix))
        .map((key) => key.slice(this.prefix.length));
      if (own.length > 0) listener(own);
    });
  }
}

/** 在一个驱动上建缓存（见文件开头） */
export function createCache(driver: StorageDriver, options?: CacheOptions): Cache {
  return new Cache(driver, options);
}
