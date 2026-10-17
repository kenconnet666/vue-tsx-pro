import { onScopeDispose, shallowRef, type Ref } from 'vue';

/** 系统是否偏好暗色（prefers-color-scheme: dark），随系统设置变化 */
export function usePrefersDark(): Readonly<Ref<boolean>> {
  const query = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  const dark = shallowRef(query?.matches ?? false);
  if (query) {
    const update = (event: MediaQueryListEvent) => (dark.value = event.matches);
    query.addEventListener('change', update);
    onScopeDispose(() => query.removeEventListener('change', update));
  }
  return dark;
}
