/**
 * 直角坐标图表（柱状图、折线图、面积图、散点图、组合图、瀑布图）的公共部分：比例尺与坐标轴、网格、十字线与提示框、
 * 目标线、标注与区间、缩放、下钻；外层结构（图例、单位、空与加载状态、给读屏的数据表）交给 ChartFrame。
 * 各种图只决定画什么（kind.render），坐标由 XYChartContext 换算，配色、坐标轴、提示框都在这里统一。
 *
 * - 类目轴：每行一个类目。柱（kind.band）每个类目占一格、画在格子中间；折线、面积的第一个、最后一个类目贴着两端。
 *   刻度文字放不下时隔几个写一个；横向（kind.horizontal）时类目在纵轴，名字太长截短。
 * - 数值轴：范围默认从 0 起（有负数时含负数），两端扩到“好看”的刻度上；valueDomain 指定的一端不扩。
 *   百分比堆叠（kind.percent）按每个类目里各系列的占比画，数值轴是 0–100%。
 * - 第二数值轴（kind.secondary，组合图）：刻度与主轴对齐（alignedTicks），第二轴的系列换算到主轴的坐标里画。
 * - 悬停：指针所在的类目画十字线（折线、面积给各系列标出圆点）或一层浅底（柱），提示框列出这一类目的各系列；
 *   散点图（kind.pointTooltip）按离指针最近的点。点了下钻（onItemClick）：点在柱上按那根柱，其余按悬停的类目。
 * - 标注（annotations）：类目上的事件是竖线，圈出某个系列的值是空心圈带文字；区间（bands）是浅色的带。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import { Button } from '../base/Button';
import { Slider } from '../input/Slider';
import { svgNumber } from '../utils/data/number';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import { alignedTicks, type AlignedAxes } from './axis-ticks';
import {
  ChartFrame,
  chartTooltip,
  useChartValueText,
  type ChartFrameParts,
  type ChartTable,
  type ChartTooltipItem,
} from './frame';
import {
  ChartTooltipBox,
  chartAxis,
  chartSvgStyles,
  pointerIn,
  usePlotArea,
  type AxisTick,
  type ChartTip,
  type PlotRect,
} from './plot';
import { linearScale, linearTicks, niceDomain } from './scale';
import {
  resolveColor,
  resolveSeries,
  seriesNumber,
  seriesValue,
  type ChartColor,
  type ChartSeries,
  type ResolvedSeries,
} from './series';
import { stackValues, type StackSegment } from './stack';
import { estimateTextWidth, truncateText } from './text-size';

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

/** 区间：类目轴上的一段（试运行期、促销期），或数值轴上的一段（目标区间） */
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
  /** 隐藏的系列（存系列的 key）：点图例时写回，父级可以写 _hiddenSeries={keys} */
  _hiddenSeries?: string[];
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
  /** 目标线、参考线：数值轴上的虚线（横向图是竖线），如年度销售指标；数值轴的范围会包含它 */
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
  /** 缩放：绘图区下面一条区间滑块，选一段类目放大看（几年的月度数据）；读屏的数据表仍是全部 */
  zoom?: boolean;
  /** 缩放的区间 [起, 止]：类目的位置，含两端；父级可以写 _zoomRange={range}，null 是全部 */
  _zoomRange?: [number, number] | null;
}

/** 交给各种图的绘制上下文：坐标都是 SVG 里的 px */
export interface XYChartContext<T extends object> {
  /** 显示中的系列（去掉了图例里隐藏的），颜色已定 */
  series: ResolvedSeries<T>[];
  /** 画的行（缩放时是选中的一段） */
  rows: readonly T[];
  /** 横向：类目在纵轴、数值在横轴 */
  horizontal: boolean;
  /** 绘图区（坐标轴以内） */
  plot: PlotRect;
  /** 一个类目在类目轴上占的长度：柱按它定宽 */
  step: number;
  /** 数值轴的范围 */
  domain: readonly [number, number];
  /** 第 index 行在类目轴上的坐标（格子的中心）；散点图是横轴数值的位置 */
  category: (row: T, index: number) => number;
  /** 数值 → 数值轴上的坐标 */
  value: (value: number) => number;
  /** 系列在一行上画的值：百分比堆叠时是占比，第二数值轴上的换算到主轴；空值 undefined */
  valueOf: (series: ResolvedSeries<T>, row: T) => number | undefined;
  /** 堆叠（kind.stacked）后各系列每一行的一段：系列的 key → 每行一段 */
  stacks: ReadonlyMap<string, readonly StackSegment[]>;
  /** 类目坐标、数值坐标 → SVG 的 [x, y]（横向时对调） */
  point: (category: number, value: number) => [number, number];
  /** 指针所在的那一行（在 rows 里的位置），没有时为 null */
  hovered: number | null;
}

