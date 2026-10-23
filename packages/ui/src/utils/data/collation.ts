/**
 * 按语言比较与匹配文字（Intl.Collator）：Combobox 的过滤、表格的排序与筛选共用。
 * Collator 按语言缓存，重复调用不再新建。
 *
 *   const match = createMatcher('zh-CN');  match('Ångström', 'ang') → true（忽略大小写与重音）
 *   rows.sort(createComparer('zh-CN'))     数字按大小、日期按时间、文字按语言的排序规则（中文按拼音）
 *   sortByValue(rows, (row) => row.amount, 'descending', 'zh-CN')   按取出的值排，空值总在最后（表格、接口的排序）
 */
import type { DateValue } from '@internationalized/date';
import type Decimal from 'decimal.js';
import { cachedIntl } from './intl-cache';
import { compareNumeric, isNumeric } from './numeric';

function collator(locale: string, usage: 'search' | 'sort'): Intl.Collator {
  return cachedIntl(
    `collator|${locale}|${usage}`,
    () => new Intl.Collator(locale, { usage, sensitivity: 'base', numeric: true }),
  );
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
export type SortValue =
  string | number | bigint | Decimal | boolean | Date | DateValue | null | undefined;

/** @internationalized/date 的日期值（CalendarDate、CalendarDateTime、ZonedDateTime）：不在运行时导入，按形状识别 */
export const isDateValue = (value: unknown): value is DateValue =>
  typeof value === 'object' &&
  value !== null &&
  'calendar' in value &&
  typeof (value as DateValue).compare === 'function';

/**
 * 比较两个值，给排序用：null / undefined 排在最后；number、bigint、Decimal 按大小（混着也行，不丢精度）；
 * Date 按时间，DateValue 按它自己的 compare（不经过时区换算）；布尔 false 在前；
 * 文字按语言比较（“第2章”排在“第10章”前）
 */
export function createComparer(locale: string): (a: SortValue, b: SortValue) => number {
  const compare = collator(locale, 'sort');
  return (a, b) => {
    if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
    if (isNumeric(a) && isNumeric(b)) return compareNumeric(a, b);
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    if (isDateValue(a) && isDateValue(b)) return a.compare(b);
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return compare.compare(String(a), String(b));
  };
}

/**
 * 按每行取出的值排序（返回新数组，原数组不变）：比较用 createComparer，相等时保持原来的先后（稳定），
 * 空值不随方向翻转、总在最后。表格的 sortRows、服务端（或假接口）的分页排序共用
 */
export function sortByValue<T>(
  rows: readonly T[],
  value: (row: T) => SortValue,
  direction: 'ascending' | 'descending',
  locale: string,
): T[] {
  return sortByValues(rows, [{ value, direction }], locale);
}

/** sortByValues 的一个排序键 */
export interface SortKey<T> {
  /** 每行取出的值 */
  value: (row: T) => SortValue;
  /** 方向 */
  direction: 'ascending' | 'descending';
}

/** 按几个键排序（多列排序）：前一个键相等时比下一个，都相等时保持原来的先后；空值总在最后，同 sortByValue */
export function sortByValues<T>(
  rows: readonly T[],
  keys: readonly SortKey<T>[],
  locale: string,
): T[] {
  const compare = createComparer(locale);
  const factors = keys.map((key) => (key.direction === 'ascending' ? 1 : -1));
  return rows
    .map((row, index) => ({ row, index, values: keys.map((key) => key.value(row)) }))
    .sort((a, b) => {
      for (let at = 0; at < keys.length; at++) {
        const x = a.values[at];
        const y = b.values[at];
        const order = x == null || y == null ? compare(x, y) : compare(x, y) * factors[at]!;
        if (order) return order;
      }
      return a.index - b.index;
    })
    .map((item) => item.row);
}
