/**
 * 画布：在一块能平移、缩放的视口里摆放节点（HTML）与连线（SVG）。流程图、组织架构图、关系图都建在它上面：
 * 画布负责定位、视口、选择、拖动、连线与焦点；节点默认画成 DiagramNode（标题是 getNodeLabel），
 * 要别的样子时 children 给渲染函数，常见的是换 DiagramNode 的属性（说明、图标、色调、形状）。
 *
 *   let selection = _state<DiagramSelection>({ nodes: [], edges: [] });
 *   <Diagram nodes={nodes} edges={edges} getNodeLabel={(node) => node.name} selectable _selected={selection} fitView aria-label="组织架构">
 *     {(node) => <DiagramNode title={node.name} description={node.title} />}
 *   </Diagram>
 *
 * - 视口（见 useDiagram）：滚轮平移，按住 Ctrl / ⌘ 或触控板捏合缩放；拖动空白处平移，dragMode="select" 时改为框选、
 *   按住空格再拖动才平移；视口有焦点时方向键平移、+ / − 缩放、0 回到适应内容。fitView 在第一次有尺寸时把内容放进视口。
 * - 选择（selectable）：点节点或连线选中它，按住 Shift / Ctrl / ⌘ 再点加选或取消；按住 Shift 拖动空白处框选
 *   （selectionMode：整个框住才算，或碰到就算），按住 Ctrl / ⌘ 时框到的加进原来的选择；点空白处、Esc 清空，
 *   Ctrl / ⌘ + A 全选。_selected 双向绑定。
 * - 拖动（draggable）：拖节点（选中的一起拖），snapToGrid 吸附网格，guides 与别的节点对齐时吸过去并画对齐线，
 *   拖到视口边上自动平移，Esc 取消；聚焦的节点按方向键挪一步（Shift 五步）。位置由使用方保存：松开后 onNodesMove 给出新位置。
 * - 连线（connectable）：悬停或选中的节点四条边上出现端口，从端口拖到另一个节点上松开调用 onConnect；
 *   选中的连线两端出现把手，拖到别的节点上调用 onReconnect。canConnect 决定能不能连，不能连的节点不高亮。
 * - 连线的画法：points 是折线（排布、路由的结果），没给时按 routing 画：straight 是两个节点之间的直线，
 *   orthogonal 是绕开节点的正交折线（routeEdges）；拖动时相连的线按 routing 实时重画。终点画箭头，拐角是圆角；
 *   连线的 tone 改线与文字的颜色（退回、驳回用 danger），dashed 画虚线。backdrop 里放泳道 DiagramLanes。
 * - 键盘：节点（可选择时连线也是）按数组顺序用 Tab 聚焦，Enter / 空格选中；键盘聚焦到视口外的节点时自动平移过去。
 *   拖动、连线都有不用指针的做法：方向键挪节点，连线交给设计器的属性面板（WCAG 2.5.7）。
 * - overlay 里的内容（DiagramControls、DiagramMinimap、图例）浮在最上面、不随视口动，经 DiagramContext 拿到控制器。
 * 部件：Root（视口）、World（随视口平移缩放的一层）、Node（节点框）、Port（端口）、Edge（每条连线的 g）、EdgeText（连线上的文字）、
 * Marquee（框选框）、Guide（对齐线）。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useMessages } from '../config/lang/messages';
import { t } from '../config/theme/tokens';
import { startMove } from '../utils/dom/move';
import { useResizeObserver } from '../utils/dom/resize';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { interactionTransitions } from '../utils/style/transitions';
import type { StatusTone } from '../utils/style/tone-styles';
import { diagramInternals, useDiagram, type DiagramController } from './controller';
import { DiagramNode } from './DiagramNode';
import {
  alignToGuides,
  arrowHead,
  boundsOf,
  polylineMidpoint,
  polylinePath,
  rectAt,
  rectContains,
  rectFromCorners,
  rectsIntersect,
  trimEnd,
  type DiagramGuide,
  type DiagramPoint,
  type DiagramRect,
} from './geometry';
import { diagramMessages } from './messages';
import { nearestSide, routeEdges, sidePoint, straightRoute, type DiagramSide } from './route';

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
  /** 折线经过的点（画布坐标，含两端）；不给时按 routing 画 */
  points?: readonly DiagramPoint[];
  /** 从起点的哪条边出去（routing="orthogonal" 时用）；不写时自动选 */
  fromSide?: DiagramSide;
  /** 从终点的哪条边进来；不写时自动选 */
  toSide?: DiagramSide;
  /** 连线文字的位置；不给时放在折线走到一半的地方 */
  labelAt?: DiagramPoint;
  /** 色调：线、箭头与连线文字的颜色（退回、驳回用 danger，走过的路径用 success），默认中性的灰 */
  tone?: StatusTone;
  /** 画成虚线：可选的、还没生效的连线 */
  dashed?: boolean;
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

/** 拖动结束后一个节点的新位置 */
export interface DiagramNodeMove {
  /** 节点的标识 */
  readonly id: string;
  /** 新的横坐标 */
  readonly x: number;
  /** 新的纵坐标 */
  readonly y: number;
}