/** 一种图：画什么，以及与坐标轴、十字线有关的差别 */
export interface XYChartKind<T extends object> {
  /** 画出图形（坐标轴、网格、目标线、标注、十字线由 XYChart 画）；每次数据、属性、悬停变化都会调用 */
  render: (context: XYChartContext<T>) => VNodeChild;
  /** 类目占一格（柱）：图形画在格子中间、两端各留半格；不写时第一个、最后一个类目贴着两端（折线、面积） */
  band?: boolean;
  /** 横向：类目在纵轴、数值在横轴 */
  horizontal?: boolean;
  /** 十字线上给每个系列画圆点（折线图、面积图）；柱状图不画，悬停的类目铺一层浅底 */
  crosshairDots?: boolean;
  /** 加载中的骨架，默认 block */
  skeleton?: keyof ChartSkeletons;
  /** 绘图区四周的留白（px）：折线两端不贴着边缘 */
  padding?: { left?: number; right?: number; top?: number; bottom?: number };
  /** 数值范围按堆叠后的总和算（堆叠的柱子、面积） */
  stacked?: boolean;
  /** 参与堆叠的系列（组合图只叠柱）；不写时是全部显示中的系列 */
  stackSeries?: (series: ResolvedSeries<T>) => boolean;
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
  /** 提示框跟着离指针最近的数据点（散点图），没有十字线 */
  pointTooltip?: boolean;
  /** 提示框里列的项；不写时每个显示中的系列一行（瀑布图列变动与累计） */
  tooltipItems?: (row: T) => ChartTooltipItem[];
  /** 数值轴（主轴）的范围要包含的值；shown 是显示中的系列（第二数值轴的已去掉）。不写时按系列的值（stacked 时按正负各自的总和） */
  domainValues?: (rows: readonly T[], shown: readonly ResolvedSeries<T>[]) => number[];
  /** 给读屏的数据表；不写时类目一列加每个系列一列 */
  table?: (rows: readonly T[]) => ChartTable;
}

/** 刻度文字的字号（px）：主题的 xs */
const TICK_FONT = 12;
/** 刻度文字与绘图区的距离 */
const TICK_GAP = 8;
/** 散点图找最近的点时，离指针多远以内算悬停在点上（px） */
const POINT_REACH = 24;

/** 骨架柱的高度（百分比）：高低错落，看起来像一组数据 */
const SKELETON_BARS = [55, 80, 40, 70, 90, 50, 65];

