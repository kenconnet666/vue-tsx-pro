/**
 * 一维布局（flex）。只做这一个，不拆 Stack / Group：竖排写 direction="column"。
 *
 *   <Flex gap="sm" align="center">…</Flex>
 *   <Flex as="ul" direction="column" gap="xs">…</Flex>   列表：自动去掉圆点并保留列表语义
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type AsProps } from '../utils/props';
import { gapStyles, listRole, listStyles, type Space } from '../utils/styles';

/** 可换的标签：语义相近的容器（COMPONENTS.md §10.2） */
export type LayoutTag =
  | 'div'
  | 'section'
  | 'article'
  | 'ul'
  | 'ol'
  | 'li'
  | 'nav'
  | 'header'
  | 'footer'
  | 'main'
  | 'aside'
  | 'form';

/** 主轴方向（flex-direction） */
export interface FlexDirections {
  /** 横排：子元素从起始边排到结束边 */
  row: unknown;
  /** 竖排：子元素从上到下 */
  column: unknown;
  /** 横排，顺序反过来 */
  'row-reverse': unknown;
  /** 竖排，顺序反过来 */
  'column-reverse': unknown;
}

/** 交叉轴对齐（align-items）：横排时是竖直方向，竖排时是水平方向 */
export interface FlexAligns {
  /** 贴着交叉轴的起点（横排时顶部对齐） */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 贴着交叉轴的终点（横排时底部对齐） */
  end: unknown;
  /** 拉伸填满交叉轴（默认） */
  stretch: unknown;
  /** 按文字基线对齐：字号不同的文字、图标与文字混排 */
  baseline: unknown;
}

/** 主轴分布（justify-content） */
export interface FlexJustifies {
  /** 靠主轴起点（默认） */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 靠主轴终点 */
  end: unknown;
  /** 两端对齐，中间等距：首尾贴边 */
  between: unknown;
  /** 每项两侧留白相等：首尾留白是中间的一半 */
  around: unknown;
  /** 所有空隙相等，包括首尾 */
  evenly: unknown;
}

export interface FlexProps extends AsProps<LayoutTag> {
  /** 主轴方向，默认 row */
  direction?: keyof FlexDirections;
  /** 交叉轴对齐（align-items），默认 stretch */
  align?: keyof FlexAligns;
  /** 主轴分布（justify-content），默认 start */
  justify?: keyof FlexJustifies;
  /** 换行；'reverse' 为反向换行 */
  wrap?: boolean | 'reverse';
  /** 间距档位，对应主题的 space */
  gap?: Space;
  /** 行内 flex（inline-flex） */
  inline?: boolean;
  children?: VNodeChild;
}

const styles = stylex.create({
  root: { display: 'flex' },
  inline: { display: 'inline-flex' },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  'row-reverse': { flexDirection: 'row-reverse' },
  'column-reverse': { flexDirection: 'column-reverse' },
  wrap: { flexWrap: 'wrap' },
  wrapReverse: { flexWrap: 'wrap-reverse' },
});

const alignStyles = stylex.create({
  start: { alignItems: 'flex-start' },
  center: { alignItems: 'center' },
  end: { alignItems: 'flex-end' },
  stretch: { alignItems: 'stretch' },
  baseline: { alignItems: 'baseline' },
});

const justifyStyles = stylex.create({
  start: { justifyContent: 'flex-start' },
  center: { justifyContent: 'center' },
  end: { justifyContent: 'flex-end' },
  between: { justifyContent: 'space-between' },
  around: { justifyContent: 'space-around' },
  evenly: { justifyContent: 'space-evenly' },
});

export const Flex = _component(
  ({
    as = 'div',
    direction = 'row',
    align,
    justify,
    wrap = false,
    gap,
    inline = false,
    children,
    ...rest
  }: FlexProps) =>
    () => {
      const Tag = as;
      const sx = [
        inline ? styles.inline : styles.root,
        styles[direction],
        wrap && (wrap === 'reverse' ? styles.wrapReverse : styles.wrap),
        align && alignStyles[align],
        justify && justifyStyles[justify],
        gap && gapStyles[gap],
        listRole(as) && listStyles.reset,
      ];
      return (
        <Tag {...elementProps(mergeProps<LayoutTag>({ sx, role: listRole(as) }, rest))}>
          {children}
        </Tag>
      );
    },
);
