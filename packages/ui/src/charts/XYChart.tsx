/**
 * 直角坐标图表（柱状图、折线图、面积图）的公共部分：坐标轴、十字线与提示框、数值范围；外层结构（图例、单位、
 * 空与加载状态、给读屏的数据表）交给 ChartFrame。
 * 绘图交给 Unovis 的 XYContainer：组件实例只建一次，数据与配置变化时 update，卸载时 destroy；
 * 绘图区换了元素（加载、空状态之后重新出现）时容器连同全部实例一起重建。
 * 各种图只决定画什么（kind.components），坐标轴、十字线、提示框、配色都在这里统一。
 * 目标线（targets）用 Unovis 的 Plotline。点了下钻（onItemClick）：有图形可点的图（柱子）按图形的点击事件
 * （kind.itemSelector），折线、面积图按十字线所在的那一行，散点图按悬停的点。
 *
 * 标注（annotations）：类目上的事件画成竖线（Plotline），圈出某个系列的值画成空心圈带文字（Scatter）；
 * 区间（bands）画成浅色的带（Plotband）。百分比堆叠（kind.percent）按每个类目里各系列的占比画。
 * 第二数值轴（kind.secondary，组合图）：刻度与主轴对齐（alignedTicks），第二轴的系列换算到主轴的坐标里画，
 * 右侧的刻度文字是不裁剪的 Plotline 标签。
 */
