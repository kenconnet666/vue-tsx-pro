// 按语言解析数字：小数点与千分位、全角、空白；解析不了时为 NaN
import { describe, expect, it } from 'vitest';
import { normalizeNumber, parseNumber } from '../number-parse';

describe('parseNumber', () => {
  it.each([
    ['1,234.5', 'en-US', 1234.5],
    ['1.234,5', 'de-DE', 1234.5],
    ['１２．５', 'zh-CN', 12.5],
    ['－3', 'zh-CN', -3],
    [' 42 ', 'zh-CN', 42],
    ['.5', 'en-US', 0.5],
    ['', 'zh-CN', null],
  ])('%s（%s）→ %s', (text, locale, expected) => {
    expect(parseNumber(text, locale)).toBe(expected);
  });

  it('解析不了时为 NaN', () => {
    expect(parseNumber('12abc', 'zh-CN')).toBeNaN();
    expect(parseNumber('1-2', 'zh-CN')).toBeNaN();
  });
});

describe('normalizeNumber', () => {
  it('不经过浮点数：大整数、长小数原样保留；解析不了时为 undefined', () => {
    expect(normalizeNumber('9,007,199,254,740,993', 'en-US')).toBe('9007199254740993');
    expect(normalizeNumber('0.1000000000000000055', 'zh-CN')).toBe('0.1000000000000000055');
    expect(normalizeNumber('12abc', 'zh-CN')).toBeUndefined();
  });
});
