// dayRangeBounds：日期区间换成按时刻查的一对边界
import { CalendarDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { dayRangeBounds } from '../date';

describe('dayRangeBounds', () => {
  it('开始那天零点起、结束那天的第二天零点前，按给的时区算', () => {
    const { from, to } = dayRangeBounds({ start: new CalendarDate(2026, 10, 27), end: new CalendarDate(2026, 10, 28) }, 'Asia/Shanghai');
    expect([from.toISOString(), to.toISOString()]).toEqual(['2026-10-26T16:00:00.000Z', '2026-10-28T16:00:00.000Z']);
  });
});
