/**
 * 滚动区域：浮层滚动条。滚动仍是浏览器原生的（触控板惯性、键盘、页内搜索、无障碍都不变），
 * 只把原生滚动条隐藏，换成半透明、绝对定位浮在内容上方的滚动条：出现、消失都不占位，不改变布局尺寸。
 * 参考 Radix ScrollArea。
 *
 *   <ScrollArea sx={styles.panel}>…</ScrollArea>            高度（或最大高度）由使用方给
 *   <ScrollArea axis="both" type="always">…</ScrollArea>
 *
 * 滚动条对读屏隐藏（滚动由视口本身承担）；视口可聚焦，键盘照常滚动。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { startMove } from '../utils/move';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/styles';

/** 哪个方向可以滚动 */
export interface ScrollAreaAxes {
  /** 纵向（默认），横向超出的部分裁掉 */
  y: unknown;
  /** 横向，纵向超出的部分裁掉 */
  x: unknown;
  /** 两个方向 */
  both: unknown;
}

/** 滚动条什么时候显示 */
export interface ScrollbarTypes {
  /** 指针在区域上方或正在滚动时显示（默认） */
  hover: unknown;
  /** 只在滚动时显示，停下后淡出 */
  scroll: unknown;
  /** 内容超出时一直显示 */
  always: unknown;
}

/** 未声明的属性落到外层（决定尺寸的那一层）；视口的属性（aria-label 等）用 propsViewport */
export interface ScrollAreaProps extends PartProps<'div'> {
  /** 可以滚动的方向，默认 y */
  axis?: keyof ScrollAreaAxes;
  /** 滚动条什么时候显示，默认 hover */
  type?: keyof ScrollbarTypes;
  /** 停止滚动、指针离开后多久淡出（毫秒），默认 600 */
  hideDelay?: number;
  /** 视口（真正滚动的元素）的部件属性；ref 拿到它可以自己控制滚动 */
  propsViewport?: PartProps<'div', 'tabindex'>;
  /** 内容层（视口里包着 children 的 div）的部件属性 */
  propsContent?: PartProps<'div'>;
  /** 滚动条轨道的部件属性，两个方向都用它（data-axis 区分 x、y） */
  propsScrollbar?: PartProps<'div', 'aria-hidden'>;
  /** 滑块的部件属性；大小与位置由组件写在行内样式上 */
  propsThumb?: PartProps<'div'>;
  children?: VNodeChild;
}

/** 滑块的最小长度（px）：内容再长也能抓得住 */
const MIN_THUMB = 20;

