/** 对象的小工具（设计器改定义、清单时用：都不改原对象） */

/** 去掉一个可选字段（不改原对象） */
export function without<T extends object, K extends keyof T>(object: T, key: K): Omit<T, K> {
  const copy = { ...object };
  delete copy[key];
  return copy;
}
