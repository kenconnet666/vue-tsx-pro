import { keyList, type StorageDriver } from '../driver.ts';

/**
 * 内存里的驱动：页面关掉就没了。用在测试、服务端渲染，或别的存储用不了时兜底。
 * 存取都复制一份（结构化克隆），和持久化的驱动一样：改读出来的对象不会改到存着的
 */
export function memoryDriver(): StorageDriver {
  const items = new Map<string, unknown>();
  return {
    name: 'memory',
    get<T>(key: string) {
      return Promise.resolve(items.has(key) ? (structuredClone(items.get(key)) as T) : undefined);
    },
    set(key, value) {
      if (value === undefined) items.delete(key);
      else items.set(key, structuredClone(value));
      return Promise.resolve();
    },
    delete(keys) {
      for (const key of keyList(keys)) items.delete(key);
      return Promise.resolve();
    },
    keys(prefix = '') {
      return Promise.resolve([...items.keys()].filter((key) => key.startsWith(prefix)));
    },
    clear() {
      items.clear();
      return Promise.resolve();
    },
  };
}
