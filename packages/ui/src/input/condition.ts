/**
 * 条件：比较一个字段，或用 all / any / not 组合的表达式树。纯 JSON，可以存库、传给后端，前后端各自求值、结果一致。
 * ConditionBuilder 编辑它；FilterBar 的高级筛选、流程连线的条件都用这一种写法。
 *
 *   const condition: Condition = {
 *     all: [
 *       { field: 'amount', op: 'gte', value: 10000 },
 *       { any: [{ field: 'category', op: 'in', value: ['钢材', '铝材'] }, { not: { field: 'urgent', op: 'eq', value: false } }] },
 *     ],
 *   };
 *   rows.filter((row) => matchesCondition(condition, row));
 *   describeCondition(condition, fields, lang);   // “金额 大于等于 10000，且（品类 是其中之一 钢材、铝材，或 不满足：加急 是 否）”
 *
 * 字段（ConditionField）给出名字、显示名与类型；类型决定能用哪些比较方式（conditionOperators）与值用什么控件填。
 * 值的形式：between 是 [下限, 上限]（含两端，任一端为空时不限），in / notIn 是数组，exists / empty 没有值；日期是 ISO 文字，按文字比就是先后。
 */
import type { VNodeChild } from 'vue';
import type { Lang } from '../config/lang/lang';

/** 比较的方式 */
export interface ConditionOps {
  /** 等于 */
  eq: unknown;
  /** 不等于 */
  ne: unknown;
  /** 大于（日期：晚于） */
  gt: unknown;
  /** 大于等于 */
  gte: unknown;
  /** 小于（日期：早于） */
  lt: unknown;
  /** 小于等于 */
  lte: unknown;
  /** 在两个值之间（含两端）：value 是 [下限, 上限] */
  between: unknown;
  /** 是其中之一：value 是数组 */
  in: unknown;
  /** 不是其中任何一个：value 是数组 */
  notIn: unknown;
  /** 文字包含 */
  contains: unknown;
  /** 文字不包含 */
  notContains: unknown;
  /** 文字以它开头 */
  startsWith: unknown;
  /** 有值（不是 null、undefined、空字符串、空数组） */
  exists: unknown;
  /** 没有值 */
  empty: unknown;
}

/** 比较的方式 */
export type ConditionOp = keyof ConditionOps;

/** 比较一个字段 */
export interface ConditionRule {
  /** 字段名 */
  field: string;
  /** 比较的方式 */
  op: ConditionOp;
  /** 比较的值；exists、empty 没有 */
  value?: unknown;
}

/** 条件：比较一个字段，或用 all（全部满足）/ any（任一满足）/ not（不满足）组合 */
export type Condition =
  | ConditionRule
  | { all: readonly Condition[] }
  | { any: readonly Condition[] }
  | { not: Condition };

/** 字段的类型：决定能用哪些比较方式、值用什么控件填 */
export interface ConditionFieldTypes {
  /** 文字：包含、等于、开头是 */
  text: unknown;
  /** 数字：大小、介于 */
  number: unknown;
  /** 日期（ISO 文字）：早于、晚于、介于 */
  date: unknown;
  /** 从选项里选：是、不是、是其中之一 */
  select: unknown;
  /** 是或否 */
  boolean: unknown;
}

/** 字段的类型 */
export type ConditionFieldType = keyof ConditionFieldTypes;

/** 选项型字段的一个选项 */
export interface ConditionOption {
  /** 值 */
  value: string | number;
  /** 显示的文字 */
  label: string;
}

/** 自己画值的输入时拿到的参数 */
export interface ConditionInputContext {
  /** 字段 */
  field: ConditionField;
  /** 比较的方式 */
  op: ConditionOp;
  /** 现在的值 */
  value: unknown;
  /** 改值 */
  onChange: (value: unknown) => void;
  /** 无障碍名称（“金额的值”） */
  label: string;
}

