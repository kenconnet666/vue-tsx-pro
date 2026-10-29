/**
 * 瀑布图：从起点出发，一步步加减到终点，看总数是怎么变过来的（测算两版之间各参数的影响、预算到实际的差异拆解）。
 *
 *   <WaterfallChart
 *     aria-label="V1 到 V2 的变化"
 *     steps={[
 *       { label: 'V1 测算', value: 120, total: true },
 *       { label: '材料单价', value: -18 },
 *       { label: '工时', value: 6.5 },
 *       { label: 'V2 测算', total: true },
 *     ]}
 *     unit="万元"
 *   />
 *
 * 每一步是 { label, value }：value 是这一步的变动（正数往上、负数往下），可以是 Decimal、bigint；
 * total: true 的是合计柱，从 0 画到当时的累计（写了 value 时以它为准，作为新的起点，如“V1 测算”）。
 * 往上的步用 success 色、往下的用 danger 色、合计用 chart1（increaseColor、decreaseColor、totalColor 可改：
 * 成本类的图里减少是好事时对调）。提示框与读屏的数据表列出变动与累计。
 * 坐标轴、目标线、下钻、加载与空状态同 BarChart（见 XYChart）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import { useChartValueText } from './frame';
import { chartBar, chartMarkStyles } from './marks';
import { chartSvgStyles } from './plot';
import { resolveColor, type ChartColor } from './series';
import { XYChart, type XYChartKind, type XYChartProps } from './XYChart';

/** 瀑布图的一步 */
export interface WaterfallStep {
  /** 名称：类目轴的刻度 */
  label: string;
  /** 这一步的变动；合计柱写了时是新的累计（作为之后的起点） */
  value?: NumericValue;
  /** 合计柱：从 0 画到当时的累计 */
  total?: boolean;
}

/** 画图用的一行（waterfallRows 算出）：柱子从 low 画到 high */
export interface WaterfallRow {
  /** 名称 */
  label: string;
  /** 这一步的种类：决定颜色 */
  kind: 'increase' | 'decrease' | 'total';
  /** 这一步的变动（原值，提示框与数据表按它格式化） */
  change: NumericValue | undefined;
  /** 这一步之后的累计 */
  cumulative: number;
  /** 柱子的下沿 */
  low: number;
  /** 柱子的上沿 */
  high: number;
}

/** 未声明的属性落到外层 div（role="figure"）上；aria-label 是图表的名称 */
export interface WaterfallChartProps extends Omit<
  XYChartProps<WaterfallRow>,
  'data' | 'index' | 'series' | 'indexFormat' | 'legend' | 'hiddenSeries' | 'onItemClick'
> {
  /** 各步：按顺序从左到右 */
  steps: readonly WaterfallStep[];
  /** 往上走的颜色，默认 success */
  increaseColor?: ChartColor;
  /** 往下走的颜色，默认 danger */
  decreaseColor?: ChartColor;
  /** 合计柱的颜色，默认 chart1 */
  totalColor?: ChartColor;
  /**
   * 柱子末端的圆角（px）
   * @default 2
   */
  radius?: number;
  /**
   * 数值轴从 0 起；false 时从接近最低的累计处起：合计很大、各步变动很小时变动也看得清
   * （合计柱被截短，读数看轴上的刻度）。写了 valueDomain 时以它为准
   * @default true
   */
  fromZero?: boolean;
  /** 点了一步（下钻）：参数是这一步与它的位置；写了它时指针是手形 */
  onItemClick?: (step: WaterfallStep, index: number) => void;
}

/** WaterfallChart 的样式 */
export const waterfallChartStyles = css.create({
  connector: {
    stroke: '_borderStrong',
    strokeWidth: 1,
    strokeDasharray: '2 2',
    pointerEvents: 'none',
  },
});

/** 各步算成画图用的行：累计、每根柱子的上下沿 */
export function waterfallRows(steps: readonly WaterfallStep[]): WaterfallRow[] {
  let running = 0;
  return steps.map((step) => {
    const before = step.total ? 0 : running;
    if (step.total) running = step.value === undefined ? running : toNumber(step.value);
    else running += step.value === undefined ? 0 : toNumber(step.value);
    const [low, high] = before <= running ? [before, running] : [running, before];
    return {
      label: step.label,
      kind: step.total ? 'total' : running >= before ? 'increase' : 'decrease',
      change: step.value,
      cumulative: running,
      low,
      high,
    };
  });
}