import {
  Axis,
  AxisType,
  Crosshair,
  Plotband,
  PlotbandLabelPosition,
  Plotline,
  PlotlineLabelPosition,
  PlotlineLineStylePresets,
  Position,
  Scatter,
  Tooltip,
  XYContainer,
  type XYComponentCore,
} from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { render, useId, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { colors } from '../config/theme/tokens.stylex';
import { Skeleton } from '../feedback/Skeleton';
import { alignedTicks, type AlignedAxes } from './axis-ticks';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import {
  ChartFrame,
  chartDuration,
  chartTooltip,
  createChartInstances,
  uniqueHighlightFilter,
  useChartValueText,
  type ChartFrameParts,
  type ChartTable,
  type ChartTooltipItem,
} from './frame';
import {
  resolveColor,
  resolveSeries,
  seriesNumber,
  seriesValue,
  type ChartColor,
  type ChartSeries,
  type ResolvedSeries,
} from './series';

/** 目标线（参考线）：数值轴上的一条虚线 */
export interface ChartTarget {
  /** 位置：数值轴上的值 */
  value: NumericValue;
  /** 标签：写在线的一端，后面带上格式化的数值（“年度指标 1,200”） */
  label?: string;
  /** 颜色；默认是 danger（要够到的线） */
  color?: ChartColor;
}

/** 标注：类目上发生的事（竖线），或圈出某个系列在这个类目上的值 */
export interface ChartAnnotation {
  /** 标在哪个类目上：index 字段的值（散点图是横轴上的数值） */
  at: unknown;
  /** 文字 */
  label: string;
  /** 圈出这个系列在这里的值（系列的 key）；不写时是一条竖线（换供应商、调价生效这类事件） */
  series?: string;
  /** 颜色；竖线默认是次要色，圈默认是系列色 */
  color?: ChartColor;
}

/** 区间：类目轴上的一段（验证窗、促销期），或数值轴上的一段（目标区间） */
export interface ChartBand {
  /** 在哪条轴上，默认 index（类目轴） */
  axis?: 'index' | 'value';
  /** 起点：类目轴是 index 字段的值（含这一项），数值轴是数值 */
  from: unknown;
  /** 终点：同 from（含这一项） */
  to: unknown;
  /** 文字：类目轴上的写在带的左下角，数值轴上的写在左上角 */
  label?: string;
  /** 颜色，默认 neutral；画成很浅的底色 */
  color?: ChartColor;
}

/** 第二数值轴（右侧）：哪些系列画在它上面，它的格式与单位 */
export interface ChartSecondaryAxis {
  /** 画在第二数值轴上的系列 */
  keys: readonly string[];
  /** 数值的格式 */
  format?: NumericFormat;
  /** 单位：显示在右上方，提示框与数据表的数值后面带上 */
  unit?: string;
}

/** 加载中的骨架 */
export interface ChartSkeletons {
  /** 一排高低不一的柱（柱状图） */
  bars: unknown;
  /** 一整块（默认） */
  block: unknown;
}

/** 直角坐标图表共有的属性；未声明的属性落到外层 div（role="figure"）上，aria-label 是图表的名称 */
export interface XYChartProps<T extends object>
  extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 数据：每一行是类目轴上的一项（一个月、一个项目） */
  data: readonly T[];
  /** 类目字段：类目轴的刻度、提示框的标题、数据表的第一列 */
  index: keyof T & string;
  /** 系列：每个系列画成一组柱子、一条线或一片面积 */
  series: readonly ChartSeries<T>[];
  /** 类目的显示文字；不写时把字段的值转成字符串 */
  indexFormat?: (value: T[keyof T & string], row: T) => string;
  /**
   * 数值的格式：数值轴、提示框、数据表共用，按当前语言格式化。以万元为单位画金额时写
   * `{ scale: 10_000, maximumFractionDigits: 1 }` 并配 `unit="万元"`
   */
  valueFormat?: NumericFormat;
  /** 单位：显示在数值轴上方，提示框与数据表的数值后面带上 */
  unit?: string;
  /**
   * 绘图区的高度；数字按 px
   * @default 240
   */
  height?: number | string;
  /** 图例：默认多于一个系列时显示；点图例可以隐藏、恢复系列 */
  legend?: boolean;
  /**
   * 数值轴的网格线
   * @default true
   */
  grid?: boolean;
  /** 数值轴的范围 [最小, 最大]；不写的一端按数据自动取，最小值默认从 0 起（数据有负数时取负数） */
  valueDomain?: readonly [number | undefined, number | undefined];
  /**
   * 悬停时的提示框
   * @default true
   */
  tooltip?: boolean;
  /**
   * 加载中：绘图区显示扫光的骨架（柱状图是一排高低不一的柱），带 aria-busy
   * @default false
   */
  loading?: boolean;
  /** 隐藏的系列（存系列的 key）：点图例时写回，父级可以写 hiddenSeries={_bind(keys)} */
  hiddenSeries?: string[];
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
  /** 目标线、参考线：数值轴上的虚线（横向图是竖线），如年度降本指标；数值轴的范围会包含它 */
  targets?: readonly ChartTarget[];
  /** 标注：类目上的事件（竖线），或圈出某个系列的值（横向图只画竖线） */
  annotations?: readonly ChartAnnotation[];
  /** 区间：类目轴或数值轴上的一段，画成浅色的带（数值轴的范围会包含它） */
  bands?: readonly ChartBand[];
  /**
   * 点了一个类目（下钻，如跳到筛好条件的台账）：参数是这一行与它的位置；写了它时绘图区的指针是手形。
   * 点图是鼠标的捷径：同样的去处在页面上还要有链接或按钮，键盘与读屏才到得了（WCAG 2.1.1）
   */
  onItemClick?: (row: T, index: number) => void;
}

/** 交给各种图的绘制上下文 */
export interface XYChartContext<T extends object> {
  /** 显示中的系列（去掉了图例里隐藏的），颜色已定 */
  series: ResolvedSeries<T>[];
  /** 类目的位置：第几行 */
  x: (row: T, index: number) => number;
  /** 系列的取值函数，空值返回 undefined（Unovis 跳过） */
  y: (series: ResolvedSeries<T>) => (row: T) => number | undefined;
  /** 取一个跨渲染保留的组件实例：第一次调用时创建；Unovis 组件保留实例，更新时才有过渡动画 */
  instance: <C>(key: string, create: () => C) => C;
  /** 点图形下钻的事件（写了 itemSelector 时）：并进组件的 events；没有 onItemClick 时是空的 */
  events: Record<string, Record<string, (row: T) => void>>;
}

