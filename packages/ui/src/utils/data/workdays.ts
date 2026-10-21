/**
 * 工作日与时限（参考 date-fns 的 addBusinessDays、differenceInBusinessDays）：周末、法定节假日与调休补班。
 * 节假日每年发布一次，组件库不内置：应用把数据交给 createUi / Provider 的 workCalendar，组件经 useWorkCalendar 取用。
 *
 *   const workCalendar = createWorkCalendar({
 *     holidays: [['2026-10-01', '2026-10-08']],   // 放假（单日或区间）
 *     workdays: ['2026-09-27', '2026-10-10'],     // 调休上班的周末
 *   });
 *   createUi({ workCalendar });
 *
 *   const calendar = useWorkCalendar();
 *   deadlineOf({ start: verifiedOn, workdays: 10 }, calendar)   // → { due, remaining, state }
 */
import { useConfig } from '../../config/context';
import { isoDayOfWeek, shiftIsoDate, todayIso } from './date';

/** 工作日历：哪天上班 */
export interface WorkCalendar {
  /** 这一天（ISO 日期）上不上班 */
  isWorkday(iso: string): boolean;
}

/** createWorkCalendar 的选项 */
export interface WorkCalendarOptions {
  /** 休息的星期几（0 周日 … 6 周六），默认周六、周日 */
  weekend?: readonly number[];
  /** 放假的日子：ISO 日期，或 [开始, 结束]（含两端） */
  holidays?: readonly (string | readonly [string, string])[];
  /** 调休上班的日子（落在周末的补班） */
  workdays?: readonly string[];
}

/** 按周末、节假日与调休生成工作日历 */
export function createWorkCalendar({
  weekend = [0, 6],
  holidays = [],
  workdays = [],
}: WorkCalendarOptions = {}): WorkCalendar {
  const off = new Set<string>();
  for (const entry of holidays) {
    if (typeof entry === 'string') off.add(entry);
    else
      for (let day = entry[0]; day <= entry[1]; day = shiftIsoDate(day, { days: 1 })) off.add(day);
  }
  const on = new Set(workdays);
  return {
    isWorkday: (iso) => on.has(iso) || (!off.has(iso) && !weekend.includes(isoDayOfWeek(iso))),
  };
}

/** 只按周末（周六、周日）算的工作日历：没配置 workCalendar 时用它 */
export const weekdayCalendar: WorkCalendar = createWorkCalendar();

/**
 * from 之后到 to（含）有几个工作日：周五到下周一是 1；to 在 from 之前时为负数（两端对调再取负，同 date-fns 的方向）
 */
export function workdaysBetween(from: string, to: string, calendar = weekdayCalendar): number {
  // 0 - x 而不是 -x：相差 0 个工作日时得 0，不是 -0
  if (to < from) return 0 - workdaysBetween(to, from, calendar);
  let count = 0;
  for (let day = from; day < to;) {
    day = shiftIsoDate(day, { days: 1 });
    if (calendar.isWorkday(day)) count++;
  }
  return count;
}

/** 从 from 起数 count 个工作日后的那一天（count 为负往前数，为 0 时原样） */
export function addWorkdays(from: string, count: number, calendar = weekdayCalendar): string {
  const step = count >= 0 ? 1 : -1;
  let day = from;
  for (let left = Math.abs(count); left > 0;) {
    day = shiftIsoDate(day, { days: step });
    if (calendar.isWorkday(day)) left--;
  }
  return day;
}

/** 时限的状态 */
export interface DeadlineStates {
  /** 还早 */
  pending: unknown;
  /** 快到期：剩下的工作日不多于 soon */
  soon: unknown;
  /** 今天到期 */
  due: unknown;
  /** 超期 */
  overdue: unknown;
  /** 已完成（按完成那天算剩余或超期） */
  done: unknown;
}

/** 时限：截止日直接给出，或开始日加几个工作日 */
export type DeadlineInput = (
  | { due: string; start?: never; workdays?: never }
  | { start: string; workdays: number; due?: never }
) & {
  /** 完成的日期；完成了状态是 done */
  done?: string | null;
  /** 今天，默认按浏览器时区的今天 */
  today?: string;
  /** 剩下几个工作日以内算快到期，默认 2 */
  soon?: number;
};

/** 时限的结果 */
export interface Deadline {
  /** 截止日 */
  due: string;
  /** 离截止还有几个工作日：截止当天为 0，超期为负；完成了按完成那天算 */
  remaining: number;
  /** 状态 */
  state: keyof DeadlineStates;
}

/** 算时限：截止日、还剩几个工作日、状态 */
export function deadlineOf(input: DeadlineInput, calendar = weekdayCalendar): Deadline {
  const due = input.due ?? addWorkdays(input.start, input.workdays, calendar);
  const at = input.done ?? input.today ?? todayIso();
  const remaining = workdaysBetween(at, due, calendar);
  // 是否过期按日期比：周五截止、周六还没完成也算超期（虽然中间没有工作日）
  const state: keyof DeadlineStates = input.done
    ? 'done'
    : at > due
      ? 'overdue'
      : at === due
        ? 'due'
        : remaining <= (input.soon ?? 2)
          ? 'soon'
          : 'pending';
  return { due, remaining, state };
}

/** 当前配置的工作日历（createUi / Provider 的 workCalendar；都没给时只按周末） */
export function useWorkCalendar(): WorkCalendar {
  return useConfig().workCalendar ?? weekdayCalendar;
}
