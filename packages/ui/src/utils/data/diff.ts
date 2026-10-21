/**
 * 两份记录按字段比较（测算版本对比、编辑前后、审批意见）：哪些字段变了，数值字段变了多少。
 *
 *   diffFields(v1, v2, ['amount', 'quantity', 'reason'])
 *   // → [{ key: 'amount', before: 120, after: 98, changed: true, delta: -22, ratio: -0.183 }, …]
 *
 * 变没变按结构相等（sameValue：Decimal('1.0') 与 1 相等、日期按值）；两边都是数值（number、bigint、Decimal）时
 * 给出精确的差（after − before，按 Decimal 或 bigint 运算，不经过浮点）与变化率。
 */
import { sameValue } from './equality';
import {
  addNumeric,
  isDecimal,
  isNumeric,
  multiplyNumeric,
  numericKind,
  toNumber,
  type NumericValue,
} from './numeric';

/** 一个字段的比较结果 */
export interface FieldDiff<T, K extends keyof T = keyof T> {
  /** 字段名 */
  key: K;
  /** 之前的值；那一份没有时 undefined */
  before: T[K] | undefined;
  /** 之后的值 */
  after: T[K] | undefined;
  /** 变了没有 */
  changed: boolean;
  /** 两边都是数值时的差：after − before（Decimal、bigint 精确运算） */
  delta?: NumericValue;
  /** 两边都是数值且之前不为 0 时的变化率：delta / before（-0.2 是降了 20%） */
  ratio?: number;
}

/**
 * 按字段比较两份记录；keys 决定比哪些字段与顺序，不写时是两边出现过的全部字段（before 的在前）。
 * 某一份是 null / undefined 时，它的每个字段都当作没有
 */
export function diffFields<T extends object, K extends keyof T = keyof T>(
  before: T | null | undefined,
  after: T | null | undefined,
  keys?: readonly K[],
): FieldDiff<T, K>[] {
  const fields =
    keys ?? ([...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])] as K[]);
  return fields.map((key) => {
    const from = before?.[key];
    const to = after?.[key];
    const diff: FieldDiff<T, K> = { key, before: from, after: to, changed: !sameValue(from, to) };
    if (isNumeric(from) && isNumeric(to)) {
      diff.delta = subtract(to, from);
      const base = toNumber(from);
      if (base !== 0) diff.ratio = toNumber(diff.delta) / base;
    }
    return diff;
  });
}

/** a − b：有一边是 Decimal 时按它的构造函数算，都是 bigint 时按整数，否则按 number */
function subtract(a: NumericValue, b: NumericValue): NumericValue {
  const kind = isDecimal(a)
    ? numericKind(a)
    : isDecimal(b)
      ? numericKind(b)
      : typeof a === 'bigint' && typeof b === 'bigint'
        ? 'bigint'
        : 'number';
  return addNumeric(a, multiplyNumeric(b, -1, kind), kind);
}
