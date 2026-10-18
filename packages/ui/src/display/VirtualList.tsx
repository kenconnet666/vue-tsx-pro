/**
 * 虚拟列表：只渲染可见范围内的项，上万条数据也流畅。行高可以不固定，渲染后自动测量（COMPONENTS.md §10.7）。
 *
 *   <VirtualList items={users} itemKey={(user) => user.id} estimateSize={48} sx={styles.list}>
 *     {(user) => <UserRow user={user} />}
 *   </VirtualList>
 *
 * 默认组件自己是滚动容器，高度由使用方给（sx、class 或 style）；scroll="window" 时随页面滚动。
 * 读屏：role="list"，每项带 aria-setsize / aria-posinset，未渲染的项也算在总数里。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { watch, type VNodeChild } from 'vue';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/styles';
import {
  Virtualizer,
  type VirtualItem,
  type VirtualScrollOptions,
  type VisibleRange,
} from '../utils/virtualizer';

/** 跟着谁滚动 */
export interface VirtualListScrolls {
  /** 组件自己是滚动容器（默认）：要给它高度（横向时给宽度） */
  container: unknown;
  /** 随页面（window）滚动：列表按总高度撑开，放在页面的普通流里 */
  window: unknown;
}

/** handle 拿到的方法 */
export interface VirtualListHandle {
  /** 滚动到第 index 项；align 默认 auto（已经完整可见就不动） */
  scrollToIndex: (index: number, options?: VirtualScrollOptions) => void;
  /** 滚动到相对列表开头的位置（px） */
  scrollToOffset: (offset: number, options?: VirtualScrollOptions) => void;
}

/** 受管属性：角色与可聚焦由组件决定 */
type Managed = 'role' | 'tabindex';

/** 未声明的属性落到外层元素（滚动容器）上；aria-label 写在这里就是列表的名称 */
export interface VirtualListProps<T> extends PartProps<'div', Managed> {
  /** 数据 */
  items: readonly T[];
  /** 渲染一项：`{(item, index) => …}` */
  children: (item: T, index: number) => VNodeChild;
  /** 每项的 key，默认用序号；数据会重排、增删时一定要给，测量结果与组件状态才对得上 */
  itemKey?: (item: T, index: number) => PropertyKey;
  /** 每项的估计大小（px），数字或按项计算；渲染后以实际大小为准，默认 40 */
  estimateSize?: number | ((item: T, index: number) => number);
  /** 可见范围前后各多渲染几项，默认 4 */
  overscan?: number;
  /** 跟着谁滚动，默认 container */
  scroll?: keyof VirtualListScrolls;
  /** 横向排列与滚动 */
  horizontal?: boolean;
  /** 没有数据时显示的内容 */
  empty?: VNodeChild;
  /** 拿到滚动方法：`handle={(list) => (listHandle = list)}` */
  handle?: (handle: VirtualListHandle) => void;
  /** 可见范围变化（不含 overscan）：接近末尾时加载更多 */
  onRangeChange?: (range: VisibleRange) => void;
}

const styles = stylex.create({
  // 自己调整滚动位置（见 virtualizer.ts），不要浏览器再按锚点调整一次
  root: { overflowAnchor: 'none' },
  container: { overflow: 'auto', overscrollBehavior: 'contain' },
  list: { position: 'relative', overflowAnchor: 'none' },
  item: { position: 'absolute', top: 0, left: 0, overflowAnchor: 'none' },
  itemVertical: { width: '_full' },
  itemHorizontal: { height: '_full' },
});

// 总大小与位置是任意值，用动态样式（编译为 CSS 变量）；单独一个 create，见 COMPONENTS.md §4
const sizeStyles = stylex.create({
  height: (px: number) => ({ height: px }),
  width: (px: number) => ({ width: px, height: '_full' }),
  y: (px: number) => ({ transform: `translateY(${px}px)` }),
  x: (px: number) => ({ transform: `translateX(${px}px)` }),
});

