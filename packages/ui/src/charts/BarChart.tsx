/**
 * 柱状图：每个类目一组柱子，系列并排（分组）或叠成一根（堆叠），可以横向；stacked="percent" 时每根叠满 100%（看构成）。
 *
 *   <BarChart
 *     aria-label="各项目销售额"
 *     data={projects}
 *     index="name"
 *     series={[{ key: 'planned', label: '预期销售' }, { key: 'actual', label: '实际销售' }]}
 *     unit="万元"
 *   />
 *
 * 颜色、坐标轴、提示框、图例、读屏的数据表见 XYChart；悬停一个类目时这一格铺一层浅底，提示框列出这一组的全部系列。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { chartBars } from './marks';
import { XYChart, type XYChartKind, type XYChartProps } from './XYChart';

/** 柱子的方向 */
export interface BarChartOrientations {
  /** 竖向的柱子（默认） */
  vertical: unknown;
  /** 横向的条：类目名较长、类目较多时 */
  horizontal: unknown;
}

/** 未声明的属性落到外层 div（role="figure"）上；aria-label 是图表的名称 */
export interface BarChartProps<T extends object> extends XYChartProps<T> {
  /** 堆叠：true 同一类目的系列叠成一根柱子，'percent' 按占比叠满 100%（数值轴是百分比）；默认并排 */
  stacked?: boolean | 'percent';
  /** 方向，默认 vertical */
  orientation?: keyof BarChartOrientations;
  /** 柱子末端的圆角（px），默认 4 */
  radius?: number;
}

/** 柱状图：分组或堆叠，竖向或横向 */
export const BarChart = _component(
  <T extends object>({
    stacked = false,
    orientation = 'vertical',
    radius = 4,
    _hiddenSeries: hiddenSeries = _bindable<string[]>([]),
    ...rest
  }: BarChartProps<T>) => {
    const kind = _derived<XYChartKind<T>>({
      band: true,
      horizontal: orientation === 'horizontal',
      skeleton: 'bars',
      stacked: stacked !== false,
      percent: stacked === 'percent',
      render: (context) =>
        chartBars(context, context.series, { stacked: stacked !== false, radius }),
    });
    return () => <XYChart {...rest} _hiddenSeries={hiddenSeries} kind={kind} />;
  },
);
