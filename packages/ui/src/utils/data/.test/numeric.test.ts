// 内置数值类型：number、bigint、Decimal 的识别、比较、转换与十进制文本
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  compareNumeric,
  isDecimal,
  isNumeric,
  numericText,
  sameNumeric,
  shiftDecimal,
  toNumber,
} from '../numeric';

describe('numeric', () => {
  it('识别 Decimal，包括 Decimal.clone 出来的构造函数的实例', () => {
    const Money = Decimal.clone({ precision: 40 });
    expect([isDecimal(new Decimal(1)), isDecimal(new Money(1))]).toEqual([true, true]);
    expect([
      isDecimal(1),
      isDecimal('1'),
      isDecimal({ d: [1], e: 0, s: 1 }),
      isDecimal(null),
    ]).toEqual([false, false, false, false]);
    expect([isNumeric(1), isNumeric(1n), isNumeric(new Decimal(1)), isNumeric('1')]).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('不同类型混着也按大小比较；大整数与小数不丢精度', () => {
    expect(compareNumeric(new Decimal('1.5'), 1.25)).toBeGreaterThan(0);
    expect(compareNumeric(1.25, new Decimal('1.5'))).toBeLessThan(0);
    expect(compareNumeric(2n ** 64n, 2 ** 53)).toBeGreaterThan(0);
    // 2^53 + 1 在 number 里等于 2^53，bigint 比较时要分得出来
    expect(compareNumeric(2n ** 53n + 1n, 2 ** 53)).toBeGreaterThan(0);
    expect(compareNumeric(new Decimal('0.1').plus('0.2'), new Decimal('0.3'))).toBe(0);
    expect(sameNumeric(1n, new Decimal('1.0'))).toBe(true);
    // NaN 排在最后
    expect([3, Number.NaN, 1].sort(compareNumeric)).toEqual([1, 3, Number.NaN]);
  });

  it('十进制文本不用科学计数法；toNumber 只在需要浮点数时用', () => {
    expect(numericText(new Decimal('1e21'))).toBe('1000000000000000000000');
    expect(numericText(new Decimal('0.00000001'))).toBe('0.00000001');
    expect(numericText(12345678901234567890n)).toBe('12345678901234567890');
    expect(numericText(1e21)).toBe('1000000000000000000000');
    expect(numericText(0.5)).toBe('0.5');
    // 1e-6 以下 String() 也是科学计数法
    expect(numericText(1e-7)).toBe('0.0000001');
    expect(numericText(-2.5e-7)).toBe('-0.00000025');
    expect(numericText(0)).toBe('0');
    expect([toNumber(new Decimal('19.9')), toNumber(10n), toNumber(1.5)]).toEqual([19.9, 10, 1.5]);
  });

  it('小数点按文字移位：缩放到万不经过浮点数', () => {
    expect(shiftDecimal('155353.2', 4)).toBe('15.53532');
    expect(shiftDecimal('5', 4)).toBe('0.0005');
    expect(shiftDecimal('-0.5', 1)).toBe('-0.05');
    expect(shiftDecimal('.5', 2)).toBe('0.005');
    expect(shiftDecimal('100', 2)).toBe('1');
    expect(shiftDecimal('12.3', -2)).toBe('1230');
    expect(shiftDecimal('12345678901234567890', 4)).toBe('1234567890123456.789');
    expect([shiftDecimal('NaN', 4), shiftDecimal('1e5', 4), shiftDecimal('7', 0)]).toEqual([
      'NaN',
      '1e5',
      '7',
    ]);
  });
});
