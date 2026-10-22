/**
 * 柱状图：每个类目一组柱子，系列并排（分组）或叠成一根（堆叠），可以横向。
 *
 *   <BarChart
 *     aria-label="项目降本金额"
 *     data={projects}
 *     index="name"
 *     series={[{ key: 'planned', label: '预期降本' }, { key: 'actual', label: '实际降本' }]}
 *     unit="万元"
 *   />
 *
 * 颜色、坐标轴、提示框、图例、读屏的数据表见 XYChart；悬停一个类目时提示框列出这一组的全部系列。
 */
import { GroupedBar, StackedBar } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
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
  /** 堆叠：同一类目的系列叠成一根柱子；默认并排 */
  stacked?: boolean;
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
    hiddenSeries = _bindable<string[]>([]),
    ...rest
  }: BarChartProps<T>) => {
    const kind = _derived<XYChartKind<T>>({
      horizontal: orientation === 'horizontal',
      skeleton: 'bars',
      stacked,
      itemSelector: stacked ? StackedBar.selectors.bar : GroupedBar.selectors.bar,
      components: ({ series, x, y, instance, events }) => {
        const common = {
          x,
          y: series.map(y),
          color: (_row: T, position: number) => series[position]?.color,
          roundedCorners: radius,
          orientation,
          events,
        };
        if (stacked) {
          const bars = instance('stacked', () => new StackedBar<T>({ x, y: [] }));
          bars.setConfig({ ...common, barPadding: 0.4, barMaxWidth: 48 });
          return [bars];
        }
        const bars = instance('grouped', () => new GroupedBar<T>({ x, y: [] }));
        // 空值不画柱子（Unovis 默认给 2px 的最小高度，空值也会画出一条线）
        bars.setConfig({
          ...common,
          groupPadding: 0.3,
          barPadding: 0.1,
          groupMaxWidth: 96,
          barMinHeight: 0,
        });
        return [bars];
      },
    });
    return () => <XYChart {...rest} hiddenSeries={_bind(hiddenSeries)} kind={kind} />;
  },
);
