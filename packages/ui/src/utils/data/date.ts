/**
 * 日期运算（不含界面）：ISO 字符串互转、月份网格、星期名与月份名、可选范围、区间、周数、快捷区间。
 * Calendar、DateField、各种日期选择器共用；运算交给 @internationalized/date（时区、地区的周起始日、非公历）。
 *
 * 组件对外的值是 ISO 8601 字符串（'2026-10-20'、'14:30'、'2026-10-20T14:30'），与原生 input、URL 参数、
 * zod 的 z.iso.date() 一致；组件内部换成 CalendarDate 等对象运算。月份名、星期名一律取自 Intl。
 *
 *   monthGrid(new CalendarDate(2026, 10, 1), { locale: 'zh-CN' })  → 6 行 × 7 天，补齐上下月
 *   weekdayNames('en-US', { format: 'short' })                      → ['Sun', 'Mon', …]
 */
import {
  CalendarDate,
  CalendarDateTime,
  createCalendar,
  DateFormatter,
  endOfMonth,
  getDayOfWeek,
  getLocalTimeZone,
  GregorianCalendar,
  parseDate,
  parseDateTime,
  parseTime,
  startOfMonth,
  startOfWeek,
  Time,
  toCalendar,
  today,
  type Calendar,
  type CalendarIdentifier,
  type DateDuration,
  type DateValue,
  type DayOfWeek,
} from '@internationalized/date';

// ───────── ISO 字符串 ─────────

/** 'YYYY-MM-DD' → CalendarDate（公历）；空值或格式不对时为 null */
export function parseIsoDate(value: string | null | undefined): CalendarDate | null {
  return tryParse(value, parseDate);
}

/** 'HH:mm' 或 'HH:mm:ss' → Time；空值或格式不对时为 null */
export function parseIsoTime(value: string | null | undefined): Time | null {
  return tryParse(value, parseTime);
}

/** 'YYYY-MM-DDTHH:mm[:ss]' → CalendarDateTime（公历）；空值或格式不对时为 null */
export function parseIsoDateTime(value: string | null | undefined): CalendarDateTime | null {
  return tryParse(value, parseDateTime);
}

/** 日期 → 'YYYY-MM-DD'；不是公历的日期先换回公历 */
export function toIsoDate(date: DateValue): string {
  const gregorian = toCalendar(date, GREGORIAN);
  return new CalendarDate(gregorian.year, gregorian.month, gregorian.day).toString();
}

/** 时间 → 'HH:mm'；withSeconds 时 'HH:mm:ss'（同原生 input type="time"） */
export function toIsoTime(time: Time, withSeconds = false): string {
  const text = new Time(time.hour, time.minute, withSeconds ? time.second : 0).toString();
  return withSeconds ? text : text.slice(0, 5);
}

/** 日期时间 → 'YYYY-MM-DDTHH:mm'；withSeconds 时带秒（同原生 input type="datetime-local"） */
export function toIsoDateTime(value: CalendarDateTime, withSeconds = false): string {
  const gregorian = toCalendar(value, GREGORIAN);
  return `${toIsoDate(gregorian)}T${toIsoTime(new Time(gregorian.hour, gregorian.minute, gregorian.second), withSeconds)}`;
}

/** 今天的 ISO 日期，按时区（不写时取浏览器的）：`todayIso()` → '2026-10-20' */
export function todayIso(timeZone = getLocalTimeZone()): string {
  return today(timeZone).toString();
}

/** ISO 日期加减（月末自动夹到下个月的最后一天）：`shiftIsoDate('2026-01-31', { months: 1 })` → '2026-02-28' */
export function shiftIsoDate(value: string, duration: DateDuration): string {
  const date = parseIsoDate(value);
  if (!date) throw new RangeError(`不是 ISO 日期：${value}`);
  return date.add(duration).toString();
}

/** 从 a 到 b 相隔几天（b 在后为正）：`daysBetween('2026-10-20', '2026-10-23')` → 3 */
export function daysBetween(a: string, b: string): number {
  const start = parseIsoDate(a);
  const end = parseIsoDate(b);
  if (!start || !end) throw new RangeError(`不是 ISO 日期：${start ? b : a}`);
  return end.compare(start);
}

/**
 * ISO 日期是星期几：0 周日 … 6 周六（同 Date#getDay）。直接按日期算，不受时区影响；
 * `new Date('2026-10-20').getDay()` 在 UTC 以西的时区会算成前一天
 */
