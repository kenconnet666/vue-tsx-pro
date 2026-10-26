/**
 * 按当前语言格式化数字、金额与日期：`const format = useFormat()`，之后 `format.currency(19.9)`。
 * 格式化器按“语言 + 选项”缓存，重复调用不再新建。
 *
 * 数字的格式是 NumericFormat：Intl.NumberFormat 的选项，加上缩放与单位文字，
 * `format.number(155353.2, { scale: 10_000, maximumFractionDigits: 2, suffix: '万元' })` → `15.54 万元`。
 * 组件的数字格式属性（AnimatedNumber、Stat、图表、表格列）都是它。
 */
import {
  CalendarDateTime,
  DateFormatter,
  getLocalTimeZone,
  type DateValue,
} from '@internationalized/date';
import type Decimal from 'decimal.js';
import {
  parseIsoDate,
  parseIsoDateTime,
  parseIsoTime,
  relativeUnit,
  toInstant,
} from '../../utils/data/date';
import { cachedIntl } from '../../utils/data/intl-cache';
import { numericText, shiftDecimal } from '../../utils/data/numeric';
import { useLang } from '../context';
import type { Lang } from './lang';

/** 字符串与 Decimal 按十进制原样格式化，不经过浮点数，金额不丢精度 */
type NumberInput = number | bigint | string | Decimal;

/** 数字的显示格式：Intl.NumberFormat 的选项，加上缩放与单位文字 */
export interface NumericFormat extends Intl.NumberFormatOptions {
  /**
   * 先除以它再显示：`10_000` 表示以“万”为单位（155353.2 → 15.53532，再按小数位取舍）。
   * 10 的整数次幂按十进制移动小数点，Decimal 与大整数不丢精度；其他值按浮点数相除
   */
  scale?: number;
  /** 跟在数字后面的单位文字，如“万元”“元/件”；与数字之间是不换行的空格 */
  suffix?: string;
}

/** 按当前语言格式化数字、金额、百分比与日期；在渲染函数里调用方法即可随语言切换 */
export function useFormat() {
  const lang = useLang();
  return {
    /**
     * 数字：`format.number(1234.5)` → `1,234.5`；`{ style: 'currency' }` 不写币种时用语言的币种，
     * 缩放与单位见 NumericFormat
     */
    number: (value: NumberInput, options: NumericFormat = {}) =>
      formatNumeric(lang, value, options),
    /** 金额，默认使用语言的币种：`format.currency(new Decimal('19.9'))` → `¥19.90` */
    currency: (value: NumberInput, currency = lang.currency) =>
      formatNumeric(lang, value, { style: 'currency', currency }),
    /** 文件大小，按 1000 进位取合适的单位：`format.fileSize(1_234_567)` → `1.2 MB` */
    fileSize: (bytes: number) => {
      const exponent = Math.min(
        Math.max(Math.floor(Math.log10(Math.max(bytes, 1)) / 3), 0),
        FILE_SIZE_UNITS.length - 1,
      );
      return numberFormatter(lang, {
        style: 'unit',
        unit: FILE_SIZE_UNITS[exponent],
        maximumFractionDigits: exponent === 0 ? 0 : 1,
      }).format(bytes / 1000 ** exponent);
    },
    /**
     * 日期时间，带上语言的时区、日历与小时制；DateValue 按语言时区换算。
     * 也接受日期组件的 ISO 值：'2026-10-20'、'2026-10-20T14:30'、'14:30'（只有时间时配 timeStyle），
     * 以及后端给的时刻（带 Z 或时差：'2026-10-20T06:30:00.19Z'，按语言的时区显示）；格式不对时原样返回
     */
    date: (
      value: Date | DateValue | string,
      options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
    ) => {
      const parsed = typeof value === 'string' ? parseIsoValue(value) : value;
      if (parsed == null) return value as string;
      const date =
        parsed instanceof Date ? parsed : parsed.toDate(lang.timeZone ?? getLocalTimeZone());
      return dateFormatter(lang, options).format(date);
    },
    /**
     * 相对现在的时间，自动取合适的单位：`format.relative(date)` → “3 分钟前”“明天”“2 年后”。
     * 值同 date；不带时区的 ISO 值按语言的时区算。now 默认此刻（组件里随时钟更新的传进来）
     */
    relative: (
      value: Date | DateValue | string,
      { now = Date.now(), ...options }: RelativeFormatOptions = {},
    ) => {
      const instant = toInstant(value, lang.timeZone ?? getLocalTimeZone());
      if (Number.isNaN(instant)) return typeof value === 'string' ? value : '';
      const { value: amount, unit } = relativeUnit(instant - now);
      const key = `relative|${lang.code}|${JSON.stringify(options)}`;
      const formatter = cachedIntl(
        key,
        () => new Intl.RelativeTimeFormat(lang.code, { numeric: 'auto', ...options }),
      );
      return formatter.format(amount, unit);
    },
  };
}

