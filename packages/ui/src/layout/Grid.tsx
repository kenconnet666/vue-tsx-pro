/**
 * 二维布局（grid）。
 *
 *   <Grid columns={3} gap="md">…</Grid>                 固定列数，等宽
 *   <Grid minItemWidth="14em" gap="md">…</Grid>         按宽度自动换列：容器多宽就放几列，不需要断点
 *
 * 响应式不引入断点：minItemWidth 覆盖最常见的自动换列，其余用 sx 加容器查询。
 * 一个元素一个组件（COMPONENTS.md §1）：Grid 是 div，GridList 是 ul；其他语义容器用 createGrid 生成。
 */
import { _component, type TsxComponent } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
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
  /** 每项的最小宽度（CSS 长度，如 '14em'）：按容器宽度自动决定列数（auto-fill），窄于它时单列 */
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
    gridTemplateColumns: `repeat(auto-fill, minmax(min(${width}, 100%), 1fr))`,
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
    }: GridProps<LayoutTag>) =>
      () => {
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
          <Tag {...elementProps(mergeProps<LayoutTag>({ sx, role: listRole(tag) }, rest))}>
            {children}
          </Tag>
        );
      },
    { name },
  ) as unknown as TsxComponent<GridProps<Tag>>;
}

/** grid 布局（div） */
export const Grid = createGrid('div', 'Grid');
/** grid 布局的列表（ul）：卡片列表等，去掉圆点与缩进，保留列表语义；子元素用 li */
export const GridList = createGrid('ul', 'GridList');
