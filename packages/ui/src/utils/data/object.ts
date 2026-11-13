/** 对象的小工具 */

/**
 * 去掉值是 undefined 的键：合并配置（主题、语言、组件默认值）时，`{ size: compact ? 'sm' : undefined }`
 * 这样没有值的键不该把外层写好的盖掉（同部件属性的合并规则）。没有这样的键时原样返回
 */
export function withoutUndefined<T extends object>(value: T | undefined): Partial<T> {
  if (!value) return {};
  if (!Object.values(value).includes(undefined)) return value;
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
}
