/**
 * 直角坐标图表（柱状图、折线图、面积图）的公共部分：坐标轴、十字线与提示框、数值范围；外层结构（图例、单位、
 * 空与加载状态、给读屏的数据表）交给 ChartFrame。
 * 绘图交给 Unovis 的 XYContainer：组件实例只建一次，数据与配置变化时 update，卸载时 destroy；
 * 绘图区换了元素（加载、空状态之后重新出现）时容器连同全部实例一起重建。
 * 各种图只决定画什么（kind.components），坐标轴、十字线、提示框、配色都在这里统一。
 * 目标线（targets）用 Unovis 的 Plotline。点了下钻（onItemClick）：有图形可点的图（柱子）按图形的点击事件
 * （kind.itemSelector），折线、面积图按十字线所在的那一行，散点图按悬停的点。
 */
import {
  Axis,
  Crosshair,
  Plotline,
  PlotlineLabelPosition,
  PlotlineLineStylePresets,
  Tooltip,
  XYContainer,
  type XYComponentCore,
} from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { render, useId, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
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
  /** 数值轴的范围要包含的值；不写时按系列的值（stacked 时按正负各自的总和） */
  domainValues?: (rows: readonly T[]) => number[];
  /** 给读屏的数据表；不写时类目一列加每个系列一列 */
  table?: (rows: readonly T[]) => ChartTable;
  /** 点哪种图形算点了这一行（柱子的选择器，图形绑定的数据是这一行）；不写时按十字线所在的那一行 */
  itemSelector?: string;
}

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
              .map((item) => ({
                label: item.label,
                color: item.color,
                value: valueText(seriesValue(row, item.key)),
              })),
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

      const totals = rows.map((row) => shown.map((item) => seriesNumber(row, item.key) ?? 0));
      const seriesValues = kind.domainValues
        ? kind.domainValues(rows)
        : kind.stacked
          ? totals.flatMap((row) => [
              row.reduce((sum, value) => sum + Math.max(value, 0), 0),
              row.reduce((sum, value) => sum + Math.min(value, 0), 0),
            ])
          : totals.flat();
      // 目标线要落在数值轴的范围里
      const values = [...seriesValues, ...(targets ?? []).map((target) => toNumber(target.value))];
      const domain: [number | undefined, number | undefined] = [
        valueDomain?.[0] ?? (kind.zeroBaseline === false ? undefined : Math.min(0, ...values)),
        valueDomain?.[1],
      ];
      const x = kind.continuousX
        ? (row: T) => kind.continuousX!.value(row) ?? Number.NaN
        : (_row: T, position: number) => position;
      const y = (item: (typeof shown)[number]) => (row: T) => seriesNumber(row, item.key);
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
      const components = [
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
        tickFormat: (tick) => format.number(Number(tick), valueFormat),
        gridLine: grid,
        tickLine: false,
        domainLine: false,
        tickPadding: 8,
      });
      crosshair.setConfig({
        // 访问器直接给：容器还没按尺寸渲染过时不会把组件的访问器转交十字线，Unovis 会报 “Y accessors have not been configured”
        x,
        ...(kind.stacked ? { yStacked: shown.map(y) } : { y: shown.map(y) }),
        template: (row: T) => renderTooltip(row),
        color: (_row: T, position: number) => shown[position]?.color ?? 'transparent',
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
        padding: kind.padding ?? {},
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
        unit={unit}
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
              ...resolved.map((item) => (unit ? `${item.label}（${unit}）` : item.label)),
            ],
            rows: data.map((row) => ({
              header: categoryText(row),
              cells: [
                ...(kind.continuousX ? [xText(row)] : []),
                ...resolved.map((item) => {
                  const value = seriesValue(row, item.key);
                  return value === undefined ? lang.emptyValue : format.number(value, valueFormat);
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
