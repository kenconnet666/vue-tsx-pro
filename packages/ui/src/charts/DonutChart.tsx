/**
 * 环形图（arcWidth 为 0 时是饼图）：每一行一个扇区，中间写合计；悬停扇区出提示框（数值与占比），点图例隐藏一项。
 *
 *   <DonutChart aria-label="访问来源" data={channels} index="name" value="visits" />
 *   <DonutChart data={budget} index="dept" value="amount" unit="万元" valueFormat={{ maximumFractionDigits: 0 }} />
 *
 * 颜色默认按顺序取图表色板（itemColor 可以按行给）；值可以是 number、bigint、Decimal，提示框与数据表按原值显示。
 * 图例、单位、加载与空状态、给读屏的数据表（类目、数值、占比）同其他图表（见 ChartFrame）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import { t } from '../config/theme/tokens';
import { svgNumber } from '../utils/data/number';
import { ChartFrame, chartTooltip, useChartValueText, type ChartFrameParts } from './frame';
import { ChartTooltipBox, chartSvgStyles, pointerIn, usePlotArea, type ChartTip } from './plot';
import { arcPath } from './shape';
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
  /** 隐藏的项（存名称）：点图例时写回，父级可以写 _hiddenItems={names} */
  _hiddenItems?: string[];
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
  /**
   * 点了一个扇区（下钻）：参数是这一行与它在 data 里的位置；写了它时指针是手形。
   * 点图是鼠标的捷径：同样的去处在页面上还要有链接或按钮
   */
  onItemClick?: (row: T, index: number) => void;
}

/** DonutChart 的样式：skeleton、扇区、中间的文字 */
export const donutChartStyles = css.create({
  // 进场：整个环从略小淡入放大
  ring: {
    transformBox: 'fill-box',
    transformOrigin: 'center',
    opacity: { default: 1, '@starting-style': 0 },
    scale: { default: '1', '@starting-style': '0.9' },
    transition: `opacity ${t.durations.lg} ${t.easings.standard}, scale ${t.durations.lg} ${t.easings.standard}`,
  },
  background: { fill: '_fill' },
  segment: { stroke: '_surface', strokeWidth: 1 },
  centerValue: { fill: '_text', fontSize: '_xl', fontWeight: '_semibold' },
  centerLabel: { fill: '_textMuted', fontSize: '_xs' },
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

    const area = usePlotArea();
    let hovered = _state.raw<{ index: number; x: number; y: number } | null>(null);

    /** 扇区的位置：从 12 点钟方向顺时针，按数值分角度；扇区之间留一点缝 */
    const arcs = _derived.by(() => {
      const pad = arcWidth > 0 && visible.length > 1 ? 0.012 : 0;
      let angle = 0;
      return visible.map((slice) => {
        const amount = slice.value === undefined ? 0 : Math.max(toNumber(slice.value), 0);
        const sweep = total > 0 ? (amount / total) * Math.PI * 2 : 0;
        const start = angle;
        angle += sweep;
        return { slice, start: start + pad / 2, end: Math.max(start + pad / 2, angle - pad / 2) };
      });
    });

    function onPointermove(event: PointerEvent) {
      const target = (event.target as Element).closest?.('[data-index]');
      if (!target) {
        hovered = null;
        return;
      }
      const { x, y } = pointerIn(event, event.currentTarget as Element);
      hovered = { index: Number(target.getAttribute('data-index')), x, y };
    }

    function onClick(event: MouseEvent) {
      const target = (event.target as Element).closest?.('[data-index]');
      const slice = target && arcs[Number(target.getAttribute('data-index'))]?.slice;
      if (slice) onItemClick?.(slice.row, data.indexOf(slice.row));
    }

    function renderPlot() {
      const { width, height } = area;
      // 留出悬停时扇区往外长的 6px
      const outer = Math.max(0, Math.min(width, height) / 2 - 8);
      const inner = arcWidth > 0 ? Math.max(0, outer - arcWidth) : 0;
      const center =
        centerLabel === false || inner < 24
          ? undefined
          : (centerLabel ?? format.number(total, valueFormat));
      return (
        <svg
          width={width}
          height={height}
          {...css.attrs(chartSvgStyles.svg)}
          onPointermove={onPointermove}
          onPointerleave={() => (hovered = null)}
          onClick={onClick}
        >
          <g transform={`translate(${svgNumber(width / 2)},${svgNumber(height / 2)})`}>
            <g {...css.attrs(donutChartStyles.ring)}>
              {inner > 0 && (
                <path
                  d={arcPath({ inner, outer, start: 0, end: Math.PI * 2 })}
                  {...css.attrs(donutChartStyles.background)}
                />
              )}
              {arcs.map((arc, index) => (
                <path
                  key={arc.slice.name}
                  data-part="segment"
                  data-index={index}
                  d={arcPath({
                    inner,
                    outer: hovered?.index === index ? outer + 6 : outer,
                    start: arc.start,
                    end: arc.end,
                    corner: arcWidth > 0 ? 3 : 0,
                  })}
                  {...css.attrs(
                    donutChartStyles.segment,
                    chartSvgStyles.fill(arc.slice.color),
                    chartSvgStyles.dimmable,
                    hovered !== null && hovered.index !== index && chartSvgStyles.dimmed,
                  )}
                />
              ))}
            </g>
            {center !== undefined && (
              <g data-part="center-label" {...css.attrs(chartSvgStyles.noPointer)}>
                <text y={-2} text-anchor="middle" {...css.attrs(donutChartStyles.centerValue)}>
                  {center}
                </text>
                <text y={18} text-anchor="middle" {...css.attrs(donutChartStyles.centerLabel)}>
                  {centerSubLabel ?? lang.chartTotal}
                </text>
              </g>
            )}
          </g>
        </svg>
      );
    }

    const tip = (): ChartTip | null => {
      const current = hovered;
      const slice = current && arcs[current.index]?.slice;
      if (!tooltip || !current || !slice) return null;
      return {
        x: current.x,
        y: current.y,
        content: chartTooltip(slice.name, [
          { label: lang.chartValue, color: slice.color, value: valueText(slice.value) },
          { label: lang.chartShare, color: 'transparent', value: shareText(slice.value) },
        ]),
      };
    };

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
        plotRef={area.ref}
        plot={
          area.ready
            ? [renderPlot(), <ChartTooltipBox key="tooltip" tip={tip()} width={area.width} />]
            : null
        }
      />
    );
  },
);
