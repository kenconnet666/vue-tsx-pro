/**
 * 时间条图（甘特图式）：每行一个任务（项目、设备、人），横轴是时间，每项一段时间条；
 * 计划画成宽而浅的轨道、实际画在上面，一眼看出提前还是拖期。可以标出“今天”与里程碑。
 *
 *   <TimelineChart
 *     aria-label="项目进度"
 *     items={[
 *       { row: '官网改版', series: 'plan', start: '2026-03-01', end: '2026-06-30' },
 *       { row: '官网改版', series: 'actual', start: '2026-03-10', end: '2026-07-20' },
 *     ]}
 *     series={[{ key: 'plan', label: '计划', variant: 'track' }, { key: 'actual', label: '实际' }]}
 *     today
 *   />
 *
 * 时间可以是 Date、时间戳或 ISO 字符串；只有日期（'2026-06-30'）的结束含这一天。行按 rows 的顺序，没给时按第一次出现。
 * 左侧是行名，底下是整齐的时间刻度（月初、周、日、整点，见 timeTicks）；悬停一段显示名称、起止与天数；
 * 读屏的数据表列出每一项。
 */
import { getLocalTimeZone } from '@internationalized/date';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import { parseIsoDate, parseIsoDateTime } from '../utils/data/date';
import { svgNumber } from '../utils/data/number';
import type { PartProps } from '../utils/props';
import { ChartFrame, chartTooltip, type ChartFrameParts } from './frame';
import {
  ChartTooltipBox,
  chartAxis,
  chartSvgStyles,
  pointerIn,
  usePlotArea,
  type ChartTip,
} from './plot';
import { linearScale, timeTicks } from './scale';
import { resolveColor, type ChartColor } from './series';
import { estimateTextWidth, truncateText } from './text-size';
import { xyChartStyles } from './XYChart';

/** 一个时间点：Date、时间戳（毫秒）或 ISO 字符串（日期或日期时间） */
export type TimelineTime = Date | number | string;

/** 一段时间条 */
export interface TimelineChartItem {
  /** 所在的行（任务、项目、设备） */
  row: string;
  /** 开始 */
  start: TimelineTime;
  /** 结束；只有日期时含这一天 */
  end: TimelineTime;
  /** 名称：提示框的标题；不写时是行名 */
  label?: string;
  /** 系列的 key（计划、实际）：决定颜色、粗细与图例 */
  series?: string;
  /** 颜色：覆盖系列的颜色（拖期的一段标红） */
  color?: ChartColor;
}

/** 时间条的系列 */
export interface TimelineChartSeries {
  /** 标识：项的 series 指向它 */
  key: string;
  /** 名称：图例、提示框 */
  label: string;
  /** 颜色；不写时按顺序取色板 */
  color?: ChartColor;
  /** bar 实心的条（默认）；track 宽而浅的轨道，画在下面（计划） */
  variant?: 'bar' | 'track';
}

/** 时间轴上的一条竖线：里程碑、截止日 */
export interface TimelineChartMarker {
  /** 时间 */
  at: TimelineTime;
  /** 文字 */
  label: string;
  /** 颜色，默认次要色 */
  color?: ChartColor;
}

/** 未声明的属性落到外层 div（role="figure"）上；aria-label 是图表的名称 */
export interface TimelineChartProps
  extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 各段时间条 */
  items: readonly TimelineChartItem[];
  /** 系列：颜色、图例与画法；不写时所有条同一个颜色 */
  series?: readonly TimelineChartSeries[];
  /** 行的顺序；不写时按第一次出现 */
  rows?: readonly string[];
  /** 标出今天（true）或指定的“今天” */
  today?: boolean | TimelineTime;
  /** 里程碑、截止日：竖线带文字 */
  markers?: readonly TimelineChartMarker[];
  /**
   * 每行的高度（px）
   * @default 32
   */
  rowHeight?: number;
  /** 刻度上日期的写法；不写时按刻度的间隔选（几个月一格写“4月”，几天一格写“10/24”，几小时一格写“14:00”） */
  dateFormat?: Intl.DateTimeFormatOptions;
  /** 加载中：绘图区显示骨架 */
  loading?: boolean;
  /** 隐藏的系列：点图例时写回，父级可以写 _hiddenSeries={keys} */
  _hiddenSeries?: string[];
  /** 没有数据时显示的内容 */
  empty?: VNodeChild;
  /** 悬停时的提示框，默认 true */
  tooltip?: boolean;
}

/** 画图用的一段：时间换成毫秒 */
interface Segment {
  item: TimelineChartItem;
  start: number;
  end: number;
  color: string;
  width: number;
  track: boolean;
}

const DAY = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 行名最宽多少（px），更长的截短 */
const LABEL_WIDTH = 160;

/** TimelineChart 的样式：隔行的底色、时间条 */
export const timelineChartStyles = css.create({
  stripe: { fill: '_surfaceMuted' },
  segment: { stroke: '_surface', strokeWidth: 0 },
  segmentActive: { strokeWidth: 1.5, stroke: '_text' },
});

