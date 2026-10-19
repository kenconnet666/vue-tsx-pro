// useReducedMotion：读 prefers-reduced-motion，随系统设置变化
import { effectScope } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { useReducedMotion } from '../reduced-motion';

afterEach(() => vi.unstubAllGlobals());

it('跟随媒体查询的变化', () => {
  let listener: ((event: { matches: boolean }) => void) | undefined;
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    addEventListener: (_: string, callback: typeof listener) => (listener = callback),
    removeEventListener: () => (listener = undefined),
  }));
  const scope = effectScope();
  const reduced = scope.run(useReducedMotion)!;
  expect(reduced.value).toBe(true);
  listener!({ matches: false });
  expect(reduced.value).toBe(false);
  scope.stop();
  expect(listener).toBeUndefined();
});
