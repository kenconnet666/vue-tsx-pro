import { toRaw } from 'vue';

/**
 * 复制表单、查询条件这类值：普通对象与数组逐层复制（各份互不影响），其余值原样保留；响应式代理先取原始对象。
 * 不用 structuredClone：Decimal、@internationalized/date 的日期这些带方法的值克隆不了（会抛错，或变成丢了方法的普通对象），
 * 它们本身不可变，共用同一个实例没有问题
 *
 *   query.search(cloneValue(draft));   // draft 里的 CalendarDate 仍是 CalendarDate
 */
export function cloneValue<T>(value: T): T {
  const raw = toRaw(value);
  if (Array.isArray(raw)) return raw.map(cloneValue) as T;
  if (raw === null || typeof raw !== 'object') return raw;
  const prototype = Object.getPrototypeOf(raw);
  if (prototype !== Object.prototype && prototype !== null) return raw;
  return Object.fromEntries(Object.entries(raw).map(([key, item]) => [key, cloneValue(item)])) as T;
}
