// sameValue：结构相等。普通对象、数组逐项；Date、数值、日期值按值；Map 逐项、Set 比成员；其余比引用
import { CalendarDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { sameValue } from '../equality';

describe('sameValue', () => {
  it('普通对象、数组逐项比较；Date 比时间；日期值按 compare', () => {
    expect(sameValue({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(sameValue({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(sameValue([1, 2], { 0: 1, 1: 2 })).toBe(false);
    expect(sameValue(new Date(5), new Date(5))).toBe(true);
    expect(sameValue(new CalendarDate(2026, 11, 14), new CalendarDate(2026, 11, 14))).toBe(true);
    expect(sameValue(new CalendarDate(2026, 11, 14), new CalendarDate(2026, 11, 15))).toBe(false);
  });

  it('Map 逐项比值、Set 比成员：内容不同的不相等（它们没有可枚举的键）', () => {
    expect(sameValue(new Set(['a']), new Set(['b']))).toBe(false);
    expect(sameValue(new Set(['a', 'b']), new Set(['b', 'a']))).toBe(true);
    expect(sameValue(new Set(['a']), new Set(['a', 'b']))).toBe(false);
    expect(sameValue(new Map([['a', { n: 1 }]]), new Map([['a', { n: 1 }]]))).toBe(true);
    expect(sameValue(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(false);
    expect(sameValue(new Map([['a', 1]]), new Map([['b', 1]]))).toBe(false);
    expect(sameValue(new Map(), new Set())).toBe(false);
    expect(sameValue(new Map(), {})).toBe(false);
  });
});
