/**
 * 二维布局（grid）。
 *
 *   <Grid columns={3} gap="md">…</Grid>                 固定列数，等宽
 *   <Grid minItemWidth="14em" gap="md">…</Grid>         按宽度自动换列：容器多宽就放几列，不需要断点
 *   <GridItem span={2}>…</GridItem>                     跨两列；span="full" 占满一整行；自动换列窄到放不下时跨当前的列数
 *
 * 响应式不引入断点：minItemWidth 覆盖最常见的自动换列，其余用 sx 加容器查询。
 * 一个元素一个组件（COMPONENTS.md §1）：Grid 是 div，GridList 是 ul；其他语义容器用 createGrid 生成。
 */
import { _component, type TsxComponent } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { inject, provide, type InjectionKey, type VNodeChild } from 'vue';
import { useResizeObserver } from '../utils/dom/resize';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  columnGapStyles,
  gapStyles,
  listRole,
  listStyles,
  rowGapStyles,
  type LayoutTag,
  type Space,
} from '../utils/style/styles';

/** 单元格内容在格子里的对齐（align-items 为块方向、justify-items 为行内方向） */
export interface GridAligns {
  /** 贴着格子的起始边 */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 贴着格子的结束边 */
  end: unknown;
  /** 拉伸填满格子（默认） */
  stretch: unknown;
}

/** 自动排布方向（grid-auto-flow） */
export interface GridFlows {
  /** 逐行填充（默认） */
  row: unknown;
  /** 逐列填充 */
  column: unknown;
  /** 逐行填充，并回填前面留下的空位（顺序可能变化） */
  'row dense': unknown;
  /** 逐列填充，并回填空位 */
  'column dense': unknown;
}

/** grid 布局的选项，Grid、GridList 与 createGrid 生成的组件共用 */
export interface GridOptions {
  /** 列数（等宽列）；与 minItemWidth 同时给时以 minItemWidth 为准 */
  columns?: number;
  /**
   * 每项的最小宽度（CSS 长度，如 '14em'）：按容器宽度自动决定列数，窄于它时单列。
   * 项目比放得下的列数少时，空列收起、各项拉宽占满（auto-fit，同 Chakra 的 minChildWidth），不在右边留空
   */
  minItemWidth?: string;
  /** 间距档位，对应主题的 space */
  gap?: Space;
  /** 行间距，覆盖 gap */
  rowGap?: Space;
  /** 列间距，覆盖 gap */
  columnGap?: Space;
  /** 单元格在块方向的对齐（align-items），默认 stretch */
  align?: keyof GridAligns;
  /** 单元格在行内方向的对齐（justify-items），默认 stretch */
  justify?: keyof GridAligns;
  /** 自动排布方向（grid-auto-flow），dense 回填空位 */
  flow?: keyof GridFlows;
  children?: VNodeChild;
}

/** Grid 的样式：root */
export const gridStyles = stylex.create({
  root: { display: 'grid' },
});

// 列数与最小宽度是任意值，用动态样式（编译为 CSS 变量）；单独一个 create，见 COMPONENTS.md §4
/** Grid 的样式：columns、minItemWidth */
export const gridDynamicStyles = stylex.create({
  columns: (count: number) => ({ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }),
  // min(…, 100%)：容器比最小宽度还窄时不溢出
  minItemWidth: (width: string) => ({
    gridTemplateColumns: `repeat(auto-fit, minmax(min(${width}, 100%), 1fr))`,
  }),
});

