// 工作日：周末、节假日与调休；from 之后到 to 的工作日数（反向为负）；往后、往前数工作日；时限的状态
import { describe, expect, it } from 'vitest';
import {
  addWorkdays,
  createWorkCalendar,
  deadlineOf,
  weekdayCalendar,
  workdaysBetween,
} from '../workdays';

// 2026-10：1 日周四；国庆 1–8 日放假，9 月 27 日（周日）与 10 月 10 日（周六）调休上班
const national = createWorkCalendar({
  holidays: [['2026-10-01', '2026-10-08']],
  workdays: ['2026-09-27', '2026-10-10'],
});

describe('createWorkCalendar', () => {
  it('周末不上班；节假日（含区间）不上班；调休的周末上班', () => {
    expect(weekdayCalendar.isWorkday('2026-10-23')).toBe(true); // 周五
    expect(weekdayCalendar.isWorkday('2026-10-24')).toBe(false); // 周六
    expect(national.isWorkday('2026-10-05')).toBe(false); // 国庆中间的周一
    expect(national.isWorkday('2026-10-10')).toBe(true); // 调休的周六
    expect(national.isWorkday('2026-09-27')).toBe(true); // 调休的周日
  });
});

describe('workdaysBetween', () => {
  it('不含起点、含终点：周五到下周一是 1；同一天是 0；反向为负', () => {
    expect(workdaysBetween('2026-10-23', '2026-10-26')).toBe(1);
    expect(workdaysBetween('2026-10-23', '2026-10-23')).toBe(0);
    expect(workdaysBetween('2026-10-26', '2026-10-23')).toBe(-1);
  });

  it('按工作日历跳过节假日、算上调休', () => {
    // 9-30（周三）到 10-12（周一）：国庆放假，10-09（周五）、10-10（调休周六）、10-12 上班
    expect(workdaysBetween('2026-09-30', '2026-10-12', national)).toBe(3);
    expect(workdaysBetween('2026-09-30', '2026-10-12')).toBe(8);
  });
});

describe('addWorkdays', () => {
  it('往后、往前数；0 原样；跳过节假日', () => {
    expect(addWorkdays('2026-10-23', 1)).toBe('2026-10-26');
    expect(addWorkdays('2026-10-26', -1)).toBe('2026-10-23');
    expect(addWorkdays('2026-10-24', 0)).toBe('2026-10-24');
    expect(addWorkdays('2026-09-30', 2, national)).toBe('2026-10-10');
  });

  it('与 workdaysBetween 互逆', () => {
    for (const count of [1, 5, 10, 23]) {
      expect(
        workdaysBetween('2026-09-28', addWorkdays('2026-09-28', count, national), national),
      ).toBe(count);
    }
  });
});

describe('deadlineOf', () => {
  const start = '2026-10-12'; // 周一；10 个工作日后是 10-26（周一）
  it('开始日加工作日得出截止日；按今天给出剩余与状态', () => {
    expect(deadlineOf({ start, workdays: 10, today: '2026-10-14' })).toEqual({
      due: '2026-10-26',
      remaining: 8,
      state: 'pending',
    });
    expect(deadlineOf({ start, workdays: 10, today: '2026-10-22' }).state).toBe('soon');
    expect(deadlineOf({ start, workdays: 10, today: '2026-10-26' }).state).toBe('due');
    expect(deadlineOf({ start, workdays: 10, today: '2026-10-27' })).toMatchObject({
      remaining: -1,
      state: 'overdue',
    });
  });

  it('截止日过了但中间没有工作日（周五截止、周六）：仍是超期', () => {
    expect(deadlineOf({ due: '2026-10-23', today: '2026-10-24' })).toEqual({
      due: '2026-10-23',
      remaining: 0,
      state: 'overdue',
    });
  });

  it('完成了按完成那天算：提前完成剩余为正，晚了为负', () => {
    expect(deadlineOf({ due: '2026-10-23', done: '2026-10-21', today: '2026-10-30' })).toEqual({
      due: '2026-10-23',
      remaining: 2,
      state: 'done',
    });
    expect(deadlineOf({ due: '2026-10-23', done: '2026-10-27' }).remaining).toBe(-2);
  });
});
