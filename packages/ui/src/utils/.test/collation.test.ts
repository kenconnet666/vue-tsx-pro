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
});
