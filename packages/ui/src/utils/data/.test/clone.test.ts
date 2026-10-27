import { CalendarDate } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { cloneValue } from '../clone';

describe('cloneValue', () => {
  it('copies plain objects and arrays but keeps class instances', () => {
    const day = new CalendarDate(2026, 10, 27);
    const source = reactive({ range: { start: day, end: day }, tags: ['a'] });
    const copy = cloneValue(source);
    expect(copy.range.start).toBe(day);
    expect(copy.range.start.add({ days: 1 }).day).toBe(28);
    copy.tags.push('b');
    expect(source.tags).toEqual(['a']);
    expect(copy.range).not.toBe(source.range);
  });
});
