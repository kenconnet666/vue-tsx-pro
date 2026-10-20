// useMediaQuery 与基于它的 usePrefersDark / useReducedMotion：随媒体查询变化，作用域结束时取消监听
import { effectScope } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { useMediaQuery, usePrefersDark, useReducedMotion } from '../media-query';

afterEach(() => vi.unstubAllGlobals());

function stubMatchMedia(matching: (query: string) => boolean) {
  const listeners = new Map<string, (event: { matches: boolean }) => void>();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: matching(query),
    addEventListener: (_: string, callback: (event: { matches: boolean }) => void) =>
      listeners.set(query, callback),
    removeEventListener: () => listeners.delete(query),
  }));
  return listeners;
}

it('跟随媒体查询的变化，作用域结束时取消监听', () => {
  const listeners = stubMatchMedia((query) => query.includes('64rem'));
  const scope = effectScope();
  const wide = scope.run(() => useMediaQuery('(min-width: 64rem)'))!;
  expect(wide.value).toBe(true);
  listeners.get('(min-width: 64rem)')!({ matches: false });
  expect(wide.value).toBe(false);
  scope.stop();
  expect(listeners.size).toBe(0);
});

it('usePrefersDark、useReducedMotion 读各自的系统设置', () => {
  stubMatchMedia((query) => query.includes('reduce'));
  const scope = effectScope();
  const [dark, reduced] = scope.run(() => [usePrefersDark(), useReducedMotion()])!;
  expect([dark!.value, reduced!.value]).toEqual([false, true]);
  scope.stop();
});
