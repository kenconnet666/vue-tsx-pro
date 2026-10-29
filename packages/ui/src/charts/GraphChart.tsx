/**
 * 网络图：节点与连线，看谁和谁有关系、关系有多强（案例与触发事件的匹配、团队与供应商的协作、依赖关系）。
 *
 *   <GraphChart aria-label="协作关系" nodes={nodes} links={links} layout="layered" groups={teams} />
 *
 * 节点是 { id, label?, sublabel?, group?, color?, shape?, size? }，连线是 { source, target, value?, label?, dashed? }。
 * 布局（见 graphLayout）：force（默认，力导向）、layered（分层，direction 定方向）、circular、concentric、parallel
 * （按 group 分列），在画之前同步算好，结果每次相同。
 * 写了 groups 时同组的节点框在一起（layered、parallel 布局；力导向、环形布局里组只决定颜色，框会互相盖住）；
 * 节点的颜色默认按组取色板，没有组时都是 chart1。
 * 连线写了 value 时按大小加粗（1–6px），悬停看“起点 → 终点”与数值。点节点选中它（selected 双向绑定），
 * 与它不相连的节点、连线变淡；点空白处取消。能拖动画布、按住 Ctrl 滚轮缩放（zoom={false} 关掉；直接滚轮照常滚动页面），
 * 双击放大一档、已放大时回到全图。给读屏的数据表每条连线一行；单位、加载与空状态同其他图表（见 ChartFrame）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { shallowRef, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { colors, t } from '../config/theme/tokens';
import { Skeleton } from '../feedback/Skeleton';
import { svgNumber } from '../utils/data/number';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import { usePanZoom } from '../utils/dom/pan-zoom';
import type { PartProps } from '../utils/props';
import { ChartFrame, chartTooltip, useChartValueText, type ChartFrameParts } from './frame';
import { graphLayout } from './layout/graph';
import { ChartTooltipBox, chartSvgStyles, pointerIn, usePlotArea, type ChartTip } from './plot';
import { resolveColor, type ChartColor } from './series';
import { estimateTextWidth, truncateText } from './text-size';

/** 节点的形状 */
export interface GraphChartShapes {
  /** 圆（默认） */
  circle: unknown;
  /** 方块 */
  square: unknown;
  /** 六边形 */
  hexagon: unknown;
  /** 三角 */
  triangle: unknown;
}

/** 布局 */
export interface GraphChartLayouts {
  /** 力导向（默认）：相连的靠近、不相连的推开，适合看关系疏密 */
  force: unknown;
  /** 分层：沿 direction 一层层排开，适合有先后、上下游的关系 */
  layered: unknown;
  /** 排成一圈 */
  circular: unknown;
  /** 同心圆：连得多的在中间 */
  concentric: unknown;
  /** 按 group 分列，组内按连接排 */
  parallel: unknown;
}

/** 一个节点 */
export interface GraphChartNode {
  /** id：连线里用它指节点 */
  id: string;
  /** 名称，写在节点下面；不写时用 id */
  label?: string;
  /** 名称下面的小字 */
  sublabel?: string;
  /** 所在的组（groups 里的 id）：同组的框在一起、颜色相同 */
  group?: string;
  /** 颜色；不写时按组取色板，没有组时是 chart1 */
  color?: ChartColor;
  /** 形状，默认 circle */
  shape?: keyof GraphChartShapes;
  /** 大小（px），默认 28 */
  size?: number;
}

/** 一条连线 */
export interface GraphChartLink {
  /** 起点节点的 id */
  source: string;
  /** 终点节点的 id */
  target: string;
  /** 强度：写了时按大小加粗；提示框、数据表里显示 */
  value?: NumericValue;
  /** 线上的短标签（几个字以内） */
  label?: string;
  /** 虚线：弱关系、待定的关系 */
  dashed?: boolean;
  /** 颜色；默认是边框色 */
  color?: ChartColor;
}

