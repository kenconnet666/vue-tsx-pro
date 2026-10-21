/**
 * Intl 对象（NumberFormat、DateTimeFormat、Collator……）的共用缓存：新建一个要解析语言与选项，比调用它慢得多，
 * 格式化、比较、解析又在渲染与输入里频繁发生。键写成“种类|语言|选项”，同样的配置只建一次。
 *
 *   const formatter = cachedIntl(`number|${locale}|${JSON.stringify(options)}`, () => new Intl.NumberFormat(locale, options));
 */

const cache = new Map<string, unknown>();

/** 取 key 对应的缓存，没有时用 create 新建并记下 */
export function cachedIntl<T>(key: string, create: () => T): T {
  if (cache.has(key)) return cache.get(key) as T;
  const created = create();
  cache.set(key, created);
  return created;
}
