/**
 * 矩形树图：一个总量按层级分块（销售额按区域 → 供应商、费用按科目），块的面积是数值，一眼看出谁占得多。
 *
 *   <TreemapChart
 *     aria-label="采购额构成"
 *     data={savings}
 *     groups={['region', 'supplier']}     // 从外到内的层级
 *     value="amount"
 *     unit="万元"
 *   />
 *
 * 数据是扁平的明细，按 groups 的字段逐级分组（布局见 groupTree、treemapLayout，squarified 算法）；
 * 同一个顶层分组同一种颜色（按色板），里面的块按深浅区分；点图例隐藏一个顶层分组，占比按剩下的算。
 * 块够大时写名字与数值；悬停看路径、数值与占比；读屏的数据表列出每一块。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import { colors, t } from '../config/theme/tokens';
import { svgNumber } from '../utils/data/number';
import { chartTooltip, ChartFrame, type ChartFrameParts } from './frame';
import { groupTree, treemapLayout, type TreemapNode } from './layout/treemap';
import { ChartTooltipBox, chartSvgStyles, pointerIn, usePlotArea, type ChartTip } from './plot';
import { resolveColor, seriesValue, type NumericKey } from './series';
import { estimateTextWidth, truncateText } from './text-size';

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
  group: { stroke: 'none' },
  tile: {
    stroke: '_surface',
    strokeWidth: 0,
    transition: `stroke-width ${t.durations.sm} ${t.easings.standard}`,
  },
  // 悬停的块描一圈正文色
  tileActive: { stroke: '_text', strokeWidth: 1.5 },
  name: { fill: '_text', fontSize: '_xs', fontWeight: '_medium' },
  value: { fill: '_text', fontSize: '_xs', opacity: 0.75 },
  groupName: { fill: '_textMuted', fontSize: '_xs', fontWeight: '_semibold' },
});

/** 块与块之间、分组四周的空（px）；写分组名时分组顶边留的空 */
const PADDING = 3;
const GROUP_TITLE = 20;
/** 块里的文字离边的距离 */
const INSET = 6;

