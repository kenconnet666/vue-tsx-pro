/**
 * 环形图（arcWidth 为 0 时是饼图）：每一行一个扇区，中间写合计；悬停扇区出提示框（数值与占比），点图例隐藏一项。
 *
 *   <DonutChart aria-label="访问来源" data={channels} index="name" value="visits" />
 *   <DonutChart data={budget} index="dept" value="amount" unit="万元" valueFormat={{ maximumFractionDigits: 0 }} />
 *
 * 颜色默认按顺序取图表色板（itemColor 可以按行给）；值可以是 number、bigint、Decimal，提示框与数据表按原值显示。
 * 图例、单位、加载与空状态、给读屏的数据表（类目、数值、占比）同其他图表（见 ChartFrame）。
 */
import { Donut } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import { ChartFrame, chartTooltip, useChartValueText, type ChartFrameParts } from './frame';
import { useSingleChart, type SingleChart } from './single';
import { resolveColor, seriesValue, type ChartColor, type NumericKey } from './series';

/** 未声明的属性落到外层 div（role="figure"）上，aria-label 是图表的名称 */
export interface DonutChartProps<T extends object>
  extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 数据：每一行一个扇区 */
  data: readonly T[];
  /** 名称字段：图例、提示框、数据表里显示，也是隐藏一项时记的 key */
  index: keyof T & string;
  /** 数值字段 */
  value: NumericKey<T>;
  /** 每一项的颜色；不写时按顺序取图表色板 */
  itemColor?: (row: T, index: number) => ChartColor | undefined;
  /** 数值的格式（可缩放，如以万元为单位）：中间的合计、提示框、数据表共用 */
  valueFormat?: NumericFormat;
  /** 单位：显示在左上方，数值后面带上 */
  unit?: string;
  /**
   * 绘图区的高度；数字按 px
   * @default 240
   */
  height?: number | string;
  /**
   * 环的粗细（px）；0 是饼图
   * @default 28
   */
  arcWidth?: number;
  /** 中间的大字；默认是显示中各项的合计，false 时不写 */
  centerLabel?: string | false;
  /** 中间大字下面的小字；默认是“合计” */
  centerSubLabel?: string;
  /**
   * 图例
   * @default true
   */
  legend?: boolean;
  /**
   * 悬停时的提示框
   * @default true
   */
  tooltip?: boolean;
  /**
   * 加载中：绘图区显示一个圆形的骨架，带 aria-busy
   * @default false
   */
  loading?: boolean;
  /** 隐藏的项（存名称）：点图例时写回，父级可以写 _hiddenItems={_bind(names)} */
  _hiddenItems?: string[];
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
  /**
   * 点了一个扇区（下钻）：参数是这一行与它在 data 里的位置；写了它时指针是手形。
   * 点图是鼠标的捷径：同样的去处在页面上还要有链接或按钮
   */
  onItemClick?: (row: T, index: number) => void;
}

/** DonutChart 的样式：skeleton */
export const donutChartStyles = css.create({
  skeleton: {
    display: 'block',
    height: '100%',
    aspectRatio: '1',
    marginInline: 'auto',
    borderRadius: '50%',
  },
});

/** 扇区的数据：一行加上它的名字与颜色 */
interface Slice<T> {
  row: T;
  name: string;
  color: string;
  value: NumericValue | undefined;
}

/** 环形图 */
export const DonutChart = _component(
  <T extends object>({
    data,
    index,
    value,
    itemColor,
    valueFormat,
    unit,
    height = 240,
    arcWidth = 28,
    centerLabel,
    centerSubLabel,
    legend = true,
    tooltip = true,
    loading = false,
    onItemClick,
    _hiddenItems: hiddenItems = _bindable<string[]>([]),
    empty,
    ...rest
  }: DonutChartProps<T>) => {
    const lang = useLang();
    const format = useFormat();

    // 颜色按原来的顺序定：隐藏一项时其余扇区不换色
    const slices = _derived.by((): Slice<T>[] => {
      return data.map((row, position) => ({
        row,
        name: String(row[index] ?? ''),
        color: resolveColor(itemColor?.(row, position), position),
        value: seriesValue(row, value),
      }));
    });
    const visible = _derived(slices.filter((slice) => !hiddenItems.includes(slice.name)));
    const total = _derived(
      visible.reduce(
        (sum, slice) => sum + (slice.value === undefined ? 0 : toNumber(slice.value)),
        0,
      ),
    );

    const valueText = useChartValueText(() => ({ valueFormat, unit }));
    const shareText = (amount: NumericValue | undefined) =>
      amount === undefined || total === 0
        ? lang.emptyValue
        : format.number(toNumber(amount) / total, { style: 'percent', maximumFractionDigits: 1 });

    function toggle(name: string) {
      hiddenItems = hiddenItems.includes(name)
        ? hiddenItems.filter((item) => item !== name)
        : [...hiddenItems, name];
    }

    let plot = _state.raw<HTMLElement | null>(null);
    const chart: SingleChart = useSingleChart<Slice<T>[]>(() => ({
      element: plot,
      ready: !loading && data.length > 0,
      tooltip,
      build: (instance) => {
        const donut = instance('donut', () => new Donut<Slice<T>>({ value: () => 0 }));
        donut.setConfig({
          value: (slice) => (slice.value === undefined ? 0 : toNumber(slice.value)),
          id: (slice) => slice.name,
          color: (slice) => slice.color,
          arcWidth,
          padAngle: arcWidth > 0 ? 0.01 : 0,
          cornerRadius: arcWidth > 0 ? 3 : 0,
          centralLabel:
            centerLabel === false ? undefined : (centerLabel ?? format.number(total, valueFormat)),
          centralSubLabel: centerLabel === false ? undefined : (centerSubLabel ?? lang.chartTotal),
          showBackground: true,
          events: {
            [Donut.selectors.segment]: {
              click: (arc: { data: Slice<T> }) =>
                onItemClick?.(arc.data.row, data.indexOf(arc.data.row)),
            },
          },
        });
        return {
          component: donut,
          data: [...visible],
          triggers: {
            [Donut.selectors.segment]: (arc: { data: Slice<T> }) =>
              chart.tooltip(
                chartTooltip(arc.data.name, [
                  {
                    label: lang.chartValue,
                    color: arc.data.color,
                    value: valueText(arc.data.value),
                  },
                  {
                    label: lang.chartShare,
                    color: 'transparent',
                    value: shareText(arc.data.value),
                  },
                ]),
              ),
          },
        };
      },
    }));

    return () => (
      <ChartFrame
        {...rest}
        unit={unit}
        height={height}
        legend={
          legend
            ? slices.map((slice) => ({ key: slice.name, label: slice.name, color: slice.color }))
            : []
        }
        hiddenKeys={hiddenItems}
        onLegendToggle={toggle}
        loading={loading}
        skeleton={<Skeleton sx={donutChartStyles.skeleton} />}
        clickable={onItemClick != null}
        isEmpty={data.length === 0}
        empty={empty}
        table={{
          columns: [
            lang.chartCategory,
            unit ? `${lang.chartValue}（${unit}）` : lang.chartValue,
            lang.chartShare,
          ],
          rows: visible.map((slice) => ({
            header: slice.name,
            cells: [
              slice.value === undefined ? lang.emptyValue : format.number(slice.value, valueFormat),
              shareText(slice.value),
            ],
          })),
        }}
        plotRef={(element) => (plot = element)}
      />
    );
  },
);