/** 一种图：画哪些组件，以及与坐标轴、十字线有关的差别 */
export interface XYChartKind<T extends object> {
  /** 配置并返回要画的 Unovis 组件（每次数据或属性变化都会调用） */
  components: (context: XYChartContext<T>) => XYComponentCore<T>[];
  /** 横向：类目在纵轴、数值在横轴 */
  horizontal?: boolean;
  /** 十字线上给每个系列画圆点（折线图、面积图）；柱状图不画 */
  crosshairDots?: boolean;
  /** 加载中的骨架，默认 block */
  skeleton?: keyof ChartSkeletons;
  /** 绘图区四周的留白（px）：折线两端不贴着边缘 */
  padding?: { left?: number; right?: number; top?: number; bottom?: number };
  /** 数值范围按堆叠后的总和算（堆叠的柱子、面积） */
  stacked?: boolean;
  /** 百分比堆叠：各系列按它在这个类目里的占比画（加起来 100%），数值轴是百分比，提示框带上占比 */
  percent?: boolean;
  /** 第二数值轴（组合图）：这些系列画在右侧的轴上，刻度与主轴对齐 */
  secondary?: ChartSecondaryAxis;
  /** 十字线只在这些系列上画圆点（组合图里只给线画）；不写时按 crosshairDots */
  crosshairSeries?: (series: ResolvedSeries<T>) => boolean;
  /** 横轴是连续的数值（散点图）：取值、刻度与提示框里的写法、数据表的列名、轴下方的标题；不写时横轴是类目（第几行） */
  continuousX?: {
    value: (row: T) => number | undefined;
    format: (value: number) => string;
    label: string;
    title?: string;
  };
  /** 数值轴默认从 0 起（数据有负数时取负数）；false 时按数据自动取（散点图） */
  zeroBaseline?: boolean;
  /** 提示框跟着数据点（散点图），没有十字线：按选择器触发，悬停的数据是这一行 */
  pointTooltip?: string;
  /** 提示框里列的项；不写时每个显示中的系列一行（瀑布图列变动与累计） */
  tooltipItems?: (row: T) => ChartTooltipItem[];
  /** 数值轴（主轴）的范围要包含的值；shown 是显示中的系列（第二数值轴的已去掉）。不写时按系列的值（stacked 时按正负各自的总和） */
  domainValues?: (rows: readonly T[], shown: readonly ResolvedSeries<T>[]) => number[];
  /** 给读屏的数据表；不写时类目一列加每个系列一列 */
  table?: (rows: readonly T[]) => ChartTable;
  /** 点哪种图形算点了这一行（柱子的选择器，图形绑定的数据是这一行）；不写时按十字线所在的那一行 */
  itemSelector?: string;
}

/** 第二数值轴的刻度文字占的宽度（px） */
const SECONDARY_AXIS_WIDTH = 48;

/** 骨架柱的高度（百分比）：高低错落，看起来像一组数据 */
const SKELETON_BARS = [55, 80, 40, 70, 90, 50, 65];

/** XYChart 的样式：hideCrosshairLine 与加载中的骨架（外层结构的样式见 chartStyles） */
export const xyChartStyles = stylex.create({
  // 柱状图的十字线只用来定位提示框，不画竖线
  hideCrosshairLine: { '--vis-crosshair-line-stroke-opacity': '0' },
  skeleton: { display: 'block', width: '100%', height: '100%' },
  skeletonBars: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: '_md',
    height: '100%',
  },
  skeletonBarsHorizontal: { flexDirection: 'column', alignItems: 'flex-start' },
  skeletonBar: { display: 'block', flexGrow: 1, flexBasis: 0, borderRadius: '_sm' },
  skeletonBarSize: (percent: string) => ({ height: percent }),
  skeletonBarSizeHorizontal: (percent: string) => ({ width: percent }),
});