/** 从端口拖出的一条新连线 */
export interface DiagramConnection {
  /** 起点节点 */
  readonly from: string;
  /** 终点节点 */
  readonly to: string;
  /** 从起点的哪条边出去 */
  readonly fromSide: DiagramSide;
  /** 从终点的哪条边进来（松开时离指针最近的边） */
  readonly toSide: DiagramSide;
}

/** 拖动连线的一端改接到别的节点 */
export interface DiagramReconnection {
  /** 连线的标识 */
  readonly edge: string;
  /** 改的是哪一端 */
  readonly end: 'from' | 'to';
  /** 改接到的节点 */
  readonly node: string;
  /** 从这个节点的哪条边进出 */
  readonly side: DiagramSide;
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

/** 没给折线的连线怎样画 */
export interface DiagramRoutings {
  /** 两个节点之间的直线，两端落在边框上 */
  straight: unknown;
  /** 绕开节点的正交折线（横竖两个方向，拐弯少，同一条边上的几条线排开） */
  orthogonal: unknown;
}

/** 未声明的属性落到视口（Root）上：aria-label 写画布画的是什么 */
export interface DiagramProps<
  N extends DiagramNodeItem,
  E extends DiagramEdgeItem,
> extends PartProps<'div', 'role' | 'tabindex' | 'draggable'> {
  /** 节点：位置与大小由使用方给（排布的结果或用户摆的位置） */
  nodes: readonly N[];
  /** 连线 */
  edges?: readonly E[];
  /** 节点的内容：节点框（定位、选中、焦点）由画布画，里面画什么由这里给，内容拉伸到节点的大小。默认是标题为 getNodeLabel 的 DiagramNode */
  children?: (node: N, state: DiagramItemState) => VNodeChild;
  /** 节点的无障碍名称（读屏念的；连线的默认名称“从 A 到 B”也用它）。节点里画了文字时按同样的先后写进来（如“姓名，岗位”），语音控制才能按看得见的字找到它 */
  getNodeLabel: (node: N) => string;
  /** 连线的无障碍名称，默认“从 A 到 B” */
  getEdgeLabel?: (edge: E) => string;
  /** 连线上的文字（处理结果、条件）；返回空时不画 */
  edgeText?: (edge: E, state: DiagramItemState) => VNodeChild;
  /**
   * 视口的高（数字是 px）
   * @default 360
   */
  height?: number | string;
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
  /** 网格的间距（画布坐标），默认 20；snapToGrid 也按它吸附 */
  gridSize?: number;
  /** 第一次有尺寸时把全部内容放进视口（不超过原大）；用户动过视口之前，尺寸变了也重新适应。默认 false：从原点、原大开始 */
  fitView?: boolean;
  /** 内容的范围（画布坐标）：适应画布按它算。默认包住全部节点与连线；backdrop 比节点占得大时（泳道）写上它 */
  extent?: DiagramRect;
  /** 没给折线的连线怎样画，默认 straight；拖动时相连的线也按它重画 */
  routing?: keyof DiagramRoutings;
  /** 折线拐角的圆角半径，默认 6；0 为直角 */
  edgeRadius?: number;
  /** 节点可以拖动（可以按节点判断）；松开后 onNodesMove 给出新位置 */
  draggable?: boolean | ((node: N) => boolean);
  /** 拖动、方向键挪动时吸附到网格（gridSize） */
  snapToGrid?: boolean;
  /** 拖动时与别的节点的边、中线对齐就吸过去并画对齐线，默认 true */
  guides?: boolean;
  /** 拖动或方向键挪动后节点的新位置：使用方写回自己的数据（顺带记一步撤销） */
  onNodesMove?: (moves: DiagramNodeMove[]) => void;
  /** 能从节点的端口拖出连线；选中的连线两端可以拖去改接 */
  connectable?: boolean;
  /** 能不能从 from 连到 to（拖动时只高亮能连的节点）；默认除了自己都能连 */
  canConnect?: (from: N, to: N) => boolean;
  /** 从端口拖出连线、在另一个节点上松开 */
  onConnect?: (connection: DiagramConnection) => void;
  /** 拖动选中连线的一端、在别的节点上松开 */
  onReconnect?: (change: DiagramReconnection) => void;
  /** 画在连线下面、随视口平移缩放的内容（画布坐标的 HTML）：泳道、分区、背景标注 */
  backdrop?: VNodeChild;
  /** 浮在最上面、不随视口动的内容（视口坐标）：缩放按钮 DiagramControls、小地图 DiagramMinimap、图例 */
  overlay?: VNodeChild;
  /** 随视口平移缩放的那一层的部件属性 */
  propsWorld?: PartProps<'div'>;
  /** 节点框的部件属性，可以按节点计算 */
  propsNode?: PartProps<'div'> | ((node: N, state: DiagramItemState) => PartProps<'div'>);
  /** 端口的部件属性 */
  propsPort?: PartProps<'span'>;
  /** 连线（g）的部件属性，可以按连线计算（颜色、虚线用连线的 tone、dashed） */
  propsEdge?: PartProps<'g'> | ((edge: E, state: DiagramItemState) => PartProps<'g'>);
  /** 连线文字的部件属性，可以按连线计算 */
  propsEdgeText?: PartProps<'div'> | ((edge: E, state: DiagramItemState) => PartProps<'div'>);
  /** 框选框的部件属性 */
  propsMarquee?: PartProps<'div'>;
  /** 对齐线的部件属性 */
  propsGuide?: PartProps<'line'>;
}

/** 画布里的部件（DiagramControls、DiagramMinimap）取控制器 */
export const DiagramContext = createContext<DiagramController>('Diagram');

/** 箭头的长度（画布坐标） */
const ARROW = 9;
/** 网格的间距在屏幕上小于这么多 px 时放大四倍，缩得很小时不糊成一片 */
const MIN_GRID = 8;
/** 对齐线吸附的距离（屏幕 px） */
const GUIDE_TOLERANCE = 6;
/** 拖到离视口边多近开始自动平移（px） */
const EDGE_PAN = 32;
/** 没吸附网格时方向键一次挪多少（画布坐标） */
const NUDGE = 8;
const NO_SELECTION: DiagramSelection = { nodes: [], edges: [] };
const SIDES: readonly DiagramSide[] = ['top', 'right', 'bottom', 'left'];

/** Diagram 的样式 */
export const diagramStyles = css.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
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
  // 对齐线、拖出来的连线、改接把手：画在节点上面，除了把手都不挡指针
  above: { zIndex: 3 },
  edge: {
    color: { default: '_borderStrong', _pressed: '_accent', ':focus-visible': '_accent' },
    strokeWidth: { default: 1.5, _pressed: 2.5, ':focus-visible': 2.5 },
    outlineStyle: 'none',
  },
  edgeSelectable: {
    cursor: 'pointer',
    // :hover 的优先级高过 aria-pressed：悬停在选中的线上时还要是强调色
    color: {
      default: '_borderStrong',
      ':hover': { default: '_textMuted', _pressed: '_accent' },
      _pressed: '_accent',
      ':focus-visible': '_accent',
    },
  },
  edgeDashed: { strokeDasharray: '6 4' },
  edgeLine: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  edgeArrow: { fill: 'currentColor', stroke: 'none' },
  // 加粗的透明命中区域：细线也好点中
  edgeHit: { fill: 'none', stroke: 'transparent', strokeWidth: 14, pointerEvents: 'stroke' },
  edgeEnd: {
    fill: '_surface',
    stroke: '_accent',
    strokeWidth: 2,
    cursor: 'crosshair',
    pointerEvents: 'all',
  },
  preview: {
    color: '_accent',
    strokeWidth: 2,
    strokeDasharray: '6 4',
  },
  guide: { stroke: '_accent', strokeWidth: 1, strokeDasharray: '4 3' },
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
    // 选中、焦点的描边跟着节点的形状走（DiagramNode 的 shape）
    borderRadius: { default: '_md', ':has(> [data-diagram-shape="pill"])': '_full' },
    outlineStyle: {
      default: 'none',
      _pressed: 'solid',
      ':focus-visible': 'solid',
      '[data-link-target]': 'dashed',
    },
    outlineWidth: '2px',
    outlineColor: { default: '_accent', ':focus-visible': '_focusRing' },
    outlineOffset: '3px',
  },
  nodeSelectable: { cursor: 'pointer' },
  nodeDraggable: { cursor: { default: 'grab', ':active': 'grabbing' } },
  nodeDragging: { cursor: 'grabbing', opacity: 0.9 },
  port: {
    position: 'absolute',
    width: '10px',
    height: '10px',
    boxSizing: 'border-box',
    borderRadius: '_full',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '_accent',
    backgroundColor: '_surface',
    cursor: 'crosshair',
    transform: { default: 'translate(-50%, -50%)', ':hover': 'translate(-50%, -50%) scale(1.3)' },
    transition: `transform ${t.durations.sm} ${t.easings.standard}`,
  },
  portTop: { left: '50%', top: 0 },
  portRight: { left: '100%', top: '50%' },
  portBottom: { left: '50%', top: '100%' },
  portLeft: { left: 0, top: '50%' },
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

