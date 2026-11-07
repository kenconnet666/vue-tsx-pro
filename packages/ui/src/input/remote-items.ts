/**
 * 远程选项（Select、Combobox、Mentions、TreeSelect 的 load）：弹层打开时按当前搜索词请求，之后搜索词变了停下 300 ms 再请求；
 * 只采用最后一次的结果，结果代替 items。弹层关着不请求。
 * 第一次结果回来之前用 items：编辑页把已选的那一项放进 items，触发框一开始就有文字。
 * 分页：load 返回 { items, next } 时是第一页，列表（ListboxView 的 onRangeChange）滚到末尾时带着 next 取下一页，
 * 接在后面（useInfiniteList）；返回数组时就是全部选项。
 */
import { watch } from 'vue';
import { useLang } from '../config/context';
import { errorCodeText } from '../utils/request/error-message';
import { useInfiniteList, type InfinitePage } from '../utils/request/use-infinite-list';

/**
 * 远程选项的加载函数：搜索词 → 选项；signal 在被后来的请求顶掉、组件卸载时中止。
 * 分页时 page 是第几页（从 1 开始），返回 { items, next: 下一页的页码 }，没有更多时不给 next
 */
export type OptionsLoader<T> = (
  query: string,
  signal: AbortSignal,
  page: number,
) => Promise<readonly T[] | InfinitePage<T, number>>;

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
  /** 选项的值：分页时按它去掉重复的项（翻页期间数据变了，下一页开头会和上一页结尾重复） */
  key: (item: T) => string;
}) {
  const lang = useLang();
  const pages = useInfiniteList(
    async (page: number | undefined, query: string, signal) => {
      const result = await read.load()!(query, signal, page ?? 1);
      return Array.isArray(result) ? { items: result } : (result as InfinitePage<T, number>);
    },
    {
      params: () => read.query(),
      key: read.key,
      debounce: DEBOUNCE,
      immediate: false,
      enabled: () => read.load() != null && read.open(),
    },
  );
  // 打开时立即按当前搜索词从第一页请求（不等防抖），一开始就是打开的也算；关闭时取消还在进行的
  watch(
    read.open,
    (open) => {
      if (!read.load()) return;
      if (open) void pages.refresh();
      else pages.cancel();
    },
    { immediate: true },
  );
  return {
    /** 当前的选项：请求过就是请求到的（加载中是空的，列表显示骨架），之前是本地的 items */
    items: (): readonly T[] =>
      read.load() && (pages.loaded || pages.loading) ? pages.items : read.items(),
    /** 正在请求：取第一页时 true，已有选项、取下一页时 'more'（ListboxView 的骨架接在末尾） */
    loading: (): boolean | 'more' => pages.loading && (pages.items.length > 0 ? 'more' : true),
    /** 交给 ListboxView：滚到末尾时取下一页（load 返回数组时没有下一页，不会请求） */
    onRangeChange: pages.onRangeChange,
    /**
     * 最后一次请求失败时列表里的提示：错误码有文案时用它（网络断了、没有权限），否则是笼统的“加载失败，请重试”；没失败时为 undefined
     */
    failure: (): string | undefined =>
      pages.error === undefined
        ? undefined
        : (errorCodeText(pages.error, lang) ?? lang.listLoadFailed),
  };
}
