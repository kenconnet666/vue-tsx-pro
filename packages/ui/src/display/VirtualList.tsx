/**
 * 虚拟列表：只渲染可见范围内的项，上万条数据也流畅。行高可以不固定，渲染后自动测量（COMPONENTS.md §10.7）。
 *
 *   <VirtualList items={users} itemKey={(user) => user.id} estimateSize={48} sx={styles.list}>
 *     {(user) => <UserRow user={user} />}
 *   </VirtualList>
 *
 * 默认组件自己是滚动容器，高度由使用方给（sx、class 或 style）；scroll="window" 时随页面滚动。
 * 读屏：role="list"，每项带 aria-setsize / aria-posinset，未渲染的项也算在总数里；没有数据时是 role="group"（空状态、骨架不是列表项）。
 * loading：没有数据时显示骨架行（按 estimateSize 的高度），已有数据（刷新、加载更多）时顶部显示进度条；带 aria-busy。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { watch, type VNodeChild } from 'vue';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { useLang } from '../config/context';
import { Progress } from '../feedback/Progress';
import { Skeleton, type SkeletonProps, type SkeletonShapeProps } from '../feedback/Skeleton';
import { SHIMMER_STAGGER } from '../utils/style/shimmer';
import {
  elementProps,
  mergeAttrs,
  mergePartProps,
  mergeProps,
  type PartProps,
} from '../utils/props';
import { ScrollArea } from '../layout/ScrollArea';
import { focusRingStyles } from '../utils/style/styles';
import { useVirtualizer } from '../utils/virtual/use-virtualizer';
import type { VirtualScrollOptions, VisibleRange } from '../utils/virtual/virtualizer';

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
export type VirtualListManaged = 'role' | 'tabindex';

/** 未声明的属性落到外层元素（滚动容器）上；aria-label 写在这里就是列表的名称 */
export interface VirtualListProps<T> extends PartProps<'div', VirtualListManaged> {
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
  /** 加载中：没有数据时显示骨架行，已有数据时顶部显示进度条 */
  loading?: boolean;
  /** 加载中占位行的部件属性 */
  propsSkeleton?: SkeletonShapeProps;
  /** 拿到滚动方法：`handle={(list) => (listHandle = list)}` */
  handle?: (handle: VirtualListHandle) => void;
  /** 可见范围变化（不含 overscan）：接近末尾时加载更多 */
  onRangeChange?: (range: VisibleRange) => void;
  /** 列表层（撑开总高度、role="list" 的项都在它里面）的部件属性 */
  propsList?: PartProps<'div', 'role'>;
  /**
   * 每一项外层（role="listitem"）的部件属性；可以按项计算：`(item, index) => ({ class: … })`。
   * 位置、序号与无障碍属性由组件管理
   */
  propsItem?: ItemProps | ((item: T, index: number) => ItemProps);
}

/** 项外层可以定制的属性 */
type ItemProps = PartProps<'div', 'role' | 'aria-setsize' | 'aria-posinset'>;

/** 加载中显示几行骨架 */
const SKELETON_ROWS = 5;

/** VirtualList 的样式：root、container、list、item、itemVertical、itemHorizontal 等 */
export const virtualListStyles = stylex.create({
  // 自己调整滚动位置（见 virtualizer.ts），不要浏览器再按锚点调整一次
  root: { overflowAnchor: 'none' },
  // 容器模式：列表元素是 ScrollArea 的视口（浮层滚动条）
  container: { overscrollBehavior: 'contain' },
  list: { position: 'relative', overflowAnchor: 'none' },
  item: { position: 'absolute', top: 0, left: 0, overflowAnchor: 'none' },
  itemVertical: { width: '_full' },
  itemHorizontal: { height: '_full' },
  // 刷新中的进度条贴在可见区域顶部
  progress: { position: 'sticky', top: 0, zIndex: 1, height: 0 },
  skeletonRow: { paddingBlock: '_xs' },
  skeleton: { display: 'block', width: '_full' },
});