/** 有色调的连线：选中、焦点时照样是强调色 */
const toned = (color: string) => ({
  color: { default: color, _pressed: '_accent', ':focus-visible': '_accent' },
});

/** 连线的色调（neutral 用默认的灰） */
const edgeToneStyles = css.create({
  neutral: {},
  accent: toned('_accent'),
  info: toned('_infoText'),
  success: toned('_successText'),
  warning: toned('_warningText'),
  danger: toned('_dangerText'),
});

/** 连线文字的色调 */
const edgeTextToneStyles = css.create({
  neutral: {},
  accent: { color: '_accentText' },
  info: { color: '_infoText' },
  success: { color: '_successText' },
  warning: { color: '_warningText' },
  danger: { color: '_dangerText' },
});

const portStyles: Record<DiagramSide, typeof diagramStyles.portTop> = {
  top: diagramStyles.portTop,
  right: diagramStyles.portRight,
  bottom: diagramStyles.portBottom,
  left: diagramStyles.portLeft,
};

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
  height: (height: number | string) => ({ height }),
});

/** 部件属性可以是对象，也可以按节点、连线计算 */
function partOf<T, A extends unknown[]>(part: T | ((...args: A) => T) | undefined, ...args: A) {
  return typeof part === 'function' ? (part as (...args: A) => T)(...args) : part;
}

