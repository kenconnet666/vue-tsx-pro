/**
 * 面积图：每个系列一片面积，上沿描一条线；默认各系列重叠、半透明（看得出谁高谁低），stacked 时依次叠起（看总量与构成），
 * stacked="percent" 时按占比叠满 100%（只看构成的变化）。
 *
 *   <AreaChart data={months} index="month" series={[{ key: 'visits', label: '访问量' }]} />
 *   <AreaChart stacked data={months} index="month" series={channels} unit="万次" />
 *   <AreaChart stacked="percent" data={months} index="month" series={channels} />
 *
 * 坐标轴、十字线（带圆点）与提示框、图例、单位、加载与空状态、给读屏的数据表同 LineChart（见 XYChart）。
 */
import { Area } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import { CURVES, type LineCurves } from './LineChart';
import { XYChart, type XYChartKind, type XYChartProps } from './XYChart';

/** 未声明的属性落到外层 div（role="figure"）上 */
export interface AreaChartProps<T extends object> extends XYChartProps<T> {
  /** 堆叠：true 各系列依次叠起，'percent' 按占比叠满 100%（数值轴是百分比）；默认重叠、半透明 */
  stacked?: boolean | 'percent';
  /**
   * 曲线的形状
   * @default 'monotone'
   */
  curve?: keyof LineCurves;
  /**
   * 面积的不透明度（0–1）；默认重叠时 0.25、堆叠时 0.8
   */
  opacity?: number;
}

/** 面积图 */
export const AreaChart = _component(
  <T extends object>({
    stacked = false,
    curve = 'monotone',
    opacity,
    _hiddenSeries: hiddenSeries = _bindable<string[]>([]),
    ...rest
  }: AreaChartProps<T>) => {
    const kind = _derived<XYChartKind<T>>({
      crosshairDots: true,
      stacked: stacked !== false,
      percent: stacked === 'percent',
      padding: { left: 12, right: 12, top: 8 },
      components: ({ series, x, y, instance }) => {
        const common = {
          x,
          curveType: CURVES[curve],
          line: true,
          lineWidth: 2,
        };
        if (stacked) {
          const area = instance('stacked', () => new Area<T>({ x, y: [] }));
          area.setConfig({
            ...common,
            y: series.map(y),
            color: (_rows: T[], position: number) => series[position]?.color,
            lineColor: (_rows: T[], position: number) => series[position]?.color,
            opacity: opacity ?? 0.8,
          });
          return [area];
        }
        // 重叠：每个系列一个 Area（Unovis 的多个 y 总是堆叠的）
        return series.map((item) => {
          const area = instance(`area:${item.key}`, () => new Area<T>({ x, y: () => 0 }));
          area.setConfig({
            ...common,
            y: y(item),
            color: item.color,
            lineColor: item.color,
            opacity: opacity ?? 0.25,
          });
          return area;
        });
      },
    });
    return () => <XYChart {...rest} _hiddenSeries={hiddenSeries} kind={kind} />;
  },
);
