/**
 * 环形图（arcWidth 为 0 时是饼图）：每一行一个扇区，中间写合计；悬停扇区出提示框（数值与占比），点图例隐藏一项。
 *
 *   <DonutChart aria-label="访问来源" data={channels} index="name" value="visits" />
 *   <DonutChart data={budget} index="dept" value="amount" unit="万元" valueFormat={{ maximumFractionDigits: 0 }} />
 *
 * 颜色默认按顺序取图表色板（itemColor 可以按行给）；值可以是 number、bigint、Decimal，提示框与数据表按原值显示。
 * 图例、单位、加载与空状态、给读屏的数据表（类目、数值、占比）同其他图表（见 ChartFrame）。
 */
import { Donut, SingleContainer, Tooltip } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { render, useId, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import {
  ChartFrame,
  chartDuration,
  chartTooltip,
  createChartInstances,
  uniqueHighlightFilter,
  type ChartFrameParts,
} from './frame';
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
  /** 数值的格式（Intl.NumberFormatOptions）：中间的合计、提示框、数据表共用 */
  valueFormat?: Intl.NumberFormatOptions;
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
  /** 隐藏的项（存名称）：点图例时写回，父级可以写 hiddenItems={_bind(names)} */
  hiddenItems?: string[];
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
}

/** DonutChart 的样式：skeleton */
export const donutChartStyles = stylex.create({
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
    hiddenItems = _bindable<string[]>([]),
    empty,
    ...rest
  }: DonutChartProps<T>) => {
    const lang = useLang();
    const format = useFormat();
    const id = useId();

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

    const valueText = (amount: NumericValue | undefined) =>
      amount === undefined ? '—' : `${format.number(amount, valueFormat)}${unit ? ` ${unit}` : ''}`;
    const shareText = (amount: NumericValue | undefined) =>
      amount === undefined || total === 0
        ? '—'
        : format.number(toNumber(amount) / total, { style: 'percent', maximumFractionDigits: 1 });

    function toggle(name: string) {
      hiddenItems = hiddenItems.includes(name)
        ? hiddenItems.filter((item) => item !== name)
        : [...hiddenItems, name];
    }

    const instances = createChartInstances();
    let tooltipElement: HTMLElement | undefined;
    function renderTooltip(slice: Slice<T>) {
      tooltipElement ??= document.createElement('div');
      render(
        chartTooltip(slice.name, [
          { label: lang.chartValue, color: slice.color, value: valueText(slice.value) },
          { label: lang.chartShare, color: 'transparent', value: shareText(slice.value) },
        ]),
        tooltipElement,
      );
      return tooltipElement;
    }

    let plot = _state.raw<HTMLElement | null>(null);
    let container: SingleContainer<Slice<T>[]> | undefined;
    let containerElement: HTMLElement | undefined;
    _effect(() => () => {
      container?.destroy();
      if (tooltipElement) render(null, tooltipElement);
    });
    _effect(() => {
      const shown = [...visible];
      const element = plot;
      if (!element || loading || data.length === 0) return;
      if (container && containerElement !== element) {
        container.destroy();
        container = undefined;
        instances.reset();
      }
      const donut = instances.get('donut', () => new Donut<Slice<T>>({ value: () => 0 }));
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
      });
      const tooltipBox = instances.get('tooltip', () => new Tooltip());
      tooltipBox.setConfig({
        triggers: {
          [Donut.selectors.segment]: (arc: { data: Slice<T> }) => renderTooltip(arc.data),
        },
      });
      const config = {
        component: donut,
        tooltip: tooltip ? tooltipBox : undefined,
        ariaLabel: null,
        duration: chartDuration(element),
      };
      if (container) container.update(config, undefined, shown);
      else {
        container = new SingleContainer<Slice<T>[]>(element, config, shown);
        containerElement = element;
        uniqueHighlightFilter(element, `${id}-highlight`);
      }
    });

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
              slice.value === undefined ? '—' : format.number(slice.value, valueFormat),
              shareText(slice.value),
            ],
          })),
        }}
        plotRef={(element) => (plot = element)}
      />
    );
  },
);