/** 一组节点 */
export interface GraphChartGroup {
  /** 组的 id：节点的 group 指它 */
  id: string;
  /** 组名：写在框上 */
  label: string;
  /** 颜色；不写时按组的顺序取色板 */
  color?: ChartColor;
}

/** 未声明的属性落到外层 div（role="figure"）上，aria-label 是图表的名称 */
export interface GraphChartProps extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 节点 */
  nodes: readonly GraphChartNode[];
  /** 连线 */
  links: readonly GraphChartLink[];
  /** 分组：同组的节点框在一起（layered、parallel 布局），颜色相同 */
  groups?: readonly GraphChartGroup[];
  /**
   * 布局
   * @default 'force'
   */
  layout?: keyof GraphChartLayouts;
  /**
   * 分层、分列布局的方向：LR 从左到右，TB 从上到下
   * @default 'LR'
   */
  direction?: 'LR' | 'TB';
  /** 连线带箭头；默认分层布局带，其余不带 */
  arrows?: boolean;
  /** 连线数值的格式：提示框、数据表共用 */
  valueFormat?: NumericFormat;
  /** 连线数值的单位：显示在左上方，数值后面带上 */
  unit?: string;
  /**
   * 绘图区的高度；数字按 px
   * @default 360
   */
  height?: number | string;
  /**
   * 能拖动画布、按住 Ctrl 滚轮缩放
   * @default true
   */
  zoom?: boolean;
  /**
   * 悬停时的提示框
   * @default true
   */
  tooltip?: boolean;
  /** 选中的节点 id：点节点时写回，父级写 _selected={x}；点空白处变回 null */
  _selected?: string | null;
  /**
   * 加载中：绘图区显示骨架，带 aria-busy
   * @default false
   */
  loading?: boolean;
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
  /**
   * 点了一个节点（下钻）：参数是这个节点与它的位置；写了它时节点的指针是手形。
   * 点图是鼠标的捷径：同样的去处在页面上还要有链接或按钮
   */
  onItemClick?: (node: GraphChartNode, index: number) => void;
}

/** GraphChart 的样式 */
export const graphChartStyles = css.create({
  skeleton: { display: 'block', width: '100%', height: '100%' },
  viewport: { position: 'absolute', inset: 0 },
  background: { fill: 'transparent' },
  panel: { fill: '_surfaceMuted', strokeWidth: 1 },
  panelLabel: { fill: '_textMuted', fontSize: '_xs', fontWeight: '_medium' },
  link: { fill: 'none', transition: `opacity ${t.durations.sm} ${t.easings.standard}` },
  linkDashed: { strokeDasharray: '5 4' },
  linkLabelBox: { fill: '_fill' },
  linkLabel: { fill: '_text', fontSize: '_xs' },
  node: { transition: `opacity ${t.durations.sm} ${t.easings.standard}` },
  nodeShape: { stroke: '_surface', strokeWidth: 2 },
  // 选中的节点：外面一圈强调色
  nodeSelected: { stroke: '_accent', strokeWidth: 3 },
  nodeLabel: { fill: '_text', fontSize: '_xs', fontWeight: '_medium' },
  nodeSublabel: { fill: '_textMuted', fontSize: '_xs' },
  clickable: { cursor: 'pointer' },
  wheelHint: {
    position: 'absolute',
    top: '_sm',
    insetInlineEnd: '_sm',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    borderRadius: '_md',
    backgroundColor: '_surfaceRaised',
    boxShadow: '_sm',
    color: '_textMuted',
    fontSize: '_xs',
    pointerEvents: 'none',
  },
});

/** 节点的默认大小、名字的行高、名字最多几个字宽（px） */
const NODE_SIZE = 28;
const LINE = 16;
const LABEL_MAX = 120;
/** 分组框四周、顶上（写组名）留的空 */
const PANEL_PAD = 16;
const PANEL_TITLE = 22;
/** 箭头的长与宽 */
const ARROW = 8;

