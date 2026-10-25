/**
 * 网络图：节点与连线，看谁和谁有关系、关系有多强（储备件与触发事件的匹配、团队与供应商的协作、依赖关系）。
 *
 *   <GraphChart aria-label="协作关系" nodes={nodes} links={links} layout="dagre" groups={teams} />
 *
 * 节点是 { id, label?, sublabel?, group?, color?, shape?, size? }，连线是 { source, target, value?, label?, dashed? }。
 * 布局交给 Unovis 的 Graph：force（默认，力导向）、dagre（分层，direction 定方向）、circular、concentric、parallel
 * （按 group 分列）、elk（分层且支持分组框，较大，用到时才加载）。布局异步算好再画，第一帧是空的。
 * 写了 groups 时同组的节点框在一起（dagre、elk、parallel 布局；力导向、环形布局里组只决定颜色，框会互相盖住）；
 * 节点的颜色默认按组取色板，没有组时都是 chart1。
 * 连线写了 value 时按大小加粗（1–6px），悬停看“起点 → 终点”与数值。点节点选中它（selected 双向绑定），
 * 与它不相连的节点、连线变淡；点空白处取消。能缩放、拖动画布（zoom={false} 关掉），双击回到全图。
 * 给读屏的数据表每条连线一行；单位、加载与空状态同其他图表（见 ChartFrame）。
 */
import {
  Graph,
  GraphLayoutType,
  GraphLinkArrowStyle,
  GraphLinkStyle,
  GraphNodeSelectionHighlightMode,
  GraphNodeShape,
} from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { colors, fontSizes, opacities } from '../config/theme/tokens';
import { Skeleton } from '../feedback/Skeleton';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import { ChartFrame, chartTooltip, useChartValueText, type ChartFrameParts } from './frame';
import { resolveColor, type ChartColor } from './series';
import { useSingleChart, type SingleChart } from './single';

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
  dagre: unknown;
  /** 排成一圈 */
  circular: unknown;
  /** 同心圆：连得多的在中间 */
  concentric: unknown;
  /** 按 group 分列，组内按连接排 */
  parallel: unknown;
  /** 分层，分组框更规整（elkjs，约 1.6 MB，用到时才加载） */
  elk: unknown;
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
  /** 分组：同组的节点框在一起（dagre、elk、parallel 布局），颜色相同 */
  groups?: readonly GraphChartGroup[];
  /**
   * 布局
   * @default 'force'
   */
  layout?: keyof GraphChartLayouts;
  /**
   * 分层布局（dagre、elk）的方向：LR 从左到右，TB 从上到下
   * @default 'LR'
   */
  direction?: 'LR' | 'TB';
  /** 连线带箭头；默认分层布局（dagre、elk）带，其余不带 */
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
   * 能缩放、拖动画布
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

/** GraphChart 的样式：root（--vis-graph-* 主题变量）、skeleton */
export const graphChartStyles = css.create({
  root: {
    '--vis-graph-node-stroke-color': colors.surface,
    '--vis-graph-node-label-text-color': colors.text,
    '--vis-graph-node-label-font-size': fontSizes.xs,
    '--vis-graph-node-label-background': colors.surface,
    '--vis-graph-node-sublabel-text-color': colors.textMuted,
    '--vis-graph-node-sublabel-font-size': fontSizes.xs,
    '--vis-graph-node-selection-color': colors.accent,
    '--vis-graph-node-greyout-color': colors.surfaceMuted,
    '--vis-graph-node-greyout-opacity': opacities.disabled,
    '--vis-graph-link-stroke-color': colors.borderStrong,
    '--vis-graph-link-greyout-opacity': '0.25',
    '--vis-graph-link-label-background': colors.fill,
    '--vis-graph-link-label-text-color-dark': colors.text,
    '--vis-graph-link-label-font-size': fontSizes.xs,
    '--vis-graph-panel-fill-color': colors.surfaceMuted,
    '--vis-graph-panel-border-color': colors.borderMuted,
    '--vis-graph-panel-label-color': colors.textMuted,
    '--vis-graph-panel-label-background': colors.surface,
    '--vis-graph-panel-label-font-size': fontSizes.xs,
    '--vis-graph-panel-label-font-weight': '500',
  },
  skeleton: { display: 'block', width: '100%', height: '100%' },
});

