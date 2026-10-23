/**
 * 平移与缩放：拖动平移，滚轮、触控板双指、触屏捏合以指针为中心缩放，键盘也能操作。
 * 图片预览（Lightbox）、流程图、大图表这类“在视口里看一块更大的内容”的场景用它。
 * 参考 panzoom、React Flow 的视口：状态只有平移 x、y 与缩放 scale，内容自己写 transform。
 *
 *   const view = usePanZoom({ viewport: () => box, min: 0.5, max: 4 });
 *   <div ref={box} tabindex="0" {...view.viewportProps}>
 *     <img style={{ transform: view.transform, transformOrigin: '0 0' }} />
 *   </div>
 *   <IconButton onClick={() => view.zoomIn()} … />
 *
 * - 指针：按下拖动平移（建在 startMove 上，拖过之后的 click 不算点击）；双击放大一档，已放大时回到初始；
 *   两个触点捏合缩放（中心是两指的中点）。
 * - 滚轮：wheel 为 'zoom'（默认，图片预览）时滚轮缩放；为 'pan' 时滚轮平移、按住 Ctrl / ⌘ 才缩放（流程图、画布）。
 *   触控板的双指缩放在浏览器里就是按着 Ctrl 的滚轮，两种模式下都是缩放。
 * - 键盘（视口要能聚焦）：+ / − 缩放，0 回到初始，方向键平移。
 * - bounds 给出内容的大小时限制平移：内容比视口大就不露出边外的空白，比视口小就居中。
 * 视口要设 touch-action: none（viewportProps 里已带），否则触屏拖动会被当成页面滚动。
 */
import { shallowRef } from 'vue';
import { clamp } from '../data/number';
import { useEventListener } from './event-listener';
import { startMove } from './move';

/** 平移与缩放的状态：内容先缩放、再平移（transform-origin 为左上角） */
export interface PanZoomState {
  /** 横向平移（px） */
  x: number;
  /** 纵向平移（px） */
  y: number;
  /** 缩放比例，1 为原大 */
  scale: number;
}

/** 滚轮的作用 */
export interface PanZoomWheelModes {
  /** 滚轮缩放（图片预览） */
  zoom: unknown;
  /** 滚轮平移，按住 Ctrl / ⌘ 缩放（画布、流程图） */
  pan: unknown;
}

/** usePanZoom 的选项 */
export interface PanZoomOptions {
  /** 接收拖动、滚轮的视口（元素或组件实例） */
  viewport: () => unknown;
  /** 最小缩放，默认 0.25 */
  min?: number;
  /** 最大缩放，默认 4 */
  max?: number;
  /** 每一档缩放的倍数（按钮、键盘、双击），默认 1.25 */
  step?: number;
  /** 初始状态，默认 { x: 0, y: 0, scale: 1 }；reset 回到它 */
  initial?: () => PanZoomState;
  /** 滚轮的作用，默认 zoom */
  wheel?: keyof PanZoomWheelModes;
  /** 内容的大小（缩放前）：给了就限制平移，不露出内容外的空白 */
  bounds?: () => { width: number; height: number } | undefined;
  /** 不可用：不响应拖动、滚轮与键盘 */
  disabled?: () => boolean;
}

/** usePanZoom 的返回值 */
export interface PanZoom {
  /** 横向平移（px） */
  readonly x: number;
  /** 纵向平移（px） */
  readonly y: number;
  /** 缩放比例 */
  readonly scale: number;
  /** 正在拖动或捏合：这期间内容不要加 transition */
  readonly interacting: boolean;
  /** 内容的 transform：`translate(xpx, ypx) scale(s)`，配 transform-origin: 0 0 */
  readonly transform: string;
  /** 放大一档；origin 是缩放中心（视口内坐标），默认视口中心 */
  zoomIn(origin?: Point): void;
  /** 缩小一档 */
  zoomOut(origin?: Point): void;
  /** 缩放到 scale（限制在 min–max） */
  zoomTo(scale: number, origin?: Point): void;
  /** 平移到 x、y */
  panTo(x: number, y: number): void;
  /** 回到初始状态 */
  reset(): void;
  /** 把 width × height 的内容整个放进视口并居中（不超过原大），返回用到的缩放 */
  fit(width: number, height: number, padding?: number): number;
  /** 视口的属性：展开到视口元素上 */
  readonly viewportProps: Record<string, unknown>;
}

/** 视口内的一点（相对视口左上角，px） */
export interface Point {
  /** 横坐标 */
  x: number;
  /** 纵坐标 */
  y: number;
}

/** 以 origin 为中心缩放到 next：origin 下的内容点缩放前后不动 */
export function zoomAround(state: PanZoomState, next: number, origin: Point): PanZoomState {
  const ratio = next / state.scale;
  return {
    x: origin.x - (origin.x - state.x) * ratio,
    y: origin.y - (origin.y - state.y) * ratio,
    scale: next,
  };
}

/** 平移的限制：内容比视口大时边缘不进到视口里，比视口小时居中 */
export function clampPan(
  state: PanZoomState,
  viewport: { width: number; height: number },
  content: { width: number; height: number },
): PanZoomState {
  const axis = (offset: number, view: number, size: number) =>
    size <= view ? (view - size) / 2 : clamp(offset, view - size, 0);
  return {
    x: axis(state.x, viewport.width, content.width * state.scale),
    y: axis(state.y, viewport.height, content.height * state.scale),
    scale: state.scale,
  };
}

/** 键盘方向键每次平移多少 px */
const KEY_PAN = 40;