const styles = stylex.create({
  // flex 纵向：使用方只给 max-height 时视口也能被限制住（视口 min-height: 0 可以收缩）
  root: { position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  viewport: {
    flexGrow: 1,
    minHeight: 0,
    // 隐藏原生滚动条：Firefox、新版 Chromium 与 Safari 用标准属性，旧版 WebKit 用伪元素
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': { display: 'none' },
    // 焦点环画在里面：外层 overflow: hidden 会裁掉画在外面的
    outlineOffset: 'calc(-1 * _borderWidths.sm)',
  },
  y: { overflowX: 'hidden', overflowY: 'auto' },
  x: { overflowX: 'auto', overflowY: 'hidden' },
  both: { overflow: 'auto' },
  // 横向滚动时内容按自己的宽度撑开，宽度变化也能被 ResizeObserver 观察到
  wideContent: { display: 'table', minWidth: '_full' },
});

const barStyles = stylex.create({
  track: {
    position: 'absolute',
    zIndex: 1,
    boxSizing: 'border-box',
    touchAction: 'none',
    userSelect: 'none',
    transition: 'opacity _durations.md _easings.standard',
  },
  hidden: { opacity: 0, pointerEvents: 'none' },
  // 粗细：0.5em 的滑块加两侧各 2px 的留白
  y: {
    insetBlock: 0,
    insetInlineEnd: 0,
    width: 'calc(_space.sm + 2 * _borderWidths.sm)',
  },
  x: {
    insetInline: 0,
    bottom: 0,
    height: 'calc(_space.sm + 2 * _borderWidths.sm)',
  },
  // 两个方向都有时让出右下角，两条滚动条不重叠
  yCorner: { bottom: 'calc(_space.sm + 2 * _borderWidths.sm)' },
  xCorner: { insetInlineEnd: 'calc(_space.sm + 2 * _borderWidths.sm)' },
  thumb: {
    position: 'absolute',
    borderRadius: '_full',
    // 半透明：浮在内容上也不完全遮住下面的文字
    backgroundColor: {
      default: 'color-mix(in srgb, _textMuted 50%, transparent)',
      ':hover': 'color-mix(in srgb, _textMuted 75%, transparent)',
    },
    transition: 'background-color _durations.sm _easings.standard',
  },
  thumbY: { top: 0, insetInline: '_borderWidths.sm' },
  thumbX: { insetInlineStart: 0, insetBlock: '_borderWidths.sm' },
});

/** 内部组件：一个方向的滚动条。单独一个组件，滚动、悬停只让它自己重新渲染，不牵动内容 */
const Scrollbar = _component(
  ({
    axis,
    root,
    viewport,
    content,
    type,
    hideDelay,
    corner,
    propsScrollbar,
    propsThumb,
  }: {
    axis: 'x' | 'y';
    root: HTMLElement | null;
    viewport: HTMLElement | null;
    content: HTMLElement | null;
    type: keyof ScrollbarTypes;
    hideDelay: number;
    corner: boolean;
    propsScrollbar?: PartProps<'div', 'aria-hidden'>;
    propsThumb?: PartProps<'div'>;
  }) => {
    let track = _state.raw<HTMLElement | null>(null);
    let thumb = _state.raw<HTMLElement | null>(null);
    let overflowing = _state(false);
    let active = _state(false);
    let hovering = false;
    let dragging = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    /** 视口的尺寸与滚动位置；横向时滚动位置取绝对值（从右到左排版时 scrollLeft 为负） */
    const measure = (element: HTMLElement) =>
      axis === 'y'
        ? { view: element.clientHeight, size: element.scrollHeight, position: element.scrollTop }
        : {
            view: element.clientWidth,
            size: element.scrollWidth,
            position: Math.abs(element.scrollLeft),
          };
    /** 从右到左排版时横向的方向要反过来 */
    const sign = () =>
      axis === 'x' && viewport && getComputedStyle(viewport).direction === 'rtl' ? -1 : 1;
    const thumbSize = (view: number, size: number, trackSize: number) =>
      Math.max(MIN_THUMB, (view / size) * trackSize);

    // 滑块的大小与位置随滚动频繁变化，直接写到元素上，不经过渲染
    function sync() {
      if (!viewport || !track || !thumb) return;
      const { view, size, position } = measure(viewport);
      overflowing = size > view + 1;
      const trackSize = axis === 'y' ? track.clientHeight : track.clientWidth;
      const length = thumbSize(view, size, trackSize);
      const offset = size > view ? (position / (size - view)) * (trackSize - length) : 0;
      if (axis === 'y') {
        thumb.style.height = `${length}px`;
        thumb.style.transform = `translateY(${offset}px)`;
      } else {
        thumb.style.width = `${length}px`;
        thumb.style.transform = `translateX(${sign() * offset}px)`;
      }
    }

    function show() {
      active = true;
      scheduleHide();
    }
    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!dragging && !(type === 'hover' && hovering)) active = false;
      }, hideDelay);
    }

    _effect(() => {
      if (!root || !viewport || !content) return;
      const element = viewport;
      sync();
      const onScroll = () => {
        sync();
        show();
      };
      const onEnter = () => {
        hovering = true;
        if (type === 'hover') show();
      };
      const onLeave = () => {
        hovering = false;
        scheduleHide();
      };
      element.addEventListener('scroll', onScroll, { passive: true });
      root.addEventListener('pointerenter', onEnter);
      root.addEventListener('pointerleave', onLeave);
      const observer = new ResizeObserver(() => sync());
      observer.observe(element);
      observer.observe(content);
      return () => {
        element.removeEventListener('scroll', onScroll);
        root.removeEventListener('pointerenter', onEnter);
        root.removeEventListener('pointerleave', onLeave);
        observer.disconnect();
        clearTimeout(hideTimer);
      };
    });

    /** 拖动滑块：位移按“可滚动距离 / 滑块可移动距离”换算成滚动距离 */
    function dragThumb(event: PointerEvent) {
      if (!viewport || !track || !thumb) return;
      event.stopPropagation();
      const element = viewport;
      const { view, size, position } = measure(element);
      const trackSize = axis === 'y' ? track.clientHeight : track.clientWidth;
      const ratio = (size - view) / (trackSize - thumbSize(view, size, trackSize));
      const direction = sign();
      dragging = true;
      startMove(event, {
        onMove: ({ deltaX, deltaY }) => {
          const target = position + (axis === 'y' ? deltaY : direction * deltaX) * ratio;
          if (axis === 'y') element.scrollTop = target;
          else element.scrollLeft = direction * target;
        },
        onEnd: () => {
          dragging = false;
          scheduleHide();
        },
      });
    }

    /** 点击轨道的空白处：朝那一侧翻一页 */
    function pageTo(event: PointerEvent) {
      if (!viewport || !thumb || event.button !== 0) return;
      const rect = thumb.getBoundingClientRect();
      const { view } = measure(viewport);
      // 点在滑块之前（上方；横向时为起始一侧）就往回翻
      const rtl = sign() === -1;
      const before =
        axis === 'y'
          ? event.clientY < rect.top
          : rtl
            ? event.clientX > rect.right
            : event.clientX < rect.left;
      const page = (before ? -1 : 1) * view * 0.9;
      viewport.scrollBy(axis === 'y' ? { top: page } : { left: sign() * page });
    }

    /** 滚动条盖在视口上面，滚轮落在它上面时转交给视口 */
    function forwardWheel(event: WheelEvent) {
      if (!viewport) return;
      event.preventDefault();
      viewport.scrollBy({ left: event.deltaX, top: event.deltaY });
    }

    return () => {
      const visible = overflowing && (type === 'always' || active);
      return (
        <div
          {...elementProps(
            mergeProps<'div'>(
              {
                sx: [
                  barStyles.track,
                  barStyles[axis],
                  corner && (axis === 'y' ? barStyles.yCorner : barStyles.xCorner),
                ],
              },
              propsScrollbar,
              {
                sx: !visible && barStyles.hidden,
                ref: _toRef(track),
                'aria-hidden': true,
                onPointerdown: pageTo,
                onWheel: forwardWheel,
              },
            ),
          )}
          data-axis={axis}
          data-state={visible ? 'visible' : 'hidden'}
        >
          <div
            {...elementProps(
              mergeProps<'div'>(
                { sx: [barStyles.thumb, axis === 'y' ? barStyles.thumbY : barStyles.thumbX] },
                propsThumb,
                { ref: _toRef(thumb), onPointerdown: dragThumb },
              ),
            )}
          />
        </div>
      );
    };
  },
  { name: 'Scrollbar' },
);