/** 瀑布图 */
export const WaterfallChart = _component(
  ({
    steps,
    increaseColor,
    decreaseColor,
    totalColor,
    radius = 2,
    fromZero = true,
    onItemClick,
    ...rest
  }: WaterfallChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const valueText = useChartValueText(() => ({ valueFormat: rest.valueFormat, unit: rest.unit }));
    const rows = _derived(waterfallRows(steps));
    const colorOf = (row: WaterfallRow) =>
      resolveColor(
        row.kind === 'total'
          ? (totalColor ?? 'chart1')
          : row.kind === 'increase'
            ? (increaseColor ?? 'success')
            : (decreaseColor ?? 'danger'),
        0,
      );
    /** 变动：带正负号；suffix 时数值后面带单位（提示框） */
    const changeText = (row: WaterfallRow, suffix = false) =>
      row.change === undefined
        ? lang.emptyValue
        : format.number(row.change, {
            ...rest.valueFormat,
            signDisplay: 'exceptZero',
            ...(suffix && rest.unit ? { suffix: rest.unit } : {}),
          });
    const cumulativeText = (row: WaterfallRow) => format.number(row.cumulative, rest.valueFormat);

    const kind = _derived<XYChartKind<WaterfallRow>>({
      skeleton: 'bars',
      band: true,
      domainValues: (list) => list.flatMap((row) => [row.low, row.high]),
      render: (context) => {
        const width = Math.min(context.step * 0.7, 56);
        return (
          <g data-part="bars">
            {context.rows.map((row, index) => {
              const center = context.category(row, index);
              const next = context.rows[index + 1];
              // 连接线：这一步的累计接到下一根柱子
              const level = context.value(row.cumulative);
              const connector =
                next &&
                (context.horizontal
                  ? {
                      x1: level,
                      x2: level,
                      y1: center + width / 2,
                      y2: context.category(next, index + 1) - width / 2,
                    }
                  : {
                      x1: center + width / 2,
                      x2: context.category(next, index + 1) - width / 2,
                      y1: level,
                      y2: level,
                    });
              const { d, grow } = chartBar(context, {
                start: center - width / 2,
                width,
                low: row.low,
                high: row.high,
                radius,
                round: true,
                down: row.kind === 'decrease' || (row.kind === 'total' && row.cumulative < 0),
              });
              return (
                <g key={index}>
                  {connector && (
                    <line {...connector} {...css.attrs(waterfallChartStyles.connector)} />
                  )}
                  <path
                    data-part="bar"
                    data-index={index}
                    d={d}
                    {...css.attrs(chartMarkStyles.bar, grow, chartSvgStyles.fill(colorOf(row)))}
                  />
                </g>
              );
            })}
          </g>
        );
      },
      tooltipItems: (row) => [
        {
          label: row.kind === 'total' ? lang.chartTotal : lang.chartChange,
          color: colorOf(row),
          value: row.kind === 'total' ? valueText(row.cumulative) : changeText(row, true),
        },
        ...(row.kind === 'total'
          ? []
          : [
              {
                label: lang.chartCumulative,
                color: 'transparent',
                value: valueText(row.cumulative),
              },
            ]),
      ],
      table: (list) => ({
        columns: [
          lang.chartCategory,
          rest.unit ? `${lang.chartChange}（${rest.unit}）` : lang.chartChange,
          rest.unit ? `${lang.chartCumulative}（${rest.unit}）` : lang.chartCumulative,
        ],
        rows: list.map((row) => ({
          header: row.label,
          cells: [row.kind === 'total' ? lang.emptyValue : changeText(row), cumulativeText(row)],
        })),
      }),
    });

    /**
     * 不从 0 起时轴的下沿：最低的累计再往下留出变动幅度的一半（没有变动时留出它的一成）；
     * 有负的累计时仍按数据自动取，不截
     */
    const zoomedDomain = (): [number | undefined, undefined] => {
      const values = rows.flatMap((row) =>
        row.kind === 'total' ? [row.high] : [row.low, row.high],
      );
      const low = Math.min(...values);
      if (low <= 0) return [undefined, undefined];
      const span = Math.max(...values) - low || low * 0.1;
      return [Math.max(0, low - span * 0.5), undefined];
    };

    return () => (
      <XYChart<WaterfallRow>
        {...rest}
        valueDomain={
          rest.valueDomain ?? (fromZero || rows.length === 0 ? undefined : zoomedDomain())
        }
        data={rows}
        index="label"
        // 系列只用来给十字线定位与算范围；画法、提示框、数据表由 kind 决定
        series={[{ key: 'cumulative', label: lang.chartChange }]}
        legend={false}
        kind={kind}
        onItemClick={onItemClick && ((_row, position) => onItemClick(steps[position]!, position))}
      />
    );
  },
);
