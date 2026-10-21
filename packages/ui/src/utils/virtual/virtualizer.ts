/**
 * 虚拟滚动的核心：只渲染可见范围内的项（COMPONENTS.md §10.7）。不依赖 Vue，VirtualList、以后的表格都建在它上面。
 * 算法参考 @tanstack/virtual-core：先按估计大小排出位置表，渲染后测量真实大小并按 key 缓存；
 * 可见范围用二分查找；可视区上方的项大小变化时同步调整滚动位置，可见内容不跳。
 *
 *   const virtualizer = new Virtualizer({ count, estimateSize: () => 36, getScrollElement: () => el, onChange });
 *   const cleanup = virtualizer.mount();
 *   virtualizer.getVirtualItems()   // 要渲染的项：index、start（相对列表开头的偏移）、size
 *   <div data-index={item.index} ref={virtualizer.measureElement}>  // 测量真实大小
 */
import { clamp } from '../data/number';

/** 一个要渲染的项；位置都相对列表开头，单位 px */
export interface VirtualItem {
  /** 在数据里的序号 */
  readonly index: number;
  /** getItemKey 给出的 key，测量结果按它缓存 */
  readonly key: PropertyKey;
  /** 起始位置 */
  readonly start: number;
  /** 大小：测量过的为真实大小，否则为估计值 */
  readonly size: number;
  /** 结束位置（start + size） */
  readonly end: number;
}

/** 可见范围（不含 overscan），两端都包含 */
export interface VisibleRange {
  /** 第一个可见项 */
  readonly startIndex: number;
  /** 最后一个可见项 */
  readonly endIndex: number;
}

/** 交给 rangeExtractor 的范围：可见范围、overscan 与总数 */
export interface ExtractorRange extends VisibleRange {
  /** 可见范围前后各多渲染几项 */
  readonly overscan: number;
  /** 总项数 */
  readonly count: number;
}

/** 滚动到某一项时，它停在视口的什么位置 */
export interface ScrollAligns {
  /** 顶端（横向时为起始端）对齐视口开头 */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 末端对齐视口末尾 */
  end: unknown;
  /** 已经完整可见就不动，否则就近对齐开头或末尾（默认） */
  auto: unknown;
}

/** scrollToIndex、scrollToOffset 的选项 */
export interface VirtualScrollOptions {
  /** 目标项停在视口的什么位置，默认 auto（scrollToOffset 不用） */
  align?: keyof ScrollAligns;
  /** 滚动方式，同 Element.scrollTo；smooth 时动态大小的项可能停得不够准 */
  behavior?: ScrollBehavior;
}

/** Virtualizer 的选项 */
export interface VirtualizerOptions {
  /** 总项数 */
  count: number;
  /** 滚动容器：元素或 window；还没有时返回 null */
  getScrollElement: () => HTMLElement | Window | null;
  /** 第 index 项的估计大小（px）；渲染后以测量值为准，估计得越接近，滚动条越稳 */
  estimateSize: (index: number) => number;
  /** 第 index 项的 key，默认就是 index；数据会重排、增删时给稳定的 key，测量结果才对得上 */
  getItemKey?: (index: number) => PropertyKey;
  /** 可见范围前后各多渲染几项，默认 3：快速滚动时不露白 */
  overscan?: number;
  /** 横向滚动 */
  horizontal?: boolean;
  /** 列表开头距滚动内容开头的距离（px），如列表上方还有其他内容；函数在每次滚动时读取，默认 0 */
  scrollMargin?: () => number;
  /** 视口开头被吸顶的内容（表头）遮住的部分（px）：scrollToIndex 对齐时避开，被遮住的项不算可见；函数在滚动时读取 */
  scrollPaddingStart?: () => number;
  /** 视口末尾被吸底的内容（合计行）遮住的部分（px）；吸底的内容要在列表之后的正常流里 */
  scrollPaddingEnd?: () => number;
  /** 改写要渲染哪些项（序号升序）：吸顶行、固定行在这里加上，默认是可见范围加 overscan */
  rangeExtractor?: (range: ExtractorRange) => number[];
  /** 渲染范围或总大小变了：重新渲染 */
  onChange?: (virtualizer: Virtualizer) => void;
}

/** 按大小依次排出每项的位置 */
export function computeMeasurements(
  count: number,
  sizeOf: (index: number, key: PropertyKey) => number,
  keyOf: (index: number) => PropertyKey,
): VirtualItem[] {
  const items: VirtualItem[] = new Array(count);
  let start = 0;
  for (let index = 0; index < count; index++) {
    const key = keyOf(index);
    const size = sizeOf(index, key);
    items[index] = { index, key, start, size, end: start + size };
    start += size;
  }
  return items;
}

