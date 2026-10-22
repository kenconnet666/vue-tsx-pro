/**
 * 页面是否在前台：切到别的标签页、窗口最小化时为 false（document.visibilityState）。
 * 计时、动画在后台时停下用它（useNow、Toaster 的自动关闭、3D 渲染循环）。
 *
 *   const visible = usePageVisible();
 *   watch(visible, (shown) => shown && refresh());
 */
import { shallowRef, type Ref } from 'vue';
import { useEventListener } from './event-listener';

/** 页面是否在前台（在 setup 或 effectScope 里调用）；没有 document 的环境（服务端）恒为 true */
export function usePageVisible(): Readonly<Ref<boolean>> {
  if (typeof document === 'undefined') return shallowRef(true);
  const visible = shallowRef(document.visibilityState !== 'hidden');
  const update = () => (visible.value = document.visibilityState !== 'hidden');
  useEventListener(document, 'visibilitychange', update);
  return visible;
}
