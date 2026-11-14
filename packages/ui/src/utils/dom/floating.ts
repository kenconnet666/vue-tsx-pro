/**
 * 锚定浮层：Popover、Tooltip、Menu、Select 的弹出层贴着触发器显示。位置在这里算（computePlacement），
 * 显示、隐藏、Esc、点击外部仍交给原生 popover；createAnchoredLayer 把两者串成打开、关闭的流程。
 *
 *   const anchored = anchorFloating(trigger, panel, { placement: 'bottom-start' });
 *   await anchored.ready;   // 第一次定位完成、已经可见：这时才能把焦点移进去
 *   anchored.stop();        // 关闭时停止跟随
 *   sx: [floatingStyles.anchored, …]   // 浮层自己的样式：去掉原生 popover 默认的居中与外边距
 *
 * - 第一次算好位置之前浮层是 visibility: hidden，不会在默认位置闪一下；
 * - 空间不够时翻到另一侧、贴着视口边缘挪回来，滚动、缩放、锚点或浮层变了大小、锚点挪了位置时自动重新定位（autoUpdate）；
 * - start / end 对齐是逻辑方向，从右到左排版下自动镜像（读浮层的 direction）；
 * - 最终方向写到 data-side / data-align，缩放原点（transform-origin）朝向锚点，进出场的 scale 过渡从锚点那侧展开。
 *
 * 浮层都在顶层（原生 popover、模态对话框里）、position: fixed：坐标就是视口坐标，不用处理定位祖先、裁剪祖先。
 * 以前用 @floating-ui/dom，它为任意定位方式、任意容器做的那部分这里用不到；自己算的这一版多做了两件事：
 * 坐标对齐到设备像素（文字不发虚），两侧都放不下时选空间大的一侧再限高（而不是选溢出最少的）。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onScopeDispose, watchPostEffect } from 'vue';
import type { SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { transitions } from '../style/transitions';
import { fontSizeStyles, type TextSize } from '../style/typography';
import { returnFocus } from './focus';

/** 弹出位置：主方向 + 对齐方式（start 对齐锚点的起始边，end 对齐结束边）；空间不够时自动翻转 */
export interface FloatingPlacements {
  /** 上方居中 */
  top: unknown;
  /** 上方，与锚点起始边对齐 */
  'top-start': unknown;
  /** 上方，与锚点结束边对齐 */
  'top-end': unknown;
  /** 下方居中 */
  bottom: unknown;
  /** 下方，与锚点起始边对齐 */
  'bottom-start': unknown;
  /** 下方，与锚点结束边对齐 */
  'bottom-end': unknown;
  /** 左侧居中 */
  left: unknown;
  /** 左侧，与锚点顶边对齐 */
  'left-start': unknown;
  /** 左侧，与锚点底边对齐 */
  'left-end': unknown;
  /** 右侧居中 */
  right: unknown;
  /** 右侧，与锚点顶边对齐 */
  'right-start': unknown;
  /** 右侧，与锚点底边对齐 */
  'right-end': unknown;
}

/** 弹出位置 */
export type FloatingPlacement = keyof FloatingPlacements;

/** 只有位置的虚拟锚点：指针的位置、文本框里光标的位置 */
export interface VirtualAnchor {
  /** 现在的位置（视口坐标）；每次重新定位都会调用 */
  getBoundingClientRect: () => DOMRect;
  /** 它所在的元素（光标所在的文本框）：这个元素被滚动、变了大小时重新定位 */
  contextElement?: Element;
}

/**
 * 锚点：元素，或只有位置的虚拟锚点（右键菜单从指针的位置弹出：`pointAnchor(x, y)`）。
 * 虚拟锚点没有元素可以还焦点，关闭后焦点由组件自己安排
 */
export type FloatingAnchor = HTMLElement | VirtualAnchor;

/** 视口里一个点（clientX / clientY）做锚点 */
export function pointAnchor(x: number, y: number): VirtualAnchor {
  return { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) };
}

/** anchorFloating 的选项 */
export interface FloatingOptions {
  /** 弹出位置，默认 bottom-start */
  placement?: FloatingPlacement;
  /** 与锚点的距离（px），默认 6 */
  offset?: number;
  /** 至少与锚点一样宽：下拉框、组合框的选项列表 */
  matchWidth?: boolean;
  /** 最大高度限制在视口剩余空间内（浮层自己设 overflow 滚动）：菜单、选项列表 */
  fitHeight?: boolean;
  /** 箭头元素（浮层里的子元素，样式用 floatingStyles.arrow）：指向锚点，随翻转换边；距离自动加上箭头露出的一半 */
  arrow?: HTMLElement | null;
  /** 主方向与对侧都放不下时，再试垂直的两侧（窄屏上“右侧”的大卡片改到上下）：引导卡片 */
  crossAxisFallback?: boolean;
}

