/**
 * 画布：在一块能平移、缩放的视口里摆放节点（HTML）与连线（SVG）。流程图、组织架构图、关系图都建在它上面：
 * 节点长什么样由使用方渲染（children 是渲染函数），画布负责定位、视口、选择、焦点与连线。
 *
 *   let selection = _state<DiagramSelection>({ nodes: [], edges: [] });
 *   <Diagram nodes={nodes} edges={edges} getNodeLabel={(node) => node.name} selectable _selected={selection} fitView aria-label="组织架构">
 *     {(node) => <OrgCard person={node} />}
 *   </Diagram>
 *
 * - 视口（见 useDiagram）：滚轮平移，按住 Ctrl / ⌘ 或触控板捏合缩放；拖动空白处平移，dragMode="select" 时改为框选、
 *   按住空格再拖动才平移；视口有焦点时方向键平移、+ / − 缩放、0 回到适应内容。fitView 在第一次有尺寸时把内容放进视口。
 * - 选择（selectable）：点节点或连线选中它，按住 Shift / Ctrl / ⌘ 再点加选或取消；按住 Shift 拖动空白处框选
 *   （selectionMode：整个框住才算，或碰到就算），按住 Ctrl / ⌘ 时框到的加进原来的选择；点空白处、Esc 清空，
 *   Ctrl / ⌘ + A 全选。_selected 双向绑定。
 * - 键盘：节点（可选择时连线也是）按数组顺序用 Tab 聚焦，Enter / 空格选中；键盘聚焦到视口外的节点时自动平移过去。
 * - 连线：points 是折线（排布、路由的结果），没给时画两个节点之间的直线、两端落在节点边框上；终点画箭头，拐角是圆角。
 *   线与箭头都是 currentColor，propsEdge 按连线给 sx 的 color 就能改色，给 strokeDasharray 画虚线。
 * - overlay 里的内容（DiagramControls、图例）浮在最上面、不随视口动，经 DiagramContext 拿到控制器。
 * 部件：Root（视口）、World（随视口平移缩放的一层）、Node（节点框）、Edge（每条连线的 g）、EdgeText（连线上的文字）、Marquee（框选框）。
 */
import { _component, createContext } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useMessages } from '../config/lang/messages';
import { t } from '../config/theme/tokens';
import { startMove } from '../utils/dom/move';
import { useResizeObserver } from '../utils/dom/resize';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { interactionTransitions } from '../utils/style/transitions';
import { diagramInternals, useDiagram, type DiagramController } from './controller';
import {
  arrowHead,
  borderPoint,
  boundsOf,
  polylineMidpoint,
  polylinePath,
  rectCenter,
  rectContains,
  rectFromCorners,
  rectsIntersect,
  trimEnd,
  type DiagramPoint,
  type DiagramRect,
} from './geometry';
import { diagramMessages } from './messages';

/** 画布上的一个节点：位置与大小（画布坐标），其余字段使用方自己用 */
export interface DiagramNodeItem extends DiagramRect {
  /** 节点的标识：连线的 from、to 与选择里用它 */
  id: string;
}

/** 画布上的一条连线 */
export interface DiagramEdgeItem {
  /** 连线的标识 */
  id: string;
  /** 起点节点 */
  from: string;
  /** 终点节点 */
  to: string;
  /** 折线经过的点（画布坐标，含两端）；不给时画两个节点之间的直线 */
  points?: readonly DiagramPoint[];
  /** 连线文字的位置；不给时放在折线走到一半的地方 */
  labelAt?: DiagramPoint;
}

/** 选中的节点与连线（标识） */
export interface DiagramSelection {
  /** 选中的节点 */
  readonly nodes: readonly string[];
  /** 选中的连线 */
  readonly edges: readonly string[];
}

/** 节点、连线渲染时的状态 */
export interface DiagramItemState {
  /** 已选中 */
  readonly selected: boolean;
}

/** 拖动空白处做什么 */
export interface DiagramDragModes {
  /** 平移视口；按住 Shift 拖动是框选（看图为主：流程图、组织架构图） */
  pan: unknown;
  /** 框选；按住空格拖动、滚轮平移（编辑为主：设计器） */
  select: unknown;
}