/** XYChart 的样式：缩放的滑块、加载中的骨架、标注（外层结构的样式见 chartStyles） */
export const xyChartStyles = css.create({
  svg: { touchAction: 'pan-y' },
  skeleton: { display: 'block', width: '100%', height: '100%' },
  // 缩放：滑块占满，“显示全部”在结束边
  zoom: { display: 'flex', alignItems: 'center', gap: '_md', paddingInline: '_sm' },
  zoomSlider: { flexGrow: 1, minWidth: 0 },
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
  targetLine: { strokeWidth: 1.5, strokeDasharray: '6 4', pointerEvents: 'none' },
  eventLine: { strokeWidth: 1, strokeDasharray: '3 3', pointerEvents: 'none' },
  mark: { fill: 'none', strokeWidth: 2, pointerEvents: 'none' },
  crosshairDot: { stroke: '_surface', strokeWidth: 2, pointerEvents: 'none' },
  bandFill: (color: string) => ({ fill: `color-mix(in srgb, ${color} 12%, transparent)` }),
  textFill: (color: string) => ({ fill: color }),
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
      {...css.attrs(xyChartStyles.skeletonBars, horizontal && xyChartStyles.skeletonBarsHorizontal)}
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

/** 数值轴上约几格：每格不少于 45px（横着的轴 90px），2–6 格 */
const tickCount = (length: number, horizontal: boolean) =>
  Math.max(2, Math.min(6, Math.round(length / (horizontal ? 90 : 45))));

/** 指针悬停的状态：行的位置、提示框的位置 */
interface Hover {
  index: number;
  x: number;
  y: number;
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
    _hiddenSeries: hiddenSeries = _bindable<string[]>([]),
    empty,
    targets,
    annotations,
    bands,
    onItemClick,
    zoom = false,
    _zoomRange: zoomRange = _bindable<[number, number] | null>(null),
    kind,
    ...rest
  }: XYChartProps<T> & { kind: XYChartKind<T> }) => {
    const lang = useLang();
    const format = useFormat();
    const area = usePlotArea();
    const resolved = _derived(resolveSeries(series));
    const visible = _derived(resolved.filter((item) => !hiddenSeries.includes(item.key)));
    let hover = _state.raw<Hover | null>(null);

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

    /** 缩放的滑块：两端是类目；缩小过时旁边有“显示全部” */
    const zoomBar = () => {
      const last = data.length - 1;
      return (
        <div {...css.attrs(xyChartStyles.zoom)}>
          <Slider
            _value={zoomRange ?? [0, last]}
            onUpdate:_value={(next: [number, number]) =>
              (zoomRange = next[0] === 0 && next[1] === last ? null : next)
            }
            min={0}
            max={last}
            step={1}
            size="sm"
            valueText={(position) => categoryText(data[position])}
            aria-label={lang.chartZoom}
            propsRoot={{ sx: xyChartStyles.zoomSlider }}
          />
          {zoomRange && (
            <Button variant="link" size="sm" onClick={() => (zoomRange = null)}>
              {lang.chartZoomReset}
            </Button>
          )}
        </div>
      );
    };

    /** 提示框的内容：类目（或点的名字）与各系列的值 */
    function tooltipContent(row: T) {
      return chartTooltip(
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
      );
    }

    /** 缩放：只画选中的一段（散点图的横轴是连续的数值，不按类目缩放） */
    const range = () => (zoom && !kind.continuousX ? zoomRange : null);
    const shownRows = _derived.by(() => {
      const selected = range();
      return selected ? data.slice(selected[0], selected[1] + 1) : data;
    });

    /** 画图要的一切：比例尺、刻度、边距；随数据、属性、绘图区大小变 */
    const layout = _derived.by(() => {
      const rows = shownRows;
      const width = area.width;
      const plotHeight = area.height;
      const horizontal = kind.horizontal ?? false;
      const shown = visible;
      const primarySeries = shown.filter((item) => !onSecondary(item.key));
      const secondarySeries = shown.filter((item) => onSecondary(item.key));

      // 数值轴的范围要包含的值：系列（堆叠时按正负各自的总和）、目标线、数值轴上的区间。
      // 不叠的系列里空值不算：散点图里一行通常只落在一个系列上，其余系列是空的
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
          : rows.flatMap((row) =>
              primarySeries.flatMap((item) => seriesNumber(row, item.key) ?? []),
            );
      const values = [
        ...seriesValues,
        ...(targets ?? []).map((target) => toNumber(target.value)),
        ...(bands ?? [])
          .filter((band) => band.axis === 'value')
          .flatMap((band) => [Number(band.from), Number(band.to)]),
      ].filter(Number.isFinite);
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

      const valueLength = horizontal ? width : plotHeight;
      let domain: [number, number];
      let ticks: number[];
      if (kind.percent) {
        domain = [0, 1];
        ticks = linearTicks(0, 1, tickCount(valueLength, horizontal));
      } else if (aligned) {
        domain = aligned.primary.domain;
        ticks = aligned.primary.ticks;
      } else {
        const fromZero = kind.zeroBaseline !== false;
        const low = values.length ? Math.min(...values, ...(fromZero ? [0] : [])) : 0;
        const high = values.length ? Math.max(...values, ...(fromZero ? [0] : [])) : 1;
        const [autoLow, autoHigh] = low === high ? [low - 1, high + 1] : [low, high];
        const nice = niceDomain(
          [valueDomain?.[0] ?? autoLow, valueDomain?.[1] ?? autoHigh],
          tickCount(valueLength, horizontal),
        );
        domain = [valueDomain?.[0] ?? nice[0], valueDomain?.[1] ?? nice[1]];
        ticks = linearTicks(domain[0], domain[1], tickCount(valueLength, horizontal));
      }
      const valueLabel = (tick: number) =>
        kind.percent
          ? format.number(tick, { style: 'percent', maximumFractionDigits: 0 })
          : format.number(tick, valueFormat);
      const valueLabels = ticks.map(valueLabel);
      const secondaryLabels = aligned
        ? aligned.secondary.ticks.map((tick) => format.number(tick, kind.secondary?.format))
        : [];

      // 连续的横轴（散点图）：按数据取范围与刻度
      const continuous = kind.continuousX;
      const xValues = continuous
        ? rows.map((row) => continuous.value(row)).filter((x): x is number => x !== undefined)
        : [];
      const xDomain = niceDomain(
        xValues.length ? [Math.min(...xValues), Math.max(...xValues)] : [0, 1],
        tickCount(width, true),
      );
      const xTicks = continuous ? linearTicks(xDomain[0], xDomain[1], tickCount(width, true)) : [];

      // 边距：放得下刻度文字
      const widest = (labels: readonly string[]) =>
        Math.max(0, ...labels.map((label) => estimateTextWidth(label, TICK_FONT)));
      const categoryLabels = rows.map((row) => categoryText(row));
      const padding = { left: 0, right: 0, top: 0, bottom: 0, ...kind.padding };
      const bottomLabels = horizontal
        ? valueLabels
        : continuous
          ? xTicks.map(continuous.format)
          : categoryLabels;
      const margin = horizontal
        ? {
            left: Math.min(widest(categoryLabels), width * 0.3) + TICK_GAP,
            right: Math.max(8, widest(valueLabels.slice(-1)) / 2),
            top: 4,
            bottom: TICK_FONT + TICK_GAP + 2,
          }
        : {
            left: widest(valueLabels) + TICK_GAP,
            right: aligned ? widest(secondaryLabels) + TICK_GAP : 8,
            top: 8,
            bottom: TICK_FONT + TICK_GAP + 2 + (continuous?.title ? TICK_FONT + 8 : 0),
          };
      // 横轴两端的文字居中在端点上：别伸出绘图区外
      if (!horizontal && bottomLabels.length && !kind.band) {
        margin.left = Math.max(margin.left, widest(bottomLabels.slice(0, 1)) / 2 - padding.left);
        margin.right = Math.max(margin.right, widest(bottomLabels.slice(-1)) / 2 - padding.right);
      }
      const plot: PlotRect = {
        left: margin.left,
        top: margin.top,
        width: Math.max(0, width - margin.left - margin.right),
        height: Math.max(0, plotHeight - margin.top - margin.bottom),
      };

      // 类目轴：带（柱）每个类目一格；点（折线）首尾贴边；散点图是连续的数值
      const [cStart, cEnd] = horizontal
        ? [plot.top + padding.top, plot.top + plot.height - padding.bottom]
        : [plot.left + padding.left, plot.left + plot.width - padding.right];
      const count = rows.length;
      const step = kind.band
        ? (cEnd - cStart) / Math.max(count, 1)
        : count > 1
          ? (cEnd - cStart) / (count - 1)
          : cEnd - cStart;
      const xScale = linearScale(xDomain, [cStart, cEnd]);
      const category = continuous
        ? (row: T) => xScale(continuous.value(row) ?? Number.NaN)
        : (_row: T, position: number) =>
            kind.band
              ? cStart + step * (position + 0.5)
              : count > 1
                ? cStart + step * position
                : (cStart + cEnd) / 2;
      const valueScale = horizontal
        ? linearScale(domain, [plot.left + padding.left, plot.left + plot.width - padding.right])
        : linearScale(domain, [plot.top + plot.height - padding.bottom, plot.top + padding.top]);

      const valueOf = (item: ResolvedSeries<T>, row: T) => {
        const value = seriesNumber(row, item.key);
        if (value === undefined) return undefined;
        if (kind.percent) {
          const total = rowTotal(row);
          return total === 0 ? undefined : value / total;
        }
        return aligned && onSecondary(item.key) ? aligned.toPrimary(value) : value;
      };
      const stacked = kind.stacked ? shown.filter(kind.stackSeries ?? (() => true)) : [];
      const segments = stackValues(stacked.map((item) => rows.map((row) => valueOf(item, row))));
      const stacks = new Map(stacked.map((item, s) => [item.key, segments[s]!]));

      // 类目刻度：放不下时隔几个写一个（横着排时按文字宽度，竖着排时按行高）
      const every = continuous
        ? 1
        : Math.max(
            1,
            Math.ceil(
              (horizontal ? TICK_FONT + 4 : widest(categoryLabels) + 12) / Math.max(step, 1),
            ),
          );
      const categoryTicks: AxisTick[] = continuous
        ? xTicks.map((tick) => ({ position: xScale(tick), label: continuous.format(tick) }))
        : rows.map((row, position) => ({
            position: category(row, position),
            label:
              position % every === 0
                ? horizontal
                  ? truncateText(categoryLabels[position]!, width * 0.3, TICK_FONT)
                  : categoryLabels[position]!
                : '',
          }));
      const valueTicks: AxisTick[] = ticks.map((tick, position) => ({
        position: valueScale(tick),
        label: valueLabels[position]!,
      }));
      const secondaryTicks: AxisTick[] = aligned
        ? aligned.primary.ticks.map((tick, position) => ({
            position: valueScale(tick),
            label: secondaryLabels[position]!,
          }))
        : [];
      return {
        rows,
        shown,
        horizontal,
        plot,
        step,
        domain,
        category,
        valueScale,
        valueOf,
        stacks,
        categoryTicks,
        valueTicks,
        secondaryTicks,
      };
    });

    /** 一个类目在类目轴上的位置（标注、区间用）：散点图是横轴的数值，其余是第几行；找不到时 undefined */
    function positionOf(at: unknown): number | undefined {
      const { rows, category } = layout;
      if (kind.continuousX) {
        const row = rows.find((item) => kind.continuousX!.value(item) === Number(at));
        return row ? category(row, 0) : undefined;
      }
      const found = rows.findIndex((row) => row[index] === at);
      return found < 0 ? undefined : category(rows[found]!, found);
    }

    /** 指针移动：找出悬停的行（散点图是最近的点） */
    function onPointermove(event: PointerEvent) {
      const svg = event.currentTarget as SVGSVGElement;
      const { x, y } = pointerIn(event, svg);
      const { rows, plot, horizontal, category, valueScale, valueOf, shown, step } = layout;
      const inside =
        x >= plot.left - 4 &&
        x <= plot.left + plot.width + 4 &&
        y >= plot.top - 4 &&
        y <= plot.top + plot.height + 4;
      if (!inside || rows.length === 0) {
        hover = null;
        return;
      }
      if (kind.pointTooltip) {
        let best: Hover | null = null;
        let distance = POINT_REACH;
        rows.forEach((row, position) => {
          for (const item of shown) {
            const value = valueOf(item, row);
            if (value === undefined) continue;
            const [px, py] = [category(row, position), valueScale(value)];
            const d = Math.hypot(px - x, py - y);
            if (d < distance) {
              distance = d;
              best = { index: position, x: px, y: py };
            }
          }
        });
        hover = best;
        return;
      }
      const along = horizontal ? y : x;
      let nearest = 0;
      rows.forEach((row, position) => {
        if (
          Math.abs(category(row, position) - along) <
          Math.abs(category(rows[nearest]!, nearest) - along)
        )
          nearest = position;
      });
      const center = category(rows[nearest]!, nearest);
      if (Math.abs(center - along) > Math.max(step, 8)) {
        hover = null;
        return;
      }
      hover = horizontal ? { index: nearest, x, y: center } : { index: nearest, x: center, y };
    }

    /** 点击下钻：点在柱上按那根柱（data-index），其余按悬停的行 */
    function onClick(event: MouseEvent) {
      if (!onItemClick) return;
      const target = (event.target as Element | null)?.closest?.('[data-index]');
      const position = target ? Number(target.getAttribute('data-index')) : hover?.index;
      if (position === undefined || Number.isNaN(position)) return;
      const offset = range()?.[0] ?? 0;
      const row = layout.rows[position];
      if (row !== undefined) onItemClick(row, offset + position);
    }

    /** 区间：浅色的带，文字在左下角（类目轴）或左上角（数值轴） */
    function renderBands() {
      const { plot, horizontal, step, valueScale } = layout;
      return (bands ?? []).map((band, position) => {
        const onIndex = band.axis !== 'value';
        const color = resolveColor(band.color ?? 'neutral', 0);
        let from: number | undefined;
        let to: number | undefined;
        if (onIndex) {
          const a = positionOf(band.from);
          const b = positionOf(band.to);
          if (a === undefined || b === undefined) return null;
          // 类目轴上的区间盖住两端的类目：往外各扩半格
          const half = kind.continuousX ? 0 : step / 2;
          from = Math.min(a, b) - half;
          to = Math.max(a, b) + half;
        } else {
          from = Math.min(valueScale(Number(band.from)), valueScale(Number(band.to)));
          to = Math.max(valueScale(Number(band.from)), valueScale(Number(band.to)));
        }
        const alongCategory = onIndex !== horizontal;
        const clampedFrom = Math.max(from, alongCategory ? plot.left : plot.top);
        const clampedTo = Math.min(
          to,
          alongCategory ? plot.left + plot.width : plot.top + plot.height,
        );
        const rect = alongCategory
          ? { x: clampedFrom, y: plot.top, width: clampedTo - clampedFrom, height: plot.height }
          : { x: plot.left, y: clampedFrom, width: plot.width, height: clampedTo - clampedFrom };
        if (rect.width <= 0 || rect.height <= 0) return null;
        return (
          <g key={`band-${position}`} data-part="band">
            <rect
              {...rect}
              {...css.attrs(xyChartStyles.bandFill(color), chartSvgStyles.noPointer)}
            />
            {band.label && (
              <text
                x={rect.x + 6}
                y={onIndex && !horizontal ? rect.y + rect.height - 6 : rect.y + 6}
                dominant-baseline={onIndex && !horizontal ? 'auto' : 'hanging'}
                {...css.attrs(chartSvgStyles.labelMuted, chartSvgStyles.noPointer)}
              >
                {band.label}
              </text>
            )}
          </g>
        );
      });
    }

    /** 目标线与事件竖线 */
    function renderLines() {
      const { plot, horizontal, valueScale } = layout;
      const right = plot.left + plot.width;
      const bottom = plot.top + plot.height;
      const targetLines = (targets ?? []).map((target, position) => {
        const color = resolveColor(target.color ?? 'danger', 0);
        const at = svgNumber(valueScale(toNumber(target.value)));
        const label = target.label
          ? `${target.label} ${valueText(target.value)}`
          : valueText(target.value);
        return (
          <g key={`target-${position}`} data-part="target">
            {horizontal ? (
              <line
                x1={at}
                x2={at}
                y1={plot.top}
                y2={bottom}
                {...css.attrs(xyChartStyles.targetLine, chartSvgStyles.stroke(color))}
              />
            ) : (
              <line
                x1={plot.left}
                x2={right}
                y1={at}
                y2={at}
                {...css.attrs(xyChartStyles.targetLine, chartSvgStyles.stroke(color))}
              />
            )}
            <text
              x={horizontal ? at + 4 : plot.left + 4}
              y={horizontal ? plot.top + 4 : at - 5}
              dominant-baseline={horizontal ? 'hanging' : 'auto'}
              {...css.attrs(
                chartSvgStyles.labelMuted,
                chartSvgStyles.halo,
                xyChartStyles.textFill(color),
                chartSvgStyles.noPointer,
              )}
            >
              {label}
            </text>
          </g>
        );
      });
      const events = (annotations ?? [])
        .filter((item) => item.series === undefined)
        .map((item, position) => {
          const at = positionOf(item.at);
          if (at === undefined) return null;
          const color = resolveColor(item.color ?? 'neutral', 0);
          const p = svgNumber(at);
          return (
            <g key={`event-${position}`} data-part="event">
              {horizontal ? (
                <line
                  x1={plot.left}
                  x2={right}
                  y1={p}
                  y2={p}
                  {...css.attrs(xyChartStyles.eventLine, chartSvgStyles.stroke(color))}
                />
              ) : (
                <line
                  x1={p}
                  x2={p}
                  y1={plot.top}
                  y2={bottom}
                  {...css.attrs(xyChartStyles.eventLine, chartSvgStyles.stroke(color))}
                />
              )}
              <text
                x={horizontal ? right - 4 : p + 4}
                y={horizontal ? p - 4 : plot.top + 4}
                text-anchor={horizontal ? 'end' : 'start'}
                dominant-baseline={horizontal ? 'auto' : 'hanging'}
                {...css.attrs(
                  chartSvgStyles.labelMuted,
                  chartSvgStyles.halo,
                  chartSvgStyles.noPointer,
                )}
              >
                {item.label}
              </text>
            </g>
          );
        });
      return [...targetLines, ...events];
    }

    /** 一个系列在一行上的值的坐标：堆叠时是它在这一摞里的外端 */
    function valuePosition(item: ResolvedSeries<T>, row: T, position: number): number | undefined {
      const segment = layout.stacks.get(item.key)?.[position];
      if (segment)
        return segment.value === undefined
          ? undefined
          : segment.value < 0
            ? segment.low
            : segment.high;
      return layout.valueOf(item, row);
    }

    /** 标注圈出的值：空心圈，文字在上方 */
    function renderMarks() {
      if (layout.horizontal) return null;
      return (annotations ?? [])
        .filter((item) => item.series !== undefined)
        .map((item, position) => {
          const series = layout.shown.find((entry) => entry.key === item.series);
          const rowIndex = kind.continuousX
            ? layout.rows.findIndex((row) => kind.continuousX!.value(row) === Number(item.at))
            : layout.rows.findIndex((row) => row[index] === item.at);
          const row = layout.rows[rowIndex];
          if (!series || row === undefined) return null;
          const value = valuePosition(series, row, rowIndex);
          if (value === undefined) return null;
          const [x, y] = [
            svgNumber(layout.category(row, rowIndex)),
            svgNumber(layout.valueScale(value)),
          ];
          const color = item.color ? resolveColor(item.color, 0) : series.color;
          // 文字居中在圈的上方；靠近绘图区两端时改成对齐圈的外沿，不伸出去
          const half = estimateTextWidth(item.label, TICK_FONT) / 2;
          const { left, width } = layout.plot;
          const anchor = x + half > left + width ? 'end' : x - half < left ? 'start' : 'middle';
          const textX = anchor === 'end' ? x + 8 : anchor === 'start' ? x - 8 : x;
          return (
            <g key={`mark-${position}`} data-part="mark">
              <circle
                cx={x}
                cy={y}
                r={8}
                {...css.attrs(xyChartStyles.mark, chartSvgStyles.stroke(color))}
              />
              <text
                x={textX}
                y={y - 14}
                text-anchor={anchor}
                {...css.attrs(chartSvgStyles.label, chartSvgStyles.halo, chartSvgStyles.noPointer)}
              >
                {item.label}
              </text>
            </g>
          );
        });
    }

    /** 十字线：悬停的类目一条竖线，线上给各系列画圆点；柱状图铺一层浅底 */
    function renderCrosshair(front: boolean) {
      const current = hover;
      if (!current || kind.pointTooltip) return null;
      const { rows, plot, horizontal, step, category, valueScale } = layout;
      const row = rows[current.index];
      if (row === undefined) return null;
      const center = category(row, current.index);
      if (!front) {
        if (kind.crosshairDots && !kind.band) return null;
        const half = Math.max(step / 2, 1);
        return horizontal ? (
          <rect
            x={plot.left}
            y={center - half}
            width={plot.width}
            height={half * 2}
            {...css.attrs(chartSvgStyles.hoverBand)}
          />
        ) : (
          <rect
            x={center - half}
            y={plot.top}
            width={half * 2}
            height={plot.height}
            {...css.attrs(chartSvgStyles.hoverBand)}
          />
        );
      }
      if (!kind.crosshairDots) return null;
      const dotted = kind.crosshairSeries
        ? layout.shown.filter(kind.crosshairSeries)
        : layout.shown;
      const p = Math.round(center) + 0.5;
      return (
        <g data-part="crosshair">
          {!kind.band && (
            <line
              x1={p}
              x2={p}
              y1={plot.top}
              y2={plot.top + plot.height}
              {...css.attrs(chartSvgStyles.crosshair)}
            />
          )}
          {dotted.map((item) => {
            const value = valuePosition(item, row, current.index);
            if (value === undefined) return null;
            return (
              <circle
                key={item.key}
                cx={svgNumber(center)}
                cy={svgNumber(valueScale(value))}
                r={4.5}
                {...css.attrs(xyChartStyles.crosshairDot, chartSvgStyles.fill(item.color))}
              />
            );
          })}
        </g>
      );
    }

    /** 绘图区的 SVG */
    function renderPlot() {
      const { rows, shown, horizontal, plot, step, domain, category, valueScale, valueOf, stacks } =
        layout;
      const context: XYChartContext<T> = {
        series: shown,
        rows,
        horizontal,
        plot,
        step,
        domain,
        category,
        value: valueScale,
        valueOf,
        stacks,
        point: (c, v) => (horizontal ? [v, c] : [c, v]),
        hovered: hover?.index ?? null,
      };
      const zero = valueScale(0);
      const showZero = domain[0] < 0 && domain[1] > 0;
      return (
        <svg
          width={area.width}
          height={area.height}
          {...css.attrs(chartSvgStyles.svg, xyChartStyles.svg)}
          onPointermove={onPointermove}
          onPointerleave={() => (hover = null)}
          onClick={onClick}
        >
          {renderBands()}
          {chartAxis({
            side: horizontal ? 'bottom' : 'left',
            ticks: layout.valueTicks,
            plot,
            grid,
          })}
          {chartAxis({
            side: horizontal ? 'left' : 'bottom',
            ticks: layout.categoryTicks,
            plot,
            grid: kind.continuousX ? grid : false,
          })}
          {layout.secondaryTicks.length > 0 &&
            chartAxis({ side: 'right', ticks: layout.secondaryTicks, plot })}
          {kind.continuousX?.title && (
            <text
              x={plot.left + plot.width / 2}
              y={area.height - 2}
              text-anchor="middle"
              {...css.attrs(chartSvgStyles.axisTitle)}
            >
              {kind.continuousX.title}
            </text>
          )}
          {showZero &&
            (horizontal ? (
              <line
                x1={Math.round(zero) + 0.5}
                x2={Math.round(zero) + 0.5}
                y1={plot.top}
                y2={plot.top + plot.height}
                {...css.attrs(chartSvgStyles.baseline)}
              />
            ) : (
              <line
                x1={plot.left}
                x2={plot.left + plot.width}
                y1={Math.round(zero) + 0.5}
                y2={Math.round(zero) + 0.5}
                {...css.attrs(chartSvgStyles.baseline)}
              />
            ))}
          {renderCrosshair(false)}
          {kind.render(context)}
          {renderLines()}
          {renderMarks()}
          {renderCrosshair(true)}
        </svg>
      );
    }

    const tip = (): ChartTip | null => {
      const current = hover;
      if (!tooltip || !current) return null;
      const row = layout.rows[current.index];
      return row === undefined
        ? null
        : { x: current.x, y: current.y, content: tooltipContent(row) };
    };

    return () => (
      <ChartFrame
        {...rest}
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
        plotRef={area.ref}
        plot={
          area.ready && shownRows.length > 0
            ? [renderPlot(), <ChartTooltipBox key="tooltip" tip={tip()} width={area.width} />]
            : null
        }
        footer={zoom && !kind.continuousX && data.length > 2 ? zoomBar() : undefined}
      />
    );
  },
);
