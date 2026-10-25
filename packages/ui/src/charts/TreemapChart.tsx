/**
 * 矩形树图：一个总量按层级分块（降本金额按区域 → 供应商、费用按科目），块的面积是数值，一眼看出谁占得多。
 *
 *   <TreemapChart
 *     aria-label="降本金额构成"
 *     data={savings}
 *     groups={['region', 'supplier']}     // 从外到内的层级
 *     value="amount"
 *     unit="万元"
 *   />
 *
 * 数据是扁平的明细，按 groups 的字段逐级分组（Unovis 的 Treemap）；同一个顶层分组同一种颜色（按色板），
 * 里面的块按亮度区分；点图例隐藏一个顶层分组，占比按剩下的算。悬停看路径、数值与占比；读屏的数据表列出每一块。
 */
import { Treemap, type TreemapNode } from '@unovis/ts';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import { chartTooltip, ChartFrame, type ChartFrameParts } from './frame';
import { resolveColor, seriesValue, type NumericKey } from './series';
import { useSingleChart, type SingleChart } from './single';

/** 未声明的属性落到外层 div（role="figure"）上；aria-label 是图表的名称 */
export interface TreemapChartProps<T extends object>
  extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 明细 */
  data: readonly T[];
  /** 分组的字段，从外到内（区域、供应商） */
  groups: readonly (keyof T & string)[];
  /** 面积的数值字段 */
  value: NumericKey<T>;
  /** 数值的格式 */
  valueFormat?: NumericFormat;
  /** 单位：显示在左上方，提示框与数据表的数值后面带上 */
  unit?: string;
  /**
   * 绘图区的高度；数字按 px
   * @default 300
   */
  height?: number | string;
  /** 外层分组也写名字（块够大时） */
  groupLabels?: boolean;
  /** 隐藏的顶层分组：点图例时写回，父级可以写 _hiddenGroups={keys} */
  _hiddenGroups?: string[];
  /** 加载中：绘图区显示骨架 */
  loading?: boolean;
  /** 没有数据时显示的内容 */
  empty?: VNodeChild;
  /** 悬停时的提示框，默认 true */
  tooltip?: boolean;
}

/** TreemapChart 的样式 */
export const treemapChartStyles = css.create({
  skeleton: { display: 'block', width: '100%', height: '100%' },
});

/** 矩形树图 */
export const TreemapChart = _component(
  <T extends object>({
    data,
    groups,
    value,
    valueFormat,
    unit,
    height = 300,
    groupLabels = false,
    _hiddenGroups: hiddenGroups = _bindable<string[]>([]),
    loading = false,
    empty,
    tooltip = true,
    ...rest
  }: TreemapChartProps<T>) => {
    const lang = useLang();
    const format = useFormat();
    const numberOf = (row: T) => {
      const amount = seriesValue(row, value);
      return amount === undefined ? 0 : Math.max(toNumber(amount), 0);
    };
    const topOf = (row: T) => String(row[groups[0]!] ?? '');
    const visible = _derived(data.filter((row) => !hiddenGroups.includes(topOf(row))));
    const total = _derived(visible.reduce((sum, row) => sum + numberOf(row), 0));
    // 顶层分组的颜色：按第一次出现的顺序取色板
    const topColors = _derived(
      new Map(
        [...new Set(data.map(topOf))].map((key, position) => [
          key,
          resolveColor(undefined, position),
        ]),
      ),
    );
    const valueText = (amount: NumericValue) =>
      format.number(amount, unit ? { ...valueFormat, suffix: unit } : valueFormat);
    const shareText = (amount: number) =>
      total === 0
        ? lang.emptyValue
        : format.number(amount / total, { style: 'percent', maximumFractionDigits: 1 });
    /** 一个节点的路径：从顶层到它 */
    const pathOf = (node: TreemapNode<T>) =>
      node
        .ancestors()
        .reverse()
        .slice(1)
        .map((item) => item.data.key ?? '')
        .join(' / ');

    function toggle(key: string) {
      hiddenGroups = hiddenGroups.includes(key)
        ? hiddenGroups.filter((item) => item !== key)
        : [...hiddenGroups, key];
    }

    let plot = _state.raw<HTMLElement | null>(null);
    const chart: SingleChart = useSingleChart<T[]>(() => ({
      element: plot,
      ready: !loading && visible.length > 0,
      tooltip,
      build: (instance) => {
        const treemap = instance('treemap', () => new Treemap<T>({ layers: [] }));
        treemap.setConfig({
          value: numberOf,
          layers: groups.map((key) => (row: T) => String(row[key] ?? '')),
          // 外层分组是浅色的底，叶子是实色：同一组里的块靠底色的缝隙分开
          tileColor: (node) => {
            const base =
              topColors.get(node.topLevelParent?.data.key ?? '') ?? resolveColor(undefined, 0);
            return node.children ? `color-mix(in srgb, ${base} 18%, transparent)` : base;
          },
          tileLabel: (node) => node.data.key ?? '',
          labelInternalNodes: groupLabels,
          enableTileLabelFontSizeVariation: false,
          tilePadding: 3,
          // 分组的名字写在顶边留出的地方
          tilePaddingTop: groupLabels ? 20 : undefined,
          tileBorderRadius: 4,
        });
        return {
          component: treemap,
          data: [...visible],
          triggers: {
            [Treemap.selectors.tile]: (node: TreemapNode<T>) =>
              chart.tooltip(
                chartTooltip(pathOf(node), [
                  {
                    label: lang.chartValue,
                    color: topColors.get(node.topLevelParent?.data.key ?? '') ?? 'transparent',
                    value: valueText(node.value),
                  },
                  { label: lang.chartShare, color: 'transparent', value: shareText(node.value) },
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
        legend={[...topColors].map(([key, color]) => ({ key, label: key, color }))}
        hiddenKeys={hiddenGroups}
        onLegendToggle={toggle}
        loading={loading}
        skeleton={<Skeleton sx={treemapChartStyles.skeleton} />}
        isEmpty={data.length === 0}
        empty={empty}
        table={{
          columns: [
            lang.chartCategory,
            unit ? `${lang.chartValue}（${unit}）` : lang.chartValue,
            lang.chartShare,
          ],
          rows: visible.map((row) => ({
            header: groups.map((key) => String(row[key] ?? '')).join(' / '),
            cells: [valueText(seriesValue(row, value) ?? 0), shareText(numberOf(row))],
          })),
        }}
        plotRef={(element) => (plot = element)}
      />
    );
  },
);
