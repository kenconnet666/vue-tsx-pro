/**
 * 各种图表共用的外层结构（XYChart、DonutChart、SankeyChart、ChordChart、FunnelChart、GraphChart）：外层 figure、单位与图例、绘图区（加载中的骨架、空状态、Unovis 画布）、
 * 给读屏的数据表；还有提示框的内容、Unovis 实例表与主题变量。
 *
 *   <ChartFrame unit="万元" legend={items} hiddenKeys={hidden} onLegendToggle={toggle} loading={loading}
 *     isEmpty={rows.length === 0} skeleton={…} table={{ columns, rows }} plotRef={(el) => (plot = el)} />
 *
 * 外观全走主题：Unovis 的样式由 --vis-* 变量控制，这里把它们指到 tokens 上；系列颜色是 CSS 变量，
 * 切换主题、改品牌色都不用重画。绘图区对读屏隐藏，数据由同样内容的表格读出。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Download, FileSpreadsheet, ImageDown } from '@lucide/icons';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { IconButton } from '../base/IconButton';
import { Menu, MenuItem } from '../overlay/Menu';
import { exportChartData, exportChartImage } from './export';
import { visuallyHiddenStyles } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import {
  borderWidths,
  colors,
  durations,
  fonts,
  fontSizes,
  fontWeights,
  radii,
  shadows,
  space,
} from '../config/theme/tokens.stylex';
import { Empty } from '../feedback/Empty';
import type { NumericValue } from '../utils/data/numeric';
import { themeTransition } from '../utils/motion/animation';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { t } from '../config/theme/tokens';

/** 图例里的一项 */
export interface ChartLegendItem {
  /** 系列（或扇区）的 key */
  key: string;
  /** 显示的名字 */
  label: string;
  /** CSS 颜色 */
  color: string;
}

/** 给读屏的数据表：列名与每一行（行标题加各列的文字） */
export interface ChartTable {
  /** 列名：第一列是行标题的列 */
  columns: readonly string[];
  /** 每一行：行标题加其余各列的文字 */
  rows: readonly { header: string; cells: readonly string[] }[];
}

/** 各种图表共有的选项与部件属性 */
export interface ChartFrameParts {
  /** 右上角的导出菜单：绘图区存成 PNG 图片、数据表存成 CSV */
  exportable?: boolean;
  /** 导出的文件名（不含扩展名）；不写时用图表的名称（aria-label） */
  exportName?: string;
  /** 图表上方一行（单位与图例）的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 单位的部件属性 */
  propsUnit?: PartProps<'span'>;
  /** 图例的部件属性 */
  propsLegend?: PartProps<'div', 'role'>;
  /** 图例每一项（按钮）的部件属性 */
  propsLegendItem?: Omit<Partial<ButtonBaseProps>, 'aria-pressed' | 'onClick'>;
  /** 绘图区（Unovis 画在这里）的部件属性 */
  propsPlot?: PartProps<'div', 'aria-hidden'>;
  /** 给读屏的数据表的部件属性 */
  propsTable?: PartProps<'table'>;
}

/** 图表共用的样式：root（--vis-* 主题变量）、header、unit、legend、swatch、plot、tooltip… */
export const chartStyles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    // 在居中、弹性布局的容器里也占满一行：绘图区按容器宽度自适应
    width: '100%',
    minWidth: 0,
    fontSize: '_sm',
    // Unovis 的外观变量：坐标轴、网格、十字线、提示框、标签都指到主题 tokens
    '--vis-font-family': fonts.sans,
    '--vis-axis-tick-label-font-size': fontSizes.xs,
    '--vis-axis-tick-label-color': colors.textMuted,
    '--vis-axis-label-color': colors.textMuted,
    '--vis-axis-label-font-size': fontSizes.xs,
    '--vis-axis-label-weight': fontWeights.normal,
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
    // 环形图：底色、扇区之间的缝、中间的标签
    '--vis-donut-background-color': colors.fill,
    '--vis-donut-segment-stroke-width': borderWidths.md,
    '--vis-donut-central-label-text-color': colors.text,
    '--vis-donut-central-label-font-size': fontSizes.xl,
    '--vis-donut-central-sub-label-text-color': colors.textMuted,
    '--vis-donut-central-sub-label-font-size': fontSizes.xs,
    // 目标线：虚线，标签是小号的次要文字（颜色由各条线自己给）
    '--vis-plotline-label-font-size': fontSizes.xs,
    '--vis-plotline-label-color': colors.textMuted,
  },
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
    gap: `${t.space.xs} ${t.space.md}`,
    marginInlineStart: 'auto',
  },
  // 图例项：ButtonBase 给出焦点环与按下的反馈，这里只定文字
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
    color: { default: '_textMuted', ':hover': '_text' },
    fontSize: '_xs',
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
  // contain: inline-size：画好的 SVG 写死了宽度，不能让它反过来撑住按内容定宽的外层（表格式的滚动区、
  // 起始对齐的弹性布局）；不然容器变窄时图表还是原来那么宽，Unovis 量不到变化也就不重画
  plot: { position: 'relative', minWidth: 0, contain: 'inline-size' },
  // 点了能下钻：手形指针
  plotClickable: { cursor: 'pointer' },
  plotHeight: (height: string) => ({ height }),
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
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
export interface ChartTooltipItem {
  /** 系列或数值的名字 */
  label: string;
  /** 色块的 CSS 颜色；transparent 时不画色块 */
  color: string;
  /** 格式化好的数值 */
  value: string;
}

