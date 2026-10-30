/**
 * 存在本地的响应式值：读的是存储里的值（没有时用默认值），改了自动写回。三端都是同步存储。
 *
 *   const history = useStorage<string[]>('search-history', []);
 *   history.value = [keyword, ...history.value].slice(0, 10);
 */
import { shallowRef, watch, type Ref } from 'vue';
import { useHost } from '../utils/host';

export function useStorage<T>(key: string, initial: T): Ref<T> {
  const { storage } = useHost();
  const value = shallowRef(storage.get<T>(key) ?? initial) as Ref<T>;
  // shallowRef：整个换掉才写回（数组、对象改里面的项不会触发，照不可变的写法赋新值）
  watch(value, (next) => storage.set(key, next));
  return value;
}