/** 悬停的块：叶子的位置、提示框的位置 */
interface TreemapHover {
  index: number;
  x: number;
  y: number;
}

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
    const area = usePlotArea();
    let hovered = _state.raw<TreemapHover | null>(null);
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
    const pathOf = (node: TreemapNode<T>) => {
      const keys: string[] = [];
      for (let item: TreemapNode<T> | undefined = node; item?.parent; item = item.parent)
        keys.unshift(item.key);
      return keys.join(' / ');
    };
    /** 顶层分组 */
    const topOfNode = (node: TreemapNode<T>) => {
      let item = node;
      while (item.parent?.parent) item = item.parent;
      return item;
    };

    function toggle(key: string) {
      hiddenGroups = hiddenGroups.includes(key)
        ? hiddenGroups.filter((item) => item !== key)
        : [...hiddenGroups, key];
    }

    /** 布局：分组与叶子（叶子按出现的顺序编号，悬停按它找） */
    const layout = _derived.by(() => {
      const root = groupTree(
        visible,
        groups.map((key) => (row: T) => String(row[key] ?? '')),
        numberOf,
      );
      treemapLayout(root, {
        width: area.width,
        height: area.height,
        padding: PADDING,
        paddingTop: groupLabels ? GROUP_TITLE : PADDING,
      });
      const branches: TreemapNode<T>[] = [];
      const leaves: TreemapNode<T>[] = [];
      const walk = (node: TreemapNode<T>) => {
        for (const child of node.children ?? []) {
          (child.children ? branches : leaves).push(child);
          walk(child);
        }
      };
      walk(root);
      return { branches, leaves };
    });

    /** 叶子的颜色：顶层分组的颜色，同一组里越靠后（数值越小）越浅 */
    const leafColor = (node: TreemapNode<T>) => {
      const base = topColors.get(topOfNode(node).key) ?? resolveColor(undefined, 0);
      const siblings = node.parent?.children ?? [node];
      const rank = siblings.indexOf(node) / Math.max(siblings.length, 1);
      return `color-mix(in srgb, ${base} ${Math.round(62 - rank * 30)}%, ${colors.surface})`;
    };

    function onPointermove(event: PointerEvent) {
      const target = (event.target as Element).closest?.('[data-leaf]');
      if (!target) {
        hovered = null;
        return;
      }
      const { x, y } = pointerIn(event, event.currentTarget as Element);
      hovered = { index: Number(target.getAttribute('data-leaf')), x, y };
    }

    function renderPlot() {
      const { branches, leaves } = layout;
      return (
        <svg
          width={area.width}
          height={area.height}
          {...css.attrs(chartSvgStyles.svg)}
          onPointermove={onPointermove}
          onPointerleave={() => (hovered = null)}
        >
          <g {...css.attrs(chartSvgStyles.fadeIn)}>
            {branches.map((node) => {
              const base = topColors.get(topOfNode(node).key) ?? resolveColor(undefined, 0);
              const width = node.x1 - node.x0;
              return (
                <g key={`group:${pathOf(node)}`}>
                  <rect
                    x={svgNumber(node.x0)}
                    y={svgNumber(node.y0)}
                    width={svgNumber(width)}
                    height={svgNumber(node.y1 - node.y0)}
                    rx={4}
                    {...css.attrs(
                      treemapChartStyles.group,
                      chartSvgStyles.fill(`color-mix(in srgb, ${base} 14%, transparent)`),
                    )}
                  />
                  {groupLabels && width > 40 && (
                    <text
                      x={svgNumber(node.x0 + INSET)}
                      y={svgNumber(node.y0 + GROUP_TITLE / 2 + 1)}
                      dominant-baseline="central"
                      {...css.attrs(treemapChartStyles.groupName, chartSvgStyles.noPointer)}
                    >
                      {truncateText(node.key, width - INSET * 2)}
                    </text>
                  )}
                </g>
              );
            })}
            {leaves.map((node, index) => {
              const width = node.x1 - node.x0;
              const height = node.y1 - node.y0;
              const name = truncateText(node.key, width - INSET * 2);
              const showName =
                height >= 22 && width >= Math.min(estimateTextWidth(node.key), 36) + INSET * 2;
              const amount = valueText(node.value);
              const showValue =
                showName && height >= 40 && estimateTextWidth(amount) <= width - INSET * 2;
              return (
                <g key={`leaf:${pathOf(node)}:${index}`}>
                  <rect
                    data-part="tile"
                    data-leaf={index}
                    x={svgNumber(node.x0)}
                    y={svgNumber(node.y0)}
                    width={svgNumber(width)}
                    height={svgNumber(height)}
                    rx={3}
                    {...css.attrs(
                      treemapChartStyles.tile,
                      chartSvgStyles.fill(leafColor(node)),
                      hovered?.index === index && treemapChartStyles.tileActive,
                    )}
                  />
                  {showName && (
                    <text
                      x={svgNumber(node.x0 + INSET)}
                      y={svgNumber(node.y0 + INSET + 7)}
                      dominant-baseline="central"
                      {...css.attrs(treemapChartStyles.name, chartSvgStyles.noPointer)}
                    >
                      {name}
                    </text>
                  )}
                  {showValue && (
                    <text
                      x={svgNumber(node.x0 + INSET)}
                      y={svgNumber(node.y0 + INSET + 24)}
                      dominant-baseline="central"
                      {...css.attrs(treemapChartStyles.value, chartSvgStyles.noPointer)}
                    >
                      {amount}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      );
    }

    const tip = (): ChartTip | null => {
      const current = hovered;
      const node = current && layout.leaves[current.index];
      if (!tooltip || !current || !node) return null;
      return {
        x: current.x,
        y: current.y,
        content: chartTooltip(pathOf(node), [
          {
            label: lang.chartValue,
            color: topColors.get(topOfNode(node).key) ?? 'transparent',
            value: valueText(node.value),
          },
          { label: lang.chartShare, color: 'transparent', value: shareText(node.value) },
        ]),
      };
    };

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
        plotRef={area.ref}
        plot={
          area.ready && visible.length > 0
            ? [renderPlot(), <ChartTooltipBox key="tooltip" tip={tip()} width={area.width} />]
            : null
        }
      />
    );
  },
);
