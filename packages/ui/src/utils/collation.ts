/**
 * 按语言比较与匹配文字（Intl.Collator）：Combobox 的过滤、表格的排序与筛选共用。
 * Collator 按语言缓存，重复调用不再新建。
 *
 *   const match = createMatcher('zh-CN');  match('Ångström', 'ang') → true（忽略大小写与重音）
 *   rows.sort(createComparer('zh-CN'))     数字按大小、日期按时间、文字按语言的排序规则（中文按拼音）
 */

const collators = new Map<string, Intl.Collator>();

function collator(locale: string, usage: 'search' | 'sort'): Intl.Collator {
  const key = `${locale}|${usage}`;
  let found = collators.get(key);
  if (!found) {
    found = new Intl.Collator(locale, { usage, sensitivity: 'base', numeric: true });
    collators.set(key, found);
  }
  return found;
}

/** 判断 text 是否包含 query：忽略大小写与重音（é 与 e、Å 与 a 视为相同）；query 为空时总是 true */
export function createMatcher(locale: string): (text: string, query: string) => boolean {
  const compare = collator(locale, 'search');
  return (text, query) => {
    if (!query) return true;
    // Collator 没有“包含”，逐个位置比较等长的片段
    for (let start = 0; start + query.length <= text.length; start++) {
      if (compare.compare(text.slice(start, start + query.length), query) === 0) return true;
    }
    return false;
  };
}

/** 可以排序的值：表格列的 value 返回它 */
export type SortValue = string | number | bigint | boolean | Date | null | undefined;

/** 比较两个值，给排序用：null / undefined 排在最后；数字、bigint 按大小；Date 按时间；布尔 false 在前；文字按语言比较（“第2章”排在“第10章”前） */
export function createComparer(locale: string): (a: SortValue, b: SortValue) => number {
  const compare = collator(locale, 'sort');
  return (a, b) => {
    if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'bigint' && typeof b === 'bigint') return a < b ? -1 : a > b ? 1 : 0;
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return compare.compare(String(a), String(b));
  };
}