/** format.relative 的选项 */
export interface RelativeFormatOptions extends Intl.RelativeTimeFormatOptions {
  /** 以哪个时刻为“现在”（毫秒时间戳），默认此刻 */
  now?: number;
}

// ───────── 内部实现 ─────────

/** Intl 支持的文件大小单位（SI，1000 进位） */
const FILE_SIZE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

function numberFormatter(lang: Lang, options: Intl.NumberFormatOptions) {
  const key = `number|${lang.code}|${JSON.stringify(options)}`;
  return cachedIntl(key, () => new Intl.NumberFormat(lang.code, options));
}

function formatNumeric(
  lang: Lang,
  value: NumberInput,
  { scale, suffix, ...options }: NumericFormat,
) {
  if (options.style === 'currency' && !options.currency) options.currency = lang.currency;
  const text = numberFormatter(lang, options).format(scaled(value, scale));
  return suffix ? `${text} ${suffix}` : text;
}

/** 除以 scale：10 的整数次幂按十进制移位（精确），其他值按浮点数相除 */
function scaled(value: NumberInput, scale: number | undefined) {
  if (scale == null || scale === 1) return toIntl(value);
  const places = Math.log10(scale);
  if (!Number.isInteger(places)) return Number(toIntl(value)) / scale;
  const text = typeof value === 'string' ? value.trim() : numericText(value);
  return shiftDecimal(text, places) as Intl.StringNumericLiteral;
}

function dateFormatter(lang: Lang, options: Intl.DateTimeFormatOptions) {
  const resolved: Intl.DateTimeFormatOptions = {
    timeZone: lang.timeZone,
    calendar: lang.calendar,
    hourCycle: lang.hourCycle,
    ...options,
  };
  const key = `date|${lang.code}|${JSON.stringify(resolved)}`;
  return cachedIntl(key, () => new DateFormatter(lang.code, resolved));
}

/** Intl 接受数字字符串（StringNumericLiteral）；Decimal 先转成字符串 */
function toIntl(value: NumberInput): number | bigint | Intl.StringNumericLiteral {
  if (typeof value === 'object') return value.toString() as Intl.StringNumericLiteral;
  return typeof value === 'string' ? (value as Intl.StringNumericLiteral) : value;
}

/** 带 Z 或时差的 ISO 时刻（后端给的 timestamptz） */
const ABSOLUTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/;

/** 日期组件的 ISO 值 → DateValue：日期、日期时间，或只有时间（放在任意一天上）；带时差的时刻 → Date */
function parseIsoValue(value: string): DateValue | Date | null {
  if (ABSOLUTE.test(value)) {
    const instant = new Date(value);
    return Number.isNaN(instant.getTime()) ? null : instant;
  }
  const time = parseIsoTime(value);
  if (time) return new CalendarDateTime(2000, 1, 1, time.hour, time.minute, time.second);
  return parseIsoDateTime(value) ?? parseIsoDate(value);
}
