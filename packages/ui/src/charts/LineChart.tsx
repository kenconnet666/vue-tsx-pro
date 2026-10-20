/**
 * 折线图：每个系列一条线，类目（通常是时间）沿横轴排开；悬停时十字线在各条线上标出当前点，提示框列出各系列的值。
 *
 *   <LineChart
 *     aria-label="月度降本趋势"
 *     data={months}
 *     index="month"
 *     series={[{ key: 'planned', label: '预期降本' }, { key: 'actual', label: '实际降本' }]}
 *     dots="hollow"
 *   />
 *
 * 空值（null、undefined）处断开；颜色、坐标轴、提示框、图例、读屏的数据表见 XYChart。
 */
import { CurveType, Line, Scatter } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import { colors } from '../config/theme/tokens.stylex';
import { XYChart, type XYChartKind, type XYChartProps } from './XYChart';

/** 线的形状 */
export interface LineCurves {
  /** 折线：相邻的点直线相连（默认） */
  linear: unknown;
  /** 平滑曲线：不会越过数据点（单调插值），趋势更柔和 */
  monotone: unknown;
  /** 阶梯：值保持到下一个点才跳变，适合离散的状态、价格档位 */
  step: unknown;
}

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

const CURVES = {
  linear: CurveType.Linear,
  monotone: CurveType.MonotoneX,
  step: CurveType.StepAfter,
} satisfies Record<keyof LineCurves, CurveType>;

/** 数据点的直径（px） */
const DOT_SIZE = 8;

/** 折线图：直线、平滑或阶梯，可带数据点 */
export const LineChart = _component(
  <T extends object>({
    curve = 'linear',
    dots = 'none',
    lineWidth = 2,
    hiddenSeries = _bindable<string[]>([]),
    ...rest
  }: LineChartProps<T>) => {
    const kind = _derived<XYChartKind<T>>({
      crosshairDots: true,
      // 两端的点不贴着绘图区边缘，圆点与十字线的圆点能完整显示
      padding: { left: 12, right: 12, top: 8 },
      components: ({ series, x, y, instance }) => {
        const line = instance('line', () => new Line<T>({ x, y: [] }));
        line.setConfig({
          x,
          y: series.map(y),
          color: (_rows: T[], position: number) => series[position]?.color,
          curveType: CURVES[curve],
          lineWidth,
        });
        if (dots === 'none') return [line];
        const points = series.map((item) => {
          const scatter = instance(`dots:${item.key}`, () => new Scatter<T>({ x, y: () => 0 }));
          scatter.setConfig({
            x,
            y: y(item),
            size: DOT_SIZE,
            color: dots === 'hollow' ? colors.surface : item.color,
            strokeColor: item.color,
            strokeWidth: dots === 'hollow' ? 2 : 0,
          });
          return scatter;
        });
        return [line, ...points];
      },
    });
    return () => <XYChart {...rest} hiddenSeries={_bind(hiddenSeries)} kind={kind} />;
  },
);