/** anchorFloating 的返回值 */
export interface Anchored {
  /** 第一次定位完成、浮层已可见时完成；在这之前就 stop 时不会完成 */
  readonly ready: Promise<void>;
  /** 停止跟随锚点；关闭浮层时调用，重复调用无副作用 */
  stop(): void;
}

/** 浮层在锚点的哪一侧 */
export type FloatingSide = 'top' | 'right' | 'bottom' | 'left';
type Side = FloatingSide;

/** 缩放原点朝向锚点：弹出在下方时从上边缘展开 */
const TRANSFORM_ORIGIN: Record<Side, string> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

/** 箭头贴着浮层的哪条边（与弹出方向相反） */
const ARROW_EDGE: Record<Side, Side> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};
/** 箭头（画了右、下两条边的方块）转多少度才朝向锚点 */
const ARROW_ROTATION: Record<Side, number> = { top: 45, right: 135, bottom: 225, left: -45 };

/**
 * 弹出面板共用的样式：锚定定位、浮起的表面、缩放进出场（transitions.pop，比对话框快）；
 * 面板渲染在顶层，不是触发器的后代、不继承它的字号：按控件的 size 设置。Popover、HoverCard、Menu、ListPopover、
 * Cascader、TreeSelect、日期选择器用它；组件自己的面板样式（内边距、宽度）排在后面
 */
export function anchoredPanelSx(size?: TextSize): SxStyles {
  return [
    floatingStyles.anchored,
    floatingStyles.surface,
    size && fontSizeStyles[size],
    transitions.pop,
  ] as SxStyles;
}

/** 锚定浮层的基础样式：定位与表面 */
export const floatingStyles = css.create({
  /** 原生 popover 默认居中显示、带外边距，改为由 anchorFloating 写入的 left / top 定位 */
  anchored: { position: 'fixed', inset: 'auto', margin: 0 },
  /** 浮起的表面：边框、圆角、阴影（Popover、Menu、选项列表）；内边距各自定 */
  surface: {
    boxSizing: 'border-box',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
    backgroundColor: '_surfaceRaised',
    color: '_text',
    boxShadow: '_lg',
  },
  /**
   * 箭头：一个小方块，只画右、下两条边，旋转后尖角朝向锚点；底色、边框跟随浮层（inherit）。
   * 位置与旋转由 anchorFloating 写
   */
  arrow: {
    position: 'absolute',
    boxSizing: 'border-box',
    width: '0.625em',
    height: '0.625em',
    backgroundColor: 'inherit',
    borderStyle: 'solid',
    borderColor: 'inherit',
    borderWidth: 0,
    borderRightWidth: 'inherit',
    borderBottomWidth: 'inherit',
    borderBottomRightRadius: '_borderWidths.sm',
    pointerEvents: 'none',
  },
  /** 有箭头的浮层：原生 popover 默认 overflow: auto 会把伸出去的箭头裁掉 */
  withArrow: { overflow: 'visible' },
  /**
   * 内容会滚动的浮层（选项列表、菜单）：打开时是竖向 flex、裁掉溢出，里面放 ScrollArea（scrollArea）撑满，
   * 滚动条是浮层的；关闭时仍由浏览器隐藏（只在 :popover-open 时改 display）
   */
  scrollPanel: {
    display: { default: null, ':popover-open': 'flex' },
    flexDirection: 'column',
    overflow: 'hidden',
    // 去掉原生 popover 默认的 0.25em 内边距：滚动条贴着浮层边缘，内边距由里面的内容层给
    padding: 0,
  },
  /** scrollPanel 里的 ScrollArea：占满剩下的高度（最大高度由 anchorFloating 的 fitHeight 写在浮层上） */
  scrollArea: { flexGrow: 1, minHeight: 0 },
});

/** 与视口边缘至少留出的距离（px） */
const VIEWPORT_PADDING = 8;

/** 矩形（视口坐标，px） */
export interface FloatingRect {
  /** 左边 */
  left: number;
  /** 上边 */
  top: number;
  /** 宽 */
  width: number;
  /** 高 */
  height: number;
}