/** 按着加选键：Shift、Ctrl、⌘ */
const toggles = (event: MouseEvent | KeyboardEvent) =>
  event.shiftKey || event.ctrlKey || event.metaKey;

/** 方向键 → 挪动的方向 */
const ARROWS: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** 一条连线画出来的折线 */
interface Route<E> {
  edge: E;
  points: readonly DiagramPoint[];
}

/** 拖动中的节点：哪些在动、挪了多少、要画的对齐线 */
interface DragState {
  ids: ReadonlySet<string>;
  dx: number;
  dy: number;
  guides: DiagramGuide[];
}

/** 正在拖的连线：从哪一点到哪一点，指针下能连的节点 */
interface LinkState {
  from: DiagramPoint;
  to: DiagramPoint;
  target: string | null;
}

/**
 * 节点、连线视图收到的事件处理：画布在 setup 里建一次，传给每个视图的都是同一个对象，
 * 视图的 props 不因事件处理重新生成而变化（拖动、悬停时只有变了的节点与连线重新渲染）
 */
interface ItemActions {
  nodeDown(id: string, event: PointerEvent): void;
  nodeClick(id: string, event: MouseEvent): void;
  nodeKey(id: string, event: KeyboardEvent): void;
  nodeEnter(id: string): void;
  nodeLeave(id: string): void;
  portDown(id: string, side: DiagramSide, event: PointerEvent): void;
  edgeClick(id: string, event: MouseEvent): void;
  edgeKey(id: string, event: KeyboardEvent): void;
  endDown(id: string, end: 'from' | 'to', event: PointerEvent): void;
  focus(rect: DiagramRect, event: FocusEvent): void;
}

/** 节点视图的属性：位置单独给（拖动中只有动着的节点位置变），状态都是原始值，比较时不会每次都“变了” */
interface NodeViewProps {
  item: DiagramNodeItem;
  x: number;
  y: number;
  label: string;
  roleDescription: string;
  selected: boolean;
  selectable: boolean;
  focusable: boolean;
  movable: boolean;
  dragging: boolean;
  ports: boolean;
  linkTarget: boolean;
  render: (node: never, state: DiagramItemState) => VNodeChild;
  part?: PartProps<'div'> | ((node: never, state: DiagramItemState) => PartProps<'div'>);
  portPart?: PartProps<'span'>;
  actions: ItemActions;
}

/** 一个节点：节点框（定位、选中、焦点、拖动）、使用方画的内容、端口 */
const NodeView = _component(
  ({
    item,
    x,
    y,
    label,
    roleDescription,
    selected,
    selectable,
    focusable,
    movable,
    dragging,
    ports,
    linkTarget,
    render,
    part,
    portPart,
    actions,
  }: NodeViewProps) =>
    () => {
      const state: DiagramItemState = { selected };
      const id = item.id;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                diagramStyles.node,
                selectable && diagramStyles.nodeSelectable,
                selectable && interactionTransitions.colors,
                movable && diagramStyles.nodeDraggable,
                dragging && diagramStyles.nodeDragging,
                diagramDynamicStyles.box(x, y, item.width, item.height),
              ],
            },
            partOf(part, item as never, state),
            {
              ...dataAttrs({
                'data-diagram-item': 'node',
                'data-node': id,
                'data-link-target': linkTarget || undefined,
              }),
              'aria-roledescription': roleDescription,
              'aria-label': label,
              onPointerdown: (event: PointerEvent) => actions.nodeDown(id, event),
              onPointerenter: () => actions.nodeEnter(id),
              onPointerleave: () => actions.nodeLeave(id),
              ...(focusable
                ? {
                    role: 'button',
                    tabindex: 0,
                    'aria-pressed': selectable ? selected : undefined,
                    onClick: (event: MouseEvent) => actions.nodeClick(id, event),
                    onKeydown: (event: KeyboardEvent) => actions.nodeKey(id, event),
                    onFocus: (event: FocusEvent) =>
                      actions.focus({ x, y, width: item.width, height: item.height }, event),
                  }
                : { role: 'img' }),
            },
          )}
        >
          {render(item as never, state)}
          {ports &&
            SIDES.map((side) => (
              <span
                key={side}
                {...mergeAttrs<'span'>({ sx: [diagramStyles.port, portStyles[side]] }, portPart, {
                  ...dataAttrs({ 'data-diagram-port': side }),
                  'aria-hidden': 'true',
                  onPointerdown: (event: PointerEvent) => actions.portDown(id, side, event),
                })}
              />
            ))}
        </div>
      );
    },
);

/** 连线视图的属性：折线的数组只在这条线真的变了时才换（不动的线一直是同一个数组） */
interface EdgeViewProps {
  item: DiagramEdgeItem;
  points: readonly DiagramPoint[];
  label: string;
  roleDescription: string;
  radius: number;
  selected: boolean;
  selectable: boolean;
  part?: PartProps<'g'> | ((edge: never, state: DiagramItemState) => PartProps<'g'>);
  actions: ItemActions;
}

