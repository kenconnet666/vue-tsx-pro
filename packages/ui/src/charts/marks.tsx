/**
 * 直角坐标图表的图形：柱（分组、堆叠）、线、面积、数据点。柱状图、折线图、面积图、组合图、瀑布图按需组合，
 * 坐标都从 XYChartContext 换算（横向时类目在纵轴）。
 *
 *   render: (context) => [chartAreas(context, series, { curve: 'monotone' }), chartDots(context, series, 'hollow')]
 *
 * 进场：柱从基线长出来、线从左往右描出、面积与点淡入，时长取主题的 lg（“减少动态效果”时为 0）；
 * 用 @starting-style，只在图形第一次出现时播放，数据更新时原地变。
 */
import { css, type SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { t } from '../config/theme/tokens';
import { chartSvgStyles } from './plot';
import type { ResolvedSeries } from './series';
import {
  areaPath,
  barPath,
  linePath,
  type BarEnd,
  type ChartPoint,
  type LineCurves,
} from './shape';
import { stackValues, type StackSegment } from './stack';
import type { XYChartContext } from './XYChart';

const enter = `${t.durations.lg} ${t.easings.standard}`;

/** 图形的样式 */
export const chartMarkStyles = css.create({
  // 柱：从基线那一端长出来
  bar: {
    transformBox: 'fill-box',
    transition: `scale ${enter}, opacity ${t.durations.sm} ${t.easings.standard}`,
  },
  growUp: { transformOrigin: 'bottom', scale: { default: '1', '@starting-style': '1 0' } },
  growDown: { transformOrigin: 'top', scale: { default: '1', '@starting-style': '1 0' } },
  growRight: { transformOrigin: 'left', scale: { default: '1', '@starting-style': '0 1' } },
  growLeft: { transformOrigin: 'right', scale: { default: '1', '@starting-style': '0 1' } },
  // 线：pathLength 归一成 1，虚线的偏移从 1 到 0，看起来是从头描到尾
  line: {
    fill: 'none',
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    strokeDasharray: '1',
    strokeDashoffset: { default: 0, '@starting-style': 1 },
    transition: `stroke-dashoffset ${t.durations.xl} ${t.easings.standard}`,
    pointerEvents: 'none',
  },
  area: {
    stroke: 'none',
    pointerEvents: 'none',
    opacity: { default: 1, '@starting-style': 0 },
    transition: `opacity ${enter}`,
  },
  dot: {
    transformBox: 'fill-box',
    transformOrigin: 'center',
    scale: { default: '1', '@starting-style': '0' },
    transition: `scale ${enter}`,
    pointerEvents: 'none',
  },
  hollowDot: { fill: '_surface', strokeWidth: 2 },
  filledDot: { stroke: '_surface', strokeWidth: 1.5 },
  lineWidth: (width: number) => ({ strokeWidth: width }),
  fillOpacity: (opacity: number) => ({ fillOpacity: opacity }),
});

/** 一行上一个系列的点：[类目坐标, 数值坐标]；空值处断开成几段 */
function segments<T extends object>(
  context: XYChartContext<T>,
  value: (row: T, index: number) => number | undefined,
): [number, number, number][][] {
  const result: [number, number, number][][] = [];
  let current: [number, number, number][] = [];
  context.rows.forEach((row, index) => {
    const v = value(row, index);
    if (v === undefined) {
      if (current.length) result.push(current);
      current = [];
      return;
    }
    current.push([context.category(row, index), context.value(v), index]);
  });
  if (current.length) result.push(current);
  return result;
}

/** 柱的选项 */
export interface ChartBarOptions {
  /** 堆叠 */
  stacked?: boolean;
  /** 柱末端的圆角（px） */
  radius: number;
  /** 一组柱占一格的比例，默认分组 0.7、堆叠 0.6 */
  fill?: number;
  /** 一组柱最宽多少（px），默认分组 96、堆叠 48 */
  maxWidth?: number;
}

/** 柱末端朝哪边：正值朝上（横向朝右），负值反过来 */
function endOf(horizontal: boolean, negative: boolean): BarEnd {
  if (horizontal) return negative ? 'left' : 'right';
  return negative ? 'bottom' : 'top';
}

/** 一根柱：类目方向上从 start 起宽 width，数值方向上从 low 到 high */
export function chartBar<T extends object>(
  context: XYChartContext<T>,
  {
    start,
    width,
    low,
    high,
    radius,
    round,
    down,
  }: {
    start: number;
    width: number;
    low: number;
    high: number;
    radius: number;
    /** 末端是圆角 */
    round: boolean;
    /** 朝下（横向时朝左）长：末端在 low 那一头；不写时按正负（负值朝下） */
    down?: boolean;
  },
): { d: string; grow: SxStyles } {
  const negative = down ?? (high <= 0 && low < 0);
  const [a, b] = [context.value(low), context.value(high)];
  const end = round ? endOf(context.horizontal, negative) : 'none';
  const d = context.horizontal
    ? barPath(Math.min(a, b), start, Math.abs(b - a), width, radius, end)
    : barPath(start, Math.min(a, b), width, Math.abs(b - a), radius, end);
  const grow = context.horizontal
    ? negative
      ? chartMarkStyles.growLeft
      : chartMarkStyles.growRight
    : negative
      ? chartMarkStyles.growDown
      : chartMarkStyles.growUp;
  return { d, grow };
}

/** 分组（并排）或堆叠的柱：每根柱带 data-index（第几行），点击下钻按它找行 */
export function chartBars<T extends object>(
  context: XYChartContext<T>,
  series: readonly ResolvedSeries<T>[],
  { stacked = false, radius, fill, maxWidth }: ChartBarOptions,
): VNodeChild {
  if (!series.length) return null;
  const groupWidth = Math.min(
    context.step * (fill ?? (stacked ? 0.6 : 0.7)),
    maxWidth ?? (stacked ? 48 : 96),
  );
  const values = series.map((item) => context.rows.map((row) => context.valueOf(item, row)));
  const stacks: StackSegment[][] = stacked ? stackValues(values) : [];
  // 堆叠时只给每一摞最外面的一段圆角（正负各一）
  const outermost = (index: number, negative: boolean) => {
    for (let s = series.length - 1; s >= 0; s -= 1) {
      const value = values[s]![index];
      if (value !== undefined && value !== 0 && value < 0 === negative) return s;
    }
    return -1;
  };
  const barWidth = stacked ? groupWidth : groupWidth / (series.length + (series.length - 1) * 0.1);
  return (
    <g data-part="bars">
      {context.rows.flatMap((row, index) => {
        const groupStart = context.category(row, index) - groupWidth / 2;
        return series.map((item, s) => {
          const value = values[s]![index];
          if (value === undefined || value === 0) return null;
          const segment = stacked
            ? stacks[s]![index]!
            : { low: Math.min(0, value), high: Math.max(0, value) };
          const { d, grow } = chartBar(context, {
            start: stacked ? groupStart : groupStart + s * barWidth * 1.1,
            width: barWidth,
            low: segment.low,
            high: segment.high,
            radius,
            round: !stacked || outermost(index, value < 0) === s,
          });
          return (
            <path
              key={`${item.key}:${index}`}
              data-part="bar"
              data-index={index}
              d={d}
              {...css.attrs(chartMarkStyles.bar, grow, chartSvgStyles.fill(item.color))}
            />
          );
        });
      })}
    </g>
  );
}

/** 线的选项 */
export interface ChartLineOptions {
  /** 曲线 */
  curve: keyof LineCurves;
  /** 线宽（px） */
  width: number;
}

/** 每个系列一条线（空值处断开） */
export function chartLines<T extends object>(
  context: XYChartContext<T>,
  series: readonly ResolvedSeries<T>[],
  { curve, width }: ChartLineOptions,
): VNodeChild {
  return (
    <g data-part="lines">
      {series.map((item) => {
        const parts = segments(context, (row) => context.valueOf(item, row));
        const d = parts
          .map((part) =>
            linePath(
              part.map((p) => context.point(p[0], p[1])),
              curve,
            ),
          )
          .join('');
        return d ? (
          <path
            key={item.key}
            data-part="line"
            d={d}
            pathLength={1}
            {...css.attrs(
              chartMarkStyles.line,
              chartSvgStyles.stroke(item.color),
              chartMarkStyles.lineWidth(width),
            )}
          />
        ) : null;
      })}
    </g>
  );
}

/** 面积的选项 */
export interface ChartAreaOptions {
  /** 曲线 */
  curve: keyof LineCurves;
  /** 堆叠：用 context.stacks 里的上下沿 */
  stacked: boolean;
  /** 面积的不透明度 */
  opacity: number;
}

/** 每个系列一片面积，上沿描一条线；重叠时下沿是 0（或数值轴的下端），堆叠时是下面那一层 */
export function chartAreas<T extends object>(
  context: XYChartContext<T>,
  series: readonly ResolvedSeries<T>[],
  { curve, stacked, opacity }: ChartAreaOptions,
): VNodeChild {
  const [d0, d1] = context.domain;
  const floor = Math.min(Math.max(0, d0), d1);
  return (
    <g data-part="areas">
      {series.map((item) => {
        const stack = context.stacks.get(item.key);
        // 堆叠时空值是 0 厚度（面积连续）；重叠时空值处断开
        const parts =
          stacked && stack
            ? [
                context.rows.map(
                  (_, index) => [stack[index]!.low, stack[index]!.high, index] as const,
                ),
              ]
            : segments(context, (row) => context.valueOf(item, row)).map((part) =>
                part.map(
                  ([, , index]) =>
                    [floor, context.valueOf(item, context.rows[index]!)!, index] as const,
                ),
              );
        const toPoints = (part: readonly (readonly [number, number, number])[], edge: 0 | 1) =>
          part.map(([low, high, index]): ChartPoint =>
            context.point(
              context.category(context.rows[index]!, index),
              context.value(edge ? high : low),
            ),
          );
        const area = parts
          .map((part) => areaPath(toPoints(part, 1), toPoints(part, 0), curve))
          .join('');
        const top = parts.map((part) => linePath(toPoints(part, 1), curve)).join('');
        return (
          <g key={item.key}>
            <path
              data-part="area"
              d={area}
              {...css.attrs(
                chartMarkStyles.area,
                chartSvgStyles.fill(item.color),
                chartMarkStyles.fillOpacity(opacity),
              )}
            />
            <path
              data-part="line"
              d={top}
              pathLength={1}
              {...css.attrs(
                chartMarkStyles.line,
                chartSvgStyles.stroke(item.color),
                chartMarkStyles.lineWidth(2),
              )}
            />
          </g>
        );
      })}
    </g>
  );
}

/** 数据点：filled 实心（描一圈表面色），hollow 空心（表面色填充、系列色描边）；空值不画 */
export function chartDots<T extends object>(
  context: XYChartContext<T>,
  series: readonly ResolvedSeries<T>[],
  variant: 'filled' | 'hollow',
): VNodeChild {
  return (
    <g data-part="dots">
      {series.flatMap((item) =>
        context.rows.map((row, index) => {
          const value = context.valueOf(item, row);
          if (value === undefined) return null;
          const [x, y] = context.point(context.category(row, index), context.value(value));
          return (
            <circle
              key={`${item.key}:${index}`}
              data-part="dot"
              cx={x}
              cy={y}
              r={variant === 'hollow' ? 3.5 : 4}
              {...css.attrs(
                chartMarkStyles.dot,
                variant === 'hollow'
                  ? [chartMarkStyles.hollowDot, chartSvgStyles.stroke(item.color)]
                  : [chartMarkStyles.filledDot, chartSvgStyles.fill(item.color)],
              )}
            />
          );
        }),
      )}
    </g>
  );
}
