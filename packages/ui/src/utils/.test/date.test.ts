// 日期运算：ISO 互转、月份网格（按语言的周起始日）、星期名、范围与区间、周数、快捷区间
import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import {
  fullIsoDay,
  isoWeekOf,
  isoWeeksInYear,
  lastIsoDay,
  toIsoQuarter,
  toIsoWeek,
  calendarOf,
  clampDate,
  isDateDisabled,
  isInRange,
  isOutOfRange,
  isSameDate,
  monthGrid,
  monthsOfYear,
  orderedRange,
  parseIsoDate,
  parseIsoDateTime,
  parseIsoRange,
  parseIsoTime,
  presetRange,
  rangeDays,
  rangeHasUnavailable,
  toIsoDate,
  toIsoDateTime,
  toIsoTime,
  weekOfYear,
  weekdayNames,
  yearsOfDecade,
} from '../data/date';

const date = (iso: string) => parseIsoDate(iso)!;

describe('ISO 字符串', () => {
  it('解析与输出；格式不对、空值为 null', () => {
    expect(parseIsoDate('2026-10-20')?.toString()).toBe('2026-10-20');
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
    expect(parseIsoTime('09:05')?.toString()).toBe('09:05:00');
    expect(parseIsoTime('25:00')).toBeNull();
    expect(parseIsoDateTime('2026-10-20T14:30')?.toString()).toBe('2026-10-20T14:30:00');
  });

  it('时间默认不带秒，同原生 input type="time"', () => {
    expect(toIsoTime(new Time(9, 5, 30))).toBe('09:05');
    expect(toIsoTime(new Time(9, 5, 30), true)).toBe('09:05:30');
    expect(toIsoDateTime(new CalendarDateTime(2026, 1, 2, 3, 4, 5))).toBe('2026-01-02T03:04');
  });

  it('不是公历的日期先换回公历', () => {
    const japanese = new CalendarDate(calendarOf('japanese'), 'reiwa', 8, 10, 20);
    expect(toIsoDate(japanese)).toBe('2026-10-20');
  });

  it('不支持的日历（农历）退回公历', () => {
    expect(calendarOf('chinese').identifier).toBe('gregory');
    expect(calendarOf('buddhist').identifier).toBe('buddhist');
  });
});

describe('monthGrid', () => {
  const october = date('2026-10-01'); // 10 月 1 日是周四

  it('zh-CN：一周从周一开始，补齐上下月，总是 6 行', () => {
    const weeks = monthGrid(october, { locale: 'zh-CN' });
    expect(weeks).toHaveLength(6);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]![0]!.toString()).toBe('2026-09-28');
    expect(weeks[5]![6]!.toString()).toBe('2026-11-08');
  });

  it('en-US：一周从周日开始', () => {
    expect(monthGrid(october, { locale: 'en-US' })[0]![0]!.toString()).toBe('2026-09-27');
  });

  it('firstDayOfWeek 覆盖地区惯例：zh-CN 也可以从周日开始', () => {
    expect(monthGrid(october, { locale: 'zh-CN', firstDayOfWeek: 0 })[0]![0]!.toString()).toBe(
      '2026-09-27',
    );
  });

  it('fixedWeeks: false 时只排到这个月的最后一周', () => {
    // 2026 年 2 月 1 日是周日：从周日开始时正好 4 行
    expect(monthGrid(date('2026-02-01'), { locale: 'en-US', fixedWeeks: false })).toHaveLength(4);
    expect(monthGrid(october, { locale: 'zh-CN', fixedWeeks: false })).toHaveLength(5);
  });
});

describe('星期、月份、年份', () => {
  it('星期名取自 Intl，按一周第一天排', () => {
    expect(weekdayNames('zh-CN')).toEqual(['周一', '周二', '周三', '周四', '周五', '周六', '周日']);
    expect(weekdayNames('en-US', { format: 'short' })[0]).toBe('Sun');
    expect(weekdayNames('zh-CN', { firstDayOfWeek: 0, format: 'narrow' })[0]).toBe('日');
    expect(weekdayNames('en-US', { firstDayOfWeek: 1, format: 'long' })[0]).toBe('Monday');
  });

  it('一年的 12 个月、十年加前后各一年', () => {
    expect(monthsOfYear(date('2026-10-20')).map((month) => month.toString())).toHaveLength(12);
    expect(yearsOfDecade(date('2026-10-20')).map((year) => year.year)).toEqual([
      2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
    ]);
  });

  it('周数：周一开始按 ISO 8601，周日开始按含 1 月 1 日的那周', () => {
    // 2027-01-01 是周五：ISO 里属于 2026 年的第 53 周
    expect(weekOfYear(date('2027-01-01'), { locale: 'zh-CN' })).toBe(53);
    expect(weekOfYear(date('2027-01-04'), { locale: 'zh-CN' })).toBe(1);
    expect(weekOfYear(date('2026-10-20'), { locale: 'de-DE' })).toBe(43);
    expect(weekOfYear(date('2027-01-01'), { locale: 'en-US' })).toBe(1);
    expect(weekOfYear(date('2026-12-31'), { locale: 'en-US' })).toBe(1);
    expect(weekOfYear(date('2026-10-20'), { locale: 'en-US' })).toBe(43);
  });
});

