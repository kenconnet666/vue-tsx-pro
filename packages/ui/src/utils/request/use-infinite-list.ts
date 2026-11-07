/**
 * 滚动加载的列表（参考 TanStack Query 的 useInfiniteQuery、SWR 的 useSWRInfinite）：一页一页取、接在已有的后面，
 * 按 key 去掉重复的项（翻页期间有新数据插进来时，下一页开头会和上一页结尾重复），记住还有没有下一页。
 *
 *   const orders = useInfiniteList(
 *     async (page = 1, { keyword }, signal) => {
 *       const result = await http.request<Page<Order>>({ url: '/orders', query: { keyword, page }, signal });
 *       return { items: result.rows, next: page * 20 < result.total ? page + 1 : undefined };
 *     },
 *     { params: () => ({ keyword }), debounce: 300, key: (order) => order.id },
 *   );
 *   <VirtualList items={orders.items} loading={orders.loading} onRangeChange={orders.onRangeChange} />
 *   <InfiniteListStatus list={orders} />          列表下方：失败时重试、取完了“没有更多了”
 *
 * 游标（cursor）是取下一页用的任何东西：页码、偏移、服务端给的 cursor；第一页时是 undefined。
 * params 变了（防抖后）、refresh 时从第一页重来：先清空、取消进行中的，只采用最后一次的结果。
 * onRangeChange 接到 VirtualList、DataTable、ListboxView 上：可见范围离末尾不到 threshold 项时取下一页；
 * 正在取、没有下一页时不取。失败时停在那里，再滚动或调用 loadMore（InfiniteListStatus 的“重试”）时接着取。
 * 只在浏览器里自动请求；一开始就请求时 loading 从 true 开始，服务端也按“加载中”渲染。
 */
import { onScopeDispose, shallowRef, watch } from 'vue';
import { sameValue } from '../data/equality';
import type { VisibleRange } from '../virtual/virtualizer';
import { isAbortError } from './http';

/** 一页的结果：items 接在已有的后面；next 是取下一页的游标，没有下一页时不给 */
export interface InfinitePage<T, C = unknown> {
  /** 这一页的项 */
  items: readonly T[];
  /** 下一页的游标（页码、偏移、服务端的 cursor）；undefined 表示没有更多了 */
  next?: C;
}

/** useInfiniteList 的选项 */
export interface InfiniteListOptions<P, T> {
  /** 请求参数（搜索词、筛选条件）：读到的响应式值变了、且内容确实不同时从第一页重来 */
  params?: () => P;
  /** 参数变了以后等多久再请求（毫秒），默认 0 */
  debounce?: number;
  /** 每项的 key：同一个 key 只留第一次出现的那项 */
  key?: (item: T) => PropertyKey;
  /** 可见范围离末尾不到几项时取下一页，默认 5 */
  threshold?: number;
  /** 一开始就取第一页，默认 true；false 时等调用 refresh */
  immediate?: boolean;
  /** 自动请求的开关（弹层打开时才请求这类）：为 false 时参数变化、滚动都不请求，refresh、loadMore 照常 */
  enabled?: () => boolean;
  /** 一页失败后调用（取消的不算） */
  onError?: (error: unknown, params: P) => void;
}

/** useInfiniteList 的返回值 */
export interface InfiniteListState<T> {
  /** 已经取到的全部项（去重后） */
  readonly items: readonly T[];
  /** 正在取（第一页或下一页） */
  readonly loading: boolean;
  /** 最后一页失败的原因；再取时清空 */
  readonly error: unknown;
  /** 第一页回来过；之前 items 是空的不代表没有数据 */
  readonly loaded: boolean;
  /** 还有下一页 */
  readonly hasMore: boolean;
  /** 取下一页（还没取到第一页时取第一页）；正在取、没有下一页时什么也不做。失败后用它重试 */
  loadMore: () => Promise<void>;
  /** 从第一页重来：清空、取消进行中的 */
  refresh: () => Promise<void>;
  /** 取消进行中的请求与等着的防抖 */
  cancel: () => void;
  /** 交给 VirtualList、DataTable 的 onRangeChange：接近末尾时取下一页 */
  onRangeChange: (range: VisibleRange) => void;
}

/** 滚动加载的列表状态（在 setup 里调用；见文件开头） */
export function useInfiniteList<T, C = unknown, P = undefined>(
  fetchPage: (cursor: C | undefined, params: P, signal: AbortSignal) => Promise<InfinitePage<T, C>>,
  options: InfiniteListOptions<P, T> = {},
): InfiniteListState<T> {
  const { params, key, debounce = 0, threshold = 5, immediate = true } = options;
  const enabled = () => options.enabled?.() !== false;
  const items = shallowRef<readonly T[]>([]);
  const error = shallowRef<unknown>();
  const loaded = shallowRef(false);
  const hasMore = shallowRef(true);
  const starts = immediate && enabled();
  const loading = shallowRef(starts);
  const readParams = () => params?.() as P;
  // 当前这一串页的参数：取下一页时沿用，变了才从第一页重来
  let current = readParams();
  let cursor: C | undefined;
  let seen = new Set<PropertyKey>();
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // 每次请求一个编号：结果回来时不是最后一次的就丢掉（fetchPage 没理会 signal 时也不会接错）
  let latest = 0;

  function cancel() {
    clearTimeout(timer);
    latest++;
    controller?.abort();
    controller = undefined;
    loading.value = false;
  }

  /** 第一页之后去掉见过的项 */
  const unseen = (page: readonly T[]) =>
    key
      ? page.filter((item) => {
          const id = key(item);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
      : page;

  async function run(first: boolean): Promise<void> {
    cancel();
    const id = latest;
    const own = (controller = new AbortController());
    if (first) {
      current = readParams();
      items.value = [];
      seen = new Set();
      cursor = undefined;
      loaded.value = false;
      hasMore.value = true;
    }
    loading.value = true;
    error.value = undefined;
    try {
      const page = await fetchPage(cursor, current, own.signal);
      if (id !== latest) return;
      items.value = [...items.value, ...unseen(page.items)];
      cursor = page.next;
      hasMore.value = page.next !== undefined;
      loaded.value = true;
    } catch (reason) {
      if (id !== latest || isAbortError(reason)) return;
      error.value = reason;
      options.onError?.(reason, current);
    } finally {
      if (id === latest) {
        loading.value = false;
        controller = undefined;
      }
    }
  }

  async function loadMore() {
    if (loading.value || (loaded.value && !hasMore.value)) return;
    await run(!loaded.value);
  }

  if (params) {
    watch(readParams, (next) => {
      clearTimeout(timer);
      if (!enabled() || sameValue(next, current)) return;
      if (debounce > 0) timer = setTimeout(() => void run(true), debounce);
      else void run(true);
    });
  }
  if (starts && typeof window !== 'undefined') void run(true);
  onScopeDispose(cancel);

  return {
    get items() {
      return items.value;
    },
    get loading() {
      return loading.value;
    },
    get error() {
      return error.value;
    },
    get loaded() {
      return loaded.value;
    },
    get hasMore() {
      return hasMore.value;
    },
    loadMore,
    refresh: () => run(true),
    cancel,
    onRangeChange: (range) => {
      if (enabled() && range.endIndex >= items.value.length - threshold) void loadMore();
    },
  };
}
