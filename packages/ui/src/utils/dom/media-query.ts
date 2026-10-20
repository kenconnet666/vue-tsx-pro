/**
 * 媒体查询的响应式结果：随视口、系统设置变化。
 *
 *   const wide = useMediaQuery('(min-width: 64rem)');
 *   if (wide.value) …
 *
 * 能用 CSS 媒体查询解决的（显示与隐藏、排版）写在样式里；只有行为要随之变化时（宽屏时关掉抽屉）才用它。
 */
import { onScopeDispose, shallowRef, type Ref } from 'vue';

/** 媒体查询是否命中（在 setup 或 effectScope 里调用）；没有 matchMedia 的环境（服务端）恒为 false */
export function useMediaQuery(query: string): Readonly<Ref<boolean>> {
  const list = globalThis.matchMedia?.(query);
  const matches = shallowRef(list?.matches ?? false);
  if (list) {
    const update = (event: MediaQueryListEvent) => (matches.value = event.matches);
    list.addEventListener('change', update);
    onScopeDispose(() => list.removeEventListener('change', update));
  }
  return matches;
}

/** 系统是否偏好暗色（prefers-color-scheme: dark） */
export function usePrefersDark(): Readonly<Ref<boolean>> {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * 系统是否要求减少动态效果（prefers-reduced-motion: reduce）。
 * 取主题时长的动画不需要它（时长 token 已经是 0）；给装饰性、循环播放的动画判断要不要播。
 */
export function useReducedMotion(): Readonly<Ref<boolean>> {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
