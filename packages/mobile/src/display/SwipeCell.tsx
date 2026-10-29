/**
 * 滑动单元格：内容往左（右）滑，露出藏在另一边的操作按钮（删除、收藏……）。列表里一行一个。
 *
 *   <SwipeCell right={<Button tone="danger" radius="none" onClick={remove}>删除</Button>}>
 *     <Cell title="订单 1024" value="待付款" />
 *   </SwipeCell>
 *   <SwipeCell _open={side} left={…} right={…} />   双向绑定：'left' | 'right' | false
 *
 * 横滑才接管手势，竖滑照常滚动页面（H5 靠 touch-action，小程序在横滑期间把 touchmove 换成 catch）。
 * 打开时点任意位置（包括露出的按钮，在它自己的点击之后）收起。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted, type VNodeChild } from 'vue';
import { useHost } from '../utils/host';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 打开的一边 */
export type SwipeCellSide = 'left' | 'right';

/** 未声明的属性落到根元素（div）上 */
export interface SwipeCellProps extends PartProps<'div'> {
  /** 打开的一边，false 是收起；双向绑定写 `_open={x}` */
  _open?: SwipeCellSide | false;
  /** 左边藏着的内容（往右滑露出） */
  left?: VNodeChild;
  /** 右边藏着的内容（往左滑露出） */
  right?: VNodeChild;
  /** 不能滑 */
  disabled?: boolean;
  /** 打开或收起 */
  onOpenChange?: (open: SwipeCellSide | false) => void;
  /** 内容 */
  children?: VNodeChild;
  /** 滑动层（内容与两边）的部件属性 */
  propsTrack?: PartProps<'div'>;
  /** 左边的部件属性 */
  propsLeft?: PartProps<'div'>;
  /** 右边的部件属性 */
  propsRight?: PartProps<'div'>;
}

/** SwipeCell 的样式：root、track、dragging、side、left、right */
export const swipeCellStyles = css.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
    // 竖滑交给浏览器滚动页面，横滑交给组件
    touchAction: 'pan-y',
    userSelect: 'none',
  },
  track: {
    position: 'relative',
    transitionProperty: 'transform',
    transitionDuration: '_md',
    transitionTimingFunction: '_standard',
  },
  // 拖动时跟手，不要过渡
  dragging: { transitionDuration: '0s' },
  side: { position: 'absolute', insetBlock: 0, display: 'flex', alignItems: 'stretch' },
  left: { insetInlineEnd: '100%' },
  right: { insetInlineStart: '100%' },
});

// 横竖方向的判定：移动超过这个距离（px）才判定
const LOCK_DISTANCE = 8;

/** 滑动单元格（div > 滑动层：左边 + 内容 + 右边） */
export const SwipeCell = _component(
  ({
    _open: open = _bindable<SwipeCellSide | false>(false),
    left,
    right,
    disabled = false,
    onOpenChange,
    children,
    propsTrack,
    propsLeft,
    propsRight,
    ...rest
  }: SwipeCellProps) => {
    const host = useHost();
    // 两边的宽度：挂上时量一次，每次按下时再量（内容可能变了；小程序里只能异步量，按下到开始滑动之间来得及）
    const widths = _state({ left: 0, right: 0 });
    let leftNode: unknown = null;
    let rightNode: unknown = null;
    const measure = async () => {
      const [l, r] = await Promise.all([host.measure(leftNode), host.measure(rightNode)]);
      widths.left = l?.width ?? 0;
      widths.right = r?.width ?? 0;
    };
    onMounted(measure);

    // 拖动中的偏移；不拖动时由 open 决定
    let drag = _state<number | null>(null);
    let horizontal = _state(false);
    let start = { x: 0, y: 0, offset: 0 };
    let direction: 'h' | 'v' | null = null;

    const restingOffset = () =>
      open === 'left' ? widths.left : open === 'right' ? -widths.right : 0;
    const setOpen = (next: SwipeCellSide | false) => {
      if (next === open) return;
      open = next;
      onOpenChange?.(next);
    };

    const onTouchstart = (event: TouchEvent) => {
      if (disabled) return;
      void measure();
      const touch = event.touches[0]!;
      start = { x: touch.clientX, y: touch.clientY, offset: restingOffset() };
      direction = null;
    };
    const onTouchmove = (event: TouchEvent) => {
      if (disabled) return;
      const touch = event.touches[0]!;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (!direction) {
        if (Math.abs(dx) < LOCK_DISTANCE && Math.abs(dy) < LOCK_DISTANCE) return;
        direction = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
        horizontal = direction === 'h';
      }
      if (direction !== 'h') return;
      drag = Math.min(widths.left, Math.max(-widths.right, start.offset + dx));
    };
    const onTouchend = () => {
      horizontal = false;
      if (drag === null) return;
      const offset = drag;
      drag = null;
      // 从收起往外拉过三成就打开；从打开往回推过三成就收起
      const threshold = (width: number) => (open ? width * 0.7 : width * 0.3);
      if (offset > 0 && widths.left && offset > threshold(widths.left)) setOpen('left');
      else if (offset < 0 && widths.right && -offset > threshold(widths.right)) setOpen('right');
      else setOpen(false);
    };
    // 滑动不会触发点击（浏览器与小程序都是），所以这里的点击都是点按：打开时收起
    const onClick = () => open && setOpen(false);

    return () => {
      const offset = drag ?? restingOffset();
      return (
        <div
          {...mergeAttrs<'div'>({ sx: swipeCellStyles.root }, rest, {
            onTouchstart,
            onTouchmove,
            onTouchend,
            onTouchcancel: onTouchend,
            onClick,
            ...dataAttrs({
              // 小程序：收 touchmove；横滑期间 catch，页面不跟着滚
              'data-touch-move': horizontal ? 'catch' : true,
              'data-open': open || undefined,
            }),
          })}
        >
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [swipeCellStyles.track, drag !== null && swipeCellStyles.dragging],
                style: { transform: `translateX(${offset}px)` },
              },
              propsTrack,
            )}
          >
            {hasContent(left) && (
              <div
                {...mergeAttrs<'div'>(
                  { sx: [swipeCellStyles.side, swipeCellStyles.left] },
                  propsLeft,
                )}
                ref={(node: unknown) => (leftNode = node)}
              >
                {left}
              </div>
            )}
            {children}
            {hasContent(right) && (
              <div
                {...mergeAttrs<'div'>(
                  { sx: [swipeCellStyles.side, swipeCellStyles.right] },
                  propsRight,
                )}
                ref={(node: unknown) => (rightNode = node)}
              >
                {right}
              </div>
            )}
          </div>
        </div>
      );
    };
  },
);
