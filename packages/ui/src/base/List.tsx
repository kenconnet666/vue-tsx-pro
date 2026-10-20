/**
 * 正文里的列表：List（ul，圆点）、OrderedList（ol，编号）、ListItem（li）。
 * 界面结构上的列表（导航、分页、步骤）不要圆点，用布局组件 FlexList / FlexOrderedList。
 *
 *   <List>
 *     <ListItem>安装依赖</ListItem>
 *     <ListItem>配置 Vite 预设<OrderedList><ListItem>…</ListItem></OrderedList></ListItem>
 *   </List>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 正文列表的样式：缩进与项目之间的间距；嵌套的列表紧贴上一项 */
export const listStylesProse = stylex.create({
  root: {
    display: 'grid',
    rowGap: '_xs',
    margin: 0,
    paddingInlineStart: '1.5em',
  },
  bullet: { listStyleType: 'disc' },
  number: { listStyleType: 'decimal' },
  item: { paddingInlineStart: '_xs' },
});

/** 未声明的属性落到 ul 上 */
export interface ListProps extends PartProps<'ul'> {
  children?: VNodeChild;
}

/** 未声明的属性落到 ol 上 */
export interface OrderedListProps extends PartProps<'ol'> {
  children?: VNodeChild;
}

/** 未声明的属性落到 li 上 */
export interface ListItemProps extends PartProps<'li'> {
  children?: VNodeChild;
}

/** 无序列表（ul）：圆点 */
export const List = _component(({ children, ...rest }: ListProps) => () => (
  <ul {...mergeAttrs<'ul'>({ sx: [listStylesProse.root, listStylesProse.bullet] }, rest)}>
    {children}
  </ul>
));

/** 有序列表（ol）：编号；start、reversed 等原生属性照常可用 */
export const OrderedList = _component(({ children, ...rest }: OrderedListProps) => () => (
  <ol {...mergeAttrs<'ol'>({ sx: [listStylesProse.root, listStylesProse.number] }, rest)}>
    {children}
  </ol>
));

/** 列表项（li） */
export const ListItem = _component(({ children, ...rest }: ListItemProps) => () => (
  <li {...mergeAttrs<'li'>({ sx: listStylesProse.item }, rest)}>{children}</li>
));
