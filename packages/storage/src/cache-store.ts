/**
 * 把任意驱动变成 easy-query 二级缓存的存储（easy-query-ts-cache 的 CacheStore：一个键下多个字段、每个字段各自过期、按键删除）。
 * 按形状对接，不导入 easy-query。浏览器里跑 easy-query（PGlite、SQLite WASM）时用：
 *
 *   const cache = createCache({ entities: [Province], store: cacheStore(indexedDbDriver({ store: 'orm-cache' })) })
 *
 * 驱动里的键是 `键 + U+001F + 字段`，按键删除时列出 `键 + U+001F` 开头的全部删掉。
 */
import type { StorageDriver } from './driver.ts';

/** 与 easy-query-ts-cache 的 CacheStore 同形 */
export interface FieldStore {
  get(key: string, field: string): Promise<string | undefined>;
  set(key: string, field: string, value: string, ttlMs: number): Promise<void>;
  delete(keys: readonly string[]): Promise<void>;
}

/** 键与字段之间的分隔（单元分隔符：不会出现在表名、主键与查询条件的文字里） */
const SEPARATOR = '\u001f';

/** 驱动里的一条：值与过期时间 */
interface Field {
  value: string;
  expires: number;
}

/** 见文件开头；now 可以换成测试用的时钟 */
export function cacheStore(driver: StorageDriver, now: () => number = Date.now): FieldStore {
  return {
    async get(key, field) {
      const item = await driver.get<Field>(key + SEPARATOR + field);
      if (!item) return undefined;
      if (item.expires <= now()) {
        await driver.delete(key + SEPARATOR + field);
        return undefined;
      }
      return item.value;
    },
    set(key, field, value, ttlMs) {
      return driver.set(key + SEPARATOR + field, { value, expires: now() + ttlMs });
    },
    async delete(keys) {
      const lists = await Promise.all(keys.map((key) => driver.keys(key + SEPARATOR)));
      await driver.delete(lists.flat());
    },
  };
}