describe('范围与不可选', () => {
  const limits = {
    min: date('2026-10-05'),
    max: date('2026-11-20'),
    isUnavailable: (day: CalendarDate) => day.day === 13,
  };

  it('范围外与不可选的日期不能选；月份视图里只要有一天在范围内就能选', () => {
    expect(isOutOfRange(date('2026-10-04'), limits)).toBe(true);
    expect(isOutOfRange(date('2026-10-01'), limits, 'month')).toBe(false);
    expect(isOutOfRange(date('2026-09-30'), limits, 'month')).toBe(true);
    expect(isDateDisabled(date('2026-10-13'), limits)).toBe(true);
    // isUnavailable 只在天的粒度上判断
    expect(isDateDisabled(date('2026-10-13'), limits, 'month')).toBe(false);
    expect(clampDate(date('2026-12-01'), limits).toString()).toBe('2026-11-20');
  });

  it('同一天 / 同一月 / 同一年，空值为 false', () => {
    expect(isSameDate(date('2026-10-20'), date('2026-10-01'), 'month')).toBe(true);
    expect(isSameDate(date('2026-10-20'), date('2026-10-01'))).toBe(false);
    expect(isSameDate(null, date('2026-10-01'))).toBe(false);
  });

  it('区间：排序、包含、天数、有没有夹着不可选的日期', () => {
    const range = orderedRange(date('2026-10-15'), date('2026-10-10'));
    expect(range.start.toString()).toBe('2026-10-10');
    expect(isInRange(date('2026-10-15'), range)).toBe(true);
    expect(isInRange(date('2026-10-16'), range)).toBe(false);
    expect(rangeDays(range)).toBe(6);
    expect(rangeHasUnavailable(range, limits.isUnavailable)).toBe(true);
    expect(parseIsoRange({ start: '2026-10-20', end: '2026-10-01' })?.start.toString()).toBe(
      '2026-10-01',
    );
    expect(parseIsoRange({ start: '2026-10-20', end: '' })).toBeNull();
  });
});

describe('快捷区间', () => {
  const today = date('2026-10-20'); // 周二

  it.each([
    ['today', '2026-10-20', '2026-10-20'],
    ['yesterday', '2026-10-19', '2026-10-19'],
    ['last7Days', '2026-10-14', '2026-10-20'],
    ['last30Days', '2026-09-21', '2026-10-20'],
    ['thisMonth', '2026-10-01', '2026-10-31'],
    ['lastMonth', '2026-09-01', '2026-09-30'],
    ['thisYear', '2026-01-01', '2026-12-31'],
  ] as const)('%s', (preset, start, end) => {
    const range = presetRange(preset, today, { locale: 'zh-CN' });
    expect([range.start.toString(), range.end.toString()]).toEqual([start, end]);
  });

  it('本周按语言的一周第一天', () => {
    expect(presetRange('thisWeek', today, { locale: 'zh-CN' }).start.toString()).toBe('2026-10-19');
    expect(presetRange('thisWeek', today, { locale: 'en-US' }).start.toString()).toBe('2026-10-18');
  });
});

describe('季度与 ISO 周', () => {
  it('toIsoQuarter、toIsoWeek；跨年的周归周四所在的年', () => {
    expect(toIsoQuarter(new CalendarDate(2026, 10, 24))).toBe('2026-Q4');
    expect(toIsoQuarter(new CalendarDate(2026, 3, 31))).toBe('2026-Q1');
    expect(toIsoWeek(new CalendarDate(2026, 10, 24))).toBe('2026-W43');
    // 2024-12-30 是周一，那周的周四在 2025 年：算 2025 年第 1 周
    expect(toIsoWeek(new CalendarDate(2024, 12, 30))).toBe('2025-W01');
    // 2027-01-01 是周五，那周的周四在 2026 年：算 2026 年第 53 周
    expect(isoWeekOf(new CalendarDate(2027, 1, 1))).toEqual({ year: 2026, week: 53 });
    expect(isoWeeksInYear(2026)).toBe(53);
    expect(isoWeeksInYear(2025)).toBe(52);
  });

  it('fullIsoDay、lastIsoDay：一段的第一天与最后一天', () => {
    expect(fullIsoDay('2026-Q4')).toBe('2026-10-01');
    expect(lastIsoDay('2026-Q4')).toBe('2026-12-31');
    expect(fullIsoDay('2026-W43')).toBe('2026-10-19');
    expect(lastIsoDay('2026-W43')).toBe('2026-10-25');
    expect(fullIsoDay('2025-W01')).toBe('2024-12-30');
    expect(lastIsoDay('2026-02')).toBe('2026-02-28');
    expect(lastIsoDay('2026')).toBe('2026-12-31');
    expect(lastIsoDay('2026-10-24T14:30')).toBe('2026-10-24');
  });
});