/** 能参与比较的字段 */
export interface ConditionField {
  /** 字段名：写进条件的 field */
  name: string;
  /** 显示名 */
  label: string;
  /** 类型 */
  type: ConditionFieldType;
  /** 分组名：字段多时字段列表按它分组（如“申请单”“流程变量”） */
  group?: string;
  /** 选项（select 类型） */
  options?: readonly ConditionOption[];
  /** 能用的比较方式，默认按类型（conditionOperators） */
  operators?: readonly ConditionOp[];
  /** 自己画值的输入（人员选择器、带单位的数字……）；类型仍决定比较方式与摘要里值的写法 */
  input?: (context: ConditionInputContext) => VNodeChild;
  /** 摘要里值的写法，默认选项的文字、日期原样、是否写成“是 / 否” */
  format?: (value: unknown) => string;
}

/** 各类型默认能用的比较方式，第一个是新条件默认的 */
export const conditionOperators: Readonly<Record<ConditionFieldType, readonly ConditionOp[]>> = {
  text: ['contains', 'notContains', 'eq', 'ne', 'startsWith', 'empty', 'exists'],
  number: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'empty', 'exists'],
  date: ['eq', 'lt', 'gt', 'lte', 'gte', 'between', 'empty', 'exists'],
  select: ['eq', 'ne', 'in', 'notIn', 'empty', 'exists'],
  boolean: ['eq'],
};

/** 字段能用的比较方式 */
export const operatorsOf = (field: ConditionField): readonly ConditionOp[] =>
  field.operators ?? conditionOperators[field.type];

/** 这种比较要不要值 */
export const needsValue = (op: ConditionOp) => op !== 'exists' && op !== 'empty';

/** 值的形状：between 两个值，in / notIn 一组值，exists / empty 没有，其余一个 */
export type ConditionValueShape = 'none' | 'single' | 'range' | 'list';

/** 比较方式要的值的形状 */
export function valueShape(op: ConditionOp): ConditionValueShape {
  if (!needsValue(op)) return 'none';
  if (op === 'between') return 'range';
  if (op === 'in' || op === 'notIn') return 'list';
  return 'single';
}

/** 是组合（all / any / not），不是比较 */
export const isConditionGroup = (
  condition: Condition,
): condition is Exclude<Condition, ConditionRule> =>
  'all' in condition || 'any' in condition || 'not' in condition;

/** 值写成文字：null、undefined 是空字符串，对象（不该出现在比较里）写成 JSON */
export const toText = (value: unknown): string =>
  value == null
    ? ''
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value as string | number | boolean | bigint);

const isBlank = (value: unknown) =>
  value == null || value === '' || (Array.isArray(value) && value.length === 0);

/** 比较已经填完整：要值的有值，between 至少一端有值 */
export function isRuleComplete(rule: ConditionRule): boolean {
  switch (valueShape(rule.op)) {
    case 'none':
      return true;
    case 'range':
      return Array.isArray(rule.value) && rule.value.some((end) => !isBlank(end));
    default:
      return !isBlank(rule.value);
  }
}

/** 两个值按大小比：数字与能读成数字的文字按数值，其余按文字（ISO 日期按文字比就是先后） */
function compare(a: unknown, b: unknown): number {
  const numeric = (value: unknown) =>
    typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))
      ? Number(value)
      : typeof value === 'bigint'
        ? Number(value)
        : value;
  const x = numeric(a);
  const y = numeric(b);
  if (typeof x === 'number' && typeof y === 'number') return x - y;
  return toText(x).localeCompare(toText(y));
}

/** 等于：数字与数字文字视为相等（表单里的 '5' 与数据里的 5） */
const same = (a: unknown, b: unknown) =>
  a === b || (a != null && b != null && typeof a !== 'object' && compare(a, b) === 0);

const text = (value: unknown) => toText(value).toLocaleLowerCase();

