/**
 * 一个请求的状态（参考 TanStack Query、alova 的 useWatcher）：只采用最后一次的结果，发新请求时取消上一次，
 * 参数变化防抖，重新请求时保留旧数据（表格不闪成空的）。
 *
 *   const http = useHttp();
 *   const users = useRequest(
 *     ({ keyword, page }, signal) => http.request<Page<User>>({ url: '/users', query: { keyword, page }, signal }),
 *     { params: () => ({ keyword, page }), debounce: 300 },
 *   );
 *   users.data?.rows; users.loading; users.error; users.refresh();
 *
 * 只在浏览器里自动请求：服务端渲染时 data 留空，等页面在浏览器里接管后再请求。
 */
import { onScopeDispose, shallowRef, watch } from 'vue';
import { sameValue } from '../data/equality';
import { isAbortError } from './http';

/** useRequest 的选项 */
export interface RequestOptions<P, T> {
  /** 请求参数：读到的响应式值变了、且内容确实不同时重新请求；不写时只在开始与 refresh 时请求 */
  params?: () => P;
  /** 参数变了以后等多久再请求（毫秒），默认 0；refresh 不等 */
  debounce?: number;
  /** 一开始就请求，默认 true；false 时等调用 refresh（或参数变化） */
  immediate?: boolean;
  /** 重新请求时保留上一次的数据，默认 true；false 时请求一开始就清空 */
  keepPrevious?: boolean;
  /**
   * 自动请求的开关（弹层打开时才请求这类）：为 false 时 immediate 与参数变化都不请求，refresh 照常。
   * 变回 true 时不自动补一次，需要时调用 refresh
   */
  enabled?: () => boolean;
  /** 成功后调用 */
  onSuccess?: (data: T, params: P) => void;
  /** 失败后调用（取消的不算） */
  onError?: (error: unknown, params: P) => void;
}

/** useRequest 的返回值 */
export interface RequestState<T> {
  /** 最后一次成功的结果 */
  readonly data: T | undefined;
  /** 最后一次失败的原因；成功后清空 */
  readonly error: unknown;
  /** 正在请求（防抖等待时还不算） */
  readonly loading: boolean;
  /** 按当前参数立即请求，取消进行中的；返回结果，失败或被后来的请求顶掉时为 undefined */
  refresh(): Promise<T | undefined>;
  /** 取消进行中的请求与等着的防抖 */
  cancel(): void;
  /** 直接改数据（乐观更新、本地删掉一行），不发请求 */
  mutate(data: T | undefined): void;
}

/** 请求的状态（在 setup 里调用；见文件开头） */
export function useRequest<T, P = undefined>(
  fetcher: (params: P, signal: AbortSignal) => Promise<T>,
  options: RequestOptions<P, T> = {},
): RequestState<T> {
  const { params, debounce = 0, immediate = true, keepPrevious = true } = options;
  const data = shallowRef<T>();
  const error = shallowRef<unknown>();
  const loading = shallowRef(false);
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // 每次请求一个编号：结果回来时不是最后一次的就丢掉（fetcher 没理会 signal 时也不会覆盖）
  let latest = 0;
  const readParams = () => params?.() as P;
  // 上一次请求（或开始时）的参数：参数变了但与它相同时不再请求（refresh 之后侦听器又看到同一组参数）
  let last = params ? readParams() : undefined;

  function cancel() {
    clearTimeout(timer);
    latest++;
    controller?.abort();
    controller = undefined;
    loading.value = false;
  }

  async function run(current: P): Promise<T | undefined> {
    cancel();
    last = current;
    const id = latest;
    const own = (controller = new AbortController());
    loading.value = true;
    if (!keepPrevious) data.value = undefined;
    try {
      const result = await fetcher(current, own.signal);
      if (id !== latest) return undefined;
      data.value = result;
      error.value = undefined;
      options.onSuccess?.(result, current);
      return result;
    } catch (reason) {
      if (id !== latest || isAbortError(reason)) return undefined;
      error.value = reason;
      options.onError?.(reason, current);
      return undefined;
    } finally {
      if (id === latest) {
        loading.value = false;
        controller = undefined;
      }
    }
  }

  if (params) {
    watch(readParams, (next) => {
      if (options.enabled?.() === false) return;
      if (sameValue(next, last)) return;
      last = next;
      clearTimeout(timer);
      if (debounce > 0) timer = setTimeout(() => void run(next), debounce);
      else void run(next);
    });
  }
  if (immediate && options.enabled?.() !== false && typeof window !== 'undefined') {
    void run(readParams());
  }
  onScopeDispose(cancel);

  return {
    get data() {
      return data.value;
    },
    get error() {
      return error.value;
    },
    get loading() {
      return loading.value;
    },
    refresh: () => run(readParams()),
    cancel,
    mutate: (value) => (data.value = value),
  };
}