/** Grid 的样式：start、center、end、stretch */
export const gridAlignStyles = stylex.create({
  start: { alignItems: 'start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'end' },
  stretch: { alignItems: 'stretch' },
});

/** Grid 的样式：start、center、end、stretch */
export const gridJustifyStyles = stylex.create({
  start: { justifyItems: 'start' },
  center: { justifyItems: 'center' },
  end: { justifyItems: 'end' },
  stretch: { justifyItems: 'stretch' },
});

/** Grid 的样式：row、column、row dense、column dense */
export const gridFlowStyles = stylex.create({
  row: { gridAutoFlow: 'row' },
  column: { gridAutoFlow: 'column' },
  'row dense': { gridAutoFlow: 'row dense' },
  'column dense': { gridAutoFlow: 'column dense' },
});

// 网格现在实际有几列；null 是不知道（没有固定列数，也量不出来），GridItem 照写的 span 跨
const gridColumnsKey: InjectionKey<() => number | null> = Symbol('GridColumns');

/** CSS 长度换成 px：认 px、em（按元素的字号）、rem；别的单位（calc、%）返回 null */
function lengthToPx(length: string, element: Element): number | null {
  const match = /^(\d*\.?\d+)(px|r?em)$/.exec(length.trim());
  if (!match) return null;
  const value = Number(match[1]);
  if (match[2] === 'px') return value;
  const from = match[2] === 'rem' ? document.documentElement : element;
  return value * parseFloat(getComputedStyle(from).fontSize);
}

/**
 * 网格的列数交给里面的 GridItem（数字 span 不超过它）：按宽度自动换列（auto-fill / auto-fit）时量出来，
 * 不然窄到一列时 span={2} 会撑出一条隐式的列、内容溢出。返回给网格元素的 ref；FormSection 也用它。
 */
export function provideGridColumns(
  read: () => { columns?: number; minItemWidth?: string },
): (element: unknown) => void {
  let element = _state.raw<HTMLElement | null>(null);
  let measured = _state<number | null>(null);
  useResizeObserver(
    () => (read().minItemWidth == null ? null : element),
    () => {
      const { columns, minItemWidth } = read();
      if (!element || minItemWidth == null) return;
      const style = getComputedStyle(element);
      const gap = parseFloat(style.columnGap) || 0;
      const width =
        element.clientWidth -
        parseFloat(style.paddingInlineStart) -
        parseFloat(style.paddingInlineEnd);
      const min = lengthToPx(minItemWidth, element);
      const fits =
        min == null ? null : Math.max(1, Math.floor((width + gap) / (Math.min(min, width) + gap)));
      measured = fits == null ? null : Math.min(fits, columns ?? fits);
    },
  );
  provide(gridColumnsKey, () =>
    read().minItemWidth == null ? (read().columns ?? null) : measured,
  );
  return (next) => (element = next as HTMLElement | null);
}

/** 未声明的属性落到元素上：Grid 为 div，GridList 为 ul，createGrid 生成的为给定的标签 */
export type GridProps<Tag extends LayoutTag = 'div'> = PartProps<Tag> & GridOptions;

/**
 * 生成渲染为指定语义标签的 grid 布局组件；列表标签（ul、ol）自动去掉圆点并补上 role="list"。
 * name 是 DevTools 与警告信息里显示的组件名。
 */
export function createGrid<Tag extends LayoutTag>(
  tag: Tag,
  name: string,
): TsxComponent<GridProps<Tag>> {
  // 实现按布局标签共有的属性写，对外每个组件只接受自己元素的属性
  return _component(
    ({
      columns,
      minItemWidth,
      gap,
      rowGap,
      columnGap,
      align,
      justify,
      flow,
      children,
      ...rest
    }: GridProps<LayoutTag>) => {
      const gridRef = provideGridColumns(() => ({ columns, minItemWidth }));
      return () => {
        const Tag = tag as LayoutTag;
        const template =
          minItemWidth != null
            ? gridDynamicStyles.minItemWidth(minItemWidth)
            : columns != null && gridDynamicStyles.columns(columns);
        const sx = [
          gridStyles.root,
          template,
          gap && gapStyles[gap],
          rowGap && rowGapStyles[rowGap],
          columnGap && columnGapStyles[columnGap],
          align && gridAlignStyles[align],
          justify && gridJustifyStyles[justify],
          flow && gridFlowStyles[flow],
          listRole(tag) && listStyles.reset,
        ];
        return (
          <Tag {...mergeAttrs<LayoutTag>({ sx, role: listRole(tag) }, rest, { ref: gridRef })}>
            {children}
          </Tag>
        );
      };
    },
    { name },
  ) as unknown as TsxComponent<GridProps<Tag>>;
}

/** grid 布局（div） */
export const Grid = createGrid('div', 'Grid');
/** grid 布局的列表（ul）：卡片列表等，去掉圆点与缩进，保留列表语义；子元素用 li */
export const GridList = createGrid('ul', 'GridList');

/** 网格里一项的跨度，GridItem、GridListItem 共用 */
export interface GridItemOptions {
  /**
   * 跨几列；`'full'` 占满一整行（从第一列到最后一列）。按宽度自动换列的网格（minItemWidth、FormSection）
   * 窄到放不下时跨当前的列数（量的是 px、em、rem 写的最小宽度）
   */
  span?: number | 'full';
  /** 跨几行 */
  rowSpan?: number;
  children?: VNodeChild;
}

/** 网格项的标签 */
export type GridItemTag = 'div' | 'li';

/** 未声明的属性落到元素上：GridItem 为 div，GridListItem 为 li */
export type GridItemProps<Tag extends GridItemTag = 'div'> = PartProps<Tag> & GridItemOptions;

/** GridItem 的样式：full */
export const gridItemStyles = stylex.create({
  full: { gridColumn: '1 / -1' },
});

/** GridItem 的样式：span、rowSpan */
export const gridItemDynamicStyles = stylex.create({
  span: (count: number) => ({ gridColumn: `span ${count} / span ${count}` }),
  rowSpan: (count: number) => ({ gridRow: `span ${count} / span ${count}` }),
});

/** 生成网格项组件：跨列、跨行 */
export function createGridItem<Tag extends GridItemTag>(
  tag: Tag,
  name: string,
): TsxComponent<GridItemProps<Tag>> {
  return _component(
    ({ span, rowSpan, children, ...rest }: GridItemProps<GridItemTag>) => {
      const columns = inject(gridColumnsKey, () => null);
      return () => {
        const Tag = tag as GridItemTag;
        const across = typeof span === 'number' ? Math.min(span, columns() ?? span) : span;
        const sx = [
          across === 'full'
            ? gridItemStyles.full
            : across != null && across > 1 && gridItemDynamicStyles.span(across),
          rowSpan != null && rowSpan > 1 && gridItemDynamicStyles.rowSpan(rowSpan),
        ];
        return <Tag {...mergeAttrs<GridItemTag>({ sx }, rest)}>{children}</Tag>;
      };
    },
    { name },
  ) as unknown as TsxComponent<GridItemProps<Tag>>;
}

/** 网格里的一项（div）：跨列、跨行 */
export const GridItem = createGridItem('div', 'GridItem');
/** GridList 里的一项（li）：跨列、跨行 */
export const GridListItem = createGridItem('li', 'GridListItem');
