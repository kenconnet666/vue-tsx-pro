// diffFields：按字段比较，变了没有按结构相等；数值字段给出精确的差与变化率；字段与顺序由 keys 决定
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { diffFields, diffRows } from '../diff';

interface Estimate {
  amount: Decimal;
  quantity: number;
  reason: string;
  tags?: string[];
}

const v1: Estimate = {
  amount: new Decimal('120.10'),
  quantity: 4,
  reason: '材料降价',
  tags: ['A'],
};
const v2: Estimate = {
  amount: new Decimal('98.15'),
  quantity: 4,
  reason: '材料降价、工时减少',
  tags: ['A'],
};

describe('diffFields', () => {
  it('变了没有按结构相等；Decimal 的差精确（不经过浮点），给出变化率', () => {
    const [amount, quantity, reason, tags] = diffFields(v1, v2);
    expect(amount).toMatchObject({ key: 'amount', changed: true });
    expect(String(amount!.delta)).toBe('-21.95');
    expect(amount!.ratio).toBeCloseTo(-21.95 / 120.1);
    expect(quantity).toMatchObject({ changed: false, delta: 0, ratio: 0 });
    expect([reason!.changed, reason!.delta]).toEqual([true, undefined]);
    expect(tags!.changed).toBe(false);
  });

  it('Decimal(1.0) 与 1 算没变；bigint 按整数相减；之前为 0 时没有变化率', () => {
    expect(diffFields({ a: new Decimal('1.0') }, { a: 1 })[0]!.changed).toBe(false);
    expect(diffFields({ a: 5n }, { a: 12n })[0]!.delta).toBe(7n);
    const fromZero = diffFields({ a: 0 }, { a: 3 })[0]!;
    expect([fromZero.delta, fromZero.ratio]).toEqual([3, undefined]);
  });

  it('keys 决定比哪些字段与顺序；某一份没有时字段都当作 undefined', () => {
    expect(diffFields(v1, v2, ['reason', 'amount']).map((item) => item.key)).toEqual([
      'reason',
      'amount',
    ]);
    const created = diffFields(null, { amount: 1, reason: '新建' });
    expect(created.map((item) => [item.key, item.before, item.changed])).toEqual([
      ['amount', undefined, true],
      ['reason', undefined, true],
    ]);
  });
});

describe('diffRows', () => {
  const key = (row: { id: number }) => String(row.id);

  it('按 key 比较：新增、修改、删除，没变的没有 change；删除的排在最后', () => {
    const before = [
      { id: 1, views: 10, tags: ['a'] },
      { id: 2, views: 20, tags: [] },
      { id: 3, views: 30, tags: [] },
    ];
    const after = [
      { id: 4, views: 0, tags: [] },
      { id: 1, views: 11, tags: ['a'] },
      { id: 2, views: 20, tags: [] },
    ];
    expect(diffRows(before, after, key)).toEqual([
      { key: '4', row: after[0], change: 'inserted' },
      { key: '1', row: after[1], change: 'updated', before: before[0], changedFields: ['views'] },
      { key: '2', row: after[2] },
      { key: '3', row: before[2], change: 'deleted' },
    ]);
  });

  it('字段按结构相等比较：内容一样的数组不算变了', () => {
    expect(
      diffRows([{ id: 1, tags: ['a'] }], [{ id: 1, tags: ['a'] }], key)[0]!.change,
    ).toBeUndefined();
  });
});
