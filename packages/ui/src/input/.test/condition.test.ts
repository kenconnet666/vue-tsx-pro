// 条件树：各种比较方式的求值（数字文字与数字相等、精确的十进制、编码顺序、数组字段、介于的开放端、文字不分大小写、空值），组合与空组，
// 自定义取值；写成一句话（嵌套加括号、取反、选项与是否的文字、数字按语言格式化、只有一端的范围）
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { zhCN } from '../../config/lang/zh-CN';
import {
  describeCondition,
  isRuleComplete,
  matchesCondition,
  valueShape,
  type Condition,
  type ConditionField,
} from '../condition';

const order = {
  amount: 1200,
  code: 'PO-17',
  category: 'steel',
  note: '',
  tags: [],
  due: '2026-11-03',
};

describe('matchesCondition', () => {
  it('比较：大小按数值（数字文字也算），日期按文字先后，介于含两端、空的一端不限', () => {
    const yes = (condition: Condition) => matchesCondition(condition, order);
    expect(yes({ field: 'amount', op: 'eq', value: '1200' })).toBe(true);
    expect(yes({ field: 'amount', op: 'gt', value: 999 })).toBe(true);
    expect(yes({ field: 'amount', op: 'lte', value: 1000 })).toBe(false);
    expect(yes({ field: 'due', op: 'lt', value: '2026-12-01' })).toBe(true);
    expect(yes({ field: 'amount', op: 'between', value: [1000, 1200] })).toBe(true);
    expect(yes({ field: 'amount', op: 'between', value: [null, 1000] })).toBe(false);
    expect(yes({ field: 'amount', op: 'between', value: [1000, null] })).toBe(true);
    // 没有这个字段：大小比较都不成立
    expect(yes({ field: 'missing', op: 'gt', value: 0 })).toBe(false);
  });

  it('数值按精确的十进制比（与流程引擎的模型包同一套规则）：长小数、大整数、Decimal 不丢精度；文字按编码顺序', () => {
    const row = {
      big: '123456789012345678901234567890.01',
      id: 12345678901234567890n,
      price: new Decimal('19.90'),
      code: 'b',
    };
    const yes = (condition: Condition) => matchesCondition(condition, row);
    expect(yes({ field: 'big', op: 'gt', value: '123456789012345678901234567890' })).toBe(true);
    expect(yes({ field: 'big', op: 'lt', value: '123456789012345678901234567890.02' })).toBe(true);
    expect(yes({ field: 'id', op: 'eq', value: '12345678901234567890' })).toBe(true);
    expect(yes({ field: 'id', op: 'gt', value: '12345678901234567889' })).toBe(true);
    expect(yes({ field: 'price', op: 'eq', value: '19.9' })).toBe(true);
    expect(yes({ field: 'price', op: 'between', value: ['19.89', '1.99e1'] })).toBe(true);
    // 编码顺序：大写字母排在小写前面，不随语言环境变
    expect(yes({ field: 'code', op: 'gt', value: 'B' })).toBe(true);
  });

  it('字段的值是数组：等于、是其中之一是"有一项满足"，不等于、不在其中是"没有一项满足"', () => {
    const row = { reviewers: ['u1', 'u2'] };
    const yes = (condition: Condition) => matchesCondition(condition, row);
    expect(yes({ field: 'reviewers', op: 'eq', value: 'u2' })).toBe(true);
    expect(yes({ field: 'reviewers', op: 'ne', value: 'u2' })).toBe(false);
    expect(yes({ field: 'reviewers', op: 'in', value: ['u3', 'u1'] })).toBe(true);
    expect(yes({ field: 'reviewers', op: 'notIn', value: ['u3'] })).toBe(true);
    expect(yes({ field: 'reviewers', op: 'exists' })).toBe(true);
  });

  it('选项与文字：in / notIn，包含与开头不分大小写；exists / empty 把空字符串、空数组算作空', () => {
    const yes = (condition: Condition) => matchesCondition(condition, order);
    expect(yes({ field: 'category', op: 'in', value: ['aluminum', 'steel'] })).toBe(true);
    expect(yes({ field: 'category', op: 'notIn', value: ['steel'] })).toBe(false);
    expect(yes({ field: 'code', op: 'contains', value: 'po' })).toBe(true);
    expect(yes({ field: 'code', op: 'startsWith', value: 'PO-1' })).toBe(true);
    expect(yes({ field: 'code', op: 'notContains', value: '17' })).toBe(false);
    expect(yes({ field: 'note', op: 'empty' })).toBe(true);
    expect(yes({ field: 'tags', op: 'exists' })).toBe(false);
  });

  it('组合：all / any / not 可以嵌套；没填完整的比较与空的组不加条件（同 query 的 conditionBy）；read 改取值的方式', () => {
    const condition: Condition = {
      all: [
        { field: 'amount', op: 'gte', value: 1000 },
        { not: { any: [{ field: 'category', op: 'eq', value: 'service' }] } },
      ],
    };
    expect(matchesCondition(condition, order)).toBe(true);
    expect(matchesCondition({ all: [] }, order)).toBe(true);
    expect(matchesCondition({ any: [] }, order)).toBe(true);
    expect(matchesCondition({ not: { all: [] } }, order)).toBe(true);
    // 没填完整的比较不算：any 只看填完整的那一条
    expect(
      matchesCondition(
        {
          any: [
            { field: 'amount', op: 'gt', value: '' },
            { field: 'amount', op: 'lt', value: 0 },
          ],
        },
        order,
      ),
    ).toBe(false);
    expect(matchesCondition({ field: 'category', op: 'in', value: [] }, order)).toBe(true);
    const nested = { head: { amount: 5 } };
    expect(
      matchesCondition(
        { field: 'amount', op: 'eq', value: 5 },
        nested,
        (row, field) => (row.head as Record<string, unknown>)[field],
      ),
    ).toBe(true);
  });

  it('值的形状与“填完整”：介于至少一端有值，exists 不要值', () => {
    expect(valueShape('between')).toBe('range');
    expect(valueShape('notIn')).toBe('list');
    expect(valueShape('empty')).toBe('none');
    expect(isRuleComplete({ field: 'a', op: 'between', value: [null, 3] })).toBe(true);
    expect(isRuleComplete({ field: 'a', op: 'between', value: [null, null] })).toBe(false);
    expect(isRuleComplete({ field: 'a', op: 'in', value: [] })).toBe(false);
    expect(isRuleComplete({ field: 'a', op: 'exists' })).toBe(true);
  });
});

