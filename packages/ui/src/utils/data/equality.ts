/** 结构相等：表单判断有没有改过、请求判断参数是不是真的变了 */
import { isNumeric, sameNumeric } from './numeric';

/** 自带 compare 的值（@internationalized/date 的日期值）：不在运行时导入，按形状识别 */
const isComparable = (value: unknown): value is { compare: (other: unknown) => number } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { compare?: unknown }).compare === 'function';

/**
 * 结构相等：普通对象与数组逐项比较；Date 比时间；数值（number、bigint、Decimal）按大小，Decimal('1.0') 与 1 相等；
 * 日期值（CalendarDate 等）按它自己的 compare；其余（含 Blob）比引用
 */
export function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (isNumeric(a) && isNumeric(b)) return sameNumeric(a, b);
  if (isComparable(a) && isComparable(b) && a.constructor === b.constructor)
    return a.compare(b) === 0;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b) || a instanceof Blob || b instanceof Blob) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) =>
    sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}