/** 一条连线：加粗的透明命中区域、线、箭头（改接的把手画在节点上面那层，见 Diagram） */
const EdgeView = _component(
  ({
    item,
    points,
    label,
    roleDescription,
    radius,
    selected,
    selectable,
    part,
    actions,
  }: EdgeViewProps) =>
    () => {
      const state: DiagramItemState = { selected };
      const path = polylinePath(trimEnd(points, ARROW * 0.7), radius);
      return (
        <g
          {...mergeAttrs<'g'>(
            {
              sx: [
                diagramStyles.edge,
                selectable && diagramStyles.edgeSelectable,
                item.tone && edgeToneStyles[item.tone],
                item.dashed && diagramStyles.edgeDashed,
              ],
            },
            partOf(part, item as never, state),
            {
              ...dataAttrs({ 'data-diagram-item': 'edge', 'data-edge': item.id }),
              ...(selectable
                ? {
                    role: 'button',
                    tabindex: 0,
                    'aria-roledescription': roleDescription,
                    'aria-label': label,
                    'aria-pressed': selected,
                    onClick: (event: MouseEvent) => actions.edgeClick(item.id, event),
                    onKeydown: (event: KeyboardEvent) => actions.edgeKey(item.id, event),
                    onFocus: (event: FocusEvent) => actions.focus(boundsOf([], points)!, event),
                  }
                : {}),
            },
          )}
        >
          {selectable && <path d={path} {...css.attrs(diagramStyles.edgeHit)} />}
          <path d={path} {...css.attrs(diagramStyles.edgeLine)} />
          <polygon points={arrowHead(points, ARROW)} {...css.attrs(diagramStyles.edgeArrow)} />
        </g>
      );
    },
);

/** 连线文字视图的属性 */
interface EdgeTextViewProps {
  item: DiagramEdgeItem;
  x: number;
  y: number;
  selected: boolean;
  render: (edge: never, state: DiagramItemState) => VNodeChild;
  part?: PartProps<'div'> | ((edge: never, state: DiagramItemState) => PartProps<'div'>);
}

/** 连线上的文字（HTML，画在连线上面）；渲染函数返回空时不画 */
const EdgeTextView = _component(
  ({ item, x, y, selected, render, part }: EdgeTextViewProps) =>
    () => {
      const state: DiagramItemState = { selected };
      const text = render(item as never, state);
      if (text == null || text === false || text === '') return null;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                diagramStyles.edgeText,
                item.tone && edgeTextToneStyles[item.tone],
                diagramDynamicStyles.at(x, y),
              ],
            },
            partOf(part, item as never, state),
            { 'aria-hidden': 'true' },
          )}
        >
          {text}
        </div>
      );
    },
);