/** 加载中绘图区的骨架：柱状图是一排高低不一的柱（横向时是条），其余是一整块 */
function chartSkeleton({
  skeleton = 'block',
  horizontal = false,
}: Pick<XYChartKind<object>, 'skeleton' | 'horizontal'>) {
  if (skeleton === 'block') return <Skeleton sx={xyChartStyles.skeleton} />;
  return (
    <div
      aria-hidden="true"
      {...stylex.attrs(
        xyChartStyles.skeletonBars,
        horizontal && xyChartStyles.skeletonBarsHorizontal,
      )}
    >
      {SKELETON_BARS.map((percent, position) => (
        <Skeleton
          key={position}
          sx={[
            xyChartStyles.skeletonBar,
            horizontal
              ? xyChartStyles.skeletonBarSizeHorizontal(`${percent}%`)
              : xyChartStyles.skeletonBarSize(`${percent}%`),
          ]}
        />
      ))}
    </div>
  );
}

/** 直角坐标图表的公共实现（组件库内部用，见 BarChart、LineChart、AreaChart） */
export const XYChart = _component(
  <T extends object>({
    data,
    index,
    series,
    indexFormat,
    valueFormat,
    unit,
    height = 240,
    legend,
    grid = true,
    valueDomain,
    tooltip = true,
    loading = false,
    hiddenSeries = _bindable<string[]>([]),
    empty,
    targets,
    annotations,
    bands,
    onItemClick,
    kind,
    sx,
    ...rest
  }: XYChartProps<T> & { kind: XYChartKind<T> }) => {
    const lang = useLang();
    const format = useFormat();
    const id = useId();
    const resolved = _derived(resolveSeries(series));
    const visible = _derived(resolved.filter((item) => !hiddenSeries.includes(item.key)));

    const categoryText = (row: T | undefined) =>
      row === undefined
        ? ''
        : indexFormat
          ? indexFormat(row[index], row)
          : String(row[index] ?? '');
    const valueText = useChartValueText(() => ({ valueFormat, unit }));
    const secondaryText = useChartValueText(() => ({
      valueFormat: kind.secondary?.format,
      unit: kind.secondary?.unit,
    }));
    const onSecondary = (key: string) => kind.secondary?.keys.includes(key) ?? false;
    /** 一个系列的值的文字：第二数值轴上的按它的格式与单位 */
    const seriesText = (key: string, value: NumericValue | undefined) =>
      onSecondary(key) ? secondaryText(value) : valueText(value);
    /** 一行里显示中的系列的总和（百分比堆叠的分母；负数不计） */
    const rowTotal = (row: T) =>
      visible.reduce((sum, item) => sum + Math.max(seriesNumber(row, item.key) ?? 0, 0), 0);
    const percentText = (value: number) =>
      format.number(value, { style: 'percent', maximumFractionDigits: 1 });

    const xText = (row: T) => {
      const x = kind.continuousX?.value(row);
      return x === undefined ? lang.emptyValue : kind.continuousX!.format(x);
    };

    function toggle(key: string) {
      hiddenSeries = hiddenSeries.includes(key)
        ? hiddenSeries.filter((item) => item !== key)
        : [...hiddenSeries, key];
    }

    const instances = createChartInstances();
    let tooltipElement: HTMLElement | undefined;

    // 指针所在的那一行：十字线移动时记下，点绘图区时下钻到它；离开绘图区时清掉
    let hovered: { row: T; index: number } | null = null;
    const hover = (row: T | undefined) => {
      hovered = row === undefined ? null : { row, index: data.indexOf(row) };
    };

    /** 十字线的提示框：内容用 Vue 渲染进同一个元素，交给 Unovis 定位 */
    function renderTooltip(row: T) {
      tooltipElement ??= document.createElement('div');
      // 跟着数据点的提示框（散点图）没有十字线：悬停哪个点就是哪一行
      if (kind.pointTooltip) hover(row);
      render(
        chartTooltip(
          categoryText(row),
          kind.tooltipItems?.(row) ?? [
            ...(kind.continuousX
              ? [{ label: kind.continuousX.label, color: 'transparent', value: xText(row) }]
              : []),
            // 跟着数据点的提示框只列这一行有值的系列（散点图里一行通常只落在一个系列上）
            ...visible
              .filter((item) => !kind.pointTooltip || seriesValue(row, item.key) !== undefined)
              .map((item) => {
                const value = seriesValue(row, item.key);
                const total = kind.percent ? rowTotal(row) : 0;
                return {
                  label: item.label,
                  color: item.color,
                  value:
                    kind.percent && value !== undefined && total > 0
                      ? `${seriesText(item.key, value)}（${percentText(toNumber(value) / total)}）`
                      : seriesText(item.key, value),
                };
              }),
          ],
        ),
        tooltipElement,
      );
      return tooltipElement;
    }

    let plot = _state.raw<HTMLElement | null>(null);
    let container: XYContainer<T> | undefined;
    let containerElement: HTMLElement | undefined;
    _effect(() => () => {
      container?.destroy();
      if (tooltipElement) render(null, tooltipElement);
    });
    _effect(() => {
      const rows = [...data];
      const shown = visible;
      const element = plot;
      if (!element || loading || rows.length === 0) return;
      // 绘图区换了元素：旧容器连同它的组件、坐标轴一起销毁，实例表清空后重新创建
      if (container && containerElement !== element) {
        container.destroy();
        container = undefined;
        instances.reset();
      }

      const primarySeries = shown.filter((item) => !onSecondary(item.key));
      const secondarySeries = shown.filter((item) => onSecondary(item.key));
      const totals = rows.map((row) =>
        primarySeries.map((item) => seriesNumber(row, item.key) ?? 0),
      );
      const seriesValues = kind.domainValues
        ? kind.domainValues(rows, primarySeries)
        : kind.stacked
          ? totals.flatMap((row) => [
              row.reduce((sum, value) => sum + Math.max(value, 0), 0),
              row.reduce((sum, value) => sum + Math.min(value, 0), 0),
            ])
          : totals.flat();
      // 目标线、数值轴上的区间要落在数值轴的范围里
      const values = [
        ...seriesValues,
        ...(targets ?? []).map((target) => toNumber(target.value)),
        ...(bands ?? [])
          .filter((band) => band.axis === 'value')
          .flatMap((band) => [Number(band.from), Number(band.to)]),
      ];
      // 第二数值轴：两条轴的刻度对齐，第二轴的值换算到主轴的坐标
      const aligned: AlignedAxes | undefined =
        secondarySeries.length > 0
          ? alignedTicks(
              [
                ...values,
                ...[valueDomain?.[0], valueDomain?.[1]].filter(
                  (end): end is number => end !== undefined,
                ),
              ],
              rows.flatMap((row) =>
                secondarySeries.map((item) => seriesNumber(row, item.key) ?? 0),
              ),
            )
          : undefined;
      const domain: [number | undefined, number | undefined] = kind.percent
        ? [0, 1]
        : aligned
          ? aligned.primary.domain
          : [
              valueDomain?.[0] ??
                (kind.zeroBaseline === false ? undefined : Math.min(0, ...values)),
              valueDomain?.[1],
            ];
      const x = kind.continuousX
        ? (row: T) => kind.continuousX!.value(row) ?? Number.NaN
        : (_row: T, position: number) => position;
      const y = (item: (typeof shown)[number]) => {
        if (kind.percent)
          return (row: T) => {
            const value = seriesNumber(row, item.key);
            const total = rowTotal(row);
            return value === undefined || total === 0 ? undefined : value / total;
          };
        if (aligned && onSecondary(item.key))
          return (row: T) => {
            const value = seriesNumber(row, item.key);
            return value === undefined ? undefined : aligned.toPrimary(value);
          };
        return (row: T) => seriesNumber(row, item.key);
      };
      /** 类目在类目轴上的位置：散点图是横轴的数值，其余是第几行；找不到时 undefined */
      const positionOf = (at: unknown) => {
        if (kind.continuousX) return Number(at);
        const found = rows.findIndex((row) => row[index] === at);
        return found < 0 ? undefined : found;
      };
      const categoryAxisName = kind.horizontal ? AxisType.Y : AxisType.X;
      const valueAxisName = kind.horizontal ? AxisType.X : AxisType.Y;
      const lines = (targets ?? []).map((target, position) => {
        const line = instances.get(`target-${position}`, () => new Plotline<T>({}));
        const value = toNumber(target.value);
        const label = valueText(target.value);
        line.setConfig({
          axis: kind.horizontal ? 'x' : 'y',
          value,
          color: resolveColor(target.color ?? 'danger', 0),
          lineWidth: 1.5,
          lineStyle: PlotlineLineStylePresets.Dash,
          labelText: target.label ? `${target.label} ${label}` : label,
          labelPosition: kind.horizontal
            ? PlotlineLabelPosition.TopRight
            : PlotlineLabelPosition.TopLeft,
          labelOffsetX: 4,
          labelOffsetY: 10,
        });
        return line;
      });

      // 区间：浅色的带，文字在左上角
      const bandComponents = (bands ?? []).flatMap((band, position) => {
        const onIndex = band.axis !== 'value';
        const from = onIndex ? positionOf(band.from) : Number(band.from);
        const to = onIndex ? positionOf(band.to) : Number(band.to);
        if (from === undefined || to === undefined) return [];
        // 类目轴上的区间盖住两端的类目：往外各扩半格
        const half = onIndex && !kind.continuousX ? 0.5 : 0;
        const plotband = instances.get(`band-${position}`, () => new Plotband<T>({}));
        plotband.setConfig({
          axis: onIndex ? categoryAxisName : valueAxisName,
          from: Math.min(from, to) - half,
          to: Math.max(from, to) + half,
          color: `color-mix(in srgb, ${resolveColor(band.color ?? 'neutral', 0)} 12%, transparent)`,
          labelText: band.label,
          // 类目轴上的区间文字在左下角：顶上留给事件竖线的文字
          labelPosition: onIndex
            ? PlotbandLabelPosition.BottomLeftInside
            : PlotbandLabelPosition.TopLeftInside,
          labelColor: colors.textMuted,
          labelOffsetX: 6,
          labelOffsetY: 6,
        });
        return [plotband];
      });

      // 标注：事件是类目上的竖线；圈出的值是一个空心圈，文字在上方
      const events = (annotations ?? []).filter((item) => item.series === undefined);
      const eventLines = events.flatMap((item, position) => {
        const at = positionOf(item.at);
        if (at === undefined) return [];
        const line = instances.get(`event-${position}`, () => new Plotline<T>({}));
        line.setConfig({
          axis: categoryAxisName,
          value: at,
          color: resolveColor(item.color ?? 'neutral', 0),
          lineWidth: 1,
          lineStyle: PlotlineLineStylePresets.ShortDash,
          labelText: item.label,
          labelPosition: kind.horizontal
            ? PlotlineLabelPosition.BottomRight
            : PlotlineLabelPosition.TopRight,
          labelOffsetX: 4,
          labelOffsetY: 4,
        });
        return [line];
      });
      const marked = (annotations ?? []).filter(
        (item) => item.series !== undefined && !kind.horizontal,
      );
      const markOf = (row: T) => {
        const at = kind.continuousX ? kind.continuousX.value(row) : rows.indexOf(row);
        return marked.find(
          (item) =>
            positionOf(item.at) === at && shown.some((series) => series.key === item.series),
        );
      };
      /** 圈的位置：系列的值；堆叠时是它在这一摞里的顶端 */
      const markY = (row: T) => {
        const mark = markOf(row);
        if (!mark) return undefined;
        const series = shown.find((item) => item.key === mark.series)!;
        if (!kind.stacked || kind.percent) return y(series)(row);
        const upTo = shown.slice(0, shown.indexOf(series) + 1);
        return upTo.reduce((sum, item) => sum + Math.max(y(item)(row) ?? 0, 0), 0);
      };
      const markColor = (row: T) => {
        const mark = markOf(row);
        const series = shown.find((item) => item.key === mark?.series);
        return mark?.color ? resolveColor(mark.color, 0) : (series?.color ?? colors.textMuted);
      };
      const marks = instances.get('marks', () => new Scatter<T>({ x, y: () => undefined }));
      marks.setConfig({
        x,
        y: markY,
        size: 16,
        color: 'transparent',
        strokeColor: markColor,
        strokeWidth: 2,
        label: (row: T) => markOf(row)?.label ?? '',
        labelPosition: Position.Top,
        labelColor: colors.text,
      });

      // 第二数值轴的刻度：与主轴的刻度同高，文字在绘图区右侧（不裁剪的 Plotline 标签，线本身透明）
      const secondaryLabels = aligned
        ? aligned.secondary.ticks.map((tick, position) => {
            const label = instances.get(`secondary-${position}`, () => {
              const line = new Plotline<T>({});
              line.clippable = false;
              return line;
            });
            label.setConfig({
              axis: 'y',
              value: aligned.primary.ticks[position]!,
              color: 'transparent',
              lineWidth: 0,
              labelText: format.number(tick, kind.secondary?.format),
              labelPosition: PlotlineLabelPosition.Right,
              labelOffsetX: -(SECONDARY_AXIS_WIDTH - 4),
              labelColor: colors.textMuted,
            });
            return label;
          })
        : [];
      const components = [
        ...bandComponents,
        ...kind.components({
          series: shown,
          x,
          y,
          instance: instances.get,
          events:
            kind.itemSelector && onItemClick
              ? {
                  [kind.itemSelector]: {
                    click: (row: T) => onItemClick(row, data.indexOf(row)),
                  },
                }
              : {},
        }),
        ...lines,
        ...eventLines,
        ...(marked.length > 0 ? [marks] : []),
        ...secondaryLabels,
      ];
      const xAxis = instances.get('xAxis', () => new Axis<T>({ type: 'x' }));
      const yAxis = instances.get('yAxis', () => new Axis<T>({ type: 'y' }));
      const crosshair = instances.get('crosshair', () => new Crosshair<T>());
      const tooltipBox = instances.get('tooltip', () => new Tooltip());
      const [categoryAxis, valueAxis] = kind.horizontal ? [yAxis, xAxis] : [xAxis, yAxis];
      const continuous = kind.continuousX;
      categoryAxis.setConfig({
        type: kind.horizontal ? 'y' : 'x',
        // 连续的横轴：Unovis 自己取刻度，网格线与数值轴一样；类目轴：每行一个刻度
        tickValues: continuous ? undefined : rows.map((_row, position) => position),
        numTicks: continuous ? 6 : undefined,
        tickFormat: continuous
          ? (tick) => continuous.format(Number(tick))
          : (tick) => categoryText(rows[Number(tick)]),
        gridLine: continuous ? grid : false,
        tickLine: false,
        domainLine: false,
        tickTextHideOverlapping: true,
        tickPadding: 8,
        label: continuous?.title,
        labelMargin: 8,
      });
      valueAxis.setConfig({
        type: kind.horizontal ? 'x' : 'y',
        numTicks: 5,
        // 有第二数值轴时用对齐的刻度，两边的刻度落在同一组网格线上
        tickValues: aligned?.primary.ticks,
        tickFormat: (tick) =>
          kind.percent
            ? format.number(Number(tick), { style: 'percent', maximumFractionDigits: 0 })
            : format.number(Number(tick), valueFormat),
        gridLine: grid,
        tickLine: false,
        domainLine: false,
        tickPadding: 8,
      });
      const dotted = kind.crosshairSeries ? shown.filter(kind.crosshairSeries) : shown;
      crosshair.setConfig({
        // 访问器直接给：容器还没按尺寸渲染过时不会把组件的访问器转交十字线，Unovis 会报 “Y accessors have not been configured”
        x,
        ...(kind.stacked ? { yStacked: dotted.map(y) } : { y: dotted.map(y) }),
        template: (row: T) => renderTooltip(row),
        color: (_row: T, position: number) => dotted[position]?.color ?? 'transparent',
        getCircles: kind.crosshairDots ? undefined : () => [],
        hideWhenFarFromPointer: false,
        onCrosshairMove: (_x, row) => hover(row),
      });

      tooltipBox.setConfig({
        triggers: kind.pointTooltip ? { [kind.pointTooltip]: (row: T) => renderTooltip(row) } : {},
      });
      const config = {
        components,
        xAxis,
        yAxis,
        // 能下钻时没有提示框也要十字线：靠它知道指针在哪一行
        crosshair:
          (tooltip || (onItemClick && !kind.itemSelector)) && !kind.pointTooltip
            ? crosshair
            : undefined,
        tooltip: tooltip ? tooltipBox : undefined,
        [kind.horizontal ? 'xDomain' : 'yDomain']: domain,
        // 第二数值轴的刻度文字画在右侧留出的空白里
        padding: aligned
          ? { ...kind.padding, right: Math.max(kind.padding?.right ?? 0, SECONDARY_AXIS_WIDTH) }
          : (kind.padding ?? {}),
        ariaLabel: null,
        duration: chartDuration(element),
      };
      if (container) container.update(config, undefined, rows);
      else {
        container = new XYContainer<T>(element, config, rows);
        containerElement = element;
        uniqueHighlightFilter(element, `${id}-highlight`);
      }
    });

    return () => (
      <ChartFrame
        {...rest}
        sx={[!kind.crosshairDots && xyChartStyles.hideCrosshairLine, sx]}
        // 百分比堆叠时数值轴是占比：轴上方不写单位（提示框、数据表里仍带）
        unit={kind.percent ? undefined : unit}
        unitEnd={kind.secondary?.unit}
        height={height}
        legend={(legend ?? resolved.length > 1) ? resolved : []}
        hiddenKeys={hiddenSeries}
        onLegendToggle={toggle}
        loading={loading}
        skeleton={chartSkeleton(kind)}
        isEmpty={data.length === 0}
        empty={empty}
        clickable={onItemClick != null}
        onPlotClick={
          onItemClick && !kind.itemSelector
            ? () => {
                if (hovered) onItemClick(hovered.row, hovered.index);
              }
            : undefined
        }
        table={
          kind.table?.(data) ?? {
            columns: [
              lang.chartCategory,
              ...(kind.continuousX ? [kind.continuousX.label] : []),
              ...resolved.map((item) => {
                const itemUnit = onSecondary(item.key) ? kind.secondary?.unit : unit;
                return itemUnit ? `${item.label}（${itemUnit}）` : item.label;
              }),
            ],
            rows: data.map((row) => ({
              header: categoryText(row),
              cells: [
                ...(kind.continuousX ? [xText(row)] : []),
                ...resolved.map((item) => {
                  const value = seriesValue(row, item.key);
                  return value === undefined
                    ? lang.emptyValue
                    : format.number(
                        value,
                        onSecondary(item.key) ? kind.secondary?.format : valueFormat,
                      );
                }),
              ],
            })),
          }
        }
        plotRef={(element) => (plot = element)}
      />
    );
  },
);
