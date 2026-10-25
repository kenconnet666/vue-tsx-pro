/**
 * 组合图：同一组类目上既有柱又有线（金额与比率、数量与单价），单位不同的系列画在右侧的第二数值轴上。
 *
 *   <ComboChart
 *     aria-label="月度降本与完成率"
 *     data={months}
 *     index="month"
 *     series={[
 *       { key: 'planned', label: '计划降本' },
 *       { key: 'actual', label: '实际降本' },
 *       { key: 'rate', label: '完成率', type: 'line', axis: 'secondary' },
 *     ]}
 *     unit="万元"
 *     secondaryFormat={{ style: 'percent' }}
 *   />
 *
 * 柱子并排（stacked 时叠起），线可以带数据点。第二数值轴的刻度与主轴对齐（同一组网格线），
 * 它的单位写在右上方，提示框、数据表里按各自的格式与单位显示。其余（图例、目标线、标注、区间、下钻）同 XYChart。
 */
import { GroupedBar, Line, Scatter, StackedBar, type XYComponentCore } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import type { NumericFormat } from '../config/lang/format';
import { colors } from '../config/theme/tokens';
import { CURVES, type LineCurves, type LineDots } from './LineChart';
import type { ChartSeries } from './series';
import { seriesNumber } from './series';
import { XYChart, type XYChartKind, type XYChartProps } from './XYChart';

/** 组合图的一个系列 */
export interface ComboSeries<T> extends ChartSeries<T> {
  /** 画法：bar 柱（默认）、line 线 */
  type?: 'bar' | 'line';
  /** 数值轴：primary 左侧的主轴（默认），secondary 右侧的第二数值轴（单位不同的量） */
  axis?: 'primary' | 'secondary';
}

/** 未声明的属性落到外层 div（role="figure"）上；aria-label 是图表的名称 */
export interface ComboChartProps<T extends object> extends Omit<XYChartProps<T>, 'series'> {
  /** 系列：柱或线，画在主轴或第二数值轴上 */
  series: readonly ComboSeries<T>[];
  /** 第二数值轴的格式（比率写 `{ style: 'percent' }`） */
  secondaryFormat?: NumericFormat;
  /** 第二数值轴的单位：显示在右上方 */
  secondaryUnit?: string;
  /** 柱子堆叠：同一类目的柱叠成一根；默认并排 */
  stacked?: boolean;
  /** 线的形状，默认 linear */
  curve?: keyof LineCurves;
  /** 线上的数据点，默认 filled */
  dots?: keyof LineDots;
  /** 柱子末端的圆角（px），默认 4 */
  radius?: number;
}

/** 数据点的直径（px） */
const DOT_SIZE = 8;

/** 组合图：柱 + 线，可以有第二数值轴 */
export const ComboChart = _component(
  <T extends object>({
    series,
    secondaryFormat,
    secondaryUnit,
    stacked = false,
    curve = 'linear',
    dots = 'filled',
    radius = 4,
    _hiddenSeries: hiddenSeries = _bindable<string[]>([]),
    ...rest
  }: ComboChartProps<T>) => {
    const isLine = (key: string) => series.find((item) => item.key === key)?.type === 'line';
    const secondaryKeys = _derived(
      series.filter((item) => item.axis === 'secondary').map((item) => item.key as string),
    );

    const kind = _derived<XYChartKind<T>>({
      skeleton: 'bars',
      stacked,
      crosshairDots: true,
      // 十字线只在线上画圆点，柱子不画
      crosshairSeries: (item) => isLine(item.key),
      itemSelector: stacked ? StackedBar.selectors.bar : GroupedBar.selectors.bar,
      secondary:
        secondaryKeys.length > 0
          ? { keys: secondaryKeys, format: secondaryFormat, unit: secondaryUnit }
          : undefined,
      // 主轴的范围：堆叠的柱按正负各自的总和，线按各自的值
      domainValues: (rows, shown) =>
        rows.flatMap((row) => {
          const bars = shown.filter((item) => !isLine(item.key));
          const lines = shown.filter((item) => isLine(item.key));
          const values = (list: typeof shown) =>
            list.map((item) => seriesNumber(row, item.key) ?? 0);
          const barValues = values(bars);
          return [
            ...(stacked
              ? [
                  barValues.reduce((sum, value) => sum + Math.max(value, 0), 0),
                  barValues.reduce((sum, value) => sum + Math.min(value, 0), 0),
                ]
              : barValues),
            ...values(lines),
          ];
        }),
      components: ({ series: shown, x, y, instance, events }) => {
        const bars = shown.filter((item) => !isLine(item.key));
        const lines = shown.filter((item) => isLine(item.key));
        const components: XYComponentCore<T>[] = [];
        if (bars.length > 0) {
          const common = {
            x,
            y: bars.map(y),
            color: (_row: T, position: number) => bars[position]?.color,
            roundedCorners: radius,
            events,
          };
          if (stacked) {
            const stack = instance('stacked', () => new StackedBar<T>({ x, y: [] }));
            stack.setConfig({ ...common, barPadding: 0.4, barMaxWidth: 48 });
            components.push(stack);
          } else {
            const group = instance('grouped', () => new GroupedBar<T>({ x, y: [] }));
            group.setConfig({
              ...common,
              groupPadding: 0.3,
              barPadding: 0.1,
              groupMaxWidth: 96,
              barMinHeight: 0,
            });
            components.push(group);
          }
        }
        if (lines.length > 0) {
          const line = instance('line', () => new Line<T>({ x, y: [] }));
          line.setConfig({
            x,
            y: lines.map(y),
            color: (_rows: T[], position: number) => lines[position]?.color,
            curveType: CURVES[curve],
            lineWidth: 2,
          });
          components.push(line);
          if (dots !== 'none')
            for (const item of lines) {
              const points = instance(`dots:${item.key}`, () => new Scatter<T>({ x, y: () => 0 }));
              points.setConfig({
                x,
                y: y(item),
                size: DOT_SIZE,
                color: dots === 'hollow' ? colors.surface : item.color,
                strokeColor: item.color,
                strokeWidth: dots === 'hollow' ? 2 : 0,
              });
              components.push(points);
            }
        }
        return components;
      },
    });
    return () => <XYChart {...rest} series={series} _hiddenSeries={hiddenSeries} kind={kind} />;
  },
);