/** 框选时怎样算选中 */
export interface DiagramSelectionModes {
  /** 整个在框里才选中 */
  full: unknown;
  /** 碰到框就选中 */
  partial: unknown;
}

/** 背景的网格 */
export interface DiagramGrids {
  /** 不画 */
  none: unknown;
  /** 点阵（设计器） */
  dots: unknown;
  /** 线格 */
  lines: unknown;
}

/** 未声明的属性落到视口（Root）上：aria-label 写画布画的是什么 */
export interface DiagramProps<
  N extends DiagramNodeItem,
  E extends DiagramEdgeItem,
> extends PartProps<'div', 'role' | 'tabindex'> {
  /** 节点：位置与大小由使用方给（排布的结果或用户摆的位置） */
  nodes: readonly N[];
  /** 连线 */
  edges?: readonly E[];
  /** 节点的内容：节点框（定位、选中、焦点）由画布画，里面画什么由这里给；内容会被拉伸到节点的大小 */
  children: (node: N, state: DiagramItemState) => VNodeChild;
  /** 节点的无障碍名称（读屏念的；连线的默认名称“从 A 到 B”也用它） */
  getNodeLabel: (node: N) => string;
  /** 连线的无障碍名称，默认“从 A 到 B” */
  getEdgeLabel?: (edge: E) => string;
  /** 连线上的文字（处理结果、条件）；返回空时不画 */
  edgeText?: (edge: E, state: DiagramItemState) => VNodeChild;
  /** 控制器（useDiagram）：画布外的按钮要缩放、适应内容时传进来；不传时画布自己建一个 */
  controller?: DiagramController;
  /** 节点与连线可以点选、框选 */
  selectable?: boolean;
  /** 选中的节点与连线：父级写 _selected={selection} 双向绑定 */
  _selected?: DiagramSelection;
  /** 拖动空白处做什么，默认 pan */
  dragMode?: keyof DiagramDragModes;
  /** 框选时怎样算选中，默认 full */
  selectionMode?: keyof DiagramSelectionModes;
  /** 背景的网格，默认 none */
  grid?: keyof DiagramGrids;
  /** 网格的间距（画布坐标），默认 20 */
  gridSize?: number;
  /** 第一次有尺寸时把全部内容放进视口（不超过原大）；用户动过视口之前，尺寸变了也重新适应。默认 false：从原点、原大开始 */
  fitView?: boolean;
  /** 内容的范围（画布坐标）：适应画布按它算。默认包住全部节点与连线；backdrop 比节点占得大时（泳道）写上它 */
  extent?: DiagramRect;
  /** 折线拐角的圆角半径，默认 6；0 为直角 */
  edgeRadius?: number;
  /** 画在连线下面、随视口平移缩放的内容（画布坐标的 HTML）：泳道、分区、背景标注 */
  backdrop?: VNodeChild;
  /** 浮在最上面、不随视口动的内容（视口坐标）：缩放按钮 DiagramControls、图例、小地图 */
  overlay?: VNodeChild;
  /** 随视口平移缩放的那一层的部件属性 */
  propsWorld?: PartProps<'div'>;
  /** 节点框的部件属性，可以按节点计算 */
  propsNode?: PartProps<'div'> | ((node: N, state: DiagramItemState) => PartProps<'div'>);
  /** 连线（g）的部件属性，可以按连线计算：改颜色写 sx 的 color，画虚线写 strokeDasharray */
  propsEdge?: PartProps<'g'> | ((edge: E, state: DiagramItemState) => PartProps<'g'>);
  /** 连线文字的部件属性，可以按连线计算 */
  propsEdgeText?: PartProps<'div'> | ((edge: E, state: DiagramItemState) => PartProps<'div'>);
  /** 框选框的部件属性 */
  propsMarquee?: PartProps<'div'>;
}

/** 画布里的部件（DiagramControls、小地图）取控制器 */
export const DiagramContext = createContext<DiagramController>('Diagram');

/** 箭头的长度（画布坐标） */
const ARROW = 9;
/** 网格的间距在屏幕上小于这么多 px 时放大四倍，缩得很小时不糊成一片 */
const MIN_GRID = 8;
const NO_SELECTION: DiagramSelection = { nodes: [], edges: [] };

