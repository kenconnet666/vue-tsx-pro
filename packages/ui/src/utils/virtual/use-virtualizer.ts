/**
 * 虚拟滚动的 Vue 接线：把 Virtualizer（virtualizer.ts，不依赖 Vue）接到组件上。
 * VirtualList、Table、TreeTable、ListboxView（Select、Combobox 的选项）共用。
 *
 *   const virtual = useVirtualizer(() => ({
 *     count: rows.length,
 *     scrollElement: viewport,           // 滚动容器（元素或 window），就绪前为 null
 *     list: body,                         // 列表开头所在的元素：据此算 scrollMargin
 *     estimateSize: () => 40,
 *     getItemKey: (index) => rows[index]!.id,
 *   }));
 *   virtual.items / virtual.total         渲染：只渲染这些项，列表撑到 total 高
 *   ref={virtual.measure}                 每一项的元素：渲染后测量真实大小
 *
 * read 在 watch 里读取：其中读到的响应式数据（行数、key）变化时重新同步；
 * 选项里的函数（estimateSize、onRangeChange）不在这时调用，它们读到的数据不会变成依赖。
 */
import { onBeforeUnmount, shallowRef, watch } from 'vue';
import {
  isWindow,
  Virtualizer,
  type ExtractorRange,
  type VirtualItem,
  type VirtualScrollOptions,
  type VisibleRange,
} from './virtualizer';

/** useVirtualizer 每次同步时读取的选项 */
export interface UseVirtualizerOptions {
  /** 总项数 */
  count: number;
  /** 滚动容器：元素或 window；还没挂载时为 null */
  scrollElement: HTMLElement | Window | null;
  /** 列表开头所在的元素：它与滚动内容开头的距离就是 scrollMargin（容器内边距、表头、列表上方的内容） */
  list: HTMLElement | null;
  /** 第 index 项的估计大小（px） */
  estimateSize: (index: number) => number;
  /** 第 index 项的 key；数据会重排、增删时给稳定的 key */
  getItemKey?: (index: number) => PropertyKey;
  /** 可见范围前后各多渲染几项 */
  overscan?: number;
  /** 横向 */
  horizontal?: boolean;
  /** 改写要渲染哪些项：始终渲染高亮项、吸顶行 */
  rangeExtractor?: (range: ExtractorRange) => number[];
  /** 可见范围（不含 overscan）变化：接近末尾时加载更多 */
  onRangeChange?: (range: VisibleRange) => void;
}

/** useVirtualizer 的返回值 */
export interface VirtualView {
  /** 要渲染的项 */
  readonly items: readonly VirtualItem[];
  /** 列表的总大小（px） */
  readonly total: number;
  /** 当前可见范围 */
  readonly range: VisibleRange | null;
  /** 项的 ref：渲染后测量真实大小（元素要带 data-index） */
  measure: (element: unknown) => void;
  /** 滚动到第 index 项 */
  scrollToIndex: (index: number, options?: VirtualScrollOptions) => void;
  /** 滚动到相对列表开头的位置 */
  scrollToOffset: (offset: number, options?: VirtualScrollOptions) => void;
}

/** 在组件 setup 里调用 */
export function useVirtualizer(read: () => UseVirtualizerOptions): VirtualView {
  // 渲染需要的只有这些；滚动本身不触发重新渲染
  const view = shallowRef<{ items: VirtualItem[]; total: number; range: VisibleRange | null }>({
    items: [],
    total: 0,
    range: null,
  });
  let current = read();
  let reported: VisibleRange | null = null;

  function build(options: UseVirtualizerOptions) {
    return {
      count: options.count,
      overscan: options.overscan,
      horizontal: options.horizontal,
      estimateSize: options.estimateSize,
      getItemKey: options.getItemKey,
      rangeExtractor: options.rangeExtractor,
      getScrollElement: () => current.scrollElement,
      scrollMargin: () => {
        const { list, scrollElement, horizontal } = current;
        if (!list || !scrollElement) return 0;
        const listRect = list.getBoundingClientRect();
        if (isWindow(scrollElement)) {
          return horizontal ? listRect.left + window.scrollX : listRect.top + window.scrollY;
        }
        const rootRect = scrollElement.getBoundingClientRect();
        return horizontal
          ? listRect.left - rootRect.left + scrollElement.scrollLeft
          : listRect.top - rootRect.top + scrollElement.scrollTop;
      },
      onChange: (changed: Virtualizer) => {
        const range = changed.getVisibleRange();
        view.value = { items: changed.getVirtualItems(), total: changed.getTotalSize(), range };
        // 测量也会触发 onChange，可见范围没变时不报告
        if (
          !range ||
          (range.startIndex === reported?.startIndex && range.endIndex === reported.endIndex)
        ) {
          return;
        }
        reported = range;
        current.onRangeChange?.(range);
      },
    };
  }

  const virtualizer = new Virtualizer(build(current));

  watch(read, (next) => {
    current = next;
    virtualizer.setOptions(build(next));
  });

  // 滚动容器就绪（或换了）时挂载：监听滚动与大小
  let unmount: (() => void) | undefined;
  watch(
    () => read().scrollElement,
    (element) => {
      unmount?.();
      unmount = element ? virtualizer.mount() : undefined;
    },
    { immediate: true, flush: 'post' },
  );
  onBeforeUnmount(() => unmount?.());

  return {
    get items() {
      return view.value.items;
    },
    get total() {
      return view.value.total;
    },
    get range() {
      return view.value.range;
    },
    measure: virtualizer.measureElement as (element: unknown) => void,
    scrollToIndex: (index, options) => virtualizer.scrollToIndex(index, options),
    scrollToOffset: (offset, options) => virtualizer.scrollToOffset(offset, options),
  };
}
