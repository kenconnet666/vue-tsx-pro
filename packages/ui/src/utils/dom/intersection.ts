/**
 * 元素与视口（或滚动容器）的相交变化时回调（IntersectionObserver）：目标或选项变了重建观察器，卸载时断开。
 * 在 setup 里调用。
 *
 *   // 吸底的栏没有完整可见，说明盖着下面的内容
 *   useIntersectionObserver(() => root, ([entry]) => (stuck = entry!.intersectionRatio < 1), () => ({
 *     threshold: [0, 1],
 *   }));
 *
 * 没有 IntersectionObserver 的环境（服务端、部分测试环境）什么也不做，调用方自己决定这时当作可见还是不可见。
 */
import { watch } from 'vue';

type Target = Element | null | undefined;

/** 观察选项，同 IntersectionObserver */
export interface IntersectionOptions {
  /** 相交的参照：滚动容器；不写时是视口 */
  root?: Element | Document | null;
  /** 参照边界向外扩展，写法同 CSS 的 margin：`'0px 0px 200px'` 提前 200px 算作进入 */
  rootMargin?: string;
  /** 在哪些可见比例上回调：0 是进出，1 是完整可见 */
  threshold?: number | number[];
}

/** 观察一个或几个元素与参照的相交；targets 与 options 在渲染后读取，读到 null 的目标跳过 */
export function useIntersectionObserver(
  targets: () => Target | readonly Target[],
  onChange: (entries: IntersectionObserverEntry[]) => void,
  options: () => IntersectionOptions = () => ({}),
): void {
  watch(
    () => ({
      elements: [targets()].flat().filter((element): element is Element => element != null),
      ...options(),
    }),
    ({ elements, root, rootMargin, threshold }, _, onCleanup) => {
      if (!elements.length || typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver((entries) => onChange(entries), {
        root,
        rootMargin,
        threshold,
      });
      for (const element of elements) observer.observe(element);
      onCleanup(() => observer.disconnect());
    },
    { immediate: true, flush: 'post' },
  );
}