/** 画布 */
export const Diagram = _component(
  <N extends DiagramNodeItem, E extends DiagramEdgeItem>({
    nodes,
    edges = [],
    children,
    getNodeLabel,
    getEdgeLabel,
    edgeText,
    height = 360,
    controller,
    selectable = false,
    _selected: selected = _bindable<DiagramSelection>(NO_SELECTION),
    dragMode = 'pan',
    selectionMode = 'full',
    grid = 'none',
    gridSize = 20,
    fitView = false,
    extent,
    routing = 'straight',
    edgeRadius = 6,
    draggable = false,
    snapToGrid = false,
    guides = true,
    onNodesMove,
    connectable = false,
    canConnect,
    onConnect,
    onReconnect,
    backdrop,
    overlay,
    propsWorld,
    propsNode,
    propsPort,
    propsEdge,
    propsEdgeText,
    propsMarquee,
    propsGuide,
    ...rest
  }: DiagramProps<N, E>) => {
    const messages = useMessages('diagram', diagramMessages);
    // 控制器只在创建时取：换控制器要换一个画布
    const diagram = _untrack(controller) ?? useDiagram();
    const internal = diagramInternals(diagram);
    DiagramContext.provide(diagram);

    // 框选框（视口坐标）、拖动中的节点、拖出来的连线、指针下的节点
    let marquee = _state.raw<DiagramRect | null>(null);
    let drag = _state.raw<DragState | null>(null);
    let link = _state.raw<LinkState | null>(null);
    let hovered = _state.raw<string | null>(null);
    // 按着空格：拖动一律平移（框选模式里平移的办法）
    let space = false;
    // 用户自己动过视口之后，尺寸变化不再自动适应
    let moved = false;

    /** 没给 children 时的节点：标题是无障碍名称的 DiagramNode */
    const defaultNode = (node: N) => <DiagramNode title={getNodeLabel(node)} />;
    const nodeById = _derived(new Map(nodes.map((node) => [node.id, node])));
    const draggableOf = (node: N) =>
      typeof draggable === 'function' ? draggable(node) : draggable;
    /** 节点现在的位置：拖动中的按拖到的位置 */
    const placed = (node: N): N =>
      drag?.ids.has(node.id) ? { ...node, x: node.x + drag.dx, y: node.y + drag.dy } : node;

    /** 不拖动时每条连线的折线：给了 points 用它，没给时按 routing 画；两端的节点缺了不画 */
    const restingRoutes = _derived.by(() => {
      const automatic = edges.filter((edge) => !hasPoints(edge));
      const routed = routing === 'orthogonal' ? routeEdges(nodes, automatic) : undefined;
      return edges.flatMap((edge): Route<E>[] => {
        if (hasPoints(edge)) return [{ edge, points: edge.points }];
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        if (!from || !to) return [];
        return [{ edge, points: routed?.get(edge.id) ?? straightRoute(from, to) }];
      });
    });
    /** 拖动中：与动着的节点相连的线按 routing 实时重画，别的线不动 */
    const routes = _derived.by(() => {
      if (!drag) return restingRoutes;
      const moving = drag.ids;
      const touches = (edge: E) => moving.has(edge.from) || moving.has(edge.to);
      const list = nodes.map(placed);
      const byId = new Map(list.map((node) => [node.id, node]));
      const touched = edges.filter(touches);
      const routed = routing === 'orthogonal' ? routeEdges(list, touched) : undefined;
      return restingRoutes.map((route): Route<E> => {
        if (!touches(route.edge)) return route;
        const from = byId.get(route.edge.from);
        const to = byId.get(route.edge.to);
        if (!from || !to) return route;
        return { edge: route.edge, points: routed?.get(route.edge.id) ?? straightRoute(from, to) };
      });
    });
    const bounds = _derived(
      boundsOf(
        nodes,
        restingRoutes.flatMap((route) => route.points),
      ),
    );
    const selectedNodes = _derived(new Set(selected.nodes));
    const selectedEdges = _derived(new Set(selected.edges));

    internal.content = () => extent ?? bounds;
    internal.nodes = () => nodes.map(placed);
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

    // 量视口的大小（小地图用）；fitView 时第一次有尺寸就适应内容，用户没动过视口时尺寸变化也重新适应
    useResizeObserver(root, () => {
      const element = root();
      if (!element) return;
      internal.size.value = { width: element.clientWidth, height: element.clientHeight };
      if (fitView && !moved && element.clientWidth > 0) diagram.fit();
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

    /**
     * 拖到视口边上时自动平移：指针停着不动也继续移，每移一帧调 onPan 让拖着的东西跟上指针
     * （拖动按指针的画布坐标算，视口挪了画布坐标就变了）
     */
    function edgePan(onPan: () => void) {
      let frame = 0;
      let speed = { x: 0, y: 0 };
      const tick = () => {
        frame = 0;
        if (!speed.x && !speed.y) return;
        internal.view.panTo(diagram.x + speed.x, diagram.y + speed.y);
        onPan();
        frame = requestAnimationFrame(tick);
      };
      return {
        follow(point: { clientX: number; clientY: number }) {
          const box = root()?.getBoundingClientRect();
          if (!box) return;
          const near = (distance: number) =>
            distance < EDGE_PAN ? Math.ceil((EDGE_PAN - distance) / 3) : 0;
          speed = {
            x: near(point.clientX - box.left) - near(box.right - point.clientX),
            y: near(point.clientY - box.top) - near(box.bottom - point.clientY),
          };
          if ((speed.x || speed.y) && !frame) frame = requestAnimationFrame(tick);
        },
        stop() {
          speed = { x: 0, y: 0 };
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
        },
      };
    }

    /** 拖动期间按 Esc 取消：在捕获阶段拦下，不让它再去清空选择 */
    function cancelOnEscape(cancel: () => void) {
      const onKey = (event: KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        cancel();
      };
      window.addEventListener('keydown', onKey, true);
      return () => window.removeEventListener('keydown', onKey, true);
    }

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

    /** 按在节点上：拖动它（选中的一起拖）；按在节点里的输入框、按钮、端口上时不拖 */
    function startDrag(node: N, event: PointerEvent) {
      if (event.button !== 0 || space || !draggableOf(node)) return;
      const target = event.target as Element;
      if (
        target.closest(
          '[data-diagram-port],input,textarea,select,button,a,[contenteditable="true"]',
        )
      ) {
        return;
      }
      const additive = toggles(event);
      const ids = selectedNodes.has(node.id)
        ? selected.nodes
        : additive
          ? [...selected.nodes, node.id]
          : [node.id];
      const moving = ids.flatMap((id) => {
        const item = nodeById.get(id);
        return item && draggableOf(item) ? [item] : [];
      });
      const others = nodes.filter((item) => !ids.includes(item.id));
      const start = diagram.toDiagram(event.clientX, event.clientY);
      let pointer = { clientX: event.clientX, clientY: event.clientY };
      let begun = false;
      let release = () => {};

      // 以按住的节点为准吸附网格与对齐线，算出整组挪多少
      const update = () => {
        const now = diagram.toDiagram(pointer.clientX, pointer.clientY);
        let x = node.x + now.x - start.x;
        let y = node.y + now.y - start.y;
        if (snapToGrid) {
          x = Math.round(x / gridSize) * gridSize;
          y = Math.round(y / gridSize) * gridSize;
        }
        let lines: DiagramGuide[] = [];
        if (guides) {
          const aligned = alignToGuides({ ...node, x, y }, others, GUIDE_TOLERANCE / diagram.scale);
          ({ x, y } = aligned);
          lines = aligned.guides;
        }
        drag = {
          ids: new Set(moving.map((item) => item.id)),
          dx: x - node.x,
          dy: y - node.y,
          guides: lines,
        };
      };
      const pan = edgePan(update);
      const cancel = startMove(event, {
        threshold: 3,
        onMove: (point) => {
          pointer = point;
          if (!begun) {
            begun = true;
            // 拖一个没选中的节点：选中它（按着加选键时加进原来的选择）
            if (selectable && !selectedNodes.has(node.id)) {
              selected = { nodes: ids, edges: additive ? selected.edges : [] };
            }
            release = cancelOnEscape(() => cancel());
          }
          update();
          pan.follow(point);
        },
        onEnd: ({ moved: dragged, cancelled }) => {
          pan.stop();
          release();
          const result = drag;
          drag = null;
          if (!dragged || cancelled || !result || (result.dx === 0 && result.dy === 0)) return;
          onNodesMove?.(
            moving.map((item) => ({ id: item.id, x: item.x + result.dx, y: item.y + result.dy })),
          );
        },
      });
    }

    /**
     * 拖一条连线：从 anchor 拉出来，松开在能连的节点上时 done(节点, 离指针最近的边)。
     * fixed 是不动的那一端的节点（连到它自己不算）；fixedIsSource 时它是起点、箭头在指针一端
     */
    function startLink(
      event: PointerEvent,
      anchor: DiagramPoint,
      fixed: N,
      fixedIsSource: boolean,
      done: (target: N, side: DiagramSide) => void,
    ) {
      if (event.button !== 0) return;
      event.stopPropagation();
      event.preventDefault();
      let pointer = { clientX: event.clientX, clientY: event.clientY };
      let release = () => {};
      let landing: { node: N; side: DiagramSide } | null = null;
      const allowed = (candidate: N) =>
        candidate.id !== fixed.id &&
        (canConnect?.(fixedIsSource ? fixed : candidate, fixedIsSource ? candidate : fixed) ??
          true);
      const update = () => {
        const point = diagram.toDiagram(pointer.clientX, pointer.clientY);
        const hit = rectAt(nodes, point);
        landing = hit && allowed(hit) ? { node: hit, side: nearestSide(hit, point) } : null;
        const end = landing ? sidePoint(landing.node, landing.side) : point;
        link = {
          from: fixedIsSource ? anchor : end,
          to: fixedIsSource ? end : anchor,
          target: landing?.node.id ?? null,
        };
      };
      const pan = edgePan(update);
      update();
      const cancel = startMove(event, {
        // 端口、改接把手拖动中会消失：捕获放在画布上；松开时的 click 也落在画布上，不能当成点空白处
        captureTarget: root() ?? undefined,
        swallowClick: true,
        onMove: (point) => {
          pointer = point;
          update();
          pan.follow(point);
        },
        onEnd: ({ cancelled }) => {
          pan.stop();
          release();
          link = null;
          if (!cancelled && landing) done(landing.node, landing.side);
        },
      });
      release = cancelOnEscape(() => cancel());
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

    /** 节点上的方向键：挪动（选中的一起挪，Shift 五步） */
    function nudge(node: N, event: KeyboardEvent) {
      const arrow = ARROWS[event.key];
      if (!arrow || !onNodesMove || !draggableOf(node)) return;
      event.preventDefault();
      const step = (snapToGrid ? gridSize : NUDGE) * (event.shiftKey ? 5 : 1);
      const ids = selectedNodes.has(node.id) ? selected.nodes : [node.id];
      onNodesMove(
        ids.flatMap((id) => {
          const item = nodeById.get(id);
          return item && draggableOf(item)
            ? [{ id, x: item.x + arrow[0] * step, y: item.y + arrow[1] * step }]
            : [];
        }),
      );
    }

    /** Enter / 空格：选中（同点击） */
    function activates(event: KeyboardEvent) {
      if (event.key !== 'Enter' && event.key !== ' ') return false;
      event.preventDefault();
      return true;
    }

    const actions: ItemActions = {
      nodeDown(id, event) {
        const node = nodeById.get(id);
        if (node) startDrag(node, event);
      },
      nodeClick: (id, event) => choose('nodes', id, toggles(event)),
      nodeKey(id, event) {
        const node = nodeById.get(id);
        if (!node) return;
        if (activates(event)) choose('nodes', id, toggles(event));
        else nudge(node, event);
      },
      nodeEnter: (id) => (hovered = id),
      nodeLeave(id) {
        if (hovered === id) hovered = null;
      },
      portDown(id, side, event) {
        const node = nodeById.get(id);
        if (!node) return;
        startLink(event, sidePoint(node, side), node, true, (target, toSide) =>
          onConnect?.({ from: id, to: target.id, fromSide: side, toSide }),
        );
      },
      edgeClick: (id, event) => choose('edges', id, toggles(event)),
      edgeKey(id, event) {
        if (activates(event)) choose('edges', id, toggles(event));
      },
      endDown(id, end, event) {
        const route = routes.find((item) => item.edge.id === id);
        const from = route && nodeById.get(route.edge.from);
        const to = route && nodeById.get(route.edge.to);
        if (!route || !from || !to || !onReconnect) return;
        const { points } = route;
        // 拖的是终点：不动的是起点，箭头在指针一端；拖的是起点：反过来
        const anchor = end === 'to' ? points[0]! : points[points.length - 1]!;
        startLink(event, anchor, end === 'to' ? from : to, end === 'to', (target, side) =>
          onReconnect({ edge: id, end, node: target.id, side }),
        );
      },
      // 键盘把焦点移到视口外的节点、连线时平移过去（鼠标点到的本来就看得见）
      focus(rect, event) {
        if (event.target instanceof Element && event.target.matches(':focus-visible')) {
          diagram.reveal(rect);
        }
      },
    };

    return () => {
      const { view } = internal;
      const focusable = selectable || !!onNodesMove;
      // 选中的连线两端的改接把手：两端的节点都在时才能改接
      const ends =
        connectable && onReconnect && !drag && !link
          ? routes.filter(
              ({ edge }) =>
                selectedEdges.has(edge.id) && nodeById.has(edge.from) && nodeById.has(edge.to),
            )
          : [];
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                diagramStyles.root,
                diagramDynamicStyles.height(height),
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
              dataAttrs({ 'data-diagram-world': true }),
            )}
          >
            {backdrop}
            {nodes.map((node) => {
              const at = placed(node);
              const isSelected = selectedNodes.has(node.id);
              return (
                <NodeView
                  key={node.id}
                  item={node}
                  x={at.x}
                  y={at.y}
                  label={getNodeLabel(node)}
                  roleDescription={messages.node}
                  selected={isSelected}
                  selectable={selectable}
                  focusable={focusable}
                  movable={draggableOf(node)}
                  dragging={drag?.ids.has(node.id) ?? false}
                  ports={
                    connectable &&
                    !drag &&
                    (hovered === node.id || isSelected || link?.target === node.id)
                  }
                  linkTarget={link?.target === node.id}
                  render={(children ?? defaultNode) as NodeViewProps['render']}
                  part={propsNode as NodeViewProps['part']}
                  portPart={propsPort}
                  actions={actions}
                />
              );
            })}
            <svg
              {...css.attrs(diagramStyles.edges)}
              width="1"
              height="1"
              aria-hidden={selectable ? undefined : 'true'}
            >
              {routes.map(({ edge, points }) => {
                const from = nodeById.get(edge.from);
                const to = nodeById.get(edge.to);
                const isSelected = selectedEdges.has(edge.id);
                return (
                  <EdgeView
                    key={edge.id}
                    item={edge}
                    points={points}
                    label={
                      getEdgeLabel?.(edge) ??
                      messages.edgeBetween(
                        from ? getNodeLabel(from) : edge.from,
                        to ? getNodeLabel(to) : edge.to,
                      )
                    }
                    roleDescription={messages.edge}
                    radius={edgeRadius}
                    selected={isSelected}
                    selectable={selectable}
                    part={propsEdge as EdgeViewProps['part']}
                    actions={actions}
                  />
                );
              })}
            </svg>
            {edgeText &&
              routes.map(({ edge, points }) => {
                const at = drag || !edge.labelAt ? polylineMidpoint(points) : edge.labelAt;
                return (
                  <EdgeTextView
                    key={edge.id}
                    item={edge}
                    x={at.x}
                    y={at.y}
                    selected={selectedEdges.has(edge.id)}
                    render={edgeText as EdgeTextViewProps['render']}
                    part={propsEdgeText as EdgeTextViewProps['part']}
                  />
                );
              })}
            {(!!drag?.guides.length || !!link || ends.length > 0) && (
              <svg
                {...css.attrs(diagramStyles.edges, diagramStyles.above)}
                width="1"
                height="1"
                aria-hidden="true"
                data-diagram-transient=""
              >
                {drag?.guides.map((guide, index) => (
                  <line
                    key={index}
                    {...mergeAttrs<'line'>({ sx: diagramStyles.guide }, propsGuide, {
                      x1: guide.from.x,
                      y1: guide.from.y,
                      x2: guide.to.x,
                      y2: guide.to.y,
                    })}
                  />
                ))}
                {ends.flatMap(({ edge, points }) =>
                  (['from', 'to'] as const).map((end) => {
                    const at = end === 'from' ? points[0]! : points[points.length - 1]!;
                    return (
                      <circle
                        key={`${edge.id}:${end}`}
                        cx={at.x}
                        cy={at.y}
                        r={5}
                        {...css.attrs(diagramStyles.edgeEnd)}
                        data-diagram-end={end}
                        onPointerdown={(event: PointerEvent) =>
                          actions.endDown(edge.id, end, event)
                        }
                      />
                    );
                  }),
                )}
                {link && (
                  <g {...css.attrs(diagramStyles.preview)}>
                    <path
                      d={polylinePath(trimEnd([link.from, link.to], ARROW * 0.7))}
                      {...css.attrs(diagramStyles.edgeLine)}
                    />
                    <polygon
                      points={arrowHead([link.from, link.to], ARROW)}
                      {...css.attrs(diagramStyles.edgeArrow)}
                    />
                  </g>
                )}
              </svg>
            )}
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

/** 连线自己给了折线 */
const hasPoints = (
  edge: DiagramEdgeItem,
): edge is DiagramEdgeItem & { points: readonly DiagramPoint[] } =>
  !!edge.points && edge.points.length >= 2;

/** 两组标识合在一起，去掉重复 */
const union = (a: readonly string[], b: readonly string[]) => [...new Set([...a, ...b])];

/** 两组标识是否相同（顺序无关） */
function sameIds(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}