export function isoDayOfWeek(value: string): number {
  const date = parseIsoDate(value);
  if (!date) throw new RangeError(`不是 ISO 日期：${value}`);
  return getDayOfWeek(date, 'en-US');
}

// ───────── 日历系统与周 ─────────

const GREGORIAN = new GregorianCalendar();

/**
 * 语言里的日历标识 → 运算用的日历；@internationalized/date 不支持的（如农历 'chinese'）退回公历，
 * 月份网格仍按公历排，显示的文字照常由 Intl 按该日历格式化
 */
export function calendarOf(identifier: string): Calendar {
  if (identifier === 'gregory') return GREGORIAN;
  try {
    return createCalendar(identifier as CalendarIdentifier);
  } catch {
    return GREGORIAN;
  }
}

const DAYS_OF_WEEK: readonly DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** 语言配置的一周第一天（0 表示周日）→ @internationalized/date 的写法；不写时按地区惯例 */
export function toDayOfWeek(firstDayOfWeek: number | undefined): DayOfWeek | undefined {
  return firstDayOfWeek == null ? undefined : DAYS_OF_WEEK[((firstDayOfWeek % 7) + 7) % 7];
}

/** 一周的排法：语言与一周第一天（0 表示周日，不写时按地区惯例） */
export interface WeekOptions {
  /** BCP 47 语言标签 */
  locale: string;
  /** 一周的第一天，0 表示周日；不写时按地区惯例（zh-CN 周一，en-US 周日） */
  firstDayOfWeek?: number;
}

/** monthGrid 的选项 */
export interface MonthGridOptions extends WeekOptions {
  /** 总是 6 行：几个月并排、或翻页时高度不跳，默认 true */
  fixedWeeks?: boolean;
}

/** 一个月的日期网格：按周分行，首尾用上个月、下个月的日期补齐（同 React Aria 的 getDatesInWeek） */
export function monthGrid(
  month: CalendarDate,
  { locale, firstDayOfWeek, fixedWeeks = true }: MonthGridOptions,
): CalendarDate[][] {
  const first = startOfWeek(startOfMonth(month), locale, toDayOfWeek(firstDayOfWeek));
  const last = endOfMonth(month);
  const weeks: CalendarDate[][] = [];
  for (let start = first; weeks.length < 6; start = start.add({ weeks: 1 })) {
    if (!fixedWeeks && start.compare(last) > 0) break;
    weeks.push(Array.from({ length: 7 }, (_, index) => start.add({ days: index })));
  }
  return weeks;
}

/** 星期在一周里的位置（0 起），按语言与一周第一天 */
export function dayOfWeekIndex(date: DateValue, { locale, firstDayOfWeek }: WeekOptions): number {
  return getDayOfWeek(date, locale, toDayOfWeek(firstDayOfWeek));
}

/** 星期名的长短 */
export interface WeekdayFormats {
  /** 最短：一、二 / S、M */
  narrow: unknown;
  /** 简写：周一 / Mon */
  short: unknown;
  /** 全称：星期一 / Monday */
  long: unknown;
}

/** 按一周的排法列出七天的星期名（取自 Intl），从一周第一天开始 */
export function weekdayNames(
  locale: string,
  {
    firstDayOfWeek,
    format = 'short',
  }: { firstDayOfWeek?: number; format?: keyof WeekdayFormats } = {},
): string[] {
  const formatter = cachedFormatter(locale, { weekday: format, timeZone: 'UTC' });
  // 任取一周：从这周的第一天起连续七天
  const start = startOfWeek(new CalendarDate(2024, 1, 10), locale, toDayOfWeek(firstDayOfWeek));
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(start.add({ days: index }).toDate('UTC')),
  );
}

/** 一年的各月（每月 1 日），按日期所在的日历系统（个别日历一年有 13 个月） */
export function monthsOfYear(date: CalendarDate): CalendarDate[] {
  const first = date.set({ month: 1, day: 1 });
  return Array.from({ length: date.calendar.getMonthsInYear(first) }, (_, index) =>
    first.add({ months: index }),
  );
}

/** 年份视图的一页：所在的十年，前后各补一年（共 12 年，排成 4 × 3；同 Ant Design 的年份面板） */
export function yearsOfDecade(date: CalendarDate): CalendarDate[] {
  const start = date.set({ year: Math.floor(date.year / 10) * 10, month: 1, day: 1 });
  return Array.from({ length: 12 }, (_, index) => start.add({ years: index - 1 }));
}