/** 轨道（计划）的颜色：系列色调浅 */
const trackColor = (color: string) => `color-mix(in srgb, ${color} 30%, transparent)`;

/** 按刻度的间隔选日期的写法：几个月一格写月，几天一格写月日，不到一天写时分 */
function autoFormat(ticks: readonly Date[]): Intl.DateTimeFormatOptions {
  const step = ticks.length > 1 ? ticks[1]!.getTime() - ticks[0]!.getTime() : DAY;
  if (step >= 28 * DAY) return { month: 'short' };
  if (step >= DAY) return { month: 'numeric', day: 'numeric' };
  return { hour: '2-digit', minute: '2-digit' };
}

/** 时间点换成毫秒：ISO 字符串按语言的时区；只有日期的结束取到这一天的末尾 */
function toTime(value: TimelineTime, timeZone: string, end = false): number {
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  // 只有日期：结束取到这一天的末尾（parseIsoDateTime 也接受只有日期的写法，要先认出来）
  const date = ISO_DATE.test(value) ? parseIsoDate(value) : null;
  if (date) return date.toDate(timeZone).getTime() + (end ? DAY : 0);
  const dateTime = parseIsoDateTime(value);
  if (dateTime) return dateTime.toDate(timeZone).getTime();
  return Date.parse(value);
}

