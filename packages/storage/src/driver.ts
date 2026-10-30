/**
 * 存储驱动：缓存与业务代码只认这个接口，底下换 IndexedDB、localStorage、小程序存储、内存，用法不变
 * （形状参考 unstorage 的驱动）。一律异步：同步的存储包一层 Promise 就行，IndexedDB 反过来变不成同步。
 *
 *   const driver = indexedDbDriver({ name: 'app' });
 *   await driver.set('draft:7', { title: '…', savedAt: new Date() });
 *   await driver.get<Draft>('draft:7');
 *   await driver.delete(await driver.keys('draft:'));
 *
 * 值：能结构化克隆的驱动（IndexedDB、内存）原样存，Date、Map、Blob 都保留；只能存文字的驱动（localStorage、小程序）
 * 经驱动自己的编码写成文字，默认 JSON。写入 undefined 等于删除。
 */
export interface StorageDriver {
  /** 驱动的名字（报错、调试时看是哪一个） */
  readonly name: string;
  /** 读；没有时 undefined */
  get<T = unknown>(key: string): Promise<T | undefined>;
  /** 写；value 为 undefined 时删掉这个键 */
  set(key: string, value: unknown): Promise<void>;
  /** 删一个或几个键；没有的键不报错 */
  delete(keys: string | readonly string[]): Promise<void>;
  /** 全部的键；给了 prefix 只要以它开头的 */
  keys(prefix?: string): Promise<string[]>;
  /** 清空这个驱动管的全部数据（带前缀的驱动只清自己前缀下的） */
  clear(): Promise<void>;
  /**
   * 别处（别的标签页、窗口）改了数据时回调：keys 是改了的键，undefined 表示清空了；返回取消收听的函数。
   * 自己这里的写入不回调。只有一个实例的存储（内存、小程序）没有这个方法
   */
  watch?(listener: (keys: readonly string[] | undefined) => void): () => void;
}

/** 只能存文字的驱动把值写成文字的方式；默认 JSON（Date 会变成文字，要保留时换成带类型的编码） */
export interface TextCodec {
  encode(value: unknown): string;
  decode(text: string): unknown;
}

/** 默认的文字编码 */
export const jsonCodec: TextCodec = {
  encode: (value) => JSON.stringify(value),
  decode: JSON.parse,
};

/** delete 的参数统一成数组 */
export function keyList(keys: string | readonly string[]): readonly string[] {
  return typeof keys === 'string' ? [keys] : keys;
}