const LAYOUTS: Record<keyof GraphChartLayouts, GraphLayoutType> = {
  force: GraphLayoutType.Force,
  dagre: GraphLayoutType.Dagre,
  circular: GraphLayoutType.Circular,
  concentric: GraphLayoutType.Concentric,
  parallel: GraphLayoutType.Parallel,
  elk: GraphLayoutType.Elk,
};

const SHAPES: Record<keyof GraphChartShapes, GraphNodeShape> = {
  circle: GraphNodeShape.Circle,
  square: GraphNodeShape.Square,
  hexagon: GraphNodeShape.Hexagon,
  triangle: GraphNodeShape.Triangle,
};

/** 交给 Unovis 的节点：带上名称与颜色；Unovis 会往上写布局用的字段，每次都复制一份 */
interface Node extends GraphChartNode {
  label: string;
  fill: string;
  index: number;
}
/** 交给 Unovis 的连线：数值转成 number 算粗细 */
interface Link extends GraphChartLink {
  amount: number | undefined;
}
/** Unovis 布局后：连线的起点、终点换成了节点对象 */
type LaidOutLink = Omit<Link, 'source' | 'target'> & { source: Node; target: Node };

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
    sx,
    ...rest
  }: GraphChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const valueText = useChartValueText(() => ({ valueFormat, unit }));

    const groupColors = _derived(
      new Map(
        (groups ?? []).map((group, position) => [group.id, resolveColor(group.color, position)]),
      ),
    );
    const resolved = _derived(
      nodes.map((node, index): Node => ({
        ...node,
        label: node.label ?? node.id,
        fill: node.color
          ? resolveColor(node.color, 0)
          : ((node.group && groupColors.get(node.group)) ?? resolveColor('chart1', 0)),
        index,
      })),
    );
    const byId = _derived(new Map(resolved.map((node) => [node.id, node])));
    const labelOf = (id: string) => byId.get(id)?.label ?? id;
    // 只留两端都在的连线；最大值用来把粗细缩放到 1–6px
    const shownLinks = _derived(
      links
        .filter((link) => byId.has(link.source) && byId.has(link.target))
        .map((link): Link => ({
          ...link,
          amount: link.value === undefined ? undefined : toNumber(link.value),
        })),
    );
    const maxAmount = _derived(Math.max(0, ...shownLinks.map((link) => link.amount ?? 0)));
    const degree = _derived.by(() => {
      const counts = new Map<string, number>();
      for (const link of shownLinks) {
        counts.set(link.source, (counts.get(link.source) ?? 0) + 1);
        counts.set(link.target, (counts.get(link.target) ?? 0) + 1);
      }
      return counts;
    });

    let plot = _state.raw<HTMLElement | null>(null);
    const chart: SingleChart = useSingleChart<{ nodes: Node[]; links?: Link[] }>(() => ({
      element: plot,
      ready: !loading && nodes.length > 0,
      tooltip,
      build: (instance) => {
        const graph = instance('graph', () => new Graph<Node, Link>({}));
        const layered = layout === 'dagre' || layout === 'elk';
        // 分组框只在按层、按列排的布局里画：其余布局不按组排，框会互相盖住
        const framed = layered || layout === 'parallel';
        graph.setConfig({
          layoutType: LAYOUTS[layout],
          layoutNodeGroup: (node) => node.group ?? '',
          layoutGroupOrder: groups?.map((group) => group.id),
          // 分组框比节点宽出一圈：层与层之间留够，框不相互压住
          dagreLayoutSettings: {
            rankdir: direction,
            nodesep: groups?.length ? 48 : 36,
            ranksep: groups?.length ? 150 : 96,
          },
          layoutElkSettings: {
            'elk.direction': direction === 'LR' ? 'RIGHT' : 'DOWN',
            'elk.spacing.nodeNode': '36',
            'elk.layered.spacing.nodeNodeBetweenLayers': '96',
          },
          layoutElkNodeGroups: groups?.length ? [(node) => node.group ?? ''] : undefined,
          forceLayoutSettings: { linkDistance: 90, charge: -600 },
          nodeSize: (node) => node.size ?? 28,
          nodeShape: (node) => SHAPES[node.shape ?? 'circle'],
          nodeFill: (node) => node.fill,
          nodeStrokeWidth: 2,
          nodeLabel: (node) => node.label,
          nodeSubLabel: (node) => node.sublabel ?? '',
          nodeLabelTrimLength: 16,
          // 不用图标字体：节点只是色块
          nodeIcon: () => '',
          linkWidth: (link) =>
            link.amount === undefined || maxAmount === 0 ? 1.5 : 1 + (5 * link.amount) / maxAmount,
          linkStroke: (link) => (link.color ? resolveColor(link.color, 0) : undefined),
          linkStyle: (link) => (link.dashed ? GraphLinkStyle.Dashed : GraphLinkStyle.Solid),
          linkArrow: (arrows ?? layered) ? GraphLinkArrowStyle.Single : undefined,
          linkLabel: (link) => (link.label ? { text: link.label } : undefined),
          linkCurvature: layered ? 0 : 0.2,
          panels: (framed ? (groups ?? []) : [])
            .filter((group) => resolved.some((node) => node.group === group.id))
            .map((group) => ({
              nodes: resolved.filter((node) => node.group === group.id).map((node) => node.id),
              label: group.label,
              padding: 16,
              borderColor: groupColors.get(group.id),
            })),
          selectedNodeId: selected ?? undefined,
          nodeSelectionHighlightMode: GraphNodeSelectionHighlightMode.GreyoutNonConnected,
          disableZoom: !zoom,
          disableDrag: !zoom,
          disableBrush: true,
          // 上方多留一些：分组框的组名写在框顶外面
          fitViewPadding: { top: 48, right: 32, bottom: 32, left: 32 },
          events: {
            [Graph.selectors.node]: {
              click: (node: Node) => {
                selected = node.id;
                onItemClick?.(nodes[node.index]!, node.index);
              },
            },
            [Graph.selectors.background]: {
              click: () => (selected = null),
              // 双击空白回到全图
              dblclick: () => graph.fitView(),
            },
          },
        });
        return {
          component: graph,
          data: {
            nodes: resolved.map((node) => ({ ...node })),
            links: shownLinks.map((link) => ({ ...link })),
          },
          triggers: {
            [Graph.selectors.node]: (node: Node) =>
              chart.tooltip(
                chartTooltip(node.label, [
                  ...(node.sublabel
                    ? [{ label: node.sublabel, color: 'transparent', value: '' }]
                    : []),
                  {
                    label: lang.chartDegree(degree.get(node.id) ?? 0),
                    color: node.fill,
                    value: '',
                  },
                ]),
              ),
            [Graph.selectors.link]: (link: LaidOutLink) =>
              chart.tooltip(
                chartTooltip(lang.chartFlowLabel(link.source.label, link.target.label), [
                  ...(link.value === undefined
                    ? []
                    : [
                        {
                          label: lang.chartValue,
                          color: link.source.fill,
                          value: valueText(link.value),
                        },
                      ]),
                  ...(link.label ? [{ label: link.label, color: 'transparent', value: '' }] : []),
                ]),
              ),
          },
        };
      },
    }));

    return () => (
      <ChartFrame
        {...rest}
        sx={[graphChartStyles.root, sx]}
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
        plotRef={(element) => (plot = element)}
      />
    );
  },
);