/** computePlacement 的输入：都是量好的数，不碰 DOM */
export interface PlacementInput {
  /** 锚点的位置 */
  anchor: FloatingRect;
  /** 浮层的宽（布局尺寸，不受进出场的缩放影响） */
  width: number;
  /** 浮层的高 */
  height: number;
  /** 看得见的视口 */
  viewport: FloatingRect;
  /** 想要的位置 */
  placement: FloatingPlacement;
  /** 与锚点的距离 */
  gap: number;
  /** 浮层是不是从右到左排版：start / end 镜像 */
  rtl: boolean;
  /** 与视口边缘至少留出的距离 */
  padding: number;
  /** 主方向与对侧都放不下时，再试垂直的两侧 */
  crossAxisFallback?: boolean;
  /** 箭头：边长，与离浮层两端至少留出的距离 */
  arrow?: { size: number; padding: number };
}

/** computePlacement 的结果 */
export interface PlacementResult {
  /** 浮层的左边 */
  x: number;
  /** 浮层的上边 */
  y: number;
  /** 最后在锚点的哪一侧 */
  side: Side;
  /** 对齐方式 */
  align: 'start' | 'center' | 'end';
  /** 箭头在浮层里的横向位置（上下弹出时） */
  arrowX?: number;
  /** 箭头在浮层里的纵向位置（左右弹出时） */
  arrowY?: number;
  /** 这一侧能用的高度：fitHeight 写成浮层的最大高度 */
  availableHeight: number;
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' };
const isVertical = (side: Side) => side === 'top' || side === 'bottom';
/** 夹在 min–max 之间；放不下（max < min）时贴着 min 那一边 */
const clampTo = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

/** 浮层在锚点这一侧、这样对齐时的左上角 */
function coordsOf(
  side: Side,
  align: PlacementResult['align'],
  { anchor, width, height, gap, rtl }: PlacementInput,
) {
  const right = anchor.left + anchor.width;
  const bottom = anchor.top + anchor.height;
  if (isVertical(side)) {
    // start / end 是逻辑方向：从右到左排版时 start 贴锚点的右边
    const atLeft = align === 'center' ? null : (align === 'start') !== rtl;
    return {
      x:
        atLeft == null
          ? anchor.left + (anchor.width - width) / 2
          : atLeft
            ? anchor.left
            : right - width,
      y: side === 'top' ? anchor.top - height - gap : bottom + gap,
    };
  }
  return {
    x: side === 'left' ? anchor.left - width - gap : right + gap,
    y:
      align === 'start'
        ? anchor.top
        : align === 'end'
          ? bottom - height
          : anchor.top + (anchor.height - height) / 2,
  };
}

/**
 * 算浮层的位置（纯函数，定位的全部规则都在这里）：
 * 1. 按想要的一侧放；放不下换对侧（crossAxisFallback 时再试垂直的两侧）；都放不下选空间最大的一侧；
 * 2. 沿着对齐的方向挪回视口里；
 * 3. 箭头对准锚点的中间，但不画到浮层的圆角外；
 * 4. 报告这一侧能用的高度。
 */
export function computePlacement(input: PlacementInput): PlacementResult {
  const { anchor, width, height, viewport, placement, padding, rtl, arrow } = input;
  const [wanted, align = 'center'] = placement.split('-') as [Side, PlacementResult['align']?];
  const bounds = {
    left: viewport.left + padding,
    top: viewport.top + padding,
    right: viewport.left + viewport.width - padding,
    bottom: viewport.top + viewport.height - padding,
  };
  /** 这一侧还差多少放不下（≤ 0 放得下） */
  const overflowOf = (side: Side) => {
    const { x, y } = coordsOf(side, align, input);
    if (side === 'top') return bounds.top - y;
    if (side === 'bottom') return y + height - bounds.bottom;
    if (side === 'left') return bounds.left - x;
    return x + width - bounds.right;
  };
  const perpendicular: Side[] = isVertical(wanted)
    ? rtl
      ? ['left', 'right']
      : ['right', 'left']
    : ['bottom', 'top'];
  const candidates = [
    wanted,
    OPPOSITE[wanted],
    ...(input.crossAxisFallback ? perpendicular : []),
  ].map((side) => ({ side, overflow: overflowOf(side) }));
  const side = (
    candidates.find((candidate) => candidate.overflow <= 0) ??
    candidates.reduce((best, candidate) => (candidate.overflow < best.overflow ? candidate : best))
  ).side;

  let { x, y } = coordsOf(side, align, input);
  if (isVertical(side)) x = clampTo(x, bounds.left, bounds.right - width);
  else y = clampTo(y, bounds.top, bounds.bottom - height);

  const result: PlacementResult = {
    x,
    y,
    side,
    align,
    availableHeight: Math.max(
      0,
      side === 'bottom'
        ? bounds.bottom - y
        : side === 'top'
          ? y + height - bounds.top
          : bounds.bottom - bounds.top,
    ),
  };
  if (arrow) {
    // 对准锚点的中间；离浮层两端留出距离，尖角不画到圆角外
    const along = (center: number, start: number, length: number) =>
      clampTo(center - start - arrow.size / 2, arrow.padding, length - arrow.size - arrow.padding);
    if (isVertical(side)) result.arrowX = along(anchor.left + anchor.width / 2, x, width);
    else result.arrowY = along(anchor.top + anchor.height / 2, y, height);
  }
  return result;
}

/** 看得见的视口：手机上键盘弹出、双指放大时，是 visualViewport 那一块 */
function viewportRect(): FloatingRect {
  const view = window.visualViewport;
  if (view) {
    return { left: view.offsetLeft, top: view.offsetTop, width: view.width, height: view.height };
  }
  const root = document.documentElement;
  return { left: 0, top: 0, width: root.clientWidth, height: root.clientHeight };
}

/**
 * 元素挪了位置（没有滚动、没有变大小：上面的内容变高了，把它挤下去）时调用 onMove。
 * 做法同 floating-ui 的 layoutShift：一个交叉观察器，根的范围正好收到元素的边上，元素一挪交叉比例就变；
 * 每次变了按新位置重建。比每帧量一次省
 */
function observeMove(element: Element, onMove: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const root = document.documentElement;
  let observer: IntersectionObserver | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => {
    clearTimeout(timer);
    observer?.disconnect();
    observer = undefined;
  };
  function watch(moved: boolean, threshold = 1) {
    cleanup();
    const { left, top, width, height } = element.getBoundingClientRect();
    if (moved) onMove();
    if (!width || !height) return;
    const inset = (value: number) => `${-Math.floor(value)}px`;
    const rootMargin = [
      inset(top),
      inset(root.clientWidth - (left + width)),
      inset(root.clientHeight - (top + height)),
      inset(left),
    ].join(' ');
    let first = true;
    observer = new IntersectionObserver(
      (entries) => {
        const ratio = entries[0]!.intersectionRatio;
        if (ratio !== threshold) {
          if (!first) return watch(true);
          // 元素有一部分在视口外：按现在的比例重新观察；完全在外面时过一会儿再看
          if (ratio) watch(false, ratio);
          else timer = setTimeout(() => watch(false, 1e-7), 1000);
        }
        first = false;
      },
      { rootMargin, threshold: clampTo(threshold, 0, 1) || 1 },
    );
    observer.observe(element);
  }
  watch(false);
  return cleanup;
}

/**
 * 锚点、浮层的位置或大小可能变了的时候调用 update：页面或锚点的祖先滚动、窗口与视口变了大小、锚点或浮层变了大小、
 * 锚点挪了位置。先调用一次；返回停止的函数。
 */
export function autoUpdate(
  anchor: FloatingAnchor,
  floating: HTMLElement,
  update: () => void,
): () => void {
  const element = anchor instanceof Element ? anchor : (anchor.contextElement ?? null);
  // 滚动不冒泡，在 document 上捕获能收到任何元素的滚动：只管页面与锚点的祖先的
  // （浮层里面自己滚、别处的容器滚，位置都不变）
  const onScroll = (event: Event) => {
    const target = event.target;
    if (target === document || (target instanceof Node && element && target.contains(element)))
      update();
  };
  const view = window.visualViewport;
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  window.addEventListener('resize', update);
  view?.addEventListener('resize', update);
  view?.addEventListener('scroll', update);
  const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
  if (element) resize?.observe(element);
  resize?.observe(floating);
  const stopMove = anchor instanceof Element ? observeMove(anchor, update) : undefined;
  update();
  return () => {
    document.removeEventListener('scroll', onScroll, { capture: true });
    window.removeEventListener('resize', update);
    view?.removeEventListener('resize', update);
    view?.removeEventListener('scroll', update);
    resize?.disconnect();
    stopMove?.();
  };
}

/** 把 floating 定位到 anchor 旁边并持续跟随；floating 需要已经显示（如 showPopover 之后） */
export function anchorFloating(
  anchor: FloatingAnchor,
  floating: HTMLElement,
  {
    placement = 'bottom-start',
    offset: distance = 6,
    matchWidth,
    fitHeight,
    arrow,
    crossAxisFallback,
  }: FloatingOptions = {},
): Anchored {
  // 箭头伸出浮层一半（旋转后的对角线的一半约等于边长的 0.7）：距离加上这一段，尖角才不压在锚点上
  const arrowSize = arrow?.offsetWidth ?? 0;
  let stopped = false;
  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => (resolveReady = resolve));
  floating.style.visibility = 'hidden';

