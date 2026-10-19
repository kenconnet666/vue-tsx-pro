import { onScopeDispose, shallowRef, type Ref } from 'vue';

/**
 * 系统是否要求减少动态效果（prefers-reduced-motion: reduce），随系统设置变化。
 * 取主题时长的动画不需要它（时长 token 已经是 0）；给装饰性、循环播放的动画判断要不要播。
 */
export function useReducedMotion(): Readonly<Ref<boolean>> {
  const query = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reduced = shallowRef(query?.matches ?? false);
  if (query) {
    const update = (event: MediaQueryListEvent) => (reduced.value = event.matches);
    query.addEventListener('change', update);
    onScopeDispose(() => query.removeEventListener('change', update));
  }
  return reduced;
}