/** 节点的形状：中心在原点、外接圆直径 size 的 SVG 路径 */
function shapePath(shape: keyof GraphChartShapes, size: number): string {
  const r = size / 2;
  const polygon = (count: number, rotate: number, radius: number) =>
    `${Array.from({ length: count }, (_, i) => {
      const angle = rotate + (i / count) * Math.PI * 2;
      return `${i ? 'L' : 'M'}${svgNumber(radius * Math.cos(angle))},${svgNumber(radius * Math.sin(angle))}`;
    }).join('')}Z`;
  if (shape === 'square') {
    const half = r * 0.86;
    return `M${-half},${-half}H${half}V${half}H${-half}Z`;
  }
  if (shape === 'hexagon') return polygon(6, 0, r);
  if (shape === 'triangle') return polygon(3, -Math.PI / 2, r * 1.1);
  return `M${-r},0A${r},${r},0,1,1,${r},0A${r},${r},0,1,1,${-r},0Z`;
}

/** 画图用的节点：带上名称、颜色与位置 */
interface PlacedNode extends GraphChartNode {
  label: string;
  fill: string;
  index: number;
  size: number;
  x: number;
  y: number;
}

/** 悬停的节点或连线 */
interface GraphHover {
  kind: 'node' | 'link';
  index: number;
  x: number;
  y: number;
}

