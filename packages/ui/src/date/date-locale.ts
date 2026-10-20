/**
 * 日期组件读当前语言的地区设置：语言标签、日历系统、时区、一周的排法、今天，以及 ISO 字符串与显示用日期的互转。
 * Calendar、DateField、各种日期选择器共用，组件里不再各自拼这些。在 setup 里调用，返回的对象在渲染时读取即可随语言切换。
 *
 *   const locale = useDateLocale(() => ({ firstDayOfWeek }));
 *   locale.fromIso(value)   // '2026-10-20' → 当前日历系统里的 CalendarDate
 *   locale.dayNumber(date)  // '20'（zh-CN 的 Intl 会写成“20日”，这里只取数字）
 */
import {
  DateFormatter,
  getLocalTimeZone,
  toCalendar,
  today,
  type Calendar,
  type CalendarDate,
} from '@internationalized/date';
import { useLang } from '../config/context';
import {
  calendarOf,
  parseIsoDate,
  toIsoDate,
  type DateLimits,
  type WeekOptions,
} from '../utils/data/date';

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
  /** ISO 日期 → 显示用的日期（当前日历系统）；空值、格式不对时 null */
  fromIso(value: string | null | undefined): CalendarDate | null;
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
    fromIso(value) {
      const date = parseIsoDate(value);
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

/** 组件上写的可选范围（ISO 字符串）与不可选的日期 */
export interface DateLimitProps {
  /** 最早可选的日期（ISO，如 '2026-01-01'） */
  min?: string;
  /** 最晚可选的日期（ISO） */
  max?: string;
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
    min: locale.fromIso(min),
    max: locale.fromIso(max),
    isUnavailable: isDateUnavailable && ((day) => isDateUnavailable(toIsoDate(day), day)),
  };
}
