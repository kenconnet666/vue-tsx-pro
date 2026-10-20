/**
 * 直角坐标图表（柱状图、折线图）的公共部分：图例、单位、绘图区、提示框、空与加载状态、给读屏的数据表。
 * 绘图交给 Unovis 的 XYContainer：组件实例只建一次，数据与配置变化时 update，卸载时 destroy。
 * 各种图只决定画什么（kind.components），坐标轴、十字线、提示框、配色都在这里统一。
 *
 * 外观全走主题：Unovis 的样式由 --vis-* 变量控制，这里把它们指到 tokens 上，系列颜色是 CSS 变量，
 * 切换主题、改品牌色都不用重画。动画时长取主题的 durations.lg（减少动态效果时为 0）。
 */
import { Axis, Crosshair, Tooltip, XYContainer, type XYComponentCore } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { render, useId, type VNodeChild } from 'vue';
import { visuallyHiddenStyles } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import {
  borderWidths,
  colors,
  durations,
  fonts,
  fontSizes,
  radii,
  shadows,
  space,
} from '../config/theme/tokens.stylex';
import { Empty } from '../feedback/Empty';
import { Skeleton } from '../feedback/Skeleton';
import { mergeAttrs, type PartProps } from '../utils/props';
import { themeTransition } from '../utils/motion/animation';
import { focusRingStyles } from '../utils/style/styles';
import { resolveSeries, seriesValue, type ChartSeries, type ResolvedSeries } from './series';

/** 柱状图、折线图共有的属性；未声明的属性落到外层 div（role="figure"）上，aria-label 是图表的名称 */
export interface XYChartProps<T extends object> extends PartProps<'div', 'role' | 'aria-busy'> {
  /** 数据：每一行是类目轴上的一项（一个月、一个项目） */
  data: readonly T[];
  /** 类目字段：类目轴的刻度、提示框的标题、数据表的第一列 */
  index: keyof T & string;
  /** 系列：每个系列画成一组柱子或一条线 */
  series: readonly ChartSeries<T>[];
  /** 类目的显示文字；不写时把字段的值转成字符串 */
  indexFormat?: (value: T[keyof T & string], row: T) => string;
  /** 数值的格式（Intl.NumberFormatOptions）：数值轴、提示框、数据表共用，按当前语言格式化 */
  valueFormat?: Intl.NumberFormatOptions;
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
  /** 图例的部件属性 */
  propsLegend?: PartProps<'div', 'role'>;
  /** 绘图区（Unovis 画在这里）的部件属性 */
  propsPlot?: PartProps<'div', 'aria-hidden'>;
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
}

/** 一种图：画哪些组件，以及与坐标轴、十字线有关的差别 */
export interface XYChartKind<T extends object> {
  /** 配置并返回要画的 Unovis 组件（每次数据或属性变化都会调用） */
  components: (context: XYChartContext<T>) => XYComponentCore<T>[];
  /** 横向：类目在纵轴、数值在横轴 */
  horizontal?: boolean;
  /** 十字线上给每个系列画圆点（折线图）；柱状图不画 */
  crosshairDots?: boolean;
  /** 加载中的骨架：bars 一排高低不一的柱（柱状图），block 一整块（默认） */
  skeleton?: 'bars' | 'block';
  /** 绘图区四周的留白（px）：折线两端不贴着边缘 */
  padding?: { left?: number; right?: number; top?: number; bottom?: number };
}

/** 骨架柱的高度（百分比）：高低错落，看起来像一组数据 */
const SKELETON_BARS = [55, 80, 40, 70, 90, 50, 65];