describe('describeCondition', () => {
  const fields: ConditionField[] = [
    { name: 'amount', label: '金额', type: 'number' },
    { name: 'due', label: '交货日期', type: 'date' },
    {
      name: 'category',
      label: '品类',
      type: 'select',
      options: [
        { value: 'steel', label: '钢材' },
        { value: 'aluminum', label: '铝材' },
      ],
    },
    { name: 'urgent', label: '加急', type: 'boolean' },
  ];

  it('嵌套的组加括号，取反写“不满足：”；选项写文字、是否写“是 / 否”、数字按语言格式化；不认识的字段写字段名', () => {
    const condition: Condition = {
      all: [
        { field: 'amount', op: 'gte', value: 100000 },
        {
          any: [
            { field: 'category', op: 'in', value: ['steel', 'aluminum'] },
            { field: 'urgent', op: 'eq', value: true },
          ],
        },
        { not: { field: 'due', op: 'lt', value: '2026-11-01' } },
        { field: 'owner', op: 'exists' },
      ],
    };
    expect(describeCondition(condition, fields, zhCN)).toBe(
      '金额 大于等于 100,000，且 （品类 是其中之一 钢材、铝材，或 加急 为 是），且 不满足：交货日期 早于 2026-11-01，且 owner 不为空',
    );
  });

  it('只有一端的介于写成“以上”“以下”', () => {
    expect(
      describeCondition({ field: 'amount', op: 'between', value: [500, null] }, fields, zhCN),
    ).toBe('金额 介于 500 以上');
    expect(
      describeCondition(
        { field: 'due', op: 'between', value: ['2026-11-01', '2026-11-30'] },
        fields,
        zhCN,
      ),
    ).toBe('交货日期 介于 2026-11-01 至 2026-11-30');
  });
});