/** 一条比较成不成立；read 取记录里字段的值，默认按字段名取属性 */
function matchesRule(rule: ConditionRule, actual: unknown): boolean {
  const { value } = rule;
  switch (rule.op) {
    case 'eq':
      return same(actual, value);
    case 'ne':
      return !same(actual, value);
    case 'gt':
      return actual != null && compare(actual, value) > 0;
    case 'gte':
      return actual != null && compare(actual, value) >= 0;
    case 'lt':
      return actual != null && compare(actual, value) < 0;
    case 'lte':
      return actual != null && compare(actual, value) <= 0;
    case 'between': {
      const [low, high] = Array.isArray(value) ? value : [];
      if (actual == null) return false;
      return (
        (isBlank(low) || compare(actual, low) >= 0) && (isBlank(high) || compare(actual, high) <= 0)
      );
    }
    case 'in':
      return Array.isArray(value) && value.some((item) => same(actual, item));
    case 'notIn':
      return !Array.isArray(value) || !value.some((item) => same(actual, item));
    case 'contains':
      return text(actual).includes(text(value));
    case 'notContains':
      return !text(actual).includes(text(value));
    case 'startsWith':
      return text(actual).startsWith(text(value));
    case 'exists':
      return !isBlank(actual);
    case 'empty':
      return isBlank(actual);
  }
}

/**
 * 记录满不满足条件。字段的值默认按名字取属性，read 可以改（嵌套字段、计算字段）。
 * 空的 all 成立、空的 any 不成立（同数组的 every / some）
 */
export function matchesCondition<T>(
  condition: Condition,
  record: T,
  read: (record: T, field: string) => unknown = (item, field) =>
    (item as Record<string, unknown> | null)?.[field],
): boolean {
  if ('all' in condition)
    return condition.all.every((item) => matchesCondition(item, record, read));
  if ('any' in condition) return condition.any.some((item) => matchesCondition(item, record, read));
  if ('not' in condition) return !matchesCondition(condition.not, record, read);
  return matchesRule(condition, read(record, condition.field));
}

/** 比较方式的文字：日期、选项、是否这几种类型有自己的说法（早于、是其中之一） */
export function operatorLabel(lang: Lang, type: ConditionFieldType, op: ConditionOp): string {
  return lang.conditionTypeOperators[type]?.[op] ?? lang.conditionOperators[op];
}

/** 值在摘要里的写法 */
export function formatConditionValue(
  lang: Lang,
  field: ConditionField | undefined,
  value: unknown,
) {
  const one = (item: unknown): string => {
    if (field?.format) return field.format(item);
    if (field?.type === 'boolean') return item ? lang.conditionTrue : lang.conditionFalse;
    const option = field?.options?.find((candidate) => candidate.value === item);
    if (option) return option.label;
    if (typeof item === 'number') return item.toLocaleString(lang.code);
    return toText(item);
  };
  if (Array.isArray(value)) return value.map(one).join(lang.conditionValueSeparator);
  return one(value);
}

/**
 * 条件写成一句话：收起的高级筛选、流程连线上的条件摘要用。不认识的字段原样写字段名；
 * 嵌套的组加括号，not 写成“不满足：…”
 */
export function describeCondition(
  condition: Condition,
  fields: readonly ConditionField[],
  lang: Lang,
): string {
  const describe = (item: Condition, nested: boolean): string => {
    if ('not' in item) return `${lang.conditionNotPrefix}${describe(item.not, true)}`;
    if ('all' in item || 'any' in item) {
      const list = 'all' in item ? item.all : item.any;
      const joiner = 'all' in item ? lang.conditionAndJoiner : lang.conditionOrJoiner;
      const text = list.map((child) => describe(child, true)).join(joiner);
      return nested && list.length > 1 ? `（${text}）` : text;
    }
    const field = fields.find((candidate) => candidate.name === item.field);
    const parts = [field?.label ?? item.field, operatorLabel(lang, field?.type ?? 'text', item.op)];
    const shape = valueShape(item.op);
    if (shape === 'range') {
      const [low, high] = Array.isArray(item.value) ? item.value : [];
      parts.push(
        lang.conditionRange(
          formatConditionValue(lang, field, low),
          formatConditionValue(lang, field, high),
        ),
      );
    } else if (shape !== 'none') {
      parts.push(formatConditionValue(lang, field, item.value));
    }
    return parts.join(' ');
  };
  return describe(condition, false);
}