/** XYChart 的样式：root、header、unit、legend、legendItem、swatch、plot、center、skeleton、tooltip… */
export const xyChartStyles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    // 在居中、弹性布局的容器里也占满一行：绘图区按容器宽度自适应
    width: '100%',
    minWidth: 0,
    fontSize: '_sm',
    // Unovis 的外观变量：坐标轴、网格、十字线、提示框都指到主题 tokens
    '--vis-font-family': fonts.sans,
    '--vis-axis-tick-label-font-size': fontSizes.xs,
    '--vis-axis-tick-label-color': colors.textMuted,
    '--vis-axis-label-color': colors.textMuted,
    '--vis-axis-grid-color': colors.borderMuted,
    '--vis-axis-domain-color': colors.border,
    '--vis-axis-tick-color': colors.border,
    '--vis-crosshair-line-stroke-color': colors.borderStrong,
    '--vis-crosshair-circle-stroke-color': colors.surface,
    '--vis-tooltip-background-color': colors.surfaceRaised,
    '--vis-tooltip-border-color': colors.borderMuted,
    '--vis-tooltip-text-color': colors.text,
    '--vis-tooltip-border-radius': radii.md,
    '--vis-tooltip-box-shadow': shadows.md,
    '--vis-tooltip-padding': `${space.sm} ${space.md}`,
    '--vis-tooltip-backdrop-filter': 'none',
    '--vis-tooltip-transition-duration': durations.sm,
    '--vis-grouped-bar-hover-stroke-width': '0',
  },
  // 柱状图的十字线只用来定位提示框，不画竖线
  hideCrosshairLine: { '--vis-crosshair-line-stroke-opacity': '0' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '_md',
    minHeight: '1.5em',
  },
  unit: { color: '_textMuted', fontSize: '_xs' },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: '_xs _md',
    marginInlineStart: 'auto',
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: { default: '_textMuted', ':hover': '_text' },
    fontFamily: 'inherit',
    fontSize: '_xs',
    cursor: 'pointer',
    borderRadius: '_sm',
  },
  // 隐藏的系列：划线、色块变空心；不降低不透明度，文字仍要满足对比度
  legendItemHidden: { textDecorationLine: 'line-through' },
  swatch: {
    width: '0.625em',
    height: '0.625em',
    borderRadius: '_sm',
    flexShrink: 0,
  },
  swatchColor: (color: string) => ({ backgroundColor: color }),
  swatchHidden: (color: string) => ({
    backgroundColor: 'transparent',
    boxShadow: `inset 0 0 0 ${borderWidths.md} ${color}`,
  }),
  plot: { position: 'relative', minWidth: 0 },
  plotHeight: (height: string) => ({ height }),
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
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
  tooltip: { display: 'flex', flexDirection: 'column', gap: '_xs', fontSize: '_xs' },
  tooltipTitle: { fontWeight: '_semibold' },
  tooltipRow: { display: 'flex', alignItems: 'center', gap: '_sm' },
  tooltipLabel: { color: '_textMuted', flexGrow: 1 },
  tooltipValue: {
    fontVariantNumeric: 'tabular-nums',
    fontWeight: '_medium',
    marginInlineStart: '_lg',
  },
});

/** 提示框的一行 */
interface TooltipItem {
  label: string;
  color: string;
  value: string;
}

