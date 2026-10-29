/**
 * 折线图：每个系列一条线，类目（通常是时间）沿横轴排开；悬停时十字线在各条线上标出当前点，提示框列出各系列的值。
 *
 *   <LineChart
 *     aria-label="月度销售趋势"
 *     data={months}
 *     index="month"
 *     series={[{ key: 'planned', label: '预期销售' }, { key: 'actual', label: '实际销售' }]}
 *     dots="hollow"
 *   />
 *
 * 空值（null、undefined）处断开；颜色、坐标轴、提示框、图例、读屏的数据表见 XYChart。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { chartDots, chartLines } from './marks';
import type { LineCurves } from './shape';
import { XYChart, type XYChartKind, type XYChartProps } from './XYChart';

/** 数据点的样式 */
export interface LineDots {
  /** 不画数据点（默认），只在悬停时由十字线标出 */
  none: unknown;
  /** 实心圆点 */
  filled: unknown;
  /** 空心圆点：描边是系列颜色，中间是背景色 */
  hollow: unknown;
}

/** 未声明的属性落到外层 div（role="figure"）上；aria-label 是图表的名称 */
export interface LineChartProps<T extends object> extends XYChartProps<T> {
  /** 线的形状，默认 linear */
  curve?: keyof LineCurves;
  /** 数据点，默认 none */
  dots?: keyof LineDots;
  /** 线宽（px），默认 2 */
  lineWidth?: number;
}

/** 折线图：直线、平滑或阶梯，可带数据点 */
export const LineChart = _component(
  <T extends object>({
    curve = 'linear',
    dots = 'none',
    lineWidth = 2,
    _hiddenSeries: hiddenSeries = _bindable<string[]>([]),
    ...rest
  }: LineChartProps<T>) => {
    const kind = _derived<XYChartKind<T>>({
      crosshairDots: true,
      // 两端的点不贴着绘图区边缘，圆点与十字线的圆点能完整显示
      padding: { left: 12, right: 12, top: 8 },
      render: (context) => [
        chartLines(context, context.series, { curve, width: lineWidth }),
        dots !== 'none' && chartDots(context, context.series, dots),
      ],
    });
    return () => <XYChart {...rest} _hiddenSeries={hiddenSeries} kind={kind} />;
  },
);
