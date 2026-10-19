// useDelayedLoading：很快完成时不显示；显示后至少保持 minDuration；挂载时已在加载就立即显示
import { effectScope, nextTick, shallowRef } from 'vue';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useDelayedLoading } from '../delayed-loading';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(initial: boolean) {
  const loading = shallowRef(initial);
  const scope = effectScope();
  const shown = scope.run(() => useDelayedLoading(() => loading.value))!;
  return { loading, shown, scope };
}

it('在 delay 之内完成：始终不显示', async () => {
  const { loading, shown } = setup(false);
  loading.value = true;
  await nextTick();
  vi.advanceTimersByTime(150);
  loading.value = false;
  await nextTick();
  vi.advanceTimersByTime(1000);
  expect(shown.value).toBe(false);
});

it('过了 delay 才显示，完成后至少显示 minDuration', async () => {
  const { loading, shown } = setup(false);
  loading.value = true;
  await nextTick();
  vi.advanceTimersByTime(200);
  expect(shown.value).toBe(true);
  vi.advanceTimersByTime(100);
  loading.value = false;
  await nextTick();
  vi.advanceTimersByTime(399);
  expect(shown.value).toBe(true);
  vi.advanceTimersByTime(1);
  expect(shown.value).toBe(false);
});

it('挂载时已在加载就立即显示；等着隐藏时又开始加载就继续显示', async () => {
  const { loading, shown, scope } = setup(true);
  expect(shown.value).toBe(true);
  loading.value = false;
  await nextTick();
  loading.value = true;
  await nextTick();
  vi.advanceTimersByTime(1000);
  expect(shown.value).toBe(true);
  scope.stop();
});