/** 提示框的内容：标题（类目、扇区名）+ 每个系列一行；Unovis 定位，Vue 渲染 */
export function chartTooltip(title: string, items: readonly ChartTooltipItem[]) {
  return (
    <div {...stylex.attrs(chartStyles.tooltip)}>
      {title && <div {...stylex.attrs(chartStyles.tooltipTitle)}>{title}</div>}
      {items.map((item) => (
        <div key={item.label} {...stylex.attrs(chartStyles.tooltipRow)}>
          <span {...stylex.attrs(chartStyles.swatch, chartStyles.swatchColor(item.color))} />
          <span {...stylex.attrs(chartStyles.tooltipLabel)}>{item.label}</span>
          <span {...stylex.attrs(chartStyles.tooltipValue)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * 图表里数值的文字（提示框、读屏数据表、扇区标签）：按 valueFormat 格式化、带上单位；
 * 没有值时是语言包的 emptyValue。setup 里调用，返回的函数在渲染里用
 */
export function useChartValueText(read: () => { valueFormat?: NumericFormat; unit?: string }) {
  const lang = useLang();
  const format = useFormat();
  return (value: NumericValue | undefined) => {
    if (value === undefined) return lang.emptyValue;
    const { valueFormat, unit } = read();
    return format.number(value, unit ? { ...valueFormat, suffix: unit } : valueFormat);
  };
}

/** 主题的 lg 时长（毫秒），减少动态效果时为 0；读不到（元素不在主题范围内）时不要动画 */
export function chartDuration(element: Element): number {
  try {
    return themeTransition(element, { duration: 'lg' }).duration ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Unovis 每个容器都插一个 id 固定为 saturate 的滤镜（悬停高亮用），一页多张图时 id 重复；
 * 改成每张图自己的 id，并让引用它的 CSS 变量指过去
 */
export function uniqueHighlightFilter(element: HTMLElement, id: string): void {
  const filter = element.querySelector<SVGFilterElement>('filter#saturate');
  if (!filter) return;
  filter.id = id;
  element.querySelector('svg')?.style.setProperty('--highlight-filter-id', `url(#${id})`);
}

/**
 * Unovis 实例表：组件、坐标轴、十字线只建一次，之后 setConfig + update（保留实例才有过渡动画）。
 * 容器 destroy 时会连带销毁这些实例：重建容器前 reset，下次取用时重新创建
 */
export function createChartInstances() {
  let instances = new Map<string, unknown>();
  return {
    /** 取一个实例：第一次调用时创建 */
    get: <C,>(key: string, create: () => C): C => {
      if (!instances.has(key)) instances.set(key, create());
      return instances.get(key) as C;
    },
    /** 容器销毁了：清空，之后重新创建 */
    reset() {
      instances = new Map();
    },
  };
}

/** ChartFrame 的属性：未声明的属性落到外层 div（role="figure"）上 */
export interface ChartFrameProps extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 单位：显示在左上方 */
  unit?: string;
  /** 第二数值轴的单位：显示在右上方（组合图） */
  unitEnd?: string;
  /** 绘图区的高度 */
  height: number | string;
  /** 图例的各项；空数组时不显示图例 */
  legend: readonly ChartLegendItem[];
  /** 图例里隐藏着的项 */
  hiddenKeys: readonly string[];
  /** 点了图例的一项 */
  onLegendToggle: (key: string) => void;
  /** 加载中：绘图区显示 skeleton，外层带 aria-busy */
  loading: boolean;
  /** 加载中显示的骨架 */
  skeleton: VNodeChild;
  /** 没有数据：绘图区显示空状态，没有数据表 */
  isEmpty: boolean;
  /** 空状态的内容，默认是“暂无数据” */
  empty?: VNodeChild;
  /** 给读屏的数据表 */
  table: ChartTable;
  /** 取得绘图区元素（Unovis 画在这里）；加载、空状态之后重新出现时是新的元素 */
  plotRef?: (element: HTMLElement | null) => void;
  /** 绘图区里直接渲染的内容（不用 Unovis 的图，如漏斗图）；同样对读屏隐藏 */
  plot?: VNodeChild;
  /** 绘图区下面的内容（缩放的滑块） */
  footer?: VNodeChild;
  /** 点了绘图区（下钻）：写了它时指针是手形 */
  onPlotClick?: () => void;
  /** 图里的项能点（手形指针），点击由图自己处理（环形图的扇区、网络图的节点） */
  clickable?: boolean;
}

/** 图表的外层结构 */
export const ChartFrame = _component(
  ({
    unit,
    unitEnd,
    height,
    legend,
    hiddenKeys,
    onLegendToggle,
    loading,
    skeleton,
    isEmpty,
    empty,
    table,
    plotRef,
    footer,
    plot,
    onPlotClick,
    clickable = false,
    propsHeader,
    propsUnit,
    propsLegend,
    propsLegendItem,
    propsPlot,
    propsTable,
    exportable = false,
    exportName,
    ...rest
  }: ChartFrameProps) => {
    const lang = useLang();
    const format = useFormat();
    let plotElement: HTMLElement | null = null;
    const fileName = () => exportName ?? rest['aria-label'] ?? lang.chartExportName;
    /** 导出菜单：图片要绘图区里有 SVG（漏斗图这类直接用 HTML 画的没有） */
    const exportMenu = () => (
      <Menu
        trigger={(props) => (
          <IconButton
            {...props}
            icon={Download}
            variant="ghost"
            tone="neutral"
            size="sm"
            aria-label={lang.chartExport}
          />
        )}
      >
        <MenuItem
          icon={ImageDown}
          onAction={() => {
            const svg = plotElement?.querySelector('svg');
            if (svg) void exportChartImage(svg, fileName());
          }}
        >
          {lang.chartExportImage}
        </MenuItem>
        <MenuItem
          icon={FileSpreadsheet}
          onAction={() => exportChartData(table, format, fileName())}
        >
          {lang.chartExportData}
        </MenuItem>
      </Menu>
    );
    return () => {
      const plotHeight = typeof height === 'number' ? `${height}px` : height;
      const body = loading ? (
        skeleton
      ) : isEmpty ? (
        <div {...stylex.attrs(chartStyles.center)}>
          {empty ?? <Empty size="sm" title={lang.chartEmpty} />}
        </div>
      ) : null;
      return (
        <div
          {...mergeAttrs<'div'>({ sx: chartStyles.root }, rest, {
            role: 'figure',
            'aria-busy': loading || undefined,
          })}
        >
          {(unit || unitEnd || legend.length > 0 || exportable) && (
            <div {...mergeAttrs<'div'>({ sx: chartStyles.header }, propsHeader)}>
              {unit && (
                <span {...mergeAttrs<'span'>({ sx: chartStyles.unit }, propsUnit)}>{unit}</span>
              )}
              {legend.length > 0 && (
                <div
                  {...mergeAttrs<'div'>({ sx: chartStyles.legend }, propsLegend, { role: 'group' })}
                >
                  {legend.map((item) => {
                    const off = hiddenKeys.includes(item.key);
                    return (
                      <ButtonBase
                        key={item.key}
                        {...mergePartProps<ButtonBaseProps>(
                          {
                            sx: [chartStyles.legendItem, off && chartStyles.legendItemHidden],
                            ripple: false,
                          },
                          propsLegendItem,
                          { 'aria-pressed': !off, onClick: () => onLegendToggle(item.key) },
                        )}
                      >
                        <span
                          {...stylex.attrs(
                            chartStyles.swatch,
                            off
                              ? chartStyles.swatchHidden(item.color)
                              : chartStyles.swatchColor(item.color),
                          )}
                        />
                        {item.label}
                      </ButtonBase>
                    );
                  })}
                </div>
              )}
              {unitEnd && (
                <span {...mergeAttrs<'span'>({ sx: chartStyles.unit }, propsUnit)}>{unitEnd}</span>
              )}
              {exportable && !isEmpty && !loading && exportMenu()}
            </div>
          )}
          {/* key 不同：两种状态不复用同一个 div，否则 Unovis 画进去的 svg 会留在骨架、空状态里 */}
          {body ? (
            <div
              key="state"
              {...stylex.attrs(chartStyles.plot, chartStyles.plotHeight(plotHeight))}
            >
              {body}
            </div>
          ) : (
            <div
              key="plot"
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    chartStyles.plot,
                    chartStyles.plotHeight(plotHeight),
                    (clickable || onPlotClick) && chartStyles.plotClickable,
                  ],
                },
                propsPlot,
                {
                  'aria-hidden': true,
                  ref: (element: unknown) => {
                    plotElement = element instanceof HTMLElement ? element : null;
                    plotRef?.(plotElement);
                  },
                  onClick: onPlotClick,
                },
              )}
            >
              {plot}
            </div>
          )}
          {!body && footer}
          {!isEmpty && (
            <table {...mergeAttrs<'table'>({ sx: visuallyHiddenStyles.hidden }, propsTable)}>
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, position) => (
                  <tr key={position}>
                    <th scope="row">{row.header}</th>
                    {row.cells.map((cell, column) => (
                      <td key={column}>{cell}</td>
                    ))}
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