/** 虚拟列表：只渲染可见范围内的项，行高渲染后自动测量 */
export const VirtualList = _component(
  <T,>({
    items,
    children,
    itemKey,
    estimateSize = 40,
    overscan = 4,
    scroll = 'container',
    horizontal = false,
    empty,
    handle,
    onRangeChange,
    ...rest
  }: VirtualListProps<T>) => {
    let root = _state.raw<HTMLElement | null>(null);
    let list = _state.raw<HTMLElement | null>(null);
    // 渲染需要的只有这两样；滚动本身不触发重新渲染
    let view = _state.raw<{ items: VirtualItem[]; total: number }>({ items: [], total: 0 });

    /** 上次报告给 onRangeChange 的范围 */
    let reported: VisibleRange | null = null;
    const virtualizer = new Virtualizer(options());

    /** 读取 props 生成选项；props 变化时重新同步（见下面的 watch） */
    function options() {
      const data = items;
      const estimate = estimateSize;
      const keyOf = itemKey;
      return {
        count: data.length,
        overscan,
        horizontal,
        estimateSize: (index: number) =>
          typeof estimate === 'number' ? estimate : estimate(data[index]!, index),
        getItemKey: keyOf ? (index: number) => keyOf(data[index]!, index) : undefined,
        getScrollElement: () => (scroll === 'window' ? window : root),
        // 列表开头距滚动内容开头的距离：容器的内边距、页面里列表上方的内容
        scrollMargin: () => {
          if (!list) return 0;
          const listRect = list.getBoundingClientRect();
          if (scroll === 'window') {
            return horizontal ? listRect.left + window.scrollX : listRect.top + window.scrollY;
          }
          const rootRect = root!.getBoundingClientRect();
          return horizontal
            ? listRect.left - rootRect.left + root!.scrollLeft
            : listRect.top - rootRect.top + root!.scrollTop;
        },
        onChange: (changed: Virtualizer) => {
          view = { items: changed.getVirtualItems(), total: changed.getTotalSize() };
          const range = changed.getVisibleRange();
          // 测量也会触发 onChange，可见范围没变时不报告
          if (
            !range ||
            (range.startIndex === reported?.startIndex && range.endIndex === reported.endIndex)
          )
            return;
          reported = range;
          onRangeChange?.(range);
        },
      };
    }

    // 用 watch 而不是 _effect：同步与挂载时会调用使用方的 estimateSize、onRangeChange，
    // 它们读到的响应式变量不该变成这里的依赖
    watch(
      () => [items, itemKey, estimateSize, overscan, horizontal, scroll],
      () => virtualizer.setOptions(options()),
    );
    const api: VirtualListHandle = {
      scrollToIndex: (index, scrollOptions) => virtualizer.scrollToIndex(index, scrollOptions),
      scrollToOffset: (offset, scrollOptions) => virtualizer.scrollToOffset(offset, scrollOptions),
    };
    // root 就绪后开始监听滚动与大小；滚动方式变了重新挂载。
    // 挂载之后才交出 handle：使用方在回调里立即滚动（恢复上次的位置）也能生效。
    // handle 不放进监听源：父级写的箭头函数每次渲染都是新的，不该因此重新挂载
    watch(
      () => [root, scroll],
      (_, __, onCleanup) => {
        if (!root) return;
        onCleanup(virtualizer.mount());
        handle?.(api);
      },
      { immediate: true, flush: 'post' },
    );

    return () => {
      const isContainer = scroll === 'container';
      const hasItems = items.length > 0;
      return (
        <div
          {...elementProps(
            mergeProps<'div'>(
              {
                sx: [styles.root, isContainer && [styles.container, focusRingStyles.visible]],
              },
              rest,
              {
                ref: _toRef(root),
                role: hasItems ? 'list' : undefined,
                // 容器模式下可以用键盘滚动
                tabindex: isContainer ? 0 : undefined,
              },
            ),
          )}
        >
          {hasItems ? (
            <div
              ref={_toRef(list)}
              role="presentation"
              {...stylex.attrs(
                styles.list,
                horizontal ? sizeStyles.width(view.total) : sizeStyles.height(view.total),
              )}
            >
              {view.items.map((item) => (
                <div
                  key={item.key}
                  ref={virtualizer.measureElement as (element: unknown) => void}
                  role="listitem"
                  data-index={item.index}
                  aria-setsize={items.length}
                  aria-posinset={item.index + 1}
                  {...stylex.attrs(
                    styles.item,
                    horizontal
                      ? [styles.itemHorizontal, sizeStyles.x(item.start)]
                      : [styles.itemVertical, sizeStyles.y(item.start)],
                  )}
                >
                  {children(items[item.index]!, item.index)}
                </div>
              ))}
            </div>
          ) : (
            empty
          )}
        </div>
      );
    };
  },
);
