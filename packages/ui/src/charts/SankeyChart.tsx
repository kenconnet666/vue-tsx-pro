/**
 * 桑基图：节点之间的流量画成粗细不同的带子，看量从哪来、到哪去、在哪流失（转化漏斗、预算分配、能源流向）。
 *
 *   <SankeyChart aria-label="注册转化" nodes={steps} links={flows} unit="人" />
 *
 * 节点是 { id, label?, color? }，流向是 { source, target, value }（value 可以是 Decimal、bigint，要大于 0；不能成环）。
 * 带子取起点节点的颜色；悬停带子出“起点 → 终点”的流量，悬停节点出它的总量并突出与它相连的带子。
 * 节点旁写名字与总量（左半边的写在右侧，右半边的写在左侧）。布局见 sankeyLayout。
 * 单位、加载与空状态、给读屏的数据表（每条流向一行）同其他图表（见 ChartFrame）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { t } from '../config/theme/tokens';
import { Skeleton } from '../feedback/Skeleton';
import type { PartProps } from '../utils/props';
import { flowData, resolveFlowNodes, type FlowLink, type FlowNode } from './flow';
import { svgNumber } from '../utils/data/number';
import { ChartFrame, chartTooltip, useChartValueText, type ChartFrameParts } from './frame';
import { sankeyLayout } from './layout/sankey';
import { ChartTooltipBox, chartSvgStyles, pointerIn, usePlotArea, type ChartTip } from './plot';
import { horizontalLinkPath } from './shape';

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

/** SankeyChart 的样式：节点、带子、名字、骨架 */
export const sankeyChartStyles = css.create({
  skeleton: { display: 'block', width: '100%', height: '100%' },
  node: { stroke: '_surface', strokeWidth: 1 },
  link: {
    fill: 'none',
    strokeOpacity: 0.35,
    transition: `stroke-opacity ${t.durations.sm} ${t.easings.standard}`,
  },
  linkActive: { strokeOpacity: 0.6 },
  linkFaded: { strokeOpacity: 0.12 },
  name: { fill: '_text', fontSize: '_xs', fontWeight: '_medium' },
  value: { fill: '_textMuted', fontSize: '_xs' },
});

/** 节点的宽、同一列里节点的间距、上下留的空（px） */
const NODE_WIDTH = 12;
const NODE_PADDING = 16;
const MARGIN = 8;

