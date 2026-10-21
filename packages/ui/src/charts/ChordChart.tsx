/**
 * 弦图：节点排成一圈，两两之间的流量画成弦，看几方之间相互往来的多少（部门协作、地区间人口流动、贸易往来）。
 *
 *   <ChordChart aria-label="部门协作" nodes={departments} links={collaborations} />
 *
 * 数据同 SankeyChart（节点 { id, label?, color? }，流向 { source, target, value }）；弦取起点节点的颜色。
 * 悬停一段弧出这个节点的总量，悬停一根弦出“起点 → 终点”的流量；点图例隐藏一个节点，连同它的弦。
 * 单位、加载与空状态、给读屏的数据表（每条流向一行）同其他图表（见 ChartFrame）。
 */
import { ChordDiagram, ChordLabelAlignment } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { colors, fontSizes } from '../config/theme/tokens.stylex';
import { Skeleton } from '../feedback/Skeleton';
import type { NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import { flowData, resolveFlowNodes, type FlowLink, type FlowNode } from './flow';
import { ChartFrame, chartTooltip, type ChartFrameParts } from './frame';
import { useSingleChart, type SingleChart } from './single';

/** 未声明的属性落到外层 div（role="figure"）上，aria-label 是图表的名称 */
export interface ChordChartProps extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 节点 */
  nodes: readonly FlowNode[];
  /** 流向 */
  links: readonly FlowLink[];
  /** 数值的格式（Intl.NumberFormatOptions）：提示框、数据表共用 */
  valueFormat?: Intl.NumberFormatOptions;
  /** 单位：显示在左上方，数值后面带上 */
  unit?: string;
  /**
   * 绘图区的高度；数字按 px
   * @default 320
   */
  height?: number | string;
  /**
   * 图例：点一下隐藏节点；关掉时节点名写在弧的外侧
   * @default true
   */
  legend?: boolean;
  /**
   * 悬停时的提示框
   * @default true
   */
  tooltip?: boolean;
  /**
   * 加载中：绘图区显示一个圆形的骨架，带 aria-busy
   * @default false
   */
  loading?: boolean;
  /** 隐藏的节点（存 id）：点图例时写回，父级可以写 hiddenNodes={_bind(ids)} */
  hiddenNodes?: string[];
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
}

/** ChordChart 的样式：root（--vis-chord-diagram-* 主题变量）、skeleton */
export const chordChartStyles = stylex.create({
  root: {
    '--vis-chord-diagram-link-opacity': '0.45',
    '--vis-chord-diagram-link-stroke-color': colors.surface,
    '--vis-chord-diagram-link-stroke-opacity': '0.6',
    '--vis-chord-diagram-link-highlighted-opacity': '0.85',
    '--vis-chord-diagram-link-dimmed-opacity': '0.12',
    '--vis-chord-diagram-node-dimmed-opacity': '0.3',
    '--vis-chord-diagram-label-text-font-size': fontSizes.xs,
  },
  skeleton: {
    display: 'block',
    height: '100%',
    aspectRatio: '1',
    marginInline: 'auto',
    borderRadius: '50%',
  },
});

/** 交给 Unovis 的节点、流向 */
type Data = ReturnType<typeof flowData>;
type Node = Data['nodes'][number];
type Link = Data['links'][number];

/** 弦图 */
export const ChordChart = _component(
  ({
    nodes,
    links,
    valueFormat,
    unit,
    height = 320,
    legend = true,
    tooltip = true,
    loading = false,
    hiddenNodes = _bindable<string[]>([]),
    empty,
    sx,
    ...rest
  }: ChordChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const resolved = _derived(resolveFlowNodes(nodes));
    const visible = _derived(new Map([...resolved].filter(([id]) => !hiddenNodes.includes(id))));
    const valueText = (amount: NumericValue | undefined) =>
      amount === undefined ? '—' : `${format.number(amount, valueFormat)}${unit ? ` ${unit}` : ''}`;
    const labelOf = (id: string) => resolved.get(id)?.label ?? id;

    function toggle(id: string) {
      hiddenNodes = hiddenNodes.includes(id)
        ? hiddenNodes.filter((item) => item !== id)
        : [...hiddenNodes, id];
    }

    let plot = _state.raw<HTMLElement | null>(null);
    const chart: SingleChart = useSingleChart<{ nodes: Node[]; links?: Link[] }>(() => ({
      element: plot,
      ready: !loading && nodes.length > 0,
      tooltip,
      build: (instance) => {
        const chord = instance(
          'chord',
          () => new ChordDiagram<Node, Link>({ linkValue: (link) => link.amount }),
        );
        chord.setConfig({
          linkValue: (link) => link.amount,
          nodeColor: (node) => (node as Node).color,
          linkColor: (link) => (link.source as Node).color,
          // 有图例时不在弧旁写名字：径向排的中文在上下两侧是竖着的，不好读
          nodeLabel: (node) => (legend ? '' : (node as Node).label),
          padAngle: 0.04,
          nodeWidth: 14,
          nodeLabelAlignment: ChordLabelAlignment.Perpendicular,
          nodeLabelColor: () => colors.textMuted,
        });
        return {
          component: chord,
          data: flowData(visible, links),
          triggers: {
            [ChordDiagram.selectors.node]: (node: { data: Node; _state: { value?: number } }) =>
              chart.tooltip(
                chartTooltip(node.data.label, [
                  {
                    label: lang.chartTotal,
                    color: node.data.color,
                    value: valueText(node._state.value),
                  },
                ]),
              ),
            [ChordDiagram.selectors.link]: (ribbon: {
              data: { source: Node; target: Node; value: NumericValue };
            }) =>
              chart.tooltip(
                chartTooltip(
                  lang.chartFlowLabel(ribbon.data.source.label, ribbon.data.target.label),
                  [
                    {
                      label: lang.chartValue,
                      color: ribbon.data.source.color,
                      value: valueText(ribbon.data.value),
                    },
                  ],
                ),
              ),
          },
        };
      },
    }));

    return () => (
      <ChartFrame
        {...rest}
        sx={[chordChartStyles.root, sx]}
        unit={unit}
        height={height}
        legend={
          legend
            ? [...resolved.values()].map((node) => ({
                key: node.id,
                label: node.label,
                color: node.color,
              }))
            : []
        }
        hiddenKeys={hiddenNodes}
        onLegendToggle={toggle}
        loading={loading}
        skeleton={<Skeleton sx={chordChartStyles.skeleton} />}
        isEmpty={nodes.length === 0}
        empty={empty}
        table={{
          columns: [lang.chartFlow, unit ? `${lang.chartValue}（${unit}）` : lang.chartValue],
          rows: links
            .filter((link) => visible.has(link.source) && visible.has(link.target))
            .map((link) => ({
              header: lang.chartFlowLabel(labelOf(link.source), labelOf(link.target)),
              cells: [format.number(link.value, valueFormat)],
            })),
        }}
        plotRef={(element) => (plot = element)}
      />
    );
  },
);
