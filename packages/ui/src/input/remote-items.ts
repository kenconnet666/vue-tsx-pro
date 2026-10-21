/**
 * 远程选项（Select、Combobox、TreeSelect 的 load）：弹层打开时按当前搜索词请求，之后搜索词变了停下 300 ms 再请求；
 * 只采用最后一次的结果（useRequest），结果代替 items。弹层关着不请求。
 * 第一次结果回来之前用 items：编辑页把已选的那一项放进 items，触发框一开始就有文字。
 */
import { watch } from 'vue';
import { useRequest } from '../utils/request/use-request';

/** 远程选项的加载函数：搜索词 → 选项；signal 在被后来的请求顶掉、组件卸载时中止 */
export type OptionsLoader<T> = (query: string, signal: AbortSignal) => Promise<readonly T[]>;

/** 搜索词停下多久再请求（毫秒） */
const DEBOUNCE = 300;

/** 远程选项的状态；没给 load 时原样用 items */
export function useRemoteItems<T>(read: {
  /** 加载函数；没有时不请求 */
  load: () => OptionsLoader<T> | undefined;
  /** 当前的搜索词 */
  query: () => string;
  /** 弹层是否打开 */
  open: () => boolean;
  /** 本地的选项（有 load 时是第一次结果之前的选项） */
  items: () => readonly T[];
}) {
  const request = useRequest((query: string, signal) => read.load()!(query, signal), {
    params: () => read.query(),
    debounce: DEBOUNCE,
    immediate: false,
    enabled: () => read.load() != null && read.open(),
  });
  // 打开时立即按当前搜索词请求（不等防抖），一开始就是打开的也算；关闭时取消还在进行的
  watch(
    read.open,
    (open) => {
      if (!read.load()) return;
      if (open) void request.refresh();
      else request.cancel();
    },
    { immediate: true },
  );
  return {
    /** 当前的选项 */
    items: (): readonly T[] => (read.load() ? (request.data ?? read.items()) : read.items()),
    /** 正在请求 */
    loading: () => request.loading,
    /** 最后一次请求失败的原因 */
    error: () => request.error,
  };
}