/** Diagram 的样式 */
export const diagramStyles = css.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: '12rem',
    backgroundColor: '_surface',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    fontSize: '_sm',
    color: '_text',
    // 画布上点选、框选、按着 Shift 加选时不选中文字（节点里要能选中复制的内容自己写 userSelect: 'text'）
    userSelect: 'none',
    cursor: { default: 'grab', ':active': 'grabbing' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    outlineOffset: '_borderWidths.sm',
  },
  rootSelect: { cursor: 'default' },
  world: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    transformOrigin: '0 0',
    // 画布坐标与方向无关：从右到左的页面里节点的位置不镜像，节点里的文字照常跟随页面
    direction: 'ltr',
  },
  edges: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
    overflow: 'visible',
    pointerEvents: 'none',
  },
  edge: {
    color: { default: '_borderStrong', _pressed: '_accent', ':focus-visible': '_accent' },
    strokeWidth: { default: 1.5, _pressed: 2.5, ':focus-visible': 2.5 },
    outlineStyle: 'none',
  },
  edgeSelectable: {
    cursor: 'pointer',
    color: {
      default: '_borderStrong',
      ':hover': '_textMuted',
      _pressed: '_accent',
      ':focus-visible': '_accent',
    },
  },
  edgeLine: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  edgeArrow: { fill: 'currentColor', stroke: 'none' },
  // 加粗的透明命中区域：细线也好点中
  edgeHit: { fill: 'none', stroke: 'transparent', strokeWidth: 14, pointerEvents: 'stroke' },
  edgeText: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
    paddingInline: '4px',
    borderRadius: '_sm',
    fontSize: '0.85em',
    lineHeight: '_tight',
    whiteSpace: 'nowrap',
    color: '_textMuted',
    backgroundColor: '_surface',
    pointerEvents: 'none',
  },
  node: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
    display: 'grid',
    boxSizing: 'border-box',
    borderRadius: '_md',
    outlineStyle: { default: 'none', _pressed: 'solid', ':focus-visible': 'solid' },
    outlineWidth: '2px',
    outlineColor: { default: '_accent', ':focus-visible': '_focusRing' },
    outlineOffset: '3px',
  },
  nodeSelectable: { cursor: 'pointer' },
  marquee: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 3,
    pointerEvents: 'none',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_accent',
    borderRadius: '_xs',
    backgroundColor: `color-mix(in srgb, ${t.colors.accent} 10%, transparent)`,
  },
  overlay: { position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' },
});

/** 网格的图案：点阵、线格 */
const gridImages: Record<keyof DiagramGrids, string> = {
  none: 'none',
  dots: `radial-gradient(circle, ${t.colors.borderStrong} 1px, transparent 1.5px)`,
  lines: `linear-gradient(${t.colors.borderMuted} 1px, transparent 1px), linear-gradient(90deg, ${t.colors.borderMuted} 1px, transparent 1px)`,
};

/** 随视口变的样式：平移缩放、网格、节点与文字的位置（值变化只改元素上的变量，画布不重新渲染） */
export const diagramDynamicStyles = css.create({
  world: (x: number, y: number, scale: number) => ({
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
  }),
  grid: (kind: keyof DiagramGrids, x: number, y: number, scale: number, gridSize: number) => {
    const step = gridSize * scale < MIN_GRID ? gridSize * scale * 4 : gridSize * scale;
    return {
      backgroundImage: gridImages[kind],
      backgroundSize: `${step}px ${step}px`,
      backgroundPosition: `${x}px ${y}px`,
    };
  },
  box: (x: number, y: number, width: number, height: number) => ({
    transform: `translate(${x}px, ${y}px)`,
    width,
    height,
  }),
  at: (x: number, y: number) => ({ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }),
});

/** 部件属性可以是对象，也可以按节点、连线计算 */
function partOf<T, A extends unknown[]>(part: T | ((...args: A) => T) | undefined, ...args: A) {
  return typeof part === 'function' ? (part as (...args: A) => T)(...args) : part;
}

/** 按着加选键：Shift、Ctrl、⌘ */
const toggles = (event: MouseEvent | KeyboardEvent) =>
  event.shiftKey || event.ctrlKey || event.metaKey;

