/**
 * 滚动区域：浮层滚动条。滚动仍是浏览器原生的（触控板惯性、键盘、页内搜索、无障碍都不变），
 * 只把原生滚动条隐藏，换成半透明、绝对定位浮在内容上方的滚动条：出现、消失都不占位，不改变布局尺寸。
 * 参考 Radix ScrollArea。
 *
 *   <ScrollArea sx={styles.panel}>…</ScrollArea>            高度（或最大高度）由使用方给
 *   <ScrollArea axis="both" type="always">…</ScrollArea>
 *
 * 滚动条对读屏隐藏（滚动由视口本身承担）；视口可聚焦，键盘照常滚动。
 * 滚动条本身是 OverlayScrollbar：整页的浮层滚动条（PageScrollbar）也用它。
 *
 * 要在外面拿到真正滚动的元素（虚拟滚动、自己控制滚动）时用 propsViewport 的 ref：
 *   <ScrollArea propsViewport={{ ref: (element) => (scroller = toElement(element)) }}>…</ScrollArea>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { startMove } from '../utils/dom/move';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { isRtl } from '../utils/dom/direction';
import { batchLayout } from '../utils/dom/layout-batch';
import { useResizeObserver } from '../utils/dom/resize';

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
  /**
   * 视口可以用 Tab 聚焦（键盘滚动），默认 true。视口本身另有角色并自己管焦点（列表框、菜单），
   * 或焦点在别处、由那里控制滚动（命令面板的输入框）时关掉，tabindex 由使用方经 propsViewport 给
   */
  focusable?: boolean;
  /** 视口（真正滚动的元素）的部件属性；ref 拿到它可以自己控制滚动 */
  propsViewport?: PartProps<'div'>;
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

