/**
 * 散点图：横轴、纵轴都是数值，每一行在每个系列上画一个点；size 给成字段时点的大小随它变（气泡图）。
 * 悬停一个点，提示框列出这一行的名称、横轴的值与各系列的值。
 *
 *   <ScatterChart data={cities} index="name" x="gdp" xLabel="人均 GDP" series={[{ key: 'life', label: '预期寿命' }]} />
 *   <ScatterChart data={products} index="name" x="price" series={[{ key: 'rating', label: '评分' }]} size="sales" />
 *
 * 纵轴不强制从 0 起（按数据取）；图例、单位、加载与空状态、给读屏的数据表同其他图表（见 XYChart）。
 */
import { Scatter } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import { colors } from '../config/theme/tokens';
import { useFormat } from '../config/lang/format';
import { seriesNumber, type NumericKey } from './series';
import { XYChart, type XYChartKind, type XYChartProps } from './XYChart';

/** 未声明的属性落到外层 div（role="figure"）上 */
export interface ScatterChartProps<T extends object> extends XYChartProps<T> {
  /** 横轴的数值字段 */
  x: NumericKey<T>;
  /** 横轴的名字：显示在横轴下方，提示框与数据表里也用；不写时轴下不显示，提示框与数据表用字段名 */
  xLabel?: string;
  /** 横轴数值的格式（Intl.NumberFormatOptions） */
  xFormat?: Intl.NumberFormatOptions;
  /**
   * 点的直径（px），或者一个数值字段（气泡图：按它在 6–32px 之间缩放）
   * @default 9
   */
  size?: number | NumericKey<T>;
}

/** 气泡图的大小范围（px） */
const BUBBLE_RANGE: [number, number] = [6, 32];

/** 散点图 */
export const ScatterChart = _component(
  <T extends object>({
    x: xKey,
    xLabel,
    xFormat,
    size = 9,
    _hiddenSeries: hiddenSeries = _bindable<string[]>([]),
    ...rest
  }: ScatterChartProps<T>) => {
    const format = useFormat();
    const kind = _derived<XYChartKind<T>>({
      zeroBaseline: false,
      pointTooltip: Scatter.selectors.point,
      // 留出半个最大气泡的边：贴边的点不被裁掉
      padding: { left: 18, right: 18, top: 18, bottom: 8 },
      continuousX: {
        value: (row) => seriesNumber(row, xKey),
        format: (value) => format.number(value, xFormat),
        label: xLabel ?? xKey,
        title: xLabel,
      },
      components: ({ series, x, y, instance }) =>
        series.map((item) => {
          const points = instance(`points:${item.key}`, () => new Scatter<T>({ x, y: () => 0 }));
          points.setConfig({
            x,
            y: y(item),
            color: item.color,
            size: typeof size === 'number' ? size : (row: T) => seriesNumber(row, size) ?? 0,
            sizeRange: typeof size === 'number' ? undefined : BUBBLE_RANGE,
            // 气泡互相重叠时用表面色描一圈边分开
            strokeColor: colors.surface,
            strokeWidth: 1,
          });
          return points;
        }),
    });
    return () => <XYChart {...rest} _hiddenSeries={hiddenSeries} kind={kind} />;
  },
);