/** 悬停的是节点还是带子 */
interface SankeyHover {
  kind: 'node' | 'link';
  index: number;
  x: number;
  y: number;
}

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
    ...rest
  }: SankeyChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const resolved = _derived(resolveFlowNodes(nodes));
    const valueText = useChartValueText(() => ({ valueFormat, unit }));
    const labelOf = (id: string) => resolved.get(id)?.label ?? id;
    const area = usePlotArea();
    let hovered = _state.raw<SankeyHover | null>(null);

    const layout = _derived.by(() => {
      const data = flowData(resolved, links);
      const laid = sankeyLayout(
        data.nodes.map((node) => node.id),
        data.links.map((link) => ({
          source: link.source,
          target: link.target,
          value: link.amount,
        })),
        {
          width: area.width,
          height: Math.max(0, area.height - MARGIN * 2),
          nodeWidth: NODE_WIDTH,
          nodePadding: NODE_PADDING,
          align,
        },
      );
      return { ...laid, flows: data.links };
    });

    function onPointermove(event: PointerEvent) {
      const target = (event.target as Element).closest?.('[data-node],[data-link]');
      if (!target) {
        hovered = null;
        return;
      }
      const { x, y } = pointerIn(event, event.currentTarget as Element);
      const node = target.getAttribute('data-node');
      hovered =
        node === null
          ? { kind: 'link', index: Number(target.getAttribute('data-link')), x, y }
          : { kind: 'node', index: Number(node), x, y };
    }

    /** 带子与悬停的节点相连（悬停带子时只有它自己）：true 突出、false 变淡、undefined 没有悬停 */
    const linkState = (index: number) => {
      const current = hovered;
      if (!current) return undefined;
      if (current.kind === 'link') return current.index === index;
      const link = layout.links[index]!;
      const node = layout.nodes[current.index]!;
      return link.source === node || link.target === node;
    };

    function renderPlot() {
      const { width } = area;
      return (
        <svg
          width={width}
          height={area.height}
          {...css.attrs(chartSvgStyles.svg)}
          onPointermove={onPointermove}
          onPointerleave={() => (hovered = null)}
        >
          <g transform={`translate(0,${MARGIN})`} {...css.attrs(chartSvgStyles.fadeIn)}>
            <g data-part="links">
              {layout.links.map((link, index) => {
                const state = linkState(index);
                return (
                  <path
                    key={index}
                    data-part="link"
                    data-link={index}
                    d={horizontalLinkPath(link.source.x1, link.y0, link.target.x0, link.y1)}
                    stroke-width={svgNumber(Math.max(1, link.width))}
                    {...css.attrs(
                      sankeyChartStyles.link,
                      chartSvgStyles.stroke(resolved.get(link.source.id)!.color),
                      state === true && sankeyChartStyles.linkActive,
                      state === false && sankeyChartStyles.linkFaded,
                    )}
                  />
                );
              })}
            </g>
            {layout.nodes.map((node, index) => {
              const info = resolved.get(node.id)!;
              // 左半边的节点名字写在右侧，右半边的写在左侧：都朝着图的中间
              const right = node.x0 < width / 2;
              const middle = (node.y0 + node.y1) / 2;
              const x = right ? node.x1 + 6 : node.x0 - 6;
              const anchor = right ? 'start' : 'end';
              return (
                <g key={node.id}>
                  <rect
                    data-part="node"
                    data-node={index}
                    x={svgNumber(node.x0)}
                    y={svgNumber(node.y0)}
                    width={NODE_WIDTH}
                    height={svgNumber(Math.max(1, node.y1 - node.y0))}
                    rx={2}
                    {...css.attrs(sankeyChartStyles.node, chartSvgStyles.fill(info.color))}
                  />
                  <text
                    x={x}
                    y={svgNumber(middle - 7)}
                    text-anchor={anchor}
                    dominant-baseline="central"
                    {...css.attrs(
                      sankeyChartStyles.name,
                      chartSvgStyles.halo,
                      chartSvgStyles.noPointer,
                    )}
                  >
                    {info.label}
                  </text>
                  <text
                    x={x}
                    y={svgNumber(middle + 8)}
                    text-anchor={anchor}
                    dominant-baseline="central"
                    {...css.attrs(
                      sankeyChartStyles.value,
                      chartSvgStyles.halo,
                      chartSvgStyles.noPointer,
                    )}
                  >
                    {valueText(node.value)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      );
    }

    const tip = (): ChartTip | null => {
      const current = hovered;
      if (!tooltip || !current) return null;
      if (current.kind === 'node') {
        const node = layout.nodes[current.index];
        const info = node && resolved.get(node.id);
        if (!node || !info) return null;
        return {
          x: current.x,
          y: current.y,
          content: chartTooltip(info.label, [
            { label: lang.chartTotal, color: info.color, value: valueText(node.value) },
          ]),
        };
      }
      const link = layout.links[current.index];
      if (!link) return null;
      const source = resolved.get(link.source.id)!;
      return {
        x: current.x,
        y: current.y,
        content: chartTooltip(lang.chartFlowLabel(source.label, labelOf(link.target.id)), [
          {
            label: lang.chartValue,
            color: source.color,
            value: valueText(layout.flows[link.index]!.value),
          },
        ]),
      };
    };

    return () => (
      <ChartFrame
        {...rest}
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
        plotRef={area.ref}
        plot={
          area.ready
            ? [renderPlot(), <ChartTooltipBox key="tooltip" tip={tip()} width={area.width} />]
            : null
        }
      />
    );
  },
);