/** 网络图 */
export const GraphChart = _component(
  ({
    nodes,
    links,
    groups,
    layout = 'force',
    direction = 'LR',
    arrows,
    valueFormat,
    unit,
    height = 360,
    zoom = true,
    tooltip = true,
    _selected: selected = _bindable<string | null>(null),
    loading = false,
    empty,
    onItemClick,
    ...rest
  }: GraphChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const valueText = useChartValueText(() => ({ valueFormat, unit }));
    const area = usePlotArea();
    const viewport = shallowRef<HTMLElement | null>(null);
    let hovered = _state.raw<GraphHover | null>(null);
    let wheelHint = _state(false);
    let hintTimer: ReturnType<typeof setTimeout> | undefined;
    _effect(() => () => clearTimeout(hintTimer));

    // 滚轮默认滚动页面，按住 Ctrl（或 ⌘、触控板捏合）才缩放；按在节点上的拖动不平移（点选节点）
    const view = usePanZoom({
      viewport: () => viewport.value,
      min: 0.3,
      max: 4,
      disabled: () => !zoom,
      filter: (event) => {
        if (event instanceof WheelEvent && !event.ctrlKey && !event.metaKey) {
          wheelHint = true;
          clearTimeout(hintTimer);
          hintTimer = setTimeout(() => (wheelHint = false), 1500);
          return false;
        }
        return !(event.type === 'dblclick' && (event.target as Element).closest?.('[data-node]'));
      },
    });

    const groupColors = _derived(
      new Map(
        (groups ?? []).map((group, position) => [group.id, resolveColor(group.color, position)]),
      ),
    );
    const byId = _derived(new Map(nodes.map((node) => [node.id, node])));
    const labelOf = (id: string) => byId.get(id)?.label ?? id;
    // 只留两端都在的连线；最大值用来把粗细缩放到 1–6px
    const shownLinks = _derived(
      links.filter((link) => byId.has(link.source) && byId.has(link.target)),
    );
    const amounts = _derived(
      shownLinks.map((link) => (link.value === undefined ? undefined : toNumber(link.value))),
    );
    const maxAmount = _derived(Math.max(0, ...amounts.map((amount) => amount ?? 0)));
    const degree = _derived.by(() => {
      const counts = new Map<string, number>();
      for (const link of shownLinks) {
        counts.set(link.source, (counts.get(link.source) ?? 0) + 1);
        counts.set(link.target, (counts.get(link.target) ?? 0) + 1);
      }
      return counts;
    });
    const layered = () => layout === 'layered';
    // 分组框只在按层、按列排的布局里画：其余布局不按组排，框会互相盖住
    const framed = () => layered() || layout === 'parallel';

    /** 布局：节点的位置（未缩放，单位 px） */
    const positions = _derived.by(() => {
      const inputs = nodes.map((node) => {
        const size = node.size ?? NODE_SIZE;
        const label = node.label ?? node.id;
        const textWidth = Math.min(
          LABEL_MAX,
          Math.max(estimateTextWidth(label), estimateTextWidth(node.sublabel ?? '')),
        );
        return {
          id: node.id,
          group: node.group,
          width: Math.max(size, textWidth) + 8,
          height: size + 6 + LINE * (node.sublabel ? 2 : 1),
        };
      });
      return graphLayout(inputs, shownLinks, {
        layout,
        direction,
        groups: groups?.map((group) => group.id),
      });
    });

    /** 放进绘图区：位置按绘图区缩放、居中（节点与文字不缩放），最多放大到 1.2 倍 */
    const placed = _derived.by((): PlacedNode[] => {
      const items = nodes.map((node, index) => {
        const position = positions.get(node.id) ?? { x: 0, y: 0 };
        return {
          ...node,
          label: node.label ?? node.id,
          fill: node.color
            ? resolveColor(node.color, 0)
            : ((node.group && groupColors.get(node.group)) ?? resolveColor('chart1', 0)),
          index,
          size: node.size ?? NODE_SIZE,
          x: position.x,
          y: position.y,
        };
      });
      if (!items.length) return items;
      const xs = items.map((item) => item.x);
      const ys = items.map((item) => item.y);
      const [minX, maxX, minY, maxY] = [
        Math.min(...xs),
        Math.max(...xs),
        Math.min(...ys),
        Math.max(...ys),
      ];
      const frame = framed() && groups?.length ? PANEL_PAD : 0;
      // 四周留出节点、名字与分组框
      const room = {
        x: LABEL_MAX / 2 + frame + 8,
        top: NODE_SIZE / 2 + frame + (frame ? PANEL_TITLE : 0) + 8,
        bottom: NODE_SIZE / 2 + LINE * 2 + frame + 8,
      };
      const width = area.width - room.x * 2;
      const height = area.height - room.top - room.bottom;
      const scale = Math.min(
        1.2,
        maxX > minX ? width / (maxX - minX) : 1.2,
        maxY > minY ? height / (maxY - minY) : 1.2,
      );
      const offsetX = room.x + (width - (maxX - minX) * scale) / 2 - minX * scale;
      const offsetY = room.top + (height - (maxY - minY) * scale) / 2 - minY * scale;
      return items.map((item) => ({
        ...item,
        x: item.x * scale + offsetX,
        y: item.y * scale + offsetY,
      }));
    });
    const placedById = _derived(new Map(placed.map((node) => [node.id, node])));

    /** 选中节点时它与相连的节点、连线保持原样，其余变淡 */
    const connected = _derived.by(() => {
      if (selected === null) return null;
      const ids = new Set([selected]);
      for (const link of shownLinks) {
        if (link.source === selected) ids.add(link.target);
        if (link.target === selected) ids.add(link.source);
      }
      return ids;
    });

    /** 一条连线的路径、终点处的方向（画箭头）与中点（写标签） */
    function linkGeometry(source: PlacedNode, target: PlacedNode, arrow: boolean) {
      const tail = arrow ? ARROW : 0;
      if (layered()) {
        // 分层：沿方向的 S 形曲线，两端从节点的边上出发
        const horizontal = direction === 'LR';
        const [sx, sy] = horizontal
          ? [source.x + source.size / 2, source.y]
          : [source.x, source.y + source.size / 2];
        const [tx, ty] = horizontal
          ? [target.x - target.size / 2 - tail, target.y]
          : [target.x, target.y - target.size / 2 - tail];
        const d = horizontal
          ? `M${svgNumber(sx)},${svgNumber(sy)}C${svgNumber((sx + tx) / 2)},${svgNumber(sy)},${svgNumber((sx + tx) / 2)},${svgNumber(ty)},${svgNumber(tx)},${svgNumber(ty)}`
          : `M${svgNumber(sx)},${svgNumber(sy)}C${svgNumber(sx)},${svgNumber((sy + ty) / 2)},${svgNumber(tx)},${svgNumber((sy + ty) / 2)},${svgNumber(tx)},${svgNumber(ty)}`;
        return {
          d,
          end: [tx, ty] as const,
          angle: horizontal ? 0 : Math.PI / 2,
          middle: [(sx + tx) / 2, (sy + ty) / 2] as const,
        };
      }
      // 其余：微微弯曲的二次曲线（相向的两条不重叠），两端退到节点的边上
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const length = Math.hypot(dx, dy) || 1;
      const control = [
        (source.x + target.x) / 2 - (dy / length) * length * 0.12,
        (source.y + target.y) / 2 + (dx / length) * length * 0.12,
      ] as const;
      const toward = (
        from: readonly [number, number],
        to: readonly [number, number],
        distance: number,
      ) => {
        const ux = to[0] - from[0];
        const uy = to[1] - from[1];
        const norm = Math.hypot(ux, uy) || 1;
        return [from[0] + (ux / norm) * distance, from[1] + (uy / norm) * distance] as const;
      };
      const start = toward([source.x, source.y], control, source.size / 2);
      const end = toward([target.x, target.y], control, target.size / 2 + tail);
      const d = `M${svgNumber(start[0])},${svgNumber(start[1])}Q${svgNumber(control[0])},${svgNumber(control[1])},${svgNumber(end[0])},${svgNumber(end[1])}`;
      return {
        d,
        end,
        angle: Math.atan2(target.y - control[1], target.x - control[0]),
        middle: [
          (start[0] + 2 * control[0] + end[0]) / 4,
          (start[1] + 2 * control[1] + end[1]) / 4,
        ] as const,
      };
    }

    function onPointermove(event: PointerEvent) {
      const target = (event.target as Element).closest?.('[data-node],[data-link]');
      if (!target) {
        hovered = null;
        return;
      }
      const { x, y } = pointerIn(event, viewport.value ?? (event.currentTarget as Element));
      const node = target.getAttribute('data-node');
      hovered =
        node === null
          ? { kind: 'link', index: Number(target.getAttribute('data-link')), x, y }
          : { kind: 'node', index: Number(node), x, y };
    }

    function onClick(event: MouseEvent) {
      const target = (event.target as Element).closest?.('[data-node]');
      if (!target) {
        selected = null;
        return;
      }
      const node = placed[Number(target.getAttribute('data-node'))];
      if (!node) return;
      selected = node.id;
      onItemClick?.(nodes[node.index]!, node.index);
    }

    function renderPanels() {
      if (!framed()) return null;
      return (groups ?? []).map((group) => {
        const members = placed.filter((node) => node.group === group.id);
        if (!members.length) return null;
        const half = (node: PlacedNode) =>
          Math.max(node.size / 2, Math.min(LABEL_MAX, estimateTextWidth(node.label)) / 2);
        const x0 = Math.min(...members.map((node) => node.x - half(node))) - PANEL_PAD;
        const x1 = Math.max(...members.map((node) => node.x + half(node))) + PANEL_PAD;
        const y0 =
          Math.min(...members.map((node) => node.y - node.size / 2)) - PANEL_PAD - PANEL_TITLE;
        const y1 =
          Math.max(
            ...members.map((node) => node.y + node.size / 2 + LINE * (node.sublabel ? 2 : 1) + 4),
          ) + PANEL_PAD;
        return (
          <g key={group.id} data-part="panel">
            <rect
              x={svgNumber(x0)}
              y={svgNumber(y0)}
              width={svgNumber(x1 - x0)}
              height={svgNumber(y1 - y0)}
              rx={8}
              {...css.attrs(
                graphChartStyles.panel,
                chartSvgStyles.stroke(groupColors.get(group.id) ?? colors.borderMuted),
              )}
            />
            <text
              x={svgNumber(x0 + 10)}
              y={svgNumber(y0 + PANEL_TITLE / 2 + 2)}
              dominant-baseline="central"
              {...css.attrs(graphChartStyles.panelLabel)}
            >
              {truncateText(group.label, x1 - x0 - 20)}
            </text>
          </g>
        );
      });
    }

    function renderLinks() {
      const withArrows = arrows ?? layered();
      return shownLinks.map((link, index) => {
        const source = placedById.get(link.source)!;
        const target = placedById.get(link.target)!;
        if (source === target) return null;
        const amount = amounts[index];
        const width = amount === undefined || maxAmount === 0 ? 1.5 : 1 + (5 * amount) / maxAmount;
        const color = link.color ? resolveColor(link.color, 0) : colors.borderStrong;
        const { d, end, angle, middle } = linkGeometry(source, target, withArrows);
        const faded = connected !== null && link.source !== selected && link.target !== selected;
        const arrowSize = ARROW + width;
        const arrowPath = () => {
          const [ex, ey] = end;
          const tipX = ex + Math.cos(angle) * arrowSize;
          const tipY = ey + Math.sin(angle) * arrowSize;
          const side = arrowSize * 0.55;
          const nx = -Math.sin(angle) * side;
          const ny = Math.cos(angle) * side;
          return `M${svgNumber(tipX)},${svgNumber(tipY)}L${svgNumber(ex + nx)},${svgNumber(ey + ny)}L${svgNumber(ex - nx)},${svgNumber(ey - ny)}Z`;
        };
        return (
          <g
            key={`${link.source}->${link.target}:${index}`}
            {...css.attrs(graphChartStyles.node, faded && chartSvgStyles.dimmed)}
          >
            <path
              data-part="link"
              data-link={index}
              d={d}
              stroke-width={svgNumber(width)}
              {...css.attrs(
                graphChartStyles.link,
                chartSvgStyles.stroke(color),
                link.dashed && graphChartStyles.linkDashed,
              )}
            />
            {withArrows && <path d={arrowPath()} {...css.attrs(chartSvgStyles.fill(color))} />}
            {link.label && (
              <g
                transform={`translate(${svgNumber(middle[0])},${svgNumber(middle[1])})`}
                {...css.attrs(chartSvgStyles.noPointer)}
              >
                <rect
                  x={-estimateTextWidth(link.label) / 2 - 4}
                  y={-9}
                  width={estimateTextWidth(link.label) + 8}
                  height={18}
                  rx={4}
                  {...css.attrs(graphChartStyles.linkLabelBox)}
                />
                <text
                  text-anchor="middle"
                  dominant-baseline="central"
                  {...css.attrs(graphChartStyles.linkLabel)}
                >
                  {link.label}
                </text>
              </g>
            )}
          </g>
        );
      });
    }

    function renderNodes() {
      return placed.map((node, index) => {
        const faded = connected !== null && !connected.has(node.id);
        const shape = node.shape ?? 'circle';
        return (
          <g
            key={node.id}
            data-part="node"
            data-node={index}
            transform={`translate(${svgNumber(node.x)},${svgNumber(node.y)})`}
            {...css.attrs(
              graphChartStyles.node,
              onItemClick && graphChartStyles.clickable,
              faded && chartSvgStyles.dimmed,
            )}
          >
            <path
              d={shapePath(shape, node.size)}
              {...css.attrs(
                graphChartStyles.nodeShape,
                chartSvgStyles.fill(node.fill),
                selected === node.id && graphChartStyles.nodeSelected,
              )}
            />
            <text
              y={node.size / 2 + 4}
              text-anchor="middle"
              dominant-baseline="hanging"
              {...css.attrs(graphChartStyles.nodeLabel, chartSvgStyles.halo)}
            >
              {truncateText(node.label, LABEL_MAX)}
            </text>
            {node.sublabel && (
              <text
                y={node.size / 2 + 4 + LINE}
                text-anchor="middle"
                dominant-baseline="hanging"
                {...css.attrs(graphChartStyles.nodeSublabel, chartSvgStyles.halo)}
              >
                {truncateText(node.sublabel, LABEL_MAX)}
              </text>
            )}
          </g>
        );
      });
    }

    const tip = (): ChartTip | null => {
      const current = hovered;
      if (!tooltip || !current) return null;
      if (current.kind === 'node') {
        const node = placed[current.index];
        if (!node) return null;
        return {
          x: current.x,
          y: current.y,
          content: chartTooltip(node.label, [
            ...(node.sublabel ? [{ label: node.sublabel, color: 'transparent', value: '' }] : []),
            { label: lang.chartDegree(degree.get(node.id) ?? 0), color: node.fill, value: '' },
          ]),
        };
      }
      const link = shownLinks[current.index];
      if (!link) return null;
      const source = placedById.get(link.source)!;
      return {
        x: current.x,
        y: current.y,
        content: chartTooltip(
          lang.chartFlowLabel(source.label, placedById.get(link.target)!.label),
          [
            ...(link.value === undefined
              ? []
              : [{ label: lang.chartValue, color: source.fill, value: valueText(link.value) }]),
            ...(link.label ? [{ label: link.label, color: 'transparent', value: '' }] : []),
          ],
        ),
      };
    };

    function renderPlot() {
      return (
        <div
          {...css.attrs(graphChartStyles.viewport)}
          {...(zoom ? view.viewportProps : {})}
          ref={(element) => (viewport.value = element as HTMLElement | null)}
          onPointermove={(event: PointerEvent) => {
            // 平移缩放也要指针移动（两指捏合）：两个都调
            if (zoom) (view.viewportProps.onPointermove as (event: PointerEvent) => void)(event);
            onPointermove(event);
          }}
          onPointerleave={() => (hovered = null)}
        >
          <svg
            width={area.width}
            height={area.height}
            {...css.attrs(chartSvgStyles.svg)}
            onClick={onClick}
          >
            <rect
              data-part="background"
              width={area.width}
              height={area.height}
              {...css.attrs(graphChartStyles.background)}
            />
            <g
              transform={`translate(${svgNumber(view.x)} ${svgNumber(view.y)}) scale(${svgNumber(view.scale)})`}
            >
              <g {...css.attrs(chartSvgStyles.fadeIn)}>
                {renderPanels()}
                {renderLinks()}
                {renderNodes()}
              </g>
            </g>
          </svg>
          <ChartTooltipBox tip={tip()} width={area.width} />
          {/* 只给指针用户的提示（读屏不用滚轮缩放）：浮在绘图区右上角，不挤动布局 */}
          {wheelHint && (
            <span {...css.attrs(graphChartStyles.wheelHint)}>{lang.chartZoomWheelHint}</span>
          )}
        </div>
      );
    }

    return () => (
      <ChartFrame
        {...rest}
        unit={unit}
        height={height}
        legend={[]}
        hiddenKeys={[]}
        onLegendToggle={() => {}}
        loading={loading}
        skeleton={<Skeleton sx={graphChartStyles.skeleton} />}
        isEmpty={nodes.length === 0}
        empty={empty}
        clickable={onItemClick != null}
        table={{
          columns: [lang.chartLink, unit ? `${lang.chartValue}（${unit}）` : lang.chartValue],
          rows: shownLinks.map((link) => ({
            header: lang.chartFlowLabel(labelOf(link.source), labelOf(link.target)),
            cells: [
              [
                link.value === undefined ? '' : format.number(link.value, valueFormat),
                link.label ?? '',
              ]
                .filter(Boolean)
                .join(' · ') || lang.emptyValue,
            ],
          })),
        }}
        plotRef={area.ref}
        plot={area.ready ? renderPlot() : null}
      />
    );
  },
);
