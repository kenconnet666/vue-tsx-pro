// 线上的 typed JSON：与 query 库共用的样例（wire-order.json 是 query 仓库 spec/wire/order.json 的副本，两边要一样），
// 还原的默认值与选项、同一路径只能一种值、地址栏里的单个值
import {
  CalendarDate,
  CalendarDateTime,
  parseAbsolute,
  Time,
  ZonedDateTime,
} from '@internationalized/date';
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import shared from './wire-order.json' with { type: 'json' };
import { fromWire, toWire, wireText } from '../wire';

/** fromWire 就地改写，每次给一份新的 */
const sample = () => structuredClone(shared) as unknown;

/** 样例对象：query 库的 TypeScript、Java 测试各写了同一个 */
const order = () => ({
  id: 9007199254740993n,
  code: 'PO-1',
  count: 3,
  rate: 0.25,
  ratio: Number.NaN,
  active: true,
  amount: new Decimal('12.5'),
  on: new CalendarDate(2024, 1, 31),
  at: new Time(13, 45),
  created: new CalendarDateTime(2024, 1, 31, 13, 45, 0, 500),
  sent: parseAbsolute('2024-01-31T05:45:00Z', 'Asia/Shanghai'),
  file: new Uint8Array([1, 2, 3, 255]),
  note: null,
  lines: [
    { sku: 'A.1', qty: new Decimal('2.75') },
    { sku: 'B', qty: new Decimal('1') },
  ],
  tags: [1n, 2n],
  byMonth: new Map([
    ['2024.01', new Decimal('3.5')],
    ['2024.02', new Decimal('0')],
  ]),
});

describe('toWire / fromWire', () => {
  it('写出的与共用样例逐字段相同', () => {
    expect(JSON.parse(JSON.stringify(toWire(order())))).toEqual(sample());
  });

  it('默认还原：bigint 是 bigint，decimal 与日期留作文字，NaN 与字节还原', () => {
    const value = fromWire<Record<string, unknown>>(sample());
    expect(value.id).toBe(9007199254740993n);
    expect(value.tags).toEqual([1n, 2n]);
    expect(value.amount).toBe('12.5');
    expect(value.on).toBe('2024-01-31');
    expect(value.sent).toBe('2024-01-31T05:45:00Z');
    expect(value.ratio).toBeNaN();
    expect([...(value.file as Uint8Array)]).toEqual([1, 2, 3, 255]);
    expect('$types' in value).toBe(false);
  });

  it('给了 Decimal 与 dates: objects 时还原成对象', () => {
    const value = fromWire<Record<string, unknown>>(sample(), {
      decimal: Decimal,
      dates: 'objects',
      timeZone: 'Asia/Shanghai',
    });
    expect((value.amount as Decimal).equals('12.5')).toBe(true);
    expect(((value.lines as { qty: Decimal }[])[0]!.qty as Decimal).equals('2.75')).toBe(true);
    expect((value.byMonth as Record<string, Decimal>)['2024.01']!.equals('3.5')).toBe(true);
    expect((value.on as CalendarDate).compare(new CalendarDate(2024, 1, 31))).toBe(0);
    expect(String(value.at)).toBe('13:45:00');
    expect(String(value.created)).toBe('2024-01-31T13:45:00.5');
    expect((value.sent as ZonedDateTime).hour).toBe(13);
  });

  it('根不是对象时包成 $value；同一路径既有文字又有 bigint 时报错', () => {
    expect(toWire([1n, 2n])).toEqual({ $value: ['1', '2'], $types: { $value: 'bigint' } });
    expect(fromWire(toWire([1n, 2n]))).toEqual([1n, 2n]);
    expect(toWire({ a: 1, b: 'x' })).toEqual({ a: 1, b: 'x' });
    expect(() => toWire([{ v: 1n }, { v: 'x' }])).toThrow(/既有 bigint 又有 text/);
  });

  it('wireText：Decimal 不用科学计数法，日期 ISO，时刻换算成 UTC，null 是空字符串', () => {
    expect(wireText(new Decimal('1e-7'))).toBe('0.0000001');
    expect(wireText(new CalendarDate(2024, 1, 31))).toBe('2024-01-31');
    expect(wireText(new Date(Date.UTC(2024, 0, 31, 5, 45, 0, 120)))).toBe(
      '2024-01-31T05:45:00.12Z',
    );
    expect(wireText(12n)).toBe('12');
    expect(wireText(null)).toBe('');
  });
});
