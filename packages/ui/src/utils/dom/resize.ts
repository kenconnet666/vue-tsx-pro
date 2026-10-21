/**
 * 元素大小变化时回调（ResizeObserver）：目标换了自动改观察对象，卸载时断开。在 setup 里调用。
 *
 *   useResizeObserver(() => [viewport, content], sync)
 *
 * 整个应用共用一个 ResizeObserver：同一轮的变化在一次通知里交给各个回调，回调之间不穿插微任务（Vue 的更新），
 * 回调里用 batchLayout 先读后写时，所有组件的读取合并成一次布局。各用各的观察器时，每个回调之后都会先跑一遍
 * Vue 的更新，下一个回调一读布局就要重新排版（一页十几个滚动区域就是十几次）。
 *
 * 回调里同步改布局会触发 “ResizeObserver loop completed with undelivered notifications”：
 * 要改位置、尺寸时放到下一帧（active-indicator、Virtualizer 都这样做）。
 */
import { watch } from 'vue';

type Target = Element | null | undefined;
type Handler = (entries: ResizeObserverEntry[]) => void;

const handlers = new Map<Element, Set<Handler>>();
let shared: ResizeObserver | undefined;

function sharedObserver() {
  shared ??= new ResizeObserver((entries) => {
    const byHandler = new Map<Handler, ResizeObserverEntry[]>();
    for (const entry of entries) {
      for (const handler of handlers.get(entry.target) ?? []) {
        const list = byHandler.get(handler);
        if (list) list.push(entry);
        else byHandler.set(handler, [entry]);
      }
    }
    for (const [handler, list] of byHandler) handler(list);
  });
  return shared;
}

function observe(element: Element, handler: Handler) {
  const set = handlers.get(element) ?? new Set();
  handlers.set(element, set);
  set.add(handler);
  // 已经在观察的元素重新 observe：新的回调也收到一次初始的大小
  sharedObserver().observe(element);
}

function unobserve(element: Element, handler: Handler) {
  const set = handlers.get(element);
  set?.delete(handler);
  if (set?.size) return;
  handlers.delete(element);
  shared?.unobserve(element);
}

/** 观察一个或几个元素的大小；targets 在渲染后读取，读到 null 的跳过 */
export function useResizeObserver(
  targets: () => Target | readonly Target[],
  onResize: (entries: ResizeObserverEntry[]) => void,
): void {
  // 每次调用一个独立的回调：同一个函数被几个组件传进来时各算各的
  const handler: Handler = (entries) => onResize(entries);
  watch(
    () => [targets()].flat().filter((element): element is Element => element != null),
    (elements, _, onCleanup) => {
      if (!elements.length || typeof ResizeObserver === 'undefined') return;
      for (const element of elements) observe(element, handler);
      onCleanup(() => {
        for (const element of elements) unobserve(element, handler);
      });
    },
    { immediate: true, flush: 'post' },
  );
}