/** 提示框的内容：标题（类目）+ 每个系列一行 */
function tooltipContent(title: string, items: TooltipItem[]) {
  return (
    <div {...stylex.attrs(xyChartStyles.tooltip)}>
      <div {...stylex.attrs(xyChartStyles.tooltipTitle)}>{title}</div>
      {items.map((item) => (
        <div key={item.label} {...stylex.attrs(xyChartStyles.tooltipRow)}>
          <span {...stylex.attrs(xyChartStyles.swatch, xyChartStyles.swatchColor(item.color))} />
          <span {...stylex.attrs(xyChartStyles.tooltipLabel)}>{item.label}</span>
          <span {...stylex.attrs(xyChartStyles.tooltipValue)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/** 主题的 lg 时长（毫秒），减少动态效果时为 0；读不到（元素不在主题范围内）时不要动画 */
function themeDuration(element: Element) {
  try {
    return themeTransition(element, { duration: 'lg' }).duration ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Unovis 每个 XYContainer 都插一个 id 固定为 saturate 的滤镜（悬停高亮用），一页多张图时 id 重复；
 * 改成每张图自己的 id，并让引用它的 CSS 变量指过去
 */
function uniqueHighlightFilter(element: HTMLElement, id: string) {
  const filter = element.querySelector<SVGFilterElement>('filter#saturate');
  if (!filter) return;
  filter.id = id;
  element.querySelector('svg')?.style.setProperty('--highlight-filter-id', `url(#${id})`);
}

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

/** 柱状图、折线图的公共实现（组件库内部用，见 BarChart、LineChart） */
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
    propsLegend,
    propsPlot,
    kind,
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
    const valueText = (value: number | undefined) =>
      value === undefined ? '—' : `${format.number(value, valueFormat)}${unit ? ` ${unit}` : ''}`;

    function toggle(key: string) {
      hiddenSeries = hiddenSeries.includes(key)
        ? hiddenSeries.filter((item) => item !== key)
        : [...hiddenSeries, key];
    }

    // Unovis 的实例：只建一次，之后 setConfig + update
    const instances = new Map<string, unknown>();
    const instance = <C,>(key: string, create: () => C): C => {
      if (!instances.has(key)) instances.set(key, create());
      return instances.get(key) as C;
    };
    const xAxis = new Axis<T>({ type: 'x' });
    const yAxis = new Axis<T>({ type: 'y' });
    const crosshair = new Crosshair<T>();
    const tooltipBox = new Tooltip();
    let tooltipElement: HTMLElement | undefined;

    /** 十字线的提示框：内容用 Vue 渲染进同一个元素，交给 Unovis 定位 */
    function renderTooltip(row: T) {
      tooltipElement ??= document.createElement('div');
      render(
        tooltipContent(
          categoryText(row),
          visible.map((item) => ({
            label: item.label,
            color: item.color,
            value: valueText(seriesValue(row, item.key)),
          })),
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
      const values = rows.flatMap((row) => shown.map((item) => seriesValue(row, item.key) ?? 0));
      const domain: [number | undefined, number | undefined] = [
        valueDomain?.[0] ?? Math.min(0, ...values),
        valueDomain?.[1],
      ];
      const context: XYChartContext<T> = {
        series: shown,
        x: (_row, position) => position,
        y: (item) => (row) => seriesValue(row, item.key),
        instance,
      };
      const components = kind.components(context);
      const [categoryAxis, valueAxis] = kind.horizontal ? [yAxis, xAxis] : [xAxis, yAxis];
      categoryAxis.setConfig({
        type: kind.horizontal ? 'y' : 'x',
        tickValues: rows.map((_row, position) => position),
        tickFormat: (tick) => categoryText(rows[Number(tick)]),
        gridLine: false,
        tickLine: false,
        domainLine: false,
        tickTextHideOverlapping: true,
        tickPadding: 8,
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
        template: (row: T) => renderTooltip(row),
        color: (_row: T, position: number) => shown[position]?.color ?? 'transparent',
        getCircles: kind.crosshairDots ? undefined : () => [],
        hideWhenFarFromPointer: false,
      });

      const element = plot;
      if (!element || loading || rows.length === 0) return;
      const config = {
        components,
        xAxis,
        yAxis,
        crosshair: tooltip ? crosshair : undefined,
        tooltip: tooltip ? tooltipBox : undefined,
        [kind.horizontal ? 'xDomain' : 'yDomain']: domain,
        padding: kind.padding ?? {},
        ariaLabel: null,
        duration: themeDuration(element),
      };
      if (container && containerElement !== element) {
        container.destroy();
        container = undefined;
      }
      if (container) container.update(config, undefined, rows);
      else {
        container = new XYContainer<T>(element, config, rows);
        containerElement = element;
        uniqueHighlightFilter(element, `${id}-highlight`);
      }
    });

    const showLegend = () => legend ?? resolved.length > 1;

    return () => {
      const plotHeight = typeof height === 'number' ? `${height}px` : height;
      const body = loading ? (
        chartSkeleton(kind)
      ) : data.length === 0 ? (
        <div {...stylex.attrs(xyChartStyles.center)}>
          {empty ?? <Empty size="sm" title={lang.chartEmpty} />}
        </div>
      ) : null;
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [xyChartStyles.root, !kind.crosshairDots && xyChartStyles.hideCrosshairLine] },
            rest,
            { role: 'figure', 'aria-busy': loading || undefined },
          )}
        >
          {(unit || showLegend()) && (
            <div {...stylex.attrs(xyChartStyles.header)}>
              {unit && <span {...stylex.attrs(xyChartStyles.unit)}>{unit}</span>}
              {showLegend() && (
                <div
                  {...mergeAttrs<'div'>({ sx: xyChartStyles.legend }, propsLegend, {
                    role: 'group',
                  })}
                >
                  {resolved.map((item) => {
                    const hidden = hiddenSeries.includes(item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        aria-pressed={!hidden}
                        onClick={() => toggle(item.key)}
                        {...stylex.attrs(
                          xyChartStyles.legendItem,
                          focusRingStyles.visible,
                          hidden && xyChartStyles.legendItemHidden,
                        )}
                      >
                        <span
                          {...stylex.attrs(
                            xyChartStyles.swatch,
                            hidden
                              ? xyChartStyles.swatchHidden(item.color)
                              : xyChartStyles.swatchColor(item.color),
                          )}
                        />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* key 不同：两种状态不复用同一个 div，否则 Unovis 画进去的 svg 会留在骨架、空状态里 */}
          {body ? (
            <div
              key="state"
              {...stylex.attrs(xyChartStyles.plot, xyChartStyles.plotHeight(plotHeight))}
            >
              {body}
            </div>
          ) : (
            <div
              key="plot"
              {...mergeAttrs<'div'>(
                { sx: [xyChartStyles.plot, xyChartStyles.plotHeight(plotHeight)] },
                propsPlot,
                {
                  'aria-hidden': true,
                  ref: _toRef(plot),
                },
              )}
            />
          )}
          {data.length > 0 && (
            <table {...stylex.attrs(visuallyHiddenStyles.hidden)}>
              <thead>
                <tr>
                  <th scope="col">{lang.chartCategory}</th>
                  {resolved.map((item) => (
                    <th key={item.key} scope="col">
                      {unit ? `${item.label}（${unit}）` : item.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, position) => (
                  <tr key={position}>
                    <th scope="row">{categoryText(row)}</th>
                    {resolved.map((item) => {
                      const value = seriesValue(row, item.key);
                      return (
                        <td key={item.key}>
                          {value === undefined ? '—' : format.number(value, valueFormat)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    };
  },
);
