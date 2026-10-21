// usePageVisible：跟着 visibilitychange 更新，作用域结束后不再监听
import { afterEach, expect, it } from 'vitest';
import { effectScope } from 'vue';
import { usePageVisible } from '../page-visibility';

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

afterEach(() => setVisibility('visible'));

it('切到后台为 false、回来为 true；作用域结束后不再更新', () => {
  const scope = effectScope();
  const visible = scope.run(usePageVisible)!;
  expect(visible.value).toBe(true);
  setVisibility('hidden');
  expect(visible.value).toBe(false);
  setVisibility('visible');
  expect(visible.value).toBe(true);
  scope.stop();
  setVisibility('hidden');
  expect(visible.value).toBe(true);
});