/** 时间条图 */
export const TimelineChart = _component(
  ({
    items,
    series = [],
    rows,
    today,
    markers,
    rowHeight = 32,
    dateFormat,
    loading = false,
    _hiddenSeries: hiddenSeries = _bindable<string[]>([]),
    empty,
    tooltip = true,
    ...rest
  }: TimelineChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const zone = () => lang.timeZone ?? getLocalTimeZone();
    const colorOf = (key: string | undefined) => {
      const position = series.findIndex((item) => item.key === key);
      return resolveColor(series[position]?.color, Math.max(position, 0));
    };
    const rowOrder = _derived(rows ?? [...new Set(items.map((item) => item.row))]);
    const visible = _derived(
      items.filter((item) => item.series === undefined || !hiddenSeries.includes(item.series)),
    );
    const dateText = (time: number) => format.date(new Date(time), { dateStyle: 'medium' });
    const daysText = (segment: Segment) =>
      lang.chartDays(Math.round((segment.end - segment.start) / DAY));

    function toggle(key: string) {
      hiddenSeries = hiddenSeries.includes(key)
        ? hiddenSeries.filter((item) => item !== key)
        : [...hiddenSeries, key];
    }

    /** 画图的各段：轨道先画（在下面），同一行里按开始时间 */
    const segments = (): Segment[] =>
      visible
        .map((item): Segment => {
          const track = series.find((entry) => entry.key === item.series)?.variant === 'track';
          return {
            item,
            start: toTime(item.start, zone()),
            end: toTime(item.end, zone(), true),
            color: item.color ? resolveColor(item.color, 0) : colorOf(item.series),
            width: track ? rowHeight * 0.62 : rowHeight * 0.32,
            track,
          };
        })
        .sort(
          (a, b) =>
            rowOrder.indexOf(a.item.row) - rowOrder.indexOf(b.item.row) ||
            Number(b.track) - Number(a.track) ||
            a.start - b.start,
        );

    /** 竖线：今天与里程碑 */
    const allMarkers = (): TimelineChartMarker[] => [
      ...(today !== undefined && today !== false
        ? [{ at: today === true ? Date.now() : today, label: lang.chartToday, color: 'danger' }]
        : []),
      ...(markers ?? []),
    ];

    const area = usePlotArea();
    let hovered = _state.raw<{ index: number; x: number; y: number } | null>(null);

    function onPointermove(event: PointerEvent) {
      const target = (event.target as Element).closest?.('[data-segment]');
      if (!target) {
        hovered = null;
        return;
      }
      const { x, y } = pointerIn(event, event.currentTarget as Element);
      hovered = { index: Number(target.getAttribute('data-segment')), x, y };
    }

    function renderPlot(shown: readonly Segment[]) {
      const { width } = area;
      const rowsHeight = rowOrder.length * rowHeight;
      const labelWidth = Math.min(
        LABEL_WIDTH,
        Math.max(0, ...rowOrder.map((row) => estimateTextWidth(row))) + 16,
      );
      const marks = allMarkers().map((marker) => ({ ...marker, time: toTime(marker.at, zone()) }));
      const times = [
        ...shown.flatMap((segment) => [segment.start, segment.end]),
        ...marks.map((m) => m.time),
      ];
      const [low, high] = times.length ? [Math.min(...times), Math.max(...times)] : [0, DAY];
      const [start, end] = low === high ? [low - DAY, high + DAY] : [low, high];
      const scale = linearScale(
        [start, end],
        [labelWidth + 8, Math.max(labelWidth + 9, width - 16)],
      );
      const ticks = timeTicks(start, end, Math.max(2, Math.round((width - labelWidth) / 110)));
      const tickFormat = dateFormat ?? autoFormat(ticks);
      const plot = {
        left: labelWidth + 8,
        top: 0,
        width: Math.max(0, width - labelWidth - 24),
        height: rowsHeight,
      };
      const rowOf = (row: string) => rowOrder.indexOf(row);
      return (
        <svg
          width={width}
          height={area.height}
          {...css.attrs(chartSvgStyles.svg)}
          onPointermove={onPointermove}
          onPointerleave={() => (hovered = null)}
        >
          {rowOrder.map((row, position) =>
            position % 2 === 0 ? (
              <rect
                key={`stripe:${row}`}
                x={0}
                y={position * rowHeight}
                width={width}
                height={rowHeight}
                {...css.attrs(timelineChartStyles.stripe)}
              />
            ) : null,
          )}
          {chartAxis({
            side: 'bottom',
            ticks: ticks.map((tick) => ({
              position: scale(tick.getTime()),
              label: format.date(tick, tickFormat),
            })),
            plot,
            grid: true,
          })}
          {rowOrder.map((row, position) => (
            <text
              key={`label:${row}`}
              x={0}
              y={svgNumber(position * rowHeight + rowHeight / 2)}
              dominant-baseline="central"
              {...css.attrs(chartSvgStyles.label)}
            >
              {truncateText(row, labelWidth - 12)}
            </text>
          ))}
          <g {...css.attrs(chartSvgStyles.fadeIn)}>
            {shown.map((segment, index) => {
              const row = rowOf(segment.item.row);
              if (row < 0) return null;
              const x = scale(segment.start);
              const length = Math.max(segment.width, scale(segment.end) - x);
              return (
                <rect
                  key={index}
                  data-part="segment"
                  data-segment={index}
                  x={svgNumber(x)}
                  y={svgNumber(row * rowHeight + (rowHeight - segment.width) / 2)}
                  width={svgNumber(length)}
                  height={svgNumber(segment.width)}
                  rx={svgNumber(segment.width / 2)}
                  {...css.attrs(
                    timelineChartStyles.segment,
                    chartSvgStyles.fill(segment.track ? trackColor(segment.color) : segment.color),
                    hovered?.index === index && timelineChartStyles.segmentActive,
                  )}
                />
              );
            })}
          </g>
          {marks.map((marker, position) => {
            const x = Math.round(scale(marker.time)) + 0.5;
            const color = resolveColor(marker.color ?? 'neutral', 0);
            return (
              <g key={`marker:${position}`} data-part="marker">
                <line
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={rowsHeight}
                  {...css.attrs(xyChartStyles.eventLine, chartSvgStyles.stroke(color))}
                />
                <text
                  x={x + 4}
                  y={4}
                  dominant-baseline="hanging"
                  {...css.attrs(
                    chartSvgStyles.labelMuted,
                    chartSvgStyles.halo,
                    xyChartStyles.textFill(color),
                    chartSvgStyles.noPointer,
                  )}
                >
                  {marker.label}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }

    const tip = (shown: readonly Segment[]): ChartTip | null => {
      const current = hovered;
      const segment = current && shown[current.index];
      if (!tooltip || !current || !segment) return null;
      const name = series.find((entry) => entry.key === segment.item.series)?.label;
      return {
        x: current.x,
        y: current.y,
        content: chartTooltip(segment.item.label ?? segment.item.row, [
          ...(name ? [{ label: name, color: segment.color, value: daysText(segment) }] : []),
          { label: lang.chartStart, color: 'transparent', value: dateText(segment.start) },
          { label: lang.chartEnd, color: 'transparent', value: dateText(segment.end - 1) },
        ]),
      };
    };

    return () => {
      const shown = segments();
      return (
        <ChartFrame
          {...rest}
          // 行数 × 行高，加上时间轴
          height={rowOrder.length * rowHeight + 36}
          legend={series.map((item, position) => {
            const color = resolveColor(item.color, position);
            return {
              key: item.key,
              label: item.label,
              color: item.variant === 'track' ? trackColor(color) : color,
            };
          })}
          hiddenKeys={hiddenSeries}
          onLegendToggle={toggle}
          loading={loading}
          skeleton={<Skeleton sx={xyChartStyles.skeleton} />}
          isEmpty={items.length === 0}
          empty={empty}
          table={{
            columns: [
              lang.chartCategory,
              lang.chartSeries,
              lang.chartStart,
              lang.chartEnd,
              lang.chartDuration,
            ],
            rows: shown.map((segment) => ({
              header: segment.item.label ?? segment.item.row,
              cells: [
                series.find((entry) => entry.key === segment.item.series)?.label ?? lang.emptyValue,
                dateText(segment.start),
                dateText(segment.end - 1),
                daysText(segment),
              ],
            })),
          }}
          plotRef={area.ref}
          plot={
            area.ready
              ? [
                  renderPlot(shown),
                  <ChartTooltipBox key="tooltip" tip={tip(shown)} width={area.width} />,
                ]
              : null
          }
        />
      );
    };
  },
);