/** 画布 */
export const Diagram = _component(
  <N extends DiagramNodeItem, E extends DiagramEdgeItem>({
    nodes,
    edges = [],
    children,
    getNodeLabel,
    getEdgeLabel,
    edgeText,
    controller,
    selectable = false,
    _selected: selected = _bindable<DiagramSelection>(NO_SELECTION),
    dragMode = 'pan',
    selectionMode = 'full',
    grid = 'none',
    gridSize = 20,
    fitView = false,
    extent,
    edgeRadius = 6,
    backdrop,
    overlay,
    propsWorld,
    propsNode,
    propsEdge,
    propsEdgeText,
    propsMarquee,
    ...rest
  }: DiagramProps<N, E>) => {
    const messages = useMessages('diagram', diagramMessages);
    // 控制器只在创建时取：换控制器要换一个画布
    const diagram = _untrack(controller) ?? useDiagram();
    const internal = diagramInternals(diagram);
    DiagramContext.provide(diagram);

    const nodeById = _derived(new Map(nodes.map((node) => [node.id, node])));
    /** 每条连线的折线：给了 points 用它，没给时两个节点之间的直线；两端的节点缺了不画 */
    const routes = _derived.by(() =>
      edges.flatMap((edge) => {
        if (edge.points && edge.points.length >= 2) return [{ edge, points: edge.points }];
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        if (!from || !to) return [];
        const points = [borderPoint(from, rectCenter(to)), borderPoint(to, rectCenter(from))];
        return [{ edge, points }];
      }),
    );
    const bounds = _derived(
      boundsOf(
        nodes,
        routes.flatMap((route) => route.points),
      ),
    );
    const selectedNodes = _derived(new Set(selected.nodes));
    const selectedEdges = _derived(new Set(selected.edges));
    // 框选框（视口坐标）
    let marquee = _state.raw<DiagramRect | null>(null);
    // 按着空格：拖动一律平移（框选模式里平移的办法）
    let space = false;
    // 用户自己动过视口之后，尺寸变化不再自动适应
    let moved = false;

    internal.content = () => extent ?? bounds;
    const root = () => internal.element.value;
    const inOverlay = (target: EventTarget | null) =>
      target instanceof Element && target.closest('[data-diagram-overlay]') !== null;
    /** 事件发生在空白处：不在节点、连线、浮层里 */
    const onBackground = (target: EventTarget | null) =>
      target instanceof Element && !target.closest('[data-diagram-item],[data-diagram-overlay]');
    /** 这次按下要框选：可选择、在空白处、按的是主键，拖动方式是框选或按着 Shift */
    const startsMarquee = (event: PointerEvent) =>
      selectable &&
      !space &&
      event.button === 0 &&
      onBackground(event.target) &&
      (dragMode === 'select' || event.shiftKey);

    /** 视口（平移缩放）要不要处理这个事件；处理了就算用户动过视口 */
    function handlesViewport(event: PointerEvent | WheelEvent | MouseEvent | KeyboardEvent) {
      if (inOverlay(event.target)) return false;
      // 视口自己的按键（方向键平移、+ − 缩放）只在焦点就在视口上时生效，节点上的按键留给节点
      const handles =
        event.type === 'wheel'
          ? true
          : event.type === 'keydown'
            ? event.target === root()
            : space ||
              (onBackground(event.target) &&
                !(
                  event.type === 'pointerdown' &&
                  (dragMode === 'select' || (event as PointerEvent).shiftKey)
                ));
      if (handles) moved = true;
      return handles;
    }
    internal.filter = handlesViewport;

    // fitView：第一次有尺寸时适应内容；用户没动过视口时，尺寸变化（侧栏收起、窗口变宽）也重新适应
    useResizeObserver(root, () => {
      const element = root();
      if (!fitView || moved || !element || element.clientWidth === 0) return;
      diagram.fit();
    });

    const itemState = (kind: 'nodes' | 'edges', id: string): DiagramItemState => ({
      selected: (kind === 'nodes' ? selectedNodes : selectedEdges).has(id),
    });

    /** 点了一项：加选键按着时切换它，否则只选它 */
    function choose(kind: 'nodes' | 'edges', id: string, toggle: boolean) {
      if (!selectable) return;
      if (!toggle) {
        selected = { nodes: kind === 'nodes' ? [id] : [], edges: kind === 'edges' ? [id] : [] };
        return;
      }
      const list = selected[kind];
      selected = {
        ...selected,
        [kind]: list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
      };
    }

    const clear = () => {
      if (selected.nodes.length || selected.edges.length) selected = NO_SELECTION;
    };
    const selectAll = () => {
      selected = {
        nodes: nodes.map((node) => node.id),
        edges: routes.map((route) => route.edge.id),
      };
    };

    function startMarquee(event: PointerEvent) {
      const element = root();
      if (!element || !startsMarquee(event)) return;
      const box = element.getBoundingClientRect();
      const origin = { x: event.clientX - box.left, y: event.clientY - box.top };
      const additive = event.ctrlKey || event.metaKey || (dragMode === 'select' && event.shiftKey);
      const base = additive ? selected : NO_SELECTION;
      const covers = (area: DiagramRect, rect: DiagramRect) =>
        selectionMode === 'partial' ? rectsIntersect(area, rect) : rectContains(area, rect);
      startMove(event, {
        threshold: 3,
        onMove: (point) => {
          const screen = rectFromCorners(origin, {
            x: point.clientX - box.left,
            y: point.clientY - box.top,
          });
          marquee = screen;
          const { x, y, scale } = diagram;
          const area = {
            x: (screen.x - x) / scale,
            y: (screen.y - y) / scale,
            width: screen.width / scale,
            height: screen.height / scale,
          };
          const next = {
            nodes: union(
              base.nodes,
              nodes.filter((node) => covers(area, node)).map((node) => node.id),
            ),
            edges: union(
              base.edges,
              routes
                .filter((route) => covers(area, boundsOf([], route.points)!))
                .map((route) => route.edge.id),
            ),
          };
          // 框到的没变时不写：画布只在选择真的变了才重新渲染
          if (!sameIds(next.nodes, selected.nodes) || !sameIds(next.edges, selected.edges)) {
            selected = next;
          }
        },
        onEnd: () => (marquee = null),
      });
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.key === ' ' && event.target === root()) space = true;
      if (!selectable) return;
      if (event.key === 'Escape') clear();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        selectAll();
      }
    }

    /** 节点、连线上的 Enter / 空格：选中（同点击） */
    const activate = (kind: 'nodes' | 'edges', id: string) => (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      choose(kind, id, toggles(event));
    };

    /** 键盘把焦点移到视口外的节点、连线时平移过去（鼠标点到的本来就看得见） */
    const reveal = (rect: DiagramRect) => (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.matches(':focus-visible')) {
        diagram.reveal(rect);
      }
    };

    return () => {
      const { view } = internal;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                diagramStyles.root,
                dragMode === 'select' && diagramStyles.rootSelect,
                diagramDynamicStyles.grid(grid, diagram.x, diagram.y, diagram.scale, gridSize),
              ],
            },
            rest,
            {
              ...view.viewportProps,
              ref: (element: unknown) => (internal.element.value = element as HTMLElement | null),
              role: 'group',
              tabindex: 0,
              'aria-roledescription': messages.canvas,
              onPointerdown: (event: PointerEvent) => {
                startMarquee(event);
                (view.viewportProps.onPointerdown as (event: PointerEvent) => void)(event);
              },
              onClick: (event: MouseEvent) => {
                if (selectable && onBackground(event.target)) clear();
              },
              onKeydown: (event: KeyboardEvent) => {
                onKeydown(event);
                (view.viewportProps.onKeydown as (event: KeyboardEvent) => void)(event);
              },
              onKeyup: (event: KeyboardEvent) => {
                if (event.key === ' ') space = false;
              },
              onBlur: () => (space = false),
              // 焦点移到视口外的节点时浏览器会滚动视口（overflow: hidden 也能被滚动），视口的位置只由平移决定
              onScroll: (event: Event) => {
                const element = event.currentTarget as HTMLElement;
                element.scrollTop = 0;
                element.scrollLeft = 0;
              },
            },
          )}
        >
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  diagramStyles.world,
                  diagramDynamicStyles.world(diagram.x, diagram.y, diagram.scale),
                ],
              },
              propsWorld,
            )}
          >
            {backdrop}
            {nodes.map((node) => {
              const state = itemState('nodes', node.id);
              return (
                <div
                  key={node.id}
                  {...mergeAttrs<'div'>(
                    {
                      sx: [
                        diagramStyles.node,
                        selectable && diagramStyles.nodeSelectable,
                        selectable && interactionTransitions.colors,
                        diagramDynamicStyles.box(node.x, node.y, node.width, node.height),
                      ],
                    },
                    partOf(propsNode, node, state),
                    {
                      ...dataAttrs({ 'data-diagram-item': 'node', 'data-node': node.id }),
                      'aria-roledescription': messages.node,
                      'aria-label': getNodeLabel(node),
                      ...(selectable
                        ? {
                            role: 'button',
                            tabindex: 0,
                            'aria-pressed': state.selected,
                            onClick: (event: MouseEvent) =>
                              choose('nodes', node.id, toggles(event)),
                            onKeydown: activate('nodes', node.id),
                            onFocus: reveal(node),
                          }
                        : { role: 'img' }),
                    },
                  )}
                >
                  {children(node, state)}
                </div>
              );
            })}
            <svg
              {...css.attrs(diagramStyles.edges)}
              width="1"
              height="1"
              aria-hidden={selectable ? undefined : 'true'}
            >
              {routes.map(({ edge, points }) => {
                const state = itemState('edges', edge.id);
                const from = nodeById.get(edge.from);
                const to = nodeById.get(edge.to);
                const path = polylinePath(trimEnd(points, ARROW * 0.7), edgeRadius);
                const interactive = selectable
                  ? {
                      role: 'button',
                      tabindex: 0,
                      'aria-roledescription': messages.edge,
                      'aria-label':
                        getEdgeLabel?.(edge) ??
                        messages.edgeBetween(
                          from ? getNodeLabel(from) : edge.from,
                          to ? getNodeLabel(to) : edge.to,
                        ),
                      'aria-pressed': state.selected,
                      onClick: (event: MouseEvent) => choose('edges', edge.id, toggles(event)),
                      onKeydown: activate('edges', edge.id),
                      onFocus: reveal(boundsOf([], points)!),
                    }
                  : {};
                return (
                  <g
                    key={edge.id}
                    {...mergeAttrs<'g'>(
                      { sx: [diagramStyles.edge, selectable && diagramStyles.edgeSelectable] },
                      partOf(propsEdge, edge, state),
                      {
                        ...dataAttrs({ 'data-diagram-item': 'edge', 'data-edge': edge.id }),
                        ...interactive,
                      },
                    )}
                  >
                    {selectable && <path d={path} {...css.attrs(diagramStyles.edgeHit)} />}
                    <path d={path} {...css.attrs(diagramStyles.edgeLine)} />
                    <polygon
                      points={arrowHead(points, ARROW)}
                      {...css.attrs(diagramStyles.edgeArrow)}
                    />
                  </g>
                );
              })}
            </svg>
            {edgeText &&
              routes.map(({ edge, points }) => {
                const state = itemState('edges', edge.id);
                const text = edgeText(edge, state);
                if (text == null || text === false || text === '') return null;
                const at = edge.labelAt ?? polylineMidpoint(points);
                return (
                  <div
                    key={edge.id}
                    {...mergeAttrs<'div'>(
                      { sx: [diagramStyles.edgeText, diagramDynamicStyles.at(at.x, at.y)] },
                      partOf(propsEdgeText, edge, state),
                      { 'aria-hidden': 'true' },
                    )}
                  >
                    {text}
                  </div>
                );
              })}
          </div>
          {marquee && (
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    diagramStyles.marquee,
                    diagramDynamicStyles.box(marquee.x, marquee.y, marquee.width, marquee.height),
                  ],
                },
                propsMarquee,
              )}
            />
          )}
          {overlay != null && (
            <div {...css.attrs(diagramStyles.overlay)} data-diagram-overlay="">
              {overlay}
            </div>
          )}
        </div>
      );
    };
  },
);

/** 两组标识合在一起，去掉重复 */
const union = (a: readonly string[], b: readonly string[]) => [...new Set([...a, ...b])];

/** 两组标识是否相同（顺序无关） */
function sameIds(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}
