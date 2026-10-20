import { CalendarDate, CalendarDateTime } from '@internationalized/date';
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { createComparer, createMatcher } from '../collation';

describe('createMatcher', () => {
  it('忽略大小写与重音；空查询总是匹配', () => {
    const match = createMatcher('en-US');
    expect(match('Ångström', 'ang')).toBe(true);
    expect(match('TypeScript', 'script')).toBe(true);
    expect(match('Rust', 'go')).toBe(false);
    expect(match('任何', '')).toBe(true);
  });
});

describe('createComparer', () => {
  it('数字按大小、日期按时间、文字按语言（数字段按数值），空值排在最后', () => {
    const compare = createComparer('zh-CN');
    expect([10, 2, 33].sort(compare)).toEqual([2, 10, 33]);
    expect(['第10章', '第2章'].sort(compare)).toEqual(['第2章', '第10章']);
    const [a, b] = [new Date(2026, 0, 2), new Date(2026, 0, 1)];
    expect([a, b].sort(compare)).toEqual([b, a]);
    expect([null, 'b', undefined, 'a'].sort(compare)).toEqual(['a', 'b', null, undefined]);
  });

  it('Decimal、bigint 与 number 混着按大小；按字符串比会排错的小数（1.5 与 1.25）也对', () => {
    const compare = createComparer('zh-CN');
    const prices = [new Decimal('1.5'), new Decimal('1.25'), new Decimal('-3'), new Decimal('10')];
    expect(prices.sort(compare).map(String)).toEqual(['-3', '1.25', '1.5', '10']);
    expect([3n, 2.5, new Decimal('2.75'), 1n].sort(compare).map(String)).toEqual([
      '1',
      '2.5',
      '2.75',
      '3',
    ]);
  });

  it('DateValue 按自己的 compare：日期、日期时间都对', () => {
    const compare = createComparer('zh-CN');
    const days = [
      new CalendarDate(2026, 10, 20),
      new CalendarDate(2025, 1, 1),
      new CalendarDate(2026, 2, 3),
    ];
    expect(days.sort(compare).map(String)).toEqual(['2025-01-01', '2026-02-03', '2026-10-20']);
    const times = [
      new CalendarDateTime(2026, 10, 20, 9),
      new CalendarDateTime(2026, 10, 20, 8, 30),
    ];
    expect(times.sort(compare).map(String)).toEqual(['2026-10-20T08:30:00', '2026-10-20T09:00:00']);
  });
});