  /** 按现在量到的尺寸算一次 */
  const compute = (rect: DOMRect) =>
    computePlacement({
      anchor: rect,
      // 布局尺寸：进出场的缩放动画不影响它
      width: floating.offsetWidth,
      height: floating.offsetHeight,
      viewport: viewportRect(),
      placement,
      gap: distance + arrowSize * 0.7,
      rtl: getComputedStyle(floating).direction === 'rtl',
      padding: VIEWPORT_PADDING,
      crossAxisFallback,
      // 箭头离浮层的圆角留出距离，不会画到圆角外面
      arrow: arrow ? { size: arrowSize, padding: arrowSize } : undefined,
    });
  // 对齐到设备像素：小数的坐标会让文字、细边框发虚
  const snap = (value: number) => {
    const ratio = window.devicePixelRatio || 1;
    return Math.round(value * ratio) / ratio;
  };

  const update = () => {
    if (stopped) return;
    const rect = anchor.getBoundingClientRect();
    if (matchWidth) floating.style.minWidth = `${rect.width}px`;
    let result = compute(rect);
    if (fitHeight) {
      const height = floating.offsetHeight;
      floating.style.maxHeight = `${result.availableHeight}px`;
      // 限高之后变矮了：位置（放在上方时的顶边）要按新的高度再算一次
      if (floating.offsetHeight !== height) result = compute(rect);
    }
    const { x, y, side, align, arrowX, arrowY } = result;
    if (arrow) {
      Object.assign(arrow.style, {
        left: arrowX != null ? `${arrowX}px` : '',
        top: arrowY != null ? `${arrowY}px` : '',
        right: '',
        bottom: '',
        [ARROW_EDGE[side]]: `${-arrowSize / 2}px`,
        transform: `rotate(${ARROW_ROTATION[side]}deg)`,
      });
    }
    Object.assign(floating.style, {
      left: `${snap(x)}px`,
      top: `${snap(y)}px`,
      visibility: '',
      transformOrigin: TRANSFORM_ORIGIN[side],
    });
    floating.dataset.side = side;
    floating.dataset.align = align;
    resolveReady();
  };
  const cleanup = autoUpdate(anchor, floating, update);

