// 内置值类型的 schema：Decimal 与 bigint 的校验，以及从 schema 推出的字段约束
import Decimal from 'decimal.js';
import * as z from 'zod';
import { describe, expect, it } from 'vitest';
import { createConstraints } from '../form-constraints';
import { bigintSchema, decimalSchema } from '../schemas';
import { useForm } from '../useForm';

const codes = (result: { success: boolean; error?: { issues: { code: string }[] } }) =>
  result.success ? [] : result.error!.issues.map((issue) => issue.code);

describe('decimalSchema', () => {
  const price = decimalSchema({ min: 0, max: '9999.99', scale: 2 });

  it('类型、范围、小数位数；Decimal.clone 出来的实例同样通过', () => {
    expect(price.safeParse(new Decimal('19.90')).success).toBe(true);
    expect(price.safeParse(new (Decimal.clone({ precision: 40 }))('0.01')).success).toBe(true);
    expect(codes(price.safeParse(19.9))).toEqual(['custom']);
    expect(codes(price.safeParse(new Decimal('-1')))).toEqual(['too_small']);
    expect(codes(price.safeParse(new Decimal('10000')))).toEqual(['too_big']);
    expect(codes(price.safeParse(new Decimal('1.005')))).toEqual(['not_multiple_of']);
  });

  it('步长按十进制精确判断：0.3 是 0.1 的倍数（浮点数里不是）', () => {
    const tenth = decimalSchema({ step: '0.1' });
    expect(tenth.safeParse(new Decimal('0.3')).success).toBe(true);
    expect(codes(tenth.safeParse(new Decimal('0.35')))).toEqual(['not_multiple_of']);
  });

  it('表单从 schema 推出约束：NumberField 拿到范围与步长，可空字段同样推得出', () => {
    const constraints = createConstraints(
      z.object({ price, discount: decimalSchema({ min: 0, step: '0.5' }).nullable() }),
    );
    expect(constraints('price')).toMatchObject({
      required: true,
      min: 0,
      max: 9999.99,
      step: 0.01,
    });
    expect(constraints('discount')).toMatchObject({ min: 0, step: 0.5 });
    expect(constraints('discount').required).toBeFalsy();
  });
});

describe('bigintSchema', () => {
  it('范围由 zod 精确校验（超过 2^53 也对）；约束写进 JSON Schema', () => {
    const big = bigintSchema({ min: 0n, max: 2n ** 64n });
    expect(big.safeParse(2n ** 63n).success).toBe(true);
    expect(codes(big.safeParse(-1n))).toEqual(['too_small']);
    expect(codes(big.safeParse(2n ** 64n + 1n))).toEqual(['too_big']);
    const constraints = createConstraints(z.object({ stock: bigintSchema({ min: 0n }) }));
    expect(constraints('stock')).toMatchObject({ min: 0, step: 1 });
  });
});

describe('useForm 里的 Decimal', () => {
  it('初始值、数组项里的 Decimal 不被克隆坏（带方法的值原样保留）；reset 后不算改动', async () => {
    const form = useForm({
      schema: z.object({ items: z.array(z.object({ price: decimalSchema({ scale: 2 }) })) }),
      initial: { items: [{ price: new Decimal('19.90') }] },
    });
    expect(form.values.items[0]!.price.plus('0.1').toString()).toBe('20');
    form.values.items[0]!.price = new Decimal('25');
    expect(form.dirty).toBe(true);
    form.reset(form.values);
    expect(form.dirty).toBe(false);
    expect(form.values.items[0]!.price.toFixed(2)).toBe('25.00');
  });
});
