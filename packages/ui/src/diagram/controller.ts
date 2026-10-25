/**
 * 画布的控制器：视口（平移、缩放、适应内容）与坐标换算，交给 Diagram 与画布外的工具栏共用（RUNES.md §7 的控制器对象）。
 *
 *   const diagram = useDiagram({ maxScale: 2 });
 *   <IconButton icon={Maximize} aria-label="适应画布" onClick={() => diagram.fit()} />
 *   <Diagram controller={diagram} nodes={nodes} … />
 *
 * 视口建在 usePanZoom 上：滚轮平移、按住 Ctrl / ⌘ 或触控板捏合缩放，拖动空白处平移，键盘的方向键、+ / −；
 * 回到初始（键盘 0、已放大时双击）回到“适应内容”。不传 controller 时 Diagram 自己建一个。
 */
import { shallowRef } from 'vue';
import { fitTransform, usePanZoom, type PanZoom, type PanZoomState } from '../utils/dom/pan-zoom';
import type { DiagramPoint, DiagramRect } from './geometry';

/** useDiagram 的选项 */
export interface DiagramOptions {
  /** 最小缩放，默认 0.2 */
  minScale?: number;
  /** 最大缩放，默认 2 */
  maxScale?: number;
  /** 每一档缩放的倍数（按钮、键盘），默认 1.2 */
  step?: number;
  /** 适应内容时四周留的空白（px），默认 48：画布角上的缩放按钮不压住节点 */
  fitPadding?: number;
}

/** 画布的控制器 */
export interface DiagramController {
  /** 视口的横向平移（px） */
  readonly x: number;
  /** 视口的纵向平移（px） */
  readonly y: number;
  /** 缩放比例，1 为原大 */
  readonly scale: number;
  /** 正在拖动平移或捏合：这期间不要加过渡动画 */
  readonly interacting: boolean;
  /** 能不能再放大、缩小（按钮的可用状态） */
  readonly canZoomIn: boolean;
  /** 能不能再缩小 */
  readonly canZoomOut: boolean;
  /** 放大一档（以视口中心为准） */
  zoomIn(): void;
  /** 缩小一档 */
  zoomOut(): void;
  /** 缩放到 scale（限制在 minScale–maxScale），以视口中心为准 */
  zoomTo(scale: number): void;
  /** 把全部内容放进视口并居中（不超过原大）；还没有内容或视口时什么也不做 */
  fit(): void;
  /** 平移到让这块区域（画布坐标）整个看得见，四周留 margin（px）；已经看得见时不动 */
  reveal(rect: DiagramRect, margin?: number): void;
  /** 页面坐标（clientX、clientY）换成画布坐标 */
  toDiagram(clientX: number, clientY: number): DiagramPoint;
}

/** Diagram 接上控制器用的内部接口：不在公开类型里 */
export interface DiagramInternals {
  /** 视口元素：Diagram 挂载后写入 */
  readonly element: { value: HTMLElement | null };
  /** 读内容的边界（画布坐标）：Diagram 交进来 */
  content: () => DiagramRect | undefined;
  /** 挑出视口要处理的事件：Diagram 按拖动方式、点在哪里交进来 */
  filter: (event: PointerEvent | WheelEvent | MouseEvent | KeyboardEvent) => boolean;
  /** 视口的事件属性：展开到视口元素上 */
  readonly view: PanZoom;
  /** 适应内容时的状态；还没有内容或视口时 undefined */
  fitted(): PanZoomState | undefined;
}

const internals = new WeakMap<DiagramController, DiagramInternals>();

/** 控制器的内部接口（只给 Diagram 与本目录的部件用） */
export function diagramInternals(controller: DiagramController): DiagramInternals {
  const found = internals.get(controller);
  if (!found) throw new Error('Diagram: controller 要用 useDiagram() 创建');
  return found;
}

/** 创建画布的控制器（在 setup 里调用） */
export function useDiagram(options: DiagramOptions = {}): DiagramController {
  const min = options.minScale ?? 0.2;
  const max = options.maxScale ?? 2;
  const padding = options.fitPadding ?? 48;
  const element = shallowRef<HTMLElement | null>(null);
  const size = () => ({
    width: element.value?.clientWidth ?? 0,
    height: element.value?.clientHeight ?? 0,
  });

  const own: Omit<DiagramInternals, 'view'> = {
    element,
    content: () => undefined,
    filter: () => true,
    fitted() {
      const content = own.content();
      const viewport = size();
      if (!content || viewport.width === 0 || viewport.height === 0) return undefined;
      return fitTransform(viewport, content, { padding, min, max });
    },
  };
  const view = usePanZoom({
    viewport: () => element.value,
    min,
    max,
    step: options.step ?? 1.2,
    wheel: 'pan',
    initial: () => own.fitted() ?? { x: 0, y: 0, scale: 1 },
    filter: (event) => own.filter(event),
  });
  const zoomTo = (scale: number) => view.zoomTo(scale);

  const controller: DiagramController = {
    get x() {
      return view.x;
    },
    get y() {
      return view.y;
    },
    get scale() {
      return view.scale;
    },
    get interacting() {
      return view.interacting;
    },
    get canZoomIn() {
      return view.scale < max;
    },
    get canZoomOut() {
      return view.scale > min;
    },
    zoomIn: () => view.zoomIn(),
    zoomOut: () => view.zoomOut(),
    zoomTo,
    fit() {
      const content = own.content();
      if (content && element.value) view.fit(content, padding);
    },
    reveal(rect, margin = 24) {
      const { width, height } = size();
      const { x, y, scale } = view;
      // 一个方向上：区域在视口外就挪到刚好露出来，比视口还大时对齐起始边
      const shift = (offset: number, start: number, length: number, room: number) => {
        const from = start * scale + offset;
        const to = from + length * scale;
        if (to - from > room - margin * 2 || from < margin) return offset + margin - from;
        if (to > room - margin) return offset + room - margin - to;
        return offset;
      };
      view.panTo(shift(x, rect.x, rect.width, width), shift(y, rect.y, rect.height, height));
    },
    toDiagram(clientX, clientY) {
      const box = element.value?.getBoundingClientRect();
      return {
        x: (clientX - (box?.left ?? 0) - view.x) / view.scale,
        y: (clientY - (box?.top ?? 0) - view.y) / view.scale,
      };
    },
  };
  internals.set(controller, Object.assign(own, { view }));
  return controller;
}