/** 平移与缩放的状态与事件（在 setup 里调用） */
export function usePanZoom(options: PanZoomOptions): PanZoom {
  const min = options.min ?? 0.25;
  const max = options.max ?? 4;
  const step = options.step ?? 1.25;
  const initial = () => options.initial?.() ?? { x: 0, y: 0, scale: 1 };
  const state = shallowRef<PanZoomState>(initial());
  const interacting = shallowRef(false);
  // 按着的触点：两个时捏合
  const pointers = new Map<number, Point>();
  let pinch: { distance: number; state: PanZoomState } | undefined;

  const viewport = () => {
    const value = options.viewport();
    return value instanceof HTMLElement ? value : null;
  };
  const viewportSize = () => {
    const element = viewport();
    return { width: element?.clientWidth ?? 0, height: element?.clientHeight ?? 0 };
  };
  const center = (): Point => {
    const { width, height } = viewportSize();
    return { x: width / 2, y: height / 2 };
  };
  /** 事件的位置换成视口内坐标 */
  const local = (event: { clientX: number; clientY: number }): Point => {
    const rect = viewport()?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

  function apply(next: PanZoomState) {
    const content = options.bounds?.();
    state.value = content ? clampPan(next, viewportSize(), content) : next;
  }

  function zoomTo(scale: number, origin: Point = center()) {
    const next = clamp(scale, min, max);
    if (next === state.value.scale) return;
    apply(zoomAround(state.value, next, origin));
  }

  function onWheel(event: WheelEvent) {
    if (options.disabled?.()) return;
    const zoom = options.wheel !== 'pan' || event.ctrlKey || event.metaKey;
    event.preventDefault();
    if (!zoom) {
      apply({ ...state.value, x: state.value.x - event.deltaX, y: state.value.y - event.deltaY });
      return;
    }
    // 触控板的捏合每次 delta 很小、鼠标滚轮一格约 100：按 delta 连续缩放，两种都顺手
    const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.002));
    zoomTo(state.value.scale * factor, local(event));
  }
  // 要能 preventDefault（不让页面跟着滚、不让浏览器整页缩放）：不能是 passive
  useEventListener(viewport, 'wheel', onWheel, { passive: false });

  function onPointerdown(event: PointerEvent) {
    if (options.disabled?.() || event.button !== 0) return;
    pointers.set(event.pointerId, local(event));
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()] as [Point, Point];
      pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y), state: state.value };
      return;
    }
    const start = state.value;
    startMove(event, {
      threshold: 3,
      onMove: (point, move) => {
        pointers.set(move.pointerId, local(move));
        interacting.value = true;
        if (pinch) return;
        apply({ ...start, x: start.x + point.deltaX, y: start.y + point.deltaY });
      },
      onEnd: () => {
        pointers.clear();
        pinch = undefined;
        interacting.value = false;
      },
    });
  }

  // 第二个触点的移动：捏合（第一个触点的移动由 startMove 收到）
  function onPointermove(event: PointerEvent) {
    if (!pinch || !pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, local(event));
    const [a, b] = [...pointers.values()] as [Point, Point];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    const scale = clamp((pinch.state.scale * distance) / pinch.distance, min, max);
    apply(zoomAround(pinch.state, scale, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }));
  }

  function onPointerup(event: PointerEvent) {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = undefined;
  }

  function onDblclick(event: MouseEvent) {
    if (options.disabled?.()) return;
    if (state.value.scale > initial().scale) apply(initial());
    else zoomTo(state.value.scale * step * step, local(event));
  }

  function onKeydown(event: KeyboardEvent) {
    if (options.disabled?.() || event.altKey || event.ctrlKey || event.metaKey) return;
    const { x, y } = state.value;
    const actions: Record<string, () => void> = {
      '+': () => zoomTo(state.value.scale * step),
      '=': () => zoomTo(state.value.scale * step),
      '-': () => zoomTo(state.value.scale / step),
      '0': () => apply(initial()),
      ArrowLeft: () => apply({ ...state.value, x: x + KEY_PAN }),
      ArrowRight: () => apply({ ...state.value, x: x - KEY_PAN }),
      ArrowUp: () => apply({ ...state.value, y: y + KEY_PAN }),
      ArrowDown: () => apply({ ...state.value, y: y - KEY_PAN }),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  const viewportProps = {
    style: { touchAction: 'none', overflow: 'hidden' },
    onPointerdown,
    onPointermove,
    onPointerup,
    onPointercancel: onPointerup,
    onDblclick,
    onKeydown,
  };

  return {
    get x() {
      return state.value.x;
    },
    get y() {
      return state.value.y;
    },
    get scale() {
      return state.value.scale;
    },
    get interacting() {
      return interacting.value;
    },
    get transform() {
      const { x, y, scale } = state.value;
      return `translate(${x}px, ${y}px) scale(${scale})`;
    },
    zoomIn: (origin) => zoomTo(state.value.scale * step, origin),
    zoomOut: (origin) => zoomTo(state.value.scale / step, origin),
    zoomTo,
    panTo: (x, y) => apply({ ...state.value, x, y }),
    reset: () => apply(initial()),
    fit(width, height, padding = 0) {
      const view = viewportSize();
      const scale = clamp(
        Math.min((view.width - padding * 2) / width, (view.height - padding * 2) / height, 1),
        min,
        max,
      );
      state.value = {
        x: (view.width - width * scale) / 2,
        y: (view.height - height * scale) / 2,
        scale,
      };
      return scale;
    },
    viewportProps,
  };
}
