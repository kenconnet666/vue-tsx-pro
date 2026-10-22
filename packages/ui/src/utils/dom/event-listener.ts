/**
 * 事件监听，跟着作用域（组件）一起移除（参考 VueUse 的 useEventListener）：
 *
 *   useEventListener(document, 'visibilitychange', update);
 *   useEventListener(() => scroller, 'scroll', onScroll, { passive: true });   目标是 getter：变了换绑，null 时不监听
 *
 * getter 在 DOM 更新之后读（模板 ref 已经有值）；服务端渲染时什么都不做。返回立即移除的函数。
 */
import { getCurrentScope, onScopeDispose, watch } from 'vue';

/** 监听的目标：window、document、元素，或返回它们的 getter（返回 null、undefined 时不监听） */
export type ListenerTarget = EventTarget | (() => EventTarget | null | undefined);

/** 监听 window 的事件（见文件开头） */
export function useEventListener<K extends keyof WindowEventMap>(
  target: Window | (() => Window | null | undefined),
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions,
): () => void;
/** 监听 document 的事件 */
export function useEventListener<K extends keyof DocumentEventMap>(
  target: Document | (() => Document | null | undefined),
  type: K,
  listener: (event: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions,
): () => void;
/** 监听元素（或 getter 给出的目标）的事件 */
export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: ListenerTarget,
  type: K,
  listener: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): () => void;
export function useEventListener(
  target: ListenerTarget,
  type: string,
  listener: (event: Event) => void,
  options?: AddEventListenerOptions,
): () => void {
  if (typeof window === 'undefined') return () => {};
  let remove = () => {};
  const bind = (element: EventTarget | null | undefined) => {
    remove();
    remove = () => {};
    if (!element) return;
    element.addEventListener(type, listener, options);
    remove = () => element.removeEventListener(type, listener, options);
  };
  const stopWatch =
    typeof target === 'function'
      ? watch(target, bind, { immediate: true, flush: 'post' })
      : (bind(target), undefined);
  const stop = () => {
    stopWatch?.();
    remove();
  };
  if (getCurrentScope()) onScopeDispose(stop);
  return stop;
}
