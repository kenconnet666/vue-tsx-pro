/**
 * 弦图：节点排成一圈，两两之间的流量画成弦，看几方之间相互往来的多少（部门协作、地区间人口流动、贸易往来）。
 *
 *   <ChordChart aria-label="部门协作" nodes={departments} links={collaborations} />
 *
 * 数据同 SankeyChart（节点 { id, label?, color? }，流向 { source, target, value }）；弦取起点节点的颜色。
 * 悬停一段弧出这个节点的总量并突出它的弦，悬停一根弦出“起点 → 终点”的流量；点图例隐藏一个节点，连同它的弦。
 * 布局见 chordLayout：弧长是流入加流出，弦的两端都按流量定宽。
 * 单位、加载与空状态、给读屏的数据表（每条流向一行）同其他图表（见 ChartFrame）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { t } from '../config/theme/tokens';
import { Skeleton } from '../feedback/Skeleton';
import { svgNumber } from '../utils/data/number';
import type { PartProps } from '../utils/props';
import { flowData, resolveFlowNodes, type FlowLink, type FlowNode } from './flow';
import { ChartFrame, chartTooltip, useChartValueText, type ChartFrameParts } from './frame';
import { chordLayout } from './layout/chord';
import { ChartTooltipBox, chartSvgStyles, pointerIn, usePlotArea, type ChartTip } from './plot';
import { arcPath, polarPoint, ribbonPath } from './shape';
import { estimateTextWidth } from './text-size';

/** 未声明的属性落到外层 div（role="figure"）上，aria-label 是图表的名称 */
export interface ChordChartProps extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 节点 */
  nodes: readonly FlowNode[];
  /** 流向 */
  links: readonly FlowLink[];
  /** 数值的格式（可缩放，如以万元为单位）：提示框、数据表共用 */
  valueFormat?: NumericFormat;
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
  /** 隐藏的节点（存 id）：点图例时写回，父级可以写 _hiddenNodes={ids} */
  _hiddenNodes?: string[];
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
}

/** ChordChart 的样式：弧、弦、名字、骨架 */
export const chordChartStyles = css.create({
  skeleton: {
    display: 'block',
    height: '100%',
    aspectRatio: '1',
    marginInline: 'auto',
    borderRadius: '50%',
  },
  node: { transition: `opacity ${t.durations.sm} ${t.easings.standard}` },
  link: {
    fillOpacity: 0.45,
    stroke: '_surface',
    strokeOpacity: 0.6,
    strokeWidth: 0.5,
    transition: `fill-opacity ${t.durations.sm} ${t.easings.standard}`,
  },
  linkActive: { fillOpacity: 0.85 },
  linkFaded: { fillOpacity: 0.12 },
  nodeFaded: { opacity: 0.3 },
  label: { fill: '_textMuted', fontSize: '_xs' },
});

/** 弧的粗细、弧与弦之间的空、弧之间的空隙（弧度） */
const ARC_WIDTH = 14;
const ARC_GAP = 3;
const PAD_ANGLE = 0.04;

