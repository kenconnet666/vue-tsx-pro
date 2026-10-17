/**
 * 按当前语言格式化数字、金额与日期。格式化器按“语言 + 选项”缓存，重复调用不再新建。
 */
import { DateFormatter, type DateValue } from '@internationalized/date';
import type Decimal from 'decimal.js';
import type { Lang } from '../lang/types';
import { useLang } from './context';

/** 字符串与 Decimal 交给 Intl 按十进制原样格式化，不经过浮点数 */
type NumberInput = number | bigint | string | Decimal;

const cache = new Map<string, Intl.NumberFormat | DateFormatter>();

function cached<T extends Intl.NumberFormat | DateFormatter>(key: string, create: () => T): T {
  let formatter = cache.get(key) as T | undefined;
  if (!formatter) cache.set(key, (formatter = create()));
  return formatter;
}

function numberFormatter(lang: Lang, options: Intl.NumberFormatOptions) {
  return cached(
    `n|${lang.code}|${JSON.stringify(options)}`,
    () => new Intl.NumberFormat(lang.code, options),
  );
}

function dateFormatter(lang: Lang, options: Intl.DateTimeFormatOptions) {
  const resolved: Intl.DateTimeFormatOptions = {
    timeZone: lang.timeZone,
    calendar: lang.calendar,
    hourCycle: lang.hourCycle,
    ...options,
  };
  return cached(
    `d|${lang.code}|${JSON.stringify(resolved)}`,
    () => new DateFormatter(lang.code, resolved),
  );
}

/** Intl 把数字字符串按十进制原样格式化（不经过浮点数），Decimal 转成字符串传入 */
function toIntl(value: NumberInput): number | bigint | Intl.StringNumericLiteral {
  if (typeof value === 'object') return value.toString() as Intl.StringNumericLiteral;
  return typeof value === 'string' ? (value as Intl.StringNumericLiteral) : value;
}

export function useFormat() {
  const lang = useLang();
  return {
    /** 数字：`format.number(1234.5)` → `1,234.5` */
    number: (value: NumberInput, options: Intl.NumberFormatOptions = {}) =>
      numberFormatter(lang, options).format(toIntl(value)),
    /** 金额，默认使用语言的币种：`format.currency(new Decimal('19.9'))` → `¥19.90` */
    currency: (value: NumberInput, currency = lang.currency) =>
      numberFormatter(lang, { style: 'currency', currency }).format(toIntl(value)),
    /** 日期时间，带上语言的时区、日历与小时制；DateValue 按语言时区换算 */
    date: (
      value: Date | DateValue,
      options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
    ) => {
      const date = value instanceof Date ? value : value.toDate(lang.timeZone ?? defaultTimeZone());
      return dateFormatter(lang, options).format(date);
    },
  };
}

function defaultTimeZone() {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}
