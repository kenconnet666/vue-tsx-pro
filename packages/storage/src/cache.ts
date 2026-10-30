/**
 * 建在驱动上的缓存：换驱动不换用法。存进去的是 `{ value, expires, until, tags }`，过期时间由这里算，驱动不用支持 TTL。
 *
 *   const cache = createCache(indexedDbDriver({ name: 'app' }), { ttl: 60_000, stale: 86_400_000 });
 *   const provinces = await cache.load('provinces', () => api.get('/provinces'));   // 新鲜的直接给，否则请求并写回
 *   const hit = await cache.read('user:7');   // { value, fresh }：过期了但还在 stale 窗口里也给，先显示再刷新
 *   await cache.set('cities:浙江', cities, { tags: ['t_city'] });   // 标上依赖的表
 *   await cache.invalidateTag(['t_city']);                          // 这张表改了：标了它的都失效
 *   await cache.invalidate('user:7'); await cache.invalidatePrefix('user:');
 *
 * 标签与后端对上：easy-query 的 createCache({ onEvict }) 给出改了的表名，kit 的失效推送把表名送到浏览器，
 * 这里按表名（标签）失效。组件库的 useRequest 的 cache 选项按 read / set / watch 对接：失效了自动重新请求。
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

/** 单次写入的选项 */
export interface CacheEntryOptions {
  ttl?: number;
  stale?: number;
  /** 这条依赖的东西（通常是后端的表名）：invalidateTag 按它失效 */
  tags?: readonly string[];
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
  tags?: readonly string[];
}

const FOREVER = Number.MAX_SAFE_INTEGER;

/**
 * 标签的索引也是驱动里的键：`前缀 + U+001E + 标签 + U+001E + 缓存键`，值不用。按前缀列出就是标了这个标签的缓存键，
 * 写入时不用读改写一份列表（几个标签页同时写也不会丢）
 */
const TAG = '\u001e';

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
  /** 本页的 watch：失效时通知（别的标签页的由驱动的 watch 通知） */
  private readonly listeners = new Set<(keys: readonly string[] | undefined) => void>();

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
    const entry = await this.entry(key);
    if (!entry) return undefined;
    const now = this.now();
    if (entry.until <= now) {
      await this.driver.delete(this.entryKeys(key, entry));
      return undefined;
    }
    return { value: entry.value as T, fresh: entry.expires > now };
  }

  /** 写入；value 为 undefined 等于失效 */
  async set(key: string, value: unknown, options: CacheEntryOptions = {}): Promise<void> {
    if (value === undefined) return this.invalidate(key);
    const ttl = checkDuration('ttl', options.ttl ?? this.ttl);
    const stale = checkDuration('stale', options.stale ?? this.stale);
    const tags = options.tags ?? [];
    for (const tag of tags) {
      if (!tag || tag.includes(TAG))
        throw new Error(
          `cache tag must be a non-empty string without U+001E: ${JSON.stringify(tag)}`,
        );
    }
    const expires = Math.min(this.now() + ttl, FOREVER);
    const entry: Entry = { value, expires, until: Math.min(expires + stale, FOREVER) };
    if (tags.length > 0) entry.tags = tags;
    // 先写索引再写值：中途失败时最多多一条用不上的索引，不会有失效不掉的值
    await Promise.all(tags.map((tag) => this.driver.set(this.tagKey(tag, key), 1)));
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

  /** 让这几个键失效（连同它们的标签索引） */
  async invalidate(keys: string | readonly string[]): Promise<void> {
    const list = keyList(keys);
    const entries = await Promise.all(list.map((key) => this.entry(key)));
    await this.driver.delete(list.flatMap((key, i) => this.entryKeys(key, entries[i])));
    this.emit(list);
  }

  /** 标了这些标签（任何一个）的全部失效 */
  async invalidateTag(tags: string | readonly string[]): Promise<void> {
    const index = await Promise.all(
      keyList(tags).map(async (tag) => {
        const start = this.prefix + TAG + tag + TAG;
        return (await this.driver.keys(start)).map((indexKey) => ({
          indexKey,
          key: indexKey.slice(start.length),
        }));
      }),
    );
    const keys = [...new Set(index.flat().map((item) => item.key))];
    if (keys.length === 0) return;
    await this.invalidate(keys);
    // 键的别的标签的索引已经随 invalidate 删了；这里是值已经不在（过期删掉）只剩索引的
    await this.driver.delete(index.flat().map((item) => item.indexKey));
  }

  /** 让以 prefix 开头的键全部失效；给 '' 清空整个缓存（连同标签索引） */
  async invalidatePrefix(prefix: string): Promise<void> {
    const keys = await this.driver.keys(this.prefix + prefix);
    await this.driver.delete(keys);
    const own = keys
      .filter((key) => !this.isIndex(key))
      .map((key) => key.slice(this.prefix.length));
    // 清空整个缓存时说不清删了哪些：通知 undefined
    this.emit(prefix ? own : undefined);
  }

  /**
   * 缓存的键改了或失效时回调：keys 是缓存的键（不带前缀），undefined 表示整个缓存清空了。
   * 本页的失效（invalidate、invalidateTag、invalidatePrefix）都通知；别的标签页的写入与失效经驱动的 watch 通知
   * （驱动不支持跨标签页时只有本页的）。本页的 set 不通知
   */
  watch(listener: (keys: readonly string[] | undefined) => void): () => void {
    this.listeners.add(listener);
    const stopDriver = this.driver.watch?.((keys) => {
      if (!keys) return listener(undefined);
      const own = keys
        .filter((key) => key.startsWith(this.prefix) && !this.isIndex(key))
        .map((key) => key.slice(this.prefix.length));
      if (own.length > 0) listener(own);
    });
    return () => {
      this.listeners.delete(listener);
      stopDriver?.();
    };
  }

  private async entry(key: string): Promise<Entry | undefined> {
    const entry = await this.driver.get<Entry>(this.prefix + key);
    return entry && typeof entry.expires === 'number' ? entry : undefined;
  }

  /** 一条在驱动里占的键：值本身与各标签的索引 */
  private entryKeys(key: string, entry: Entry | undefined): string[] {
    return [this.prefix + key, ...(entry?.tags ?? []).map((tag) => this.tagKey(tag, key))];
  }

  private tagKey(tag: string, key: string): string {
    return this.prefix + TAG + tag + TAG + key;
  }

  private isIndex(key: string): boolean {
    return key.startsWith(this.prefix + TAG);
  }

  private emit(keys: readonly string[] | undefined) {
    if (keys?.length === 0) return;
    for (const listener of this.listeners) listener(keys);
  }
}

/** 在一个驱动上建缓存（见文件开头） */
export function createCache(driver: StorageDriver, options?: CacheOptions): Cache {
  return new Cache(driver, options);
}
