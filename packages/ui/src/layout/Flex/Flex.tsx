/**
 * 一维布局（flex）。只做这一个，不拆 Stack / Group：竖排写 direction="column"。
 *
 *   <Flex gap="sm" align="center">…</Flex>
 *   <Flex as="ul" direction="column" gap="xs">…</Flex>   列表：自动去掉圆点并保留列表语义
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type AsProps } from '../../utils/props';
import { gapStyles, listRole, listStyles, type Space } from '../../utils/styles';

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

export interface FlexProps extends AsProps<LayoutTag> {
  /** 主轴方向，默认 row */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /** 交叉轴对齐（align-items），默认 stretch */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** 主轴分布（justify-content），默认 start */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
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
