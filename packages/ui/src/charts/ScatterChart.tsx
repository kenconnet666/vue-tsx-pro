/**
 * 散点图：横轴、纵轴都是数值，每一行在每个系列上画一个点；size 给成字段时点的大小随它变（气泡图）。
 * 悬停离指针最近的点，提示框列出这一行的名称、横轴的值与各系列的值。
 *
 *   <ScatterChart data={cities} index="name" x="gdp" xLabel="人均 GDP" series={[{ key: 'life', label: '预期寿命' }]} />
 *   <ScatterChart data={products} index="name" x="price" series={[{ key: 'rating', label: '评分' }]} size="sales" />
 *
 * 纵轴不强制从 0 起（按数据取）；图例、单位、加载与空状态、给读屏的数据表同其他图表（见 XYChart）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { t } from '../config/theme/tokens';
import { useFormat } from '../config/lang/format';
import { svgNumber } from '../utils/data/number';
import { chartMarkStyles } from './marks';
import { chartSvgStyles } from './plot';
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
   * 点的直径（px），或者一个数值字段（气泡图：面积按它在 6–32px 的直径之间缩放）
   * @default 9
   */
  size?: number | NumericKey<T>;
}

/** 气泡图的直径范围（px） */
const BUBBLE_RANGE: [number, number] = [6, 32];

/** ScatterChart 的样式 */
export const scatterChartStyles = css.create({
  // 气泡互相重叠时用表面色描一圈边分开；悬停的点描粗一点
  point: {
    stroke: '_surface',
    strokeWidth: 1,
    fillOpacity: 0.85,
    transition: `stroke-width ${t.durations.sm} ${t.easings.standard}`,
  },
  active: { strokeWidth: 2.5, fillOpacity: 1 },
});

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
    /** 点的半径：固定直径，或按字段的值让面积成比例 */
    const radiusOf = (row: T, sizes: readonly number[]) => {
      if (typeof size === 'number') return size / 2;
      const value = seriesNumber(row, size) ?? 0;
      const [low, high] = [Math.min(...sizes), Math.max(...sizes)];
      const ratio = high === low ? 1 : Math.sqrt((value - low) / (high - low));
      return (BUBBLE_RANGE[0] + ratio * (BUBBLE_RANGE[1] - BUBBLE_RANGE[0])) / 2;
    };
    const kind = _derived<XYChartKind<T>>({
      zeroBaseline: false,
      pointTooltip: true,
      // 留出半个最大气泡的边：贴边的点不被裁掉
      padding: { left: 18, right: 18, top: 18, bottom: 8 },
      continuousX: {
        value: (row) => seriesNumber(row, xKey),
        format: (value) => format.number(value, xFormat),
        label: xLabel ?? xKey,
        title: xLabel,
      },
      render: (context) => {
        const sizes =
          typeof size === 'number' ? [] : context.rows.map((row) => seriesNumber(row, size) ?? 0);
        return (
          <g data-part="points">
            {context.series.flatMap((item) =>
              context.rows.map((row, index) => {
                const value = context.valueOf(item, row);
                const cx = context.category(row, index);
                if (value === undefined || Number.isNaN(cx)) return null;
                return (
                  <circle
                    key={`${item.key}:${index}`}
                    data-part="point"
                    data-index={index}
                    cx={svgNumber(cx)}
                    cy={svgNumber(context.value(value))}
                    r={radiusOf(row, sizes)}
                    {...css.attrs(
                      chartMarkStyles.dot,
                      scatterChartStyles.point,
                      chartSvgStyles.fill(item.color),
                      context.hovered === index && scatterChartStyles.active,
                    )}
                  />
                );
              }),
            )}
          </g>
        );
      },
    });
    return () => <XYChart {...rest} _hiddenSeries={hiddenSeries} kind={kind} />;
  },
);
