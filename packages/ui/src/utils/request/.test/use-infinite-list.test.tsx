// useInfiniteList：一页页接上、按 key 去重、取完停下、接近末尾才取、失败后重试、参数变了从第一页重来；InfiniteListStatus 的提示与重试
import { describe, expect, it } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { InfiniteListStatus } from '../../../display/InfiniteListStatus';
import { mount } from '../../.test/mount';
import { useInfiniteList, type InfiniteListOptions, type InfinitePage } from '../use-infinite-list';

/** 每次请求一个可以手动完成的 Promise，记下游标、参数与 signal */
function deferredPages<T, P>() {
  const calls: {
    cursor: number | undefined;
    params: P;
    signal: AbortSignal;
    resolve: (page: InfinitePage<T, number>) => void;
    reject: (reason: unknown) => void;
  }[] = [];
  const fetchPage = (cursor: number | undefined, params: P, signal: AbortSignal) =>
    new Promise<InfinitePage<T, number>>((resolve, reject) => {
      calls.push({ cursor, params, signal, resolve, reject });
      signal.addEventListener('abort', () => reject(signal.reason));
    });
  return { fetchPage, calls };
}

function run<T, P>(
  fetchPage: (
    cursor: number | undefined,
    params: P,
    signal: AbortSignal,
  ) => Promise<InfinitePage<T, number>>,
  options?: InfiniteListOptions<P, T>,
) {
  const scope = effectScope();
  const list = scope.run(() => useInfiniteList(fetchPage, options))!;
  return { list, stop: () => scope.stop() };
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve));

describe('useInfiniteList', () => {
  it('一开始取第一页；下一页带着游标接在后面，重复的项按 key 去掉；没有 next 时停下', async () => {
    const { fetchPage, calls } = deferredPages<{ id: number }, undefined>();
    const { list, stop } = run(fetchPage, { key: (item) => item.id });
    expect([calls.length, calls[0]!.cursor, list.loading, list.loaded]).toEqual([
      1,
      undefined,
      true,
      false,
    ]);
    calls[0]!.resolve({ items: [{ id: 1 }, { id: 2 }], next: 2 });
    await flush();
    expect([list.items.length, list.loaded, list.hasMore]).toEqual([2, true, true]);

    void list.loadMore();
    void list.loadMore();
    expect(calls.length).toBe(2);
    expect(calls[1]!.cursor).toBe(2);
    calls[1]!.resolve({ items: [{ id: 2 }, { id: 3 }] });
    await flush();
    expect(list.items.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(list.hasMore).toBe(false);
    await list.loadMore();
    expect(calls.length).toBe(2);
    stop();
  });

  it('onRangeChange：离末尾不到 threshold 项才取下一页', async () => {
    const { fetchPage, calls } = deferredPages<number, undefined>();
    const { list, stop } = run(fetchPage, { threshold: 3 });
    calls[0]!.resolve({ items: Array.from({ length: 10 }, (_, index) => index), next: 2 });
    await flush();
    list.onRangeChange({ startIndex: 0, endIndex: 5 });
    expect(calls.length).toBe(1);
    list.onRangeChange({ startIndex: 2, endIndex: 7 });
    expect(calls.length).toBe(2);
    stop();
  });

  it('失败：记下原因、停下；loadMore 重试同一页，开始时清掉错误', async () => {
    const { fetchPage, calls } = deferredPages<number, undefined>();
    const { list, stop } = run(fetchPage);
    calls[0]!.resolve({ items: [1], next: 2 });
    await flush();
    void list.loadMore();
    calls[1]!.reject(new Error('boom'));
    await flush();
    expect([list.loading, (list.error as Error).message]).toEqual([false, 'boom']);
    void list.loadMore();
    expect([calls[2]!.cursor, list.error]).toEqual([2, undefined]);
    stop();
  });

  it('参数变了从第一页重来：清空、取消进行中的；enabled 为 false 时不自动请求', async () => {
    const keyword = ref('a');
    const open = ref(true);
    const { fetchPage, calls } = deferredPages<string, string>();
    const { list, stop } = run(fetchPage, {
      params: () => keyword.value,
      enabled: () => open.value,
    });
    calls[0]!.resolve({ items: ['a1'], next: 2 });
    await flush();
    void list.loadMore();
    keyword.value = 'b';
    await nextTick();
    expect(calls[1]!.signal.aborted).toBe(true);
    expect([calls[2]!.cursor, calls[2]!.params, list.items]).toEqual([undefined, 'b', []]);

    open.value = false;
    keyword.value = 'c';
    await nextTick();
    expect(calls.length).toBe(3);
    stop();
  });
});

describe('InfiniteListStatus', () => {
  it('取完了显示“没有更多了”；失败时显示原因与重试，点重试接着取', async () => {
    const { fetchPage, calls } = deferredPages<number, undefined>();
    let list!: ReturnType<typeof useInfiniteList<number, number>>;
    const root = mount(() => {
      list ??= useInfiniteList(fetchPage);
      return <InfiniteListStatus list={list} />;
    });
    const status = root.querySelector('[role="status"]')!;
    calls[0]!.resolve({ items: [1], next: 2 });
    await flush();
    expect(status.textContent).toBe('');
    void list.loadMore();
    calls[1]!.reject(new Error('boom'));
    await flush();
    expect(status.textContent).toContain('加载失败');
    status.querySelector('button')!.click();
    expect(calls.length).toBe(3);
    calls[2]!.resolve({ items: [2] });
    await flush();
    expect(status.textContent).toBe('没有更多了');
  });
});
