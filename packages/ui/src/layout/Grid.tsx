/**
 * 二维布局（grid）。
 *
 *   <Grid columns={3} gap="md">…</Grid>                 固定列数，等宽
 *   <Grid minItemWidth="14em" gap="md">…</Grid>         按宽度自动换列：容器多宽就放几列，不需要断点
 *
 * 响应式不引入断点：minItemWidth 覆盖最常见的自动换列，其余用 sx 加容器查询。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type AsProps } from '../utils/props';
import {
  columnGapStyles,
  gapStyles,
  listRole,
  listStyles,
  rowGapStyles,
  type Space,
} from '../utils/styles';
import type { LayoutTag } from './Flex';

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

export interface GridProps extends AsProps<LayoutTag> {
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

const styles = stylex.create({
  root: { display: 'grid' },
});

// 列数与最小宽度是任意值，用动态样式（编译为 CSS 变量）；单独一个 create，见 COMPONENTS.md §4
const dynamicStyles = stylex.create({
  columns: (count: number) => ({ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }),
  // min(…, 100%)：容器比最小宽度还窄时不溢出
  minItemWidth: (width: string) => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(min(${width}, 100%), 1fr))`,
  }),
});

const alignStyles = stylex.create({
  start: { alignItems: 'start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'end' },
  stretch: { alignItems: 'stretch' },
});

const justifyStyles = stylex.create({
  start: { justifyItems: 'start' },
  center: { justifyItems: 'center' },
  end: { justifyItems: 'end' },
  stretch: { justifyItems: 'stretch' },
});

const flowStyles = stylex.create({
  row: { gridAutoFlow: 'row' },
  column: { gridAutoFlow: 'column' },
  'row dense': { gridAutoFlow: 'row dense' },
  'column dense': { gridAutoFlow: 'column dense' },
});

export const Grid = _component(
  ({
    as = 'div',
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
  }: GridProps) =>
    () => {
      const Tag = as;
      const template =
        minItemWidth != null
          ? dynamicStyles.minItemWidth(minItemWidth)
          : columns != null && dynamicStyles.columns(columns);
      const sx = [
        styles.root,
        template,
        gap && gapStyles[gap],
        rowGap && rowGapStyles[rowGap],
        columnGap && columnGapStyles[columnGap],
        align && alignStyles[align],
        justify && justifyStyles[justify],
        flow && flowStyles[flow],
        listRole(as) && listStyles.reset,
      ];
      return (
        <Tag {...elementProps(mergeProps<LayoutTag>({ sx, role: listRole(as) }, rest))}>
          {children}
        </Tag>
      );
    },
);