  return {
    ready,
    stop() {
      if (stopped) return;
      stopped = true;
      cleanup();
    },
  };
}

/** 关闭浮层时焦点还给谁：true 锚点，元素，或 false 不还 */
export type RestoreFocus = boolean | HTMLElement | null;

/** createAnchoredLayer 的返回值：一个原生 popover 浮层的打开与关闭 */
export interface AnchoredLayer {
  /** 是否显示着（show 之后、hide 之前） */
  readonly visible: boolean;
  /** 显示 panel（showPopover）并贴着 anchor 定位；返回第一次定位完成、可以移入焦点的 Promise。已显示时不重复 */
  show(anchor: FloatingAnchor, panel: HTMLElement, options?: FloatingOptions): Promise<void>;
  /**
   * 停止定位并隐藏；焦点还在浮层里或已丢失时归还：restoreFocus 默认 true 还给锚点，给元素时还给它，false 不还。
   * 未显示时什么也不做
   */
  hide(options?: { restoreFocus?: RestoreFocus }): void;
}

/**
 * 锚定浮层的生命周期（Popover、Menu、Tooltip 共用）：显示 → 定位 → 关闭时停止定位、归还焦点。
 * 原生 popover="auto" 被 Esc、点击外部关闭（light dismiss）时浏览器先隐藏了它，组件在 toggle 事件里调用 hide 收尾。
 */
