// useIntersectionObserver：目标与选项变了重建观察器、作用域结束时断开；不支持的环境什么也不做
import { effectScope, nextTick, shallowRef } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { useIntersectionObserver } from '../intersection';

afterEach(() => vi.unstubAllGlobals());

interface FakeObserver {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  targets: Element[];
  disconnected: boolean;
}

function stubIntersectionObserver() {
  const created: FakeObserver[] = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      record: FakeObserver;
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.record = { callback, options, targets: [], disconnected: false };
        created.push(this.record);
      }
      observe(target: Element) {
        this.record.targets.push(target);
      }
      disconnect() {
        this.record.disconnected = true;
      }
    },
  );
  return created;
}

it('观察目标，回调收到相交记录；目标换了重建，作用域结束时断开', async () => {
  const created = stubIntersectionObserver();
  const first = document.createElement('div');
  const second = document.createElement('div');
  const target = shallowRef<Element | null>(first);
  const seen: boolean[] = [];
  const scope = effectScope();
  scope.run(() =>
    useIntersectionObserver(
      () => target.value,
      (entries) => seen.push(entries[0]!.isIntersecting),
      () => ({ threshold: [0, 1] }),
    ),
  );
  expect(created).toHaveLength(1);
  expect(created[0]!.targets).toEqual([first]);
  expect(created[0]!.options?.threshold).toEqual([0, 1]);

  created[0]!.callback(
    [{ isIntersecting: true } as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
  expect(seen).toEqual([true]);

  target.value = second;
  await nextTick();
  expect(created[0]!.disconnected).toBe(true);
  expect(created[1]!.targets).toEqual([second]);

  scope.stop();
  expect(created[1]!.disconnected).toBe(true);
});

it('目标为空时不观察；没有 IntersectionObserver 的环境不报错', () => {
  const created = stubIntersectionObserver();
  const scope = effectScope();
  scope.run(() =>
    useIntersectionObserver(
      () => null,
      () => {},
    ),
  );
  expect(created).toHaveLength(0);
  scope.stop();

  vi.stubGlobal('IntersectionObserver', undefined);
  const unsupported = effectScope();
  expect(() =>
    unsupported.run(() =>
      useIntersectionObserver(
        () => document.createElement('div'),
        () => {},
      ),
    ),
  ).not.toThrow();
  unsupported.stop();
});