/** 悬停的是弧还是弦 */
interface ChordHover {
  kind: 'node' | 'link';
  index: number;
  x: number;
  y: number;
}

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
    _hiddenNodes: hiddenNodes = _bindable<string[]>([]),
    empty,
    ...rest
  }: ChordChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const resolved = _derived(resolveFlowNodes(nodes));
    const visible = _derived(new Map([...resolved].filter(([id]) => !hiddenNodes.includes(id))));
    const valueText = useChartValueText(() => ({ valueFormat, unit }));
    const labelOf = (id: string) => resolved.get(id)?.label ?? id;
    const area = usePlotArea();
    let hovered = _state.raw<ChordHover | null>(null);

    function toggle(id: string) {
      hiddenNodes = hiddenNodes.includes(id)
        ? hiddenNodes.filter((item) => item !== id)
        : [...hiddenNodes, id];
    }

    const layout = _derived.by(() => {
      const data = flowData(visible, links);
      const order = new Map(data.nodes.map((node, position) => [node.id, position]));
      const { groups, chords } = chordLayout(
        data.nodes.length,
        data.links.map((link) => ({
          source: order.get(link.source)!,
          target: order.get(link.target)!,
          value: link.amount,
        })),
        PAD_ANGLE,
      );
      return { nodes: data.nodes, flows: data.links, groups, chords };
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

    /** 弦与悬停的弧相连（悬停弦时只有它自己）：true 突出、false 变淡、undefined 没有悬停 */
    const chordState = (index: number) => {
      const current = hovered;
      if (!current) return undefined;
      if (current.kind === 'link') return current.index === index;
      const flow = layout.flows[index]!;
      const id = layout.nodes[current.index]?.id;
      return flow.source === id || flow.target === id;
    };

    function renderPlot() {
      const { width, height: plotHeight } = area;
      // 没有图例时名字写在弧外：留出最长的名字
      const labelRoom = legend
        ? 4
        : Math.max(0, ...layout.nodes.map((node) => estimateTextWidth(node.label))) + 12;
      const outer = Math.max(
        0,
        Math.min(width / 2 - labelRoom, plotHeight / 2 - (legend ? 4 : 20)),
      );
      const inner = Math.max(0, outer - ARC_WIDTH);
      const current = hovered;
      return (
        <svg
          width={width}
          height={plotHeight}
          {...css.attrs(chartSvgStyles.svg)}
          onPointermove={onPointermove}
          onPointerleave={() => (hovered = null)}
        >
          <g
            transform={`translate(${svgNumber(width / 2)},${svgNumber(plotHeight / 2)})`}
            {...css.attrs(chartSvgStyles.fadeIn)}
          >
            <g data-part="links">
              {layout.chords.map((chord) => {
                const state = chordState(chord.index);
                const source = visible.get(layout.flows[chord.index]!.source)!;
                return (
                  <path
                    key={chord.index}
                    data-part="link"
                    data-link={chord.index}
                    d={ribbonPath(Math.max(0, inner - ARC_GAP), chord.source, chord.target)}
                    {...css.attrs(
                      chordChartStyles.link,
                      chartSvgStyles.fill(source.color),
                      state === true && chordChartStyles.linkActive,
                      state === false && chordChartStyles.linkFaded,
                    )}
                  />
                );
              })}
            </g>
            {layout.groups.map((group, index) => {
              const node = layout.nodes[index]!;
              const middle = (group.start + group.end) / 2;
              const [x, y] = polarPoint(outer + 8, middle);
              const faded = current?.kind === 'node' && current.index !== index;
              return (
                <g key={node.id}>
                  <path
                    data-part="node"
                    data-node={index}
                    d={arcPath({ inner, outer, start: group.start, end: group.end, corner: 2 })}
                    {...css.attrs(
                      chordChartStyles.node,
                      chartSvgStyles.fill(node.color),
                      faded && chordChartStyles.nodeFaded,
                    )}
                  />
                  {!legend && (
                    <text
                      x={svgNumber(x)}
                      y={svgNumber(y)}
                      // 名字横着写：右半圈左对齐、左半圈右对齐，上下两端居中
                      text-anchor={Math.abs(x) < outer * 0.2 ? 'middle' : x > 0 ? 'start' : 'end'}
                      dominant-baseline="central"
                      {...css.attrs(chordChartStyles.label, chartSvgStyles.noPointer)}
                    >
                      {node.label}
                    </text>
                  )}
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
        const group = layout.groups[current.index];
        if (!node || !group) return null;
        return {
          x: current.x,
          y: current.y,
          content: chartTooltip(node.label, [
            { label: lang.chartTotal, color: node.color, value: valueText(group.value) },
          ]),
        };
      }
      const flow = layout.flows[current.index];
      if (!flow) return null;
      const source = resolved.get(flow.source)!;
      return {
        x: current.x,
        y: current.y,
        content: chartTooltip(lang.chartFlowLabel(source.label, labelOf(flow.target)), [
          { label: lang.chartValue, color: source.color, value: valueText(flow.value) },
        ]),
      };
    };

    return () => (
      <ChartFrame
        {...rest}
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
