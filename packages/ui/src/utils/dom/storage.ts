/**
 * 记在浏览器里的状态（参考 VueUse 的 useStorage）：列宽、密度、每页条数、侧栏、查询条件，刷新、再打开时还在。
 *
 *   let hidden = _fromRef(usePersistentState('orders.hiddenColumns', [] as string[]));
 *   <DataTable hiddenColumns={hidden} … />
 *
 * - 存成 JSON；读出来的类型与 initial 不同（改过版本、被手改坏了）时用 initial；对象按字段合并在 initial 上，
 *   新加的字段有默认值
 * - 隐私模式、禁用存储、配额满时读写会抛错：只在这次打开有效
 * - 别的标签页改了同一个键，这里跟着变（storage 事件）；服务端渲染时就是 initial，水合时先是 initial（和服务端渲染的
 *   一致），挂载后换成存的值
 */
import { onMounted, ref, watch, type Ref } from 'vue';
import { useEventListener } from './event-listener';
import { isHydrating } from './mounted';

/** usePersistentState 的选项 */
export interface PersistentStateOptions<T> {
  /** 存在哪：默认 localStorage；sessionStorage 只在这个标签页里记 */
  storage?: () => Storage;
  /** 读出来的值能不能用；默认要求与 initial 同类型（数组对数组、对象对对象） */
  validate?: (value: unknown) => value is T;
}

/** 记在浏览器里的状态（见文件开头）；返回的 Ref 改了就写回去 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  options: PersistentStateOptions<T> = {},
): Ref<T> {
  const storage = () => {
    try {
      return options.storage ? options.storage() : globalThis.localStorage;
    } catch {
      return undefined;
    }
  };
  const valid = options.validate ?? ((value: unknown): value is T => sameShape(value, initial));

  // initial 的副本：之后改状态不会改到调用方传进来的对象（存的也是 JSON，副本照 JSON 复制）
  const fallback = (): T =>
    typeof initial === 'object' && initial !== null
      ? (JSON.parse(JSON.stringify(initial)) as T)
      : initial;

  function read(): T {
    try {
      const text = storage()?.getItem(key);
      if (text == null) return fallback();
      const value: unknown = JSON.parse(text);
      if (!valid(value)) return fallback();
      return isPlainObject(initial) && isPlainObject(value)
        ? ({ ...initial, ...value } as T)
        : value;
    } catch {
      return fallback();
    }
  }

  // 水合时先用 initial：直接用存的值渲染，和服务端的节点对不上，存的状态反而显示不出来（见 isHydrating）
  const stored = read();
  const hydrating = isHydrating();
  const state = ref(hydrating ? fallback() : stored) as Ref<T>;
  if (hydrating) {
    const rendered = JSON.stringify(state.value);
    onMounted(() => {
      // 挂载前组件自己改过的以它为准；存的值和 initial 一样时不动（不白白触发一次渲染）
      if (JSON.stringify(state.value) === rendered && JSON.stringify(stored) !== rendered)
        state.value = stored;
    });
  }
  watch(
    state,
    (value) => {
      try {
        const text = JSON.stringify(value);
        // 内容没变（别的标签页刚写进来的）不再写回去
        if (storage()?.getItem(key) !== text) storage()?.setItem(key, text);
      } catch {
        // 存不了：只在这次打开有效
      }
    },
    { deep: true },
  );

  if (typeof window !== 'undefined') {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === storage()) state.value = read();
    };
    useEventListener(window, 'storage', onStorage);
  }
  return state;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** 与 initial 同类型：数组对数组、普通对象对普通对象，其余比 typeof；initial 是 null 时什么都行 */
function sameShape(value: unknown, initial: unknown): boolean {
  if (initial === null || initial === undefined) return true;
  if (Array.isArray(initial)) return Array.isArray(value);
  if (isPlainObject(initial)) return isPlainObject(value);
  return typeof value === typeof initial;
}
