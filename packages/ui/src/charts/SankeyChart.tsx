/**
 * 桑基图：节点之间的流量画成粗细不同的带子，看量从哪来、到哪去、在哪流失（转化漏斗、预算分配、能源流向）。
 *
 *   <SankeyChart aria-label="注册转化" nodes={steps} links={flows} unit="人" />
 *
 * 节点是 { id, label?, color? }，流向是 { source, target, value }（value 可以是 Decimal、bigint，要大于 0；不能成环）。
 * 带子取起点节点的颜色；悬停带子出“起点 → 终点”的流量，悬停节点出它的总量。节点旁写名字与总量。
 * 单位、加载与空状态、给读屏的数据表（每条流向一行）同其他图表（见 ChartFrame）。
 */
import { FitMode, Sankey, SankeyNodeAlign } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { colors, fontSizes } from '../config/theme/tokens';
import { Skeleton } from '../feedback/Skeleton';
import type { PartProps } from '../utils/props';
import { flowData, resolveFlowNodes, type FlowLink, type FlowNode } from './flow';
import { ChartFrame, chartTooltip, useChartValueText, type ChartFrameParts } from './frame';
import { useSingleChart, type SingleChart } from './single';

/** 节点怎样排：justify 两端对齐（默认），left、right 靠向一侧，center 居中 */
export interface SankeyAligns {
  /** 两端对齐（默认）：按离起点的远近分列，没有流出的节点都排到最右一列 */
  justify: unknown;
  /** 靠左：每个节点排在离起点最近的一列 */
  left: unknown;
  /** 靠右：每个节点排在离终点最近的一列 */
  right: unknown;
  /** 居中：同靠左，但没有流入的节点往右挪，贴着它流向的节点 */
  center: unknown;
}

/** 未声明的属性落到外层 div（role="figure"）上，aria-label 是图表的名称 */
export interface SankeyChartProps extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 节点 */
  nodes: readonly FlowNode[];
  /** 流向 */
  links: readonly FlowLink[];
  /** 数值的格式（可缩放，如以万元为单位）：节点旁的总量、提示框、数据表共用 */
  valueFormat?: NumericFormat;
  /** 单位：显示在左上方，数值后面带上 */
  unit?: string;
  /**
   * 绘图区的高度；数字按 px
   * @default 320
   */
  height?: number | string;
  /**
   * 节点的排法
   * @default 'justify'
   */
  align?: keyof SankeyAligns;
  /**
   * 悬停时的提示框
   * @default true
   */
  tooltip?: boolean;
  /**
   * 加载中：绘图区显示骨架，带 aria-busy
   * @default false
   */
  loading?: boolean;
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
}

/** SankeyChart 的样式：root（--vis-sankey-* 主题变量）、skeleton */
export const sankeyChartStyles = css.create({
  root: {
    '--vis-sankey-node-label-color': colors.text,
    '--vis-sankey-node-label-font-size': fontSizes.xs,
    '--vis-sankey-node-label-font-weight': '500',
    '--vis-sankey-node-label-background-fill-color': colors.surface,
    '--vis-sankey-node-label-background-stroke-color': colors.borderMuted,
    '--vis-sankey-node-sublabel-font-size': fontSizes.xs,
    '--vis-sankey-link-opacity': '0.35',
    '--vis-sankey-link-hover-opacity': '0.6',
  },
  skeleton: { display: 'block', width: '100%', height: '100%' },
});

const ALIGNS: Record<keyof SankeyAligns, SankeyNodeAlign> = {
  justify: SankeyNodeAlign.Justify,
  left: SankeyNodeAlign.Left,
  right: SankeyNodeAlign.Right,
  center: SankeyNodeAlign.Center,
};

/** 交给 Unovis 的节点、流向 */
type Data = ReturnType<typeof flowData>;
type Node = Data['nodes'][number];
type Link = Data['links'][number];
/** Unovis 布局后：流向的起点、终点换成了节点对象，节点带上了总量 value */
type LaidOutNode = Node & { value?: number };
type LaidOutLink = Omit<Link, 'source' | 'target'> & { source: LaidOutNode; target: LaidOutNode };

/** 桑基图 */
export const SankeyChart = _component(
  ({
    nodes,
    links,
    valueFormat,
    unit,
    height = 320,
    align = 'justify',
    tooltip = true,
    loading = false,
    empty,
    sx,
    ...rest
  }: SankeyChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const resolved = _derived(resolveFlowNodes(nodes));
    const valueText = useChartValueText(() => ({ valueFormat, unit }));
    const labelOf = (id: string) => resolved.get(id)?.label ?? id;

    let plot = _state.raw<HTMLElement | null>(null);
    const chart: SingleChart = useSingleChart<{ nodes: Node[]; links?: Link[] }>(() => ({
      element: plot,
      ready: !loading && nodes.length > 0,
      tooltip,
      build: (instance) => {
        const sankey = instance(
          'sankey',
          () => new Sankey<Node, Link>({ linkValue: (link) => link.amount }),
        );
        sankey.setConfig({
          linkValue: (link) => link.amount,
          nodeColor: (node) => node.color,
          linkColor: (link) => link.source.color,
          nodeAlign: ALIGNS[align],
          label: (node) => node.label,
          subLabel: (node) => (node.value === undefined ? '' : valueText(node.value)),
          nodePadding: 16,
          nodeWidth: 12,
          labelMaxWidth: 120,
          labelMaxWidthTakeAvailableSpace: true,
          labelFit: FitMode.Wrap,
          labelBackground: true,
          enableZoom: false,
        });
        return {
          component: sankey,
          data: flowData(resolved, links),
          triggers: {
            [Sankey.selectors.link]: (link: LaidOutLink) =>
              chart.tooltip(
                chartTooltip(lang.chartFlowLabel(link.source.label, link.target.label), [
                  {
                    label: lang.chartValue,
                    color: link.source.color,
                    value: valueText(link.value),
                  },
                ]),
              ),
            [Sankey.selectors.node]: (node: LaidOutNode) =>
              chart.tooltip(
                chartTooltip(node.label, [
                  { label: lang.chartTotal, color: node.color, value: valueText(node.value) },
                ]),
              ),
          },
        };
      },
    }));

    return () => (
      <ChartFrame
        {...rest}
        sx={[sankeyChartStyles.root, sx]}
        unit={unit}
        height={height}
        legend={[]}
        hiddenKeys={[]}
        onLegendToggle={() => {}}
        loading={loading}
        skeleton={<Skeleton sx={sankeyChartStyles.skeleton} />}
        isEmpty={nodes.length === 0}
        empty={empty}
        table={{
          columns: [lang.chartFlow, unit ? `${lang.chartValue}（${unit}）` : lang.chartValue],
          rows: links.map((link) => ({
            header: lang.chartFlowLabel(labelOf(link.source), labelOf(link.target)),
            cells: [format.number(link.value, valueFormat)],
          })),
        }}
        plotRef={(element) => (plot = element)}
      />
    );
  },
);
