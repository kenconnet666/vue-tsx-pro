/**
 * 日期组件读当前语言的地区设置：语言标签、日历系统、时区、一周的排法、今天，以及 ISO 字符串与显示用日期的互转。
 * Calendar、DateField、各种日期选择器共用，组件里不再各自拼这些。在 setup 里调用，返回的对象在渲染时读取即可随语言切换。
 *
 *   const locale = useDateLocale(() => ({ firstDayOfWeek }));
 *   locale.fromValue(value) // '2026-10-20' 或 CalendarDate → 当前日历系统里的 CalendarDate
 *   locale.dayNumber(date)  // '20'（zh-CN 的 Intl 会写成“20日”，这里只取数字）
 */
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  GregorianCalendar,
  toCalendar,
  toCalendarDate,
  today,
  type Calendar,
  type DateValue,
} from '@internationalized/date';
import { useLang } from '../config/context';
import {
  calendarOf,
  parseIsoDate,
  toIsoDate,
  type DateLimits,
  type WeekOptions,
} from '../utils/data/date';

/**
 * 日期组件接受的值：ISO 字符串（'2026-10-20'），或 @internationalized/date 的 DateValue
 * （CalendarDate、CalendarDateTime、ZonedDateTime）。写回时保持传入的类型（见 writeDateLike）
 */
export type DateInput = string | DateValue;

/** 值为空、推不出类型时写回哪一种 */
export interface DateValueTypes {
  /** ISO 字符串（默认）：与原生 input、URL 参数、zod 的 z.iso.date() 一致 */
  iso: unknown;
  /** @internationalized/date 的对象：日期是 CalendarDate，带时间时是 CalendarDateTime */
  dateValue: unknown;
}

/** 组件上可以覆盖语言配置的地区选项 */
export interface DateLocaleOverrides {
  /** 一周的第一天，0 表示周日；不写时取语言配置，再按地区惯例 */
  firstDayOfWeek?: number;
}

/** useDateLocale 的返回值 */
export interface DateLocale {
  /** BCP 47 语言标签 */
  readonly locale: string;
  /** 运算用的日历系统（语言配置的 calendar，不支持的退回公历） */
  readonly calendar: Calendar;
  /** 时区：语言配置的，没有时取浏览器的 */
  readonly timeZone: string;
  /** 一周的排法 */
  readonly week: WeekOptions;
  /** 今天，按时区与日历系统 */
  today(): CalendarDate;
  /** 值（ISO 字符串或 DateValue）→ 显示用的日期（当前日历系统）；空值、格式不对时 null */
  fromValue(value: DateInput | null | undefined): CalendarDate | null;
  /** 显示用的日期 → ISO 日期（公历） */
  toIso(date: CalendarDate): string;
  /** 日期格里的数字（按日历系统与语言的数字写法） */
  dayNumber(date: CalendarDate): string;
}

/** 当前语言的日期地区设置（组件 setup 里调用） */
export function useDateLocale(read: () => DateLocaleOverrides = () => ({})): DateLocale {
  const lang = useLang();
  const calendar = () => calendarOf(lang.calendar);
  return {
    get locale() {
      return lang.code;
    },
    get calendar() {
      return calendar();
    },
    get timeZone() {
      return lang.timeZone ?? getLocalTimeZone();
    },
    get week() {
      return { locale: lang.code, firstDayOfWeek: read().firstDayOfWeek ?? lang.firstDayOfWeek };
    },
    today() {
      return toCalendar(today(lang.timeZone ?? getLocalTimeZone()), calendar());
    },
    fromValue(value) {
      if (value == null) return null;
      // 字符串取日期部分：min / max 常写成日期时间（'2026-10-20T14:00'），日历按天比较
      const date =
        typeof value === 'string' ? parseIsoDate(value.slice(0, 10)) : toCalendarDate(value);
      return date && toCalendar(date, calendar());
    },
    toIso: toIsoDate,
    dayNumber(date) {
      const parts = dayFormatter(lang.code, date.calendar.identifier).formatToParts(
        date.toDate('UTC'),
      );
      return parts.find((part) => part.type === 'day')?.value ?? String(date.day);
    },
  };
}

const dayFormatters = new Map<string, DateFormatter>();

function dayFormatter(locale: string, calendar: string): DateFormatter {
  const key = `${locale}|${calendar}`;
  let formatter = dayFormatters.get(key);
  if (!formatter) {
    formatter = new DateFormatter(locale, { day: 'numeric', calendar, timeZone: 'UTC' });
    dayFormatters.set(key, formatter);
  }
  return formatter;
}

/** 组件上写的可选范围与不可选的日期 */
export interface DateLimitProps {
  /** 最早可选的日期（ISO 字符串如 '2026-01-01'，或 DateValue） */
  min?: DateInput;
  /** 最晚可选的日期（ISO 字符串或 DateValue） */
  max?: DateInput;
  /**
   * 不可选的日期（已订满、节假日）：仍能用方向键经过，读屏念“不可用”，不能选。
   * 第二个参数是同一天的 CalendarDate，判断星期几等不用自己解析：`(_, day) => isWeekend(day, 'zh-CN')`
   */
  isDateUnavailable?: (date: string, day: CalendarDate) => boolean;
}

/** 组件的 min、max、isDateUnavailable → 日历状态用的 DateLimits（日期换成当前日历系统） */
export function toDateLimits(
  locale: DateLocale,
  { min, max, isDateUnavailable }: DateLimitProps,
): DateLimits {
  return {
    min: locale.fromValue(min),
    max: locale.fromValue(max),
    isUnavailable: isDateUnavailable && ((day) => isDateUnavailable(toIsoDate(day), day)),
  };
}

const GREGORIAN = new GregorianCalendar();

/**
 * 选到的日期写回成和 like 同一种类型：like 是字符串时写 ISO 日期；是 DateValue 时保留它的类型、日历系统、时间与时区，
 * 只换年月日（CalendarDateTime 选了另一天，时间不变）。like 为空时按 valueType（默认 ISO 字符串）
 */
export function writeDateLike(
  date: CalendarDate,
  like: DateInput | null | undefined,
  valueType: keyof DateValueTypes = 'iso',
): DateInput {
  if (typeof like === 'string' || (like == null && valueType === 'iso')) return toIsoDate(date);
  if (like == null) return toCalendar(date, GREGORIAN);
  const converted = toCalendar(date, like.calendar);
  if (!('hour' in like)) return converted;
  return like.set({
    era: converted.era,
    year: converted.year,
    month: converted.month,
    day: converted.day,
  });
}
