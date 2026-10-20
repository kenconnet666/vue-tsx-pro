/**
 * 元素大小变化时回调（ResizeObserver）：目标换了自动改观察对象，卸载时断开。在 setup 里调用。
 *
 *   useResizeObserver(() => [viewport, content], sync)
 *
 * 回调里同步改布局会触发 “ResizeObserver loop completed with undelivered notifications”：
 * 要改位置、尺寸时放到下一帧（active-indicator、Virtualizer 都这样做）。
 */
import { watch } from 'vue';

type Target = Element | null | undefined;

/** 观察一个或几个元素的大小；targets 在渲染后读取，读到 null 的跳过 */
export function useResizeObserver(
  targets: () => Target | readonly Target[],
  onResize: (entries: ResizeObserverEntry[]) => void,
): void {
  watch(
    () => [targets()].flat().filter((element): element is Element => element != null),
    (elements, _, onCleanup) => {
      if (!elements.length || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(onResize);
      for (const element of elements) observer.observe(element);
      onCleanup(() => observer.disconnect());
    },
    { immediate: true, flush: 'post' },
  );
}