/** ScrollArea 的样式：root、viewport、y、x、both、wideContent */
export const scrollAreaStyles = stylex.create({
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

/** OverlayScrollbar 的样式：track、hidden、y、x、yCorner、xCorner、thumb 等 */
export const scrollAreaBarStyles = stylex.create({
  track: {
    position: 'absolute',
    zIndex: 1,
    boxSizing: 'border-box',
    touchAction: 'none',
    userSelect: 'none',
    transition: 'opacity _durations.md _easings.standard',
  },
  hidden: { opacity: 0, pointerEvents: 'none' },
  // 整页的滚动条：隐藏时仍接收指针，指针移到窗口边缘就显示出来
  hiddenReveal: { opacity: 0 },
  // 整页的滚动条固定在视口一侧，盖在粘性顶栏之上
  fixed: { position: 'fixed', zIndex: 20 },
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

/** OverlayScrollbar 的属性 */
export interface OverlayScrollbarProps {
  /** 方向 */
  axis: 'x' | 'y';
  /** 真正滚动的元素；整页滚动时是 document.scrollingElement（滚动事件在 window 上） */
  viewport: HTMLElement | null;
  /** 内容：它的尺寸变化时重新计算滑块 */
  content: HTMLElement | null;
  /** 指针进入它时显示滚动条（type 为 hover 时）；不给时只看指针是否在滚动条上 */
  hoverTarget?: HTMLElement | null;
  /** 什么时候显示，默认 hover */
  type?: keyof ScrollbarTypes;
  /** 停止滚动、指针离开后多久淡出（毫秒），默认 600 */
  hideDelay?: number;
  /** 两个方向都有滚动条：让出右下角 */
  corner?: boolean;
  /** 固定在视口一侧（整页的滚动条）：隐藏时仍接收指针，移到窗口边缘就显示 */
  fixed?: boolean;
  /** 轨道的部件属性 */
  propsScrollbar?: PartProps<'div', 'aria-hidden'>;
  /** 滑块的部件属性 */
  propsThumb?: PartProps<'div'>;
}

/**
 * 一个方向的浮层滚动条：轨道与滑块，滚动、悬停时出现，停下后淡出；拖动滑块、点击轨道翻页、滚轮转交给视口。
 * ScrollArea 与 PageScrollbar 都用它。单独一个组件，滚动、悬停只让它自己重新渲染，不牵动内容
 */
export const OverlayScrollbar = _component(
  ({
    axis,
    viewport,
    content,
    hoverTarget,
    type = 'hover',
    hideDelay = 600,
    corner = false,
    fixed = false,
    propsScrollbar,
    propsThumb,
  }: OverlayScrollbarProps) => {
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
    const sign = () => (axis === 'x' && viewport && isRtl(viewport) ? -1 : 1);
    const thumbSize = (view: number, size: number, trackSize: number) =>
      Math.max(MIN_THUMB, (view / size) * trackSize);

    // 滑块的大小与位置随滚动频繁变化，直接写到元素上，不经过渲染。read 量、返回的函数写
    function read() {
      if (!viewport || !track || !thumb) return;
      // 看不见的（收起的 Collapse 是 hidden="until-found"，即 content-visibility: hidden）不量：
      // 在这种子树里读尺寸，浏览器每次都要为它单独排一遍版。显示出来时 ResizeObserver 会再通知
      if (viewport.checkVisibility?.() === false) return;
      const element = thumb;
      const { view, size, position } = measure(viewport);
      const trackSize = axis === 'y' ? track.clientHeight : track.clientWidth;
      const length = thumbSize(view, size, trackSize);
      const offset = size > view ? (position / (size - view)) * (trackSize - length) : 0;
      const direction = sign();
      return () => {
        overflowing = size > view + 1;
        if (axis === 'y') {
          element.style.height = `${length}px`;
          element.style.transform = `translateY(${offset}px)`;
        } else {
          element.style.width = `${length}px`;
          element.style.transform = `translateX(${direction * offset}px)`;
        }
      };
    }
    // 滚动时立即对齐；挂载、尺寸变化时合并到这一轮的先读后写里（一页十几个滚动区域只排一次版）
    const sync = () => read()?.();
    const syncLater = () => batchLayout(read);

    // 整页的滚动条（fixed）不论 type，指针移到它上面都显示
    const revealsOnHover = () => type === 'hover' || fixed;

    function show() {
      active = true;
      scheduleHide();
    }
    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!dragging && !(revealsOnHover() && hovering)) active = false;
      }, hideDelay);
    }

    _effect(() => {
      if (!viewport || !content) return;
      const element = viewport;
      // 整页滚动时滚动事件发在 window 上；窗口高度变了（不改变内容尺寸）也要重算
      const scroller = element === document.scrollingElement ? window : element;
      const hover = hoverTarget ?? track;
      syncLater();
      const onScroll = () => {
        sync();
        show();
      };
      const onEnter = () => {
        hovering = true;
        if (!revealsOnHover()) return;
        // 绝对定位的后代（图表的提示框）撑出、收回溢出时内容尺寸不变，ResizeObserver 察觉不到，显示前重新量
        sync();
        show();
      };
      const onLeave = () => {
        hovering = false;
        scheduleHide();
      };
      scroller.addEventListener('scroll', onScroll, { passive: true });
      if (scroller === window) window.addEventListener('resize', sync);
      hover?.addEventListener('pointerenter', onEnter);
      hover?.addEventListener('pointerleave', onLeave);
      return () => {
        scroller.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', sync);
        hover?.removeEventListener('pointerenter', onEnter);
        hover?.removeEventListener('pointerleave', onLeave);
        clearTimeout(hideTimer);
      };
    });
    useResizeObserver(() => [viewport, content], syncLater);

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
          {...mergeAttrs<'div'>(
            {
              sx: [
                scrollAreaBarStyles.track,
                scrollAreaBarStyles[axis],
                fixed && scrollAreaBarStyles.fixed,
                corner &&
                  (axis === 'y' ? scrollAreaBarStyles.yCorner : scrollAreaBarStyles.xCorner),
              ],
            },
            propsScrollbar,
            {
              sx:
                !visible && (fixed ? scrollAreaBarStyles.hiddenReveal : scrollAreaBarStyles.hidden),
              ref: _toRef(track),
              'aria-hidden': true,
              onPointerdown: pageTo,
              onWheel: forwardWheel,
            },
          )}
          data-axis={axis}
          data-state={visible ? 'visible' : 'hidden'}
        >
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  scrollAreaBarStyles.thumb,
                  axis === 'y' ? scrollAreaBarStyles.thumbY : scrollAreaBarStyles.thumbX,
                ],
              },
              propsThumb,
              { ref: _toRef(thumb), onPointerdown: dragThumb },
            )}
          />
        </div>
      );
    };
  },
  { name: 'OverlayScrollbar' },
);

/** 滚动区域：原生滚动 + 半透明的浮层滚动条，出现与消失都不占位 */
export const ScrollArea = _component(
  ({
    axis = 'y',
    type = 'hover',
    hideDelay = 600,
    focusable = true,
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
        <OverlayScrollbar
          axis={barAxis}
          hoverTarget={root}
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
        <div {...mergeAttrs<'div'>({ sx: scrollAreaStyles.root }, rest, { ref: _toRef(root) })}>
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [focusRingStyles.visible, scrollAreaStyles.viewport, scrollAreaStyles[axis]],
              },
              propsViewport,
              { ref: _toRef(viewport), ...(focusable && { tabindex: 0 }) },
            )}
          >
            <div
              {...mergeAttrs<'div'>(
                { sx: axis !== 'y' && scrollAreaStyles.wideContent },
                propsContent,
                {
                  ref: _toRef(content),
                },
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
