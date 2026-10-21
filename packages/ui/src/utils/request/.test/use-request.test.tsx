// useRequest：只采用最后一次、取消上一次、参数防抖与去重、保留旧数据、出错与取消、乐观更新；useHttp 取配置里的客户端
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { _component } from '@vue-tsx-pro/tsx';
import { Provider } from '../../../config/Provider';
import { mount } from '../../.test/mount';
import { useHttp, type HttpClient } from '../http';
import { useRequest, type RequestOptions } from '../use-request';

/** 每次请求一个可以手动完成的 Promise，记下收到的参数与 signal */
function deferredFetcher<T, P>() {
  const calls: {
    params: P;
    signal: AbortSignal;
    resolve: (value: T) => void;
    reject: (reason: unknown) => void;
  }[] = [];
  const fetcher = (params: P, signal: AbortSignal) =>
    new Promise<T>((resolve, reject) => {
      calls.push({ params, signal, resolve, reject });
      signal.addEventListener('abort', () => reject(signal.reason));
    });
  return { fetcher, calls };
}

function run<T, P>(
  fetcher: (params: P, signal: AbortSignal) => Promise<T>,
  options?: RequestOptions<P, T>,
) {
  const scope = effectScope();
  const state = scope.run(() => useRequest(fetcher, options))!;
  return { state, stop: () => scope.stop() };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

beforeEach(() => vi.useRealTimers());
afterEach(() => vi.useRealTimers());

describe('useRequest', () => {
  it('一开始就请求；完成后 data 有值、loading 结束', async () => {
    const { fetcher, calls } = deferredFetcher<string[], undefined>();
    const { state, stop } = run(fetcher);
    expect([calls.length, state.loading]).toEqual([1, true]);
    calls[0]!.resolve(['a']);
    await flush();
    expect([state.data, state.loading, state.error]).toEqual([['a'], false, undefined]);
    stop();
  });

  it('参数变了才重新请求：内容相同不请求；新请求取消上一次，晚到的旧结果不会覆盖', async () => {
    const keyword = ref('a');
    const { fetcher, calls } = deferredFetcher<string, { keyword: string }>();
    const { state, stop } = run(fetcher, { params: () => ({ keyword: keyword.value }) });
    keyword.value = 'a';
    await nextTick();
    expect(calls).toHaveLength(1);

    keyword.value = 'b';
    await nextTick();
    expect(calls.map((call) => call.params.keyword)).toEqual(['a', 'b']);
    expect(calls[0]!.signal.aborted).toBe(true);
    calls[1]!.resolve('结果 b');
    calls[0]!.resolve('结果 a（晚到）');
    await flush();
    expect(state.data).toBe('结果 b');
    stop();
  });

  it('防抖：连续变化只请求最后一次；refresh 不等', async () => {
    vi.useFakeTimers();
    const keyword = ref('');
    const { fetcher, calls } = deferredFetcher<string, string>();
    const { state, stop } = run(fetcher, {
      params: () => keyword.value,
      debounce: 300,
      immediate: false,
    });
    for (const text of ['上', '上海', '上海市']) {
      keyword.value = text;
      await nextTick();
      vi.advanceTimersByTime(100);
    }
    expect(calls).toHaveLength(0);
    vi.advanceTimersByTime(300);
    expect(calls.map((call) => call.params)).toEqual(['上海市']);
    void state.refresh();
    expect(calls).toHaveLength(2);
    stop();
  });

  it('参数变了马上 refresh（翻页不等防抖）：侦听器看到同一组参数，不再补一次', async () => {
    vi.useFakeTimers();
    const page = ref(1);
    const { fetcher, calls } = deferredFetcher<number, number>();
    const { state, stop } = run(fetcher, {
      params: () => page.value,
      debounce: 300,
      immediate: false,
    });
    page.value = 2;
    void state.refresh();
    await nextTick();
    vi.advanceTimersByTime(300);
    expect(calls.map((call) => call.params)).toEqual([2]);
    stop();
  });

  it('重新请求时保留旧数据；keepPrevious: false 时先清空', async () => {
    const page = ref(1);
    const kept = deferredFetcher<number, number>();
    const keep = run(kept.fetcher, { params: () => page.value });
    const cleared = deferredFetcher<number, number>();
    const clear = run(cleared.fetcher, { params: () => page.value, keepPrevious: false });
    kept.calls[0]!.resolve(1);
    cleared.calls[0]!.resolve(1);
    await flush();
    page.value = 2;
    await nextTick();
    expect([keep.state.data, keep.state.loading]).toEqual([1, true]);
    expect([clear.state.data, clear.state.loading]).toEqual([undefined, true]);
    keep.stop();
    clear.stop();
  });

  it('失败记下原因（成功后清空）；取消不算失败；mutate 直接改数据', async () => {
    const { fetcher, calls } = deferredFetcher<string, undefined>();
    const onError = vi.fn();
    const { state, stop } = run(fetcher, { onError });
    const reason = new Error('服务不可用');
    calls[0]!.reject(reason);
    await flush();
    expect([state.error, onError.mock.calls.length]).toEqual([reason, 1]);

    void state.refresh();
    state.cancel();
    await flush();
    expect([state.loading, onError.mock.calls.length]).toEqual([false, 1]);

    void state.refresh();
    calls[2]!.resolve('好了');
    await flush();
    expect([state.data, state.error]).toEqual(['好了', undefined]);
    state.mutate('本地改的');
    expect(state.data).toBe('本地改的');
    stop();
  });

  it('作用域销毁时取消进行中的请求', () => {
    const { fetcher, calls } = deferredFetcher<string, undefined>();
    const { stop } = run(fetcher);
    stop();
    expect(calls[0]!.signal.aborted).toBe(true);
  });
});

describe('useHttp', () => {
  it('取 Provider 给的客户端；没有时是默认的 fetch 客户端', () => {
    const custom: HttpClient = { request: () => Promise.resolve('custom' as never) };
    const seen: HttpClient[] = [];
    const Probe = _component(() => {
      seen.push(useHttp());
      return () => null;
    });
    mount(() => (
      <>
        <Provider http={custom}>
          <Probe />
        </Provider>
        <Probe />
      </>
    ));
    expect(seen[0]).toBe(custom);
    expect(seen[1]).not.toBe(custom);
    expect(typeof seen[1]!.request).toBe('function');
  });
});