/** 是不是十年之外、补上的那两年 */
export const isOutsideDecade = (year: CalendarDate, page: CalendarDate) =>
  Math.floor(year.year / 10) !== Math.floor(page.year / 10);

/**
 * 一年里的第几周：一周从周一开始时按 ISO 8601（含 1 月 4 日的那周是第 1 周），
 * 其他（周日、周六开始）按含 1 月 1 日的那周是第 1 周（美国、日本的惯例）
 */
export function weekOfYear(date: CalendarDate, options: WeekOptions): number {
  const gregorian = toCalendar(date, GREGORIAN);
  const monday =
    getDayOfWeek(
      new CalendarDate(2024, 1, 1),
      options.locale,
      toDayOfWeek(options.firstDayOfWeek),
    ) === 0;
  const weekStart = startOfWeek(gregorian, options.locale, toDayOfWeek(options.firstDayOfWeek));
  // 一周归属的年份：ISO 按这周的周四，其他按这周的最后一天（含 1 月 1 日的周就算新年的第 1 周）
  const anchor = weekStart.add({ days: monday ? 3 : 6 });
  const firstAnchor = new CalendarDate(anchor.year, 1, monday ? 4 : 1);
  const firstWeek = startOfWeek(firstAnchor, options.locale, toDayOfWeek(options.firstDayOfWeek));
  return Math.round(weekStart.compare(firstWeek) / 7) + 1;
}

// ───────── 比较、范围与不可选 ─────────

/** 比较的粒度：日历的三种视图 */
export interface DateUnits {
  /** 天 */
  day: unknown;
  /** 月 */
  month: unknown;
  /** 年 */
  year: unknown;
}

/** 日期的粒度 */
export type DateUnit = keyof DateUnits;

/** 截到粒度：月取 1 日，年取 1 月 1 日 */
export function truncateDate(date: CalendarDate, unit: DateUnit): CalendarDate {
  if (unit === 'day') return date;
  return unit === 'month' ? date.set({ day: 1 }) : date.set({ month: 1, day: 1 });
}

/** 按粒度比较：小于 0 表示 a 在前；跨日历系统时按同一天比较 */
export function compareDates(a: CalendarDate, b: CalendarDate, unit: DateUnit = 'day'): number {
  const other = toCalendar(b, a.calendar);
  return truncateDate(a, unit).compare(truncateDate(other, unit));
}

/** 是不是同一天 / 同一月 / 同一年；任一方为空时为 false */
export function isSameDate(
  a: CalendarDate | null | undefined,
  b: CalendarDate | null | undefined,
  unit: DateUnit = 'day',
): boolean {
  return a != null && b != null && compareDates(a, b, unit) === 0;
}

/** 可选范围与不可选的日期：Calendar、DatePicker、DateField 共用 */
export interface DateLimits {
  /** 最早可选的日期 */
  min?: CalendarDate | null;
  /** 最晚可选的日期 */
  max?: CalendarDate | null;
  /** 不可选的日期（已订满、节假日）：仍能用方向键经过，读屏能听到，不能选 */
  isUnavailable?: (date: CalendarDate) => boolean;
}

/** 在 min–max 之外（按粒度：月份视图里只要这个月有一天可选就不算在外面） */
export function isOutOfRange(
  date: CalendarDate,
  { min, max }: DateLimits,
  unit: DateUnit = 'day',
): boolean {
  return (
    (min != null && compareDates(date, min, unit) < 0) ||
    (max != null && compareDates(date, max, unit) > 0)
  );
}

/** 不能选：在范围外，或是不可选的日期（只在天的粒度上判断 isUnavailable） */
export function isDateDisabled(
  date: CalendarDate,
  limits: DateLimits,
  unit: DateUnit = 'day',
): boolean {
  return (
    isOutOfRange(date, limits, unit) || (unit === 'day' && (limits.isUnavailable?.(date) ?? false))
  );
}

/** 把日期夹到 min–max 之间 */
export function clampDate(date: CalendarDate, { min, max }: DateLimits): CalendarDate {
  if (min != null && date.compare(toCalendar(min, date.calendar)) < 0)
    return toCalendar(min, date.calendar);
  if (max != null && date.compare(toCalendar(max, date.calendar)) > 0)
    return toCalendar(max, date.calendar);
  return date;
}

/** 日期区间：两端都包含 */
export interface DateRange<T = CalendarDate> {
  /** 开始（含） */
  start: T;
  /** 结束（含） */
  end: T;
}

