/**
 * 按当前语言格式化数字、金额与日期：`const format = useFormat()`，之后 `format.currency(19.9)`。
 * 格式化器按“语言 + 选项”缓存，重复调用不再新建。
 */
import { DateFormatter, type DateValue } from '@internationalized/date';
import type Decimal from 'decimal.js';
import { useLang } from '../context';
import type { Lang } from './lang';

/** 字符串与 Decimal 按十进制原样格式化，不经过浮点数，金额不丢精度 */
type NumberInput = number | bigint | string | Decimal;

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
      const date = value instanceof Date ? value : value.toDate(lang.timeZone ?? browserTimeZone());
      return dateFormatter(lang, options).format(date);
    },
  };
}

// ───────── 内部实现 ─────────

const cache = new Map<string, Intl.NumberFormat | DateFormatter>();

function cached<T extends Intl.NumberFormat | DateFormatter>(key: string, create: () => T): T {
  let formatter = cache.get(key) as T | undefined;
  if (!formatter) cache.set(key, (formatter = create()));
  return formatter;
}

function numberFormatter(lang: Lang, options: Intl.NumberFormatOptions) {
  const key = `number|${lang.code}|${JSON.stringify(options)}`;
  return cached(key, () => new Intl.NumberFormat(lang.code, options));
}

function dateFormatter(lang: Lang, options: Intl.DateTimeFormatOptions) {
  const resolved: Intl.DateTimeFormatOptions = {
    timeZone: lang.timeZone,
    calendar: lang.calendar,
    hourCycle: lang.hourCycle,
    ...options,
  };
  const key = `date|${lang.code}|${JSON.stringify(resolved)}`;
  return cached(key, () => new DateFormatter(lang.code, resolved));
}

/** Intl 接受数字字符串（StringNumericLiteral）；Decimal 先转成字符串 */
function toIntl(value: NumberInput): number | bigint | Intl.StringNumericLiteral {
  if (typeof value === 'object') return value.toString() as Intl.StringNumericLiteral;
  return typeof value === 'string' ? (value as Intl.StringNumericLiteral) : value;
}

function browserTimeZone() {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}