export function createAnchoredLayer(): AnchoredLayer {
  let current: { anchor: FloatingAnchor; panel: HTMLElement; anchored: Anchored } | undefined;
  let ready: Promise<void> = Promise.resolve();
  return {
    get visible() {
      return current != null;
    },
    show(anchor, panel, options) {
      if (current) return ready;
      if (!panel.matches(':popover-open')) panel.showPopover();
      const anchored = anchorFloating(anchor, panel, options);
      current = { anchor, panel, anchored };
      ready = anchored.ready;
      return ready;
    },
    hide({ restoreFocus = true } = {}) {
      if (!current) return;
      const { anchor, panel, anchored } = current;
      current = undefined;
      anchored.stop();
      if (panel.matches(':popover-open')) panel.hidePopover();
      const target = restoreFocus === true ? anchor : restoreFocus;
      if (target instanceof HTMLElement) returnFocus(panel, target);
    },
  };
}

/** useAnchoredPopover 每次渲染后读取的状态 */
export interface AnchoredPopoverState {
  /** 是否打开 */
  open: boolean;
  /** 锚点（触发器、输入框外壳，或右键菜单的虚拟锚点） */
  anchor: FloatingAnchor | null;
  /** 浮层（popover 元素） */
  panel: HTMLElement | null;
  /** 定位选项 */
  floating?: FloatingOptions;
  /**
   * 关闭时焦点还给谁：默认 true 还给锚点；锚点是输入框外壳时给打开按钮（DatePicker）；
   * 焦点一直在锚点上的组件（Select、Combobox）设 false
   */
  restoreFocus?: RestoreFocus;
}

/** useAnchoredPopover 的回调 */
export interface AnchoredPopoverEvents {
  /** 浏览器关掉了浮层：按了 Esc，或点了外面（别的浮层打开也算）；组件把 open 写回 false */
  close: (reason: 'escape' | 'outside', event: Event) => void;
  /** 浮层打开并第一次定位完成（可见）：移入焦点等 */
  shown?: (panel: HTMLElement) => void;
}

/**
 * 原生 popover="auto" 的锚定浮层接到组件的 open 上（Popover、Menu、Select、Combobox 共用）：
 * open 变化时显示或隐藏（DOM 更新之后），浏览器的 light dismiss 写回 open，卸载时收起。
 * 返回要放到浮层元素上的 onToggle。在组件 setup 里调用。
 *
 *   const { onToggle } = useAnchoredPopover(
 *     () => ({ open, anchor, panel, floating: { placement } }),
 *     { close: (reason, event) => setOpen(false, reason, event), shown: focusFirst },
 *   );
 */
export function useAnchoredPopover(
  read: () => AnchoredPopoverState,
  events: AnchoredPopoverEvents,
): { onToggle: (event: Event) => void } {
  const layer = createAnchoredLayer();
  trackEscape();

  watchPostEffect(() => {
    const { open, anchor, panel, floating, restoreFocus = true } = read();
    if (!open) {
      layer.hide({ restoreFocus });
      return;
    }
    if (!anchor || !panel) return;
    // 已经显示着（只是定位选项变了）时不再触发 shown，焦点不会被拉回第一项
    const opening = !layer.visible;
    const ready = layer.show(anchor, panel, floating);
    if (opening && events.shown) void ready.then(() => events.shown!(panel));
  });
  onScopeDispose(() => layer.hide({ restoreFocus: read().restoreFocus ?? true }));

  return {
    onToggle(event) {
      if ((event as ToggleEvent).newState === 'open') return;
      const state = read();
      if (state.open) events.close(closedByEscape(event) ? 'escape' : 'outside', event);
      layer.hide({ restoreFocus: state.restoreFocus ?? true });
    },
  };
}

// 最近一次按 Esc 的时间：light dismiss 的 toggle 事件不说原因，按时间判断是不是 Esc 关的
let escapeAt = -Infinity;
let trackingEscape = false;

/** 开始记录 Esc（整页一个监听，第一个浮层组件 setup 时装上） */
function trackEscape() {
  if (trackingEscape || typeof window === 'undefined') return;
  trackingEscape = true;
  window.addEventListener('keydown', (key) => key.key === 'Escape' && (escapeAt = key.timeStamp), {
    capture: true,
  });
}

/** toggle 事件紧跟在 Esc 之后（浏览器在按键后排队派发）就是 Esc 关的 */
const closedByEscape = (event: Event) => event.timeStamp - escapeAt < 250;