/** 滚动区域：原生滚动 + 半透明的浮层滚动条，出现与消失都不占位 */
export const ScrollArea = _component(
  ({
    axis = 'y',
    type = 'hover',
    hideDelay = 600,
    propsViewport,
    propsContent,
    propsScrollbar,
    propsThumb,
    children,
    ...rest
  }: ScrollAreaProps) => {
    let root = _state.raw<HTMLElement | null>(null);
    let viewport = _state.raw<HTMLElement | null>(null);
    let content = _state.raw<HTMLElement | null>(null);

    return () => {
      const both = axis === 'both';
      const bar = (barAxis: 'x' | 'y') => (
        <Scrollbar
          axis={barAxis}
          root={root}
          viewport={viewport}
          content={content}
          type={type}
          hideDelay={hideDelay}
          corner={both}
          propsScrollbar={propsScrollbar}
          propsThumb={propsThumb}
        />
      );
      return (
        <div {...elementProps(mergeProps<'div'>({ sx: styles.root }, rest, { ref: _toRef(root) }))}>
          <div
            {...elementProps(
              mergeProps<'div'>(
                // 焦点环在前：视口自己的 outlineOffset（画在里面）覆盖它
                { sx: [focusRingStyles.visible, styles.viewport, styles[axis]] },
                propsViewport,
                // 可聚焦：键盘用户也能滚动（axe 的 scrollable-region-focusable）
                { ref: _toRef(viewport), tabindex: 0 },
              ),
            )}
          >
            <div
              {...elementProps(
                mergeProps<'div'>({ sx: axis !== 'y' && styles.wideContent }, propsContent, {
                  ref: _toRef(content),
                }),
              )}
            >
              {children}
            </div>
          </div>
          {axis !== 'x' && bar('y')}
          {axis !== 'y' && bar('x')}
        </div>
      );
    };
  },
);