/** 与 [offset, offset + viewport) 相交的项；视口为 0 时只有 offset 处的一项；没有项时为 null */
export function findVisibleRange(
  items: readonly VirtualItem[],
  offset: number,
  viewport: number,
): VisibleRange | null {
  if (!items.length) return null;
  // 二分查找第一个 end > offset 的项
  let low = 0;
  let high = items.length - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (items[middle]!.end > offset) high = middle;
    else low = middle + 1;
  }
  let endIndex = low;
  while (endIndex < items.length - 1 && items[endIndex]!.end < offset + viewport) endIndex++;
  return { startIndex: low, endIndex };
}

/** 默认的渲染范围：可见范围前后各加 overscan 项 */
export function defaultRangeExtractor({
  startIndex,
  endIndex,
  overscan,
  count,
}: ExtractorRange): number[] {
  const from = Math.max(0, startIndex - overscan);
  const to = Math.min(count - 1, endIndex + overscan);
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

/** 滚动容器是不是 window（整页滚动） */
export const isWindow = (target: HTMLElement | Window): target is Window =>
  typeof window !== 'undefined' && target === window;

/** 动态大小下 scrollToIndex 重新对准的最多次数 */
const MAX_SCROLL_ATTEMPTS = 10;

/** 虚拟滚动的状态与计算：位置表、可见范围、测量、滚动到指定项（用法见文件开头） */
export class Virtualizer {
  private options: VirtualizerOptions;
  /** key → 测量到的大小 */
  private readonly sizes = new Map<PropertyKey, number>();
  /** 位置表；前 valid 项是准的，之后的在下次读取时从第 valid 项往后重排 */
  private measurements: VirtualItem[] | null = null;
  private valid = 0;
  /** 同一轮里的多次测量只通知一次 */
  private updateQueued = false;
  /** 每测到一次新的大小加一：scrollToIndex 据此判断位置是否已经稳定 */
  private sizeVersion = 0;
  /** 滚动位置，相对列表开头 */
  private offset = 0;
  private viewport = 0;
  private range: VisibleRange | null = null;
  private scrollElement: HTMLElement | Window | null = null;
  private itemObserver: ResizeObserver | null = null;
  private readonly observed = new Set<Element>();
  /** 这一批新渲染、还没量过的项 */
  private readonly unmeasured: HTMLElement[] = [];
  private pendingScroll = 0;

  constructor(options: VirtualizerOptions) {
    this.options = options;
  }

  /** 换一组选项（总数、估计大小、key 等）：重新排位置表，测量过的大小按 key 保留 */
  setOptions(options: VirtualizerOptions): void {
    this.options = options;
    this.measurements = null;
    this.valid = 0;
    this.update(true);
  }

  /** 开始监听滚动容器的滚动与大小变化；返回清理函数 */
  mount(): () => void {
    const element = this.options.getScrollElement();
    if (!element) return () => {};
    this.scrollElement = element;
    const onScroll = () => this.readScroll();
    const onResize = () => {
      this.readViewport();
      this.readScroll();
    };
    element.addEventListener('scroll', onScroll, { passive: true });
    let viewportObserver: ResizeObserver | undefined;
    if (isWindow(element)) window.addEventListener('resize', onResize);
    else if (typeof ResizeObserver !== 'undefined') {
      viewportObserver = new ResizeObserver(onResize);
      viewportObserver.observe(element);
    }
    if (typeof ResizeObserver !== 'undefined') {
      // 测量结果下一帧再用：在回调里同步改布局（重排位置、调整滚动），浏览器会报
      // “ResizeObserver loop completed with undelivered notifications”。第一次测量在 measureRendered 里已经做过
      this.itemObserver = new ResizeObserver((entries) => {
        const sizes = entries.map((entry) => [entry.target, this.borderBoxSize(entry)] as const);
        requestAnimationFrame(() => {
          for (const [target, size] of sizes) this.resizeItem(target, size);
        });
      });
      // 项的 ref 回调早于外层组件的 onMounted：挂载前就登记过的项这里补上观察，否则它们之后的大小变化永远收不到
      for (const element of this.observed) this.itemObserver.observe(element);
    }
    this.readViewport();
    this.readScroll();

    return () => {
      element.removeEventListener('scroll', onScroll);
      if (isWindow(element)) window.removeEventListener('resize', onResize);
      viewportObserver?.disconnect();
      this.itemObserver?.disconnect();
      this.itemObserver = null;
      // 换滚动容器时会重新 mount：还在文档里的项留着，下次 mount 接着观察（它们的 ref 回调不会再来）
      for (const observed of this.observed)
        if (!observed.isConnected) this.observed.delete(observed);
      cancelAnimationFrame(this.pendingScroll);
      this.scrollElement = null;
    };
  }

  /** 每项的位置表 */
  getMeasurements(): readonly VirtualItem[] {
    return this.measureUpTo(this.options.count - 1);
  }

  /**
   * 位置表补算到第 index 项为止：只从第一个变了大小的项往后重排，不是每次测量都重建整张表
   * （一万行时每次重建要几毫秒，滚动时每帧都有新的项被测量）
   */
  private measureUpTo(index: number): VirtualItem[] {
    const { count, estimateSize, getItemKey = (i) => i } = this.options;
    const sizeOf = (i: number, key: PropertyKey) => this.sizes.get(key) ?? estimateSize(i);
    if (!this.measurements || this.measurements.length !== count) {
      this.measurements = computeMeasurements(count, sizeOf, getItemKey);
      this.valid = count;
      return this.measurements;
    }
    const items = this.measurements;
    const end = Math.min(index, count - 1);
    let start = this.valid > 0 ? items[this.valid - 1]!.end : 0;
    for (let i = this.valid; i <= end; i++) {
      const key = getItemKey(i);
      const size = sizeOf(i, key);
      items[i] = { index: i, key, start, size, end: start + size };
      start += size;
    }
    this.valid = Math.max(this.valid, end + 1);
    return items;
  }

  /** 列表的总大小（px）：撑开滚动区域 */
  getTotalSize(): number {
    return this.getMeasurements().at(-1)?.end ?? 0;
  }

  /** 可见范围（不含 overscan）；没有项时为 null */
  getVisibleRange(): VisibleRange | null {
    return this.range;
  }

  /** 要渲染的项，序号升序 */
  getVirtualItems(): VirtualItem[] {
    if (!this.range) return [];
    const { count, overscan = 3, rangeExtractor = defaultRangeExtractor } = this.options;
    const measurements = this.getMeasurements();
    return rangeExtractor({ ...this.range, overscan, count })
      .map((index) => measurements[index])
      .filter((item): item is VirtualItem => item != null);
  }

  /**
   * 测量渲染出来的项：作为元素的 ref 回调，元素要带 data-index。同一批渲染的项在微任务里一起量，
   * 之后大小变化由 ResizeObserver 自动更新。传 null（元素卸载）时不再观察已经离开文档的元素。
   */
  measureElement = (element: Element | null): void => {
    if (!element) {
      for (const observed of this.observed) {
        if (observed.isConnected) continue;
        this.itemObserver?.unobserve(observed);
        this.observed.delete(observed);
      }
      return;
    }
    // 只在元素第一次出现时量（这一批渲染完、绘制之前）：之后的变化交给 ResizeObserver
    if (this.observed.has(element)) return;
    this.observed.add(element);
    this.itemObserver?.observe(element);
    this.unmeasured.push(element as HTMLElement);
    if (this.unmeasured.length === 1) queueMicrotask(() => this.measureRendered());
  };

  /**
   * 量这一批新渲染的项：先全部读完再更新。边读边改（调整滚动位置）时每次读取都强制重新布局，
   * 一次渲染很多项（如滚动容器没有限高，所有项都“可见”）时是平方级的布局，页面会卡死。
   * 量布局尺寸（offsetHeight）而不是 getBoundingClientRect：浮层进场的 scale 变换会把后者缩小，
   * 元素之后被复用（列表过滤、重排）时 ResizeObserver 不会再报，缩小的值就一直留着，行与行叠在一起
   */
  private measureRendered() {
    const { horizontal } = this.options;
    const sizes = this.unmeasured
      .splice(0)
      .map(
        (element) => [element, horizontal ? element.offsetWidth : element.offsetHeight] as const,
      );
    for (const [element, size] of sizes) this.resizeItem(element, size);
  }

  /** 滚动到第 index 项 */
  scrollToIndex(index: number, { align = 'auto', behavior }: VirtualScrollOptions = {}): void {
    cancelAnimationFrame(this.pendingScroll);
    const target = () => this.offsetForIndex(index, align);
    const first = target();
    if (first == null) return;
    this.scrollToOffset(first, { behavior });
    if (behavior === 'smooth') return;
    // 滚过去之后周围的项才被测量，位置可能变化：下一帧重新对准；
    // 对准了、而且这一帧没有新的测量才算稳定（WebKit 的测量可能晚一两帧才到，对准后又变）
    let attempts = 0;
    let version = this.sizeVersion;
    const settle = () => {
      if (++attempts > MAX_SCROLL_ATTEMPTS) return;
      const next = target();
      const measured = version !== this.sizeVersion;
      version = this.sizeVersion;
      if (next != null && Math.abs(next - this.offset) >= 1) this.scrollToOffset(next);
      else if (!measured) return;
      this.pendingScroll = requestAnimationFrame(settle);
    };
    this.pendingScroll = requestAnimationFrame(settle);
  }

  /** 滚动到相对列表开头的 offset（px） */
  scrollToOffset(offset: number, { behavior }: VirtualScrollOptions = {}): void {
    const element = this.scrollElement;
    if (!element) return;
    const position = offset + this.scrollMargin();
    element.scrollTo(
      this.options.horizontal ? { left: position, behavior } : { top: position, behavior },
    );
  }

  /** 第 index 项按 align 对齐时的滚动位置；auto 且已经完整可见时为 null */
  private offsetForIndex(index: number, align: keyof ScrollAligns): number | null {
    const item = this.getMeasurements()[clamp(index, 0, this.options.count - 1)];
    if (!item) return null;
    const { offset, viewport } = this;
    const before = this.options.scrollPaddingStart?.() ?? 0;
    const after = this.options.scrollPaddingEnd?.() ?? 0;
    let target: number;
    if (align === 'auto') {
      if (item.start >= offset + before && item.end <= offset + viewport - after) return null;
      target = item.start < offset + before ? item.start - before : item.end - viewport + after;
    } else if (align === 'start') target = item.start - before;
    else if (align === 'end') target = item.end - viewport + after;
    else target = item.start + item.size / 2 - (viewport + before - after) / 2;
    // 开头可以负到 -before：第一项对齐开头时回到最顶上，表头下面就是它
    return clamp(target, -before, Math.max(0, this.getTotalSize() - viewport + after));
  }

  private resizeItem(element: Element, size: number) {
    // 0 是还没排版（display: none、刚离开文档），保留原来的值
    if (!size || !element.isConnected) return;
    const index = Number(element.getAttribute('data-index'));
    const item = this.measureUpTo(index)[index];
    if (!item || item.size === size) return;
    // 可视区上方的项变大或变小：同步调整滚动位置，可见内容不跳
    if (item.start < this.offset) this.scrollBy(size - item.size);
    this.sizes.set(item.key, size);
    this.sizeVersion++;
    this.valid = Math.min(this.valid, index);
    // 渲染时一批新项依次测量：合并成一次通知，等这一批量完再重新算范围
    if (this.updateQueued) return;
    this.updateQueued = true;
    queueMicrotask(() => {
      this.updateQueued = false;
      this.update(true);
    });
  }

  private borderBoxSize(entry: ResizeObserverEntry) {
    const box = entry.borderBoxSize?.[0];
    if (!box) return this.options.horizontal ? entry.contentRect.width : entry.contentRect.height;
    return this.options.horizontal ? box.inlineSize : box.blockSize;
  }

  private scrollBy(delta: number) {
    this.offset += delta;
    this.scrollElement?.scrollBy(this.options.horizontal ? { left: delta } : { top: delta });
  }

  private scrollMargin() {
    return this.options.scrollMargin?.() ?? 0;
  }

  private readViewport() {
    const element = this.scrollElement;
    if (!element) return;
    const { horizontal } = this.options;
    if (isWindow(element)) this.viewport = horizontal ? window.innerWidth : window.innerHeight;
    else this.viewport = horizontal ? element.clientWidth : element.clientHeight;
  }

  private readScroll() {
    const element = this.scrollElement;
    if (!element) return;
    const { horizontal } = this.options;
    const position = isWindow(element)
      ? horizontal
        ? window.scrollX
        : window.scrollY
      : horizontal
        ? element.scrollLeft
        : element.scrollTop;
    this.offset = position - this.scrollMargin();
    this.update(false);
  }

  /** 重新算可见范围；范围变了或 force 时通知 */
  private update(force: boolean) {
    const range = findVisibleRange(this.getMeasurements(), this.offset, this.viewport);
    const changed =
      range?.startIndex !== this.range?.startIndex || range?.endIndex !== this.range?.endIndex;
    this.range = range;
    if (changed || force) this.options.onChange?.(this);
  }
}