/** 两个日期排成区间：先的在前 */
export function orderedRange(a: CalendarDate, b: CalendarDate): DateRange {
  return a.compare(b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

/** 日期是否在区间里（含两端；按粒度） */
export function isInRange(
  date: CalendarDate,
  range: DateRange | null | undefined,
  unit: DateUnit = 'day',
): boolean {
  return (
    range != null &&
    compareDates(date, range.start, unit) >= 0 &&
    compareDates(date, range.end, unit) <= 0
  );
}

/** 区间一共几天（含两端） */
export function rangeDays({ start, end }: DateRange): number {
  return end.compare(start) + 1;
}

/** 区间里有没有不可选的日期：酒店连住时中间不能有订满的一天（React Aria 的 allowsNonContiguousRanges 为 false 时） */
export function rangeHasUnavailable(
  { start, end }: DateRange,
  isUnavailable: ((date: CalendarDate) => boolean) | undefined,
): boolean {
  if (!isUnavailable) return false;
  for (let date = start; date.compare(end) <= 0; date = date.add({ days: 1 })) {
    if (isUnavailable(date)) return true;
  }
  return false;
}

/** ISO 字符串的区间 → CalendarDate 的区间；任一端解析不了时为 null */
export function parseIsoRange(range: DateRange<string> | null | undefined): DateRange | null {
  const start = parseIsoDate(range?.start);
  const end = parseIsoDate(range?.end);
  return start && end ? orderedRange(start, end) : null;
}

/** CalendarDate 的区间 → ISO 字符串的区间 */
export function toIsoRange(range: DateRange): DateRange<string> {
  return { start: toIsoDate(range.start), end: toIsoDate(range.end) };
}

// ───────── 快捷区间 ─────────

/** 常用的快捷区间：报表、筛选里的“最近 7 天”“本月” */
export interface DateRangePresets {
  /** 今天 */
  today: unknown;
  /** 昨天 */
  yesterday: unknown;
  /** 最近 7 天（含今天） */
  last7Days: unknown;
  /** 最近 30 天（含今天） */
  last30Days: unknown;
  /** 本周（按语言的一周第一天） */
  thisWeek: unknown;
  /** 本月 */
  thisMonth: unknown;
  /** 上月 */
  lastMonth: unknown;
  /** 今年 */
  thisYear: unknown;
}

/** 快捷区间的名字 */
export type DateRangePreset = keyof DateRangePresets;

/** 按今天算出快捷区间 */
export function presetRange(
  preset: DateRangePreset,
  today: CalendarDate,
  week: WeekOptions,
): DateRange {
  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday': {
      const day = today.subtract({ days: 1 });
      return { start: day, end: day };
    }
    case 'last7Days':
      return { start: today.subtract({ days: 6 }), end: today };
    case 'last30Days':
      return { start: today.subtract({ days: 29 }), end: today };
    case 'thisWeek': {
      const start = startOfWeek(today, week.locale, toDayOfWeek(week.firstDayOfWeek));
      return { start, end: start.add({ days: 6 }) };
    }
    case 'thisMonth':
      return { start: startOfMonth(today), end: endOfMonth(today) };
    case 'lastMonth': {
      const month = startOfMonth(today).subtract({ months: 1 });
      return { start: month, end: endOfMonth(month) };
    }
    case 'thisYear':
      return { start: today.set({ month: 1, day: 1 }), end: today.set({ month: 12, day: 31 }) };
  }
}

/** 快捷区间的 ISO 值，按今天（时区，不写时取浏览器的）与一周的排法：`presetIsoRange('last7Days', { locale: 'zh-CN' })` */
export function presetIsoRange(
  preset: DateRangePreset,
  week: WeekOptions,
  timeZone = getLocalTimeZone(),
): DateRange<string> {
  return toIsoRange(presetRange(preset, today(timeZone), week));
}

// ───────── 内部实现 ─────────

function tryParse<T>(value: string | null | undefined, parse: (text: string) => T): T | null {
  if (!value) return null;
  try {
    return parse(value);
  } catch {
    return null;
  }
}

const formatters = new Map<string, DateFormatter>();

function cachedFormatter(locale: string, options: Intl.DateTimeFormatOptions): DateFormatter {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = formatters.get(key);
  if (!formatter) formatters.set(key, (formatter = new DateFormatter(locale, options)));
  return formatter;
}