// 总大小与位置是任意值，用动态样式（编译为 CSS 变量）；单独一个 create，见 COMPONENTS.md §4
/** VirtualList 的样式：height、width、y、x、skeleton */
export const virtualListSizeStyles = stylex.create({
  height: (px: number) => ({ height: px }),
  width: (px: number) => ({ width: px, height: '_full' }),
  y: (px: number) => ({ transform: `translateY(${px}px)` }),
  x: (px: number) => ({ transform: `translateX(${px}px)` }),
  // 骨架行比一项略矮：上下留出间隔
  skeleton: (px: number) => ({ height: Math.max(8, px - 8) }),
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
    loading = false,
    propsSkeleton,
    handle,
    onRangeChange,
    propsList,
    propsItem,
    ...rest
  }: VirtualListProps<T>) => {
    const lang = useLang();
    // 骨架、进度条防闪烁；aria-busy 按真实的 loading
    const indicator = useDelayedLoading(() => loading);
    let root = _state.raw<HTMLElement | null>(null);
    let list = _state.raw<HTMLElement | null>(null);
    const virtual = useVirtualizer(() => {
      const data = items;
      const estimate = estimateSize;
      const keyOf = itemKey;
      return {
        count: data.length,
        overscan,
        horizontal,
        scrollElement: scroll === 'window' ? window : root,
        list,
        estimateSize: (index: number) =>
          typeof estimate === 'number' ? estimate : estimate(data[index]!, index),
        getItemKey: keyOf ? (index: number) => keyOf(data[index]!, index) : undefined,
        onRangeChange,
      };
    });

    // 挂载之后才交出 handle：使用方在回调里立即滚动（恢复上次的位置）也能生效。
    // handle 不放进监听源：父级写的箭头函数每次渲染都是新的，不该因此重新交出
    const api: VirtualListHandle = {
      scrollToIndex: virtual.scrollToIndex,
      scrollToOffset: virtual.scrollToOffset,
    };
    watch(
      () => root,
      (element) => {
        if (element) handle?.(api);
      },
      { flush: 'post' },
    );

    return () => {
      const isContainer = scroll === 'container';
      const hasItems = items.length > 0;
      const props = mergeProps<'div'>(
        {
          sx: [
            virtualListStyles.root,
            isContainer && [virtualListStyles.container, focusRingStyles.visible],
          ],
        },
        rest,
        {
          ref: _toRef(root),
          // 没有数据（空状态、首次加载的骨架）时不是列表；仍给 group 角色，写在外层的 aria-label 才有效
          role: hasItems ? 'list' : 'group',
          'aria-busy': loading || undefined,
          // 容器模式下可以用键盘滚动
          tabindex: isContainer ? 0 : undefined,
        },
      );
      const content = (
        <>
          {indicator.value && hasItems && (
            <div aria-hidden="true" {...stylex.attrs(virtualListStyles.progress)}>
              <Progress size="xs" aria-label={lang.loading} />
            </div>
          )}
          {hasItems ? (
            <div
              {...mergeAttrs<'div'>({ sx: virtualListStyles.list }, propsList, {
                sx: horizontal
                  ? virtualListSizeStyles.width(virtual.total)
                  : virtualListSizeStyles.height(virtual.total),
                ref: _toRef(list),
                role: 'presentation',
              })}
            >
              {virtual.items.map((item) => {
                const data = items[item.index]!;
                const own =
                  typeof propsItem === 'function' ? propsItem(data, item.index) : propsItem;
                return (
                  <div
                    key={item.key}
                    {...mergeAttrs<'div'>(
                      {
                        sx: [
                          virtualListStyles.item,
                          horizontal
                            ? virtualListStyles.itemHorizontal
                            : virtualListStyles.itemVertical,
                        ],
                      },
                      own,
                      {
                        sx: horizontal
                          ? virtualListSizeStyles.x(item.start)
                          : virtualListSizeStyles.y(item.start),
                        ref: virtual.measure,
                        role: 'listitem',
                        'aria-setsize': items.length,
                        'aria-posinset': item.index + 1,
                      },
                    )}
                    data-index={item.index}
                  >
                    {children(data, item.index)}
                  </div>
                );
              })}
            </div>
          ) : loading ? (
            indicator.value &&
            Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <div key={index} aria-hidden="true" {...stylex.attrs(virtualListStyles.skeletonRow)}>
                <Skeleton
                  {...mergePartProps<SkeletonProps>(
                    {
                      sx: [
                        virtualListStyles.skeleton,
                        virtualListSizeStyles.skeleton(
                          typeof estimateSize === 'number' ? estimateSize : 40,
                        ),
                      ],
                      delay: index * SHIMMER_STAGGER,
                    },
                    propsSkeleton,
                  )}
                />
              </div>
            ))
          ) : (
            empty
          )}
        </>
      );
      // 容器模式：列表元素就是 ScrollArea 的视口，滚动条是浮层的；跟着页面滚动时就是普通的 div
      return isContainer ? (
        <ScrollArea
          axis={horizontal ? 'x' : 'y'}
          focusable={false}
          propsViewport={props as PartProps<'div'>}
        >
          {content}
        </ScrollArea>
      ) : (
        <div {...elementProps(props)}>{content}</div>
      );
    };
  },
);
