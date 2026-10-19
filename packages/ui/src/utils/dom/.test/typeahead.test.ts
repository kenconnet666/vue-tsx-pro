import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTypeahead } from '../typeahead';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const labels = ['新建', 'Export', 'Edit', 'Delete', 'Duplicate', 'Exit'];

describe('createTypeahead', () => {
  it('连续输入拼成一个词；超时后重新开始', () => {
    const search = createTypeahead(500);
    expect(search.next('e', labels, 0)).toBe(1);
    expect(search.next('x', labels, 1)).toBe(1);
    expect(search.next('i', labels, 1)).toBe(5);
    vi.advanceTimersByTime(500);
    expect(search.next('d', labels, 5)).toBe(3);
  });

  it('反复按同一个字母在以它开头的项之间轮换', () => {
    const search = createTypeahead();
    expect(search.next('d', labels, 0)).toBe(3);
    expect(search.next('d', labels, 3)).toBe(4);
    expect(search.next('d', labels, 4)).toBe(3);
  });

  it('不可打印的键、开头的空格、没有匹配时返回 -1；不区分大小写，认中文', () => {
    const search = createTypeahead();
    expect(search.next('ArrowDown', labels, 0)).toBe(-1);
    expect(search.next(' ', labels, 0)).toBe(-1);
    expect(search.next('Z', labels, 0)).toBe(-1);
    vi.advanceTimersByTime(500);
    expect(search.next('新', labels, 2)).toBe(0);
  });
});
