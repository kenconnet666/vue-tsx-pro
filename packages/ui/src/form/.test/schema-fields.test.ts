// 从 schema 推出字段：控件按类型选、meta 的标签与选项、嵌套与列表、空白的初始值
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { bigintSchema, decimalSchema } from '../schemas';
import { emptyValues, schemaFields } from '../schema-fields';

const schema = z.object({
  company: z.string().min(2).meta({ title: '公司全称', placeholder: '营业执照上的名称' }),
  category: z
    .enum(['machined', 'plastic'])
    .meta({ title: '供货品类', options: { machined: '机械件' } }),
  level: z.enum(['a', 'b']).meta({ title: '等级', control: 'radio' }),
  amount: decimalSchema({ min: 0, scale: 2 }).meta({ title: '金额', unit: '元' }),
  days: z.number().int().optional(),
  agreed: z.boolean(),
  tags: z.array(z.enum(['urgent', 'export'])).meta({ title: '标记' }),
  start: z.iso.date().meta({ title: '开始', group: '交付' }),
  at: z.iso.datetime({ local: true }).nullable().meta({ title: '时间', group: '交付' }),
  note: z.string().max(500).meta({ title: '说明', span: 'full' }),
  address: z.object({ city: z.string().meta({ title: '城市' }) }).meta({ title: '地址' }),
  contacts: z
    .array(z.object({ name: z.string().meta({ title: '姓名' }), phone: z.string() }))
    .meta({ title: '联系人' }),
  mode: z.string().default('normal'),
});

const byKey = (key: string) => schemaFields(schema).find((field) => field.key === key)!;

describe('schemaFields', () => {
  it('decimalSchema 给了 type、bigintSchema 时记下值类型（包了 meta、optional 也认得）：控件一开始为空时按它写回', () => {
    const typed = z.object({
      price: decimalSchema({ scale: 2, type: Decimal }).optional().meta({ title: '单价' }),
      id: bigintSchema().nullable(),
      plain: decimalSchema(),
    });
    expect(schemaFields(typed).map((field) => field.valueType)).toEqual([
      Decimal,
      'bigint',
      undefined,
    ]);
  });

  it('按类型选控件，meta 写了 control 时用它', () => {
    expect(schemaFields(schema).map((field) => [field.key, field.control])).toEqual([
      ['company', 'text'],
      ['category', 'select'],
      ['level', 'radio'],
      ['amount', 'number'],
      ['days', 'number'],
      ['agreed', 'switch'],
      ['tags', 'multiselect'],
      ['start', 'date'],
      ['at', 'datetime'],
      ['note', 'textarea'],
      ['address', 'object'],
      ['contacts', 'list'],
      ['mode', 'text'],
    ]);
  });

  it('标签、占位、单位、分组、栏宽取自 meta；没写标题时是键', () => {
    expect(byKey('company')).toMatchObject({ label: '公司全称', placeholder: '营业执照上的名称' });
    expect(byKey('amount')).toMatchObject({ label: '金额', unit: '元' });
    expect(byKey('days').label).toBe('days');
    expect(byKey('start').group).toBe('交付');
    // 包在 nullable 外面的 meta 也认
    expect(byKey('at')).toMatchObject({ label: '时间', group: '交付' });
    expect(byKey('note').span).toBe('full');
  });

  it('枚举的可选值：meta 的 options 是显示文字，没写的显示值本身；数组按元素的枚举', () => {
    expect(byKey('category').options).toEqual([
      { value: 'machined', label: '机械件' },
      { value: 'plastic', label: 'plastic' },
    ]);
    expect(byKey('tags').options!.map((option) => option.value)).toEqual(['urgent', 'export']);
  });

  it('嵌套对象与对象的数组带上各自的字段', () => {
    expect(byKey('address').fields!.map((field) => field.label)).toEqual(['城市']);
    expect(byKey('contacts').fields!.map((field) => [field.key, field.label])).toEqual([
      ['name', '姓名'],
      ['phone', 'phone'],
    ]);
  });

  it('emptyValues：文字是空串，必填的选择、数字、日期是 null，可选的是 undefined，默认值照用；每次是新的对象', () => {
    const values = emptyValues(schema);
    expect(values).toEqual({
      company: '',
      category: null,
      level: null,
      amount: null,
      days: undefined,
      agreed: false,
      tags: [],
      start: null,
      at: null,
      note: '',
      address: { city: '' },
      contacts: [],
      mode: 'normal',
    });
    expect(emptyValues(schema).tags).not.toBe(values.tags);
  });

  it('不是对象的 schema 没有字段', () => {
    expect(schemaFields(z.string())).toEqual([]);
  });
});
