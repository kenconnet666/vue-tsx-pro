// 从 zod schema 推出字段约束：必填的判断、长度、范围、格式、枚举、嵌套与数组、nullable / optional
import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import * as zm from 'zod/mini';
import { createConstraints } from '../form-constraints';

const schema = z.object({
  email: z.email(),
  name: z.string().min(1).max(20),
  note: z.string(),
  nickname: z.string().min(2).optional(),
  alias: z.string().min(2).nullable(),
  age: z.number().int().min(0).max(150),
  price: z.number().multipleOf(0.5),
  agree: z.literal(true),
  newsletter: z.boolean(),
  city: z.enum(['bj', 'sh']),
  tags: z.array(z.string()).min(1),
  address: z.object({ zip: z.string().length(6) }),
  items: z.array(z.object({ qty: z.number().min(1) })),
  slug: z.string().transform((value) => value.toLowerCase()),
  code: z.string().regex(/^[A-Z]{2}-\d+$/),
  modelNo: z.string().regex(/^$|^\S+ R\d+$/),
});
const constraints = createConstraints(schema);

describe('createConstraints', () => {
  it('必填看值能不能为空：z.string() 允许空字符串、z.boolean() 允许 false，都不算必填', () => {
    expect(constraints('name')).toEqual({ required: true, minLength: 1, maxLength: 20 });
    expect(constraints('note')).toEqual({});
    expect(constraints('newsletter')).toEqual({});
    expect(constraints('agree').required).toBe(true);
    expect(constraints('tags').required).toBe(true);
  });

  it('正则：不匹配空字符串的才算必填；能匹配空的（选填、填了要合格式）只给出 pattern', () => {
    expect(constraints('code')).toEqual({ required: true, pattern: '^[A-Z]{2}-\\d+$' });
    expect(constraints('modelNo')).toEqual({ pattern: '^$|^\\S+ R\\d+$' });
  });

  it('optional、nullable 不必填，但长度约束照样给出', () => {
    expect(constraints('nickname')).toEqual({ minLength: 2 });
    expect(constraints('alias')).toEqual({ minLength: 2 });
  });

  it('数字的范围与步长（整数步长为 1）、格式、枚举', () => {
    expect(constraints('age')).toEqual({ required: true, min: 0, max: 150, step: 1 });
    expect(constraints('price').step).toBe(0.5);
    expect(constraints('email')).toMatchObject({ required: true, format: 'email' });
    expect(constraints('city')).toEqual({ required: true, options: ['bj', 'sh'] });
  });

  it('嵌套对象与数组按点连接的路径找；transform 取输入一侧；找不到的路径是空约束', () => {
    expect(constraints('address.zip')).toEqual({ required: true, minLength: 6, maxLength: 6 });
    expect(constraints('items.0.qty')).toEqual({ required: true, min: 1 });
    expect(constraints('slug')).toEqual({});
    expect(constraints('missing.path')).toEqual({});
    expect(createConstraints(undefined)('name')).toEqual({});
  });

  it('zod/mini 的 schema 同样可用', () => {
    const mini = createConstraints(zm.object({ code: zm.string().check(zm.minLength(4)) }));
    expect(mini('code')).toEqual({ required: true, minLength: 4 });
  });
});
