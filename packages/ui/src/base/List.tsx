/**
 * 正文里的列表：List（ul，圆点或图标）、OrderedList（ol，编号）、ListItem（li）。
 * 界面结构上的列表（导航、分页、步骤）不要圆点，用布局组件 FlexList / FlexOrderedList。
 *
 *   <List>
 *     <ListItem>安装依赖</ListItem>
 *     <ListItem>配置 Vite 预设<OrderedList><ListItem>…</ListItem></OrderedList></ListItem>
 *   </List>
 *   <List icon={Check} propsIcon={{ tone: 'success' }}>        功能清单：图标代替圆点
 *     <ListItem>不限项目</ListItem>
 *     <ListItem icon={X} propsIcon={{ tone: 'muted' }}>单点登录</ListItem>   逐项换图标
 *   </List>
 *
 * 图标是装饰（aria-hidden），读屏照常念“列表，几项”。参考 Mantine List 的 icon、Chakra 的 ListIcon。
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { Icon, type IconData, type IconProps } from './Icon';

/** 列表项之间的间距 */
export interface ListSpacings {
  /** 没有间距 */
  none: unknown;
  /** 小（默认） */
  xs: unknown;
  /** 中 */
  sm: unknown;
  /** 大：每项是一段话时 */
  md: unknown;
}

/** 正文列表的样式：缩进与项目之间的间距；嵌套的列表紧贴上一项；有图标时不要圆点、不缩进 */
export const listStylesProse = stylex.create({
  root: {
    display: 'grid',
    margin: 0,
    paddingInlineStart: '1.5em',
  },
  bullet: { listStyleType: 'disc' },
  number: { listStyleType: 'decimal' },
  // 图标代替圆点：图标在项里占一列，项的文字换行时对齐文字
  iconic: { listStyleType: 'none', paddingInlineStart: 0 },
  item: { paddingInlineStart: '_xs' },
  iconItem: { display: 'flex', alignItems: 'baseline', gap: '_sm', paddingInlineStart: 0 },
  // 图标与第一行文字对齐（基线对不齐图标，按行高居中）
  icon: { flexShrink: 0, alignSelf: 'flex-start', marginBlockStart: '0.2em' },
  content: { minWidth: 0 },
});

/** List 的样式：间距 none、xs、sm、md */
export const listSpacingStyles = stylex.create({
  none: { rowGap: 0 },
  xs: { rowGap: '_xs' },
  sm: { rowGap: '_sm' },
  md: { rowGap: '_md' },
});

/** 列表共有的外观 */
interface ListOptions {
  /** 字号档位；不写时继承上下文字号 */
  size?: TextSize;
  /** 项与项之间的间距，默认 xs */
  spacing?: keyof ListSpacings;
  children?: VNodeChild;
}

/** List 交给 ListItem 的：默认的图标与它的部件属性 */
export interface ListMarkerState {
  /** 各项默认的图标；没有时画圆点 */
  readonly icon?: IconData;
  /** 各项图标默认的部件属性 */
  readonly propsIcon?: Partial<IconProps>;
}

/** List 的上下文：ListItem 据此画图标；OrderedList 里是空的 */
export const ListContext = createContext<ListMarkerState>('List');

/** 未声明的属性落到 ul 上 */
export interface ListProps extends PartProps<'ul'>, ListOptions {
  /** 用图标代替圆点（功能清单的对勾）；ListItem 的 icon 可以逐项覆盖 */
  icon?: IconData;
  /** 各项图标的部件属性（tone 改颜色）；ListItem 的 propsIcon 会合并进来 */
  propsIcon?: Partial<IconProps>;
}

/** 未声明的属性落到 ol 上 */
export interface OrderedListProps extends PartProps<'ol'>, ListOptions {}

/** 未声明的属性落到 li 上 */
export interface ListItemProps extends PartProps<'li'> {
  /** 这一项的图标，覆盖 List 的 icon（在有序列表里不用） */
  icon?: IconData;
  /** 图标的部件属性，与 List 的 propsIcon 合并 */
  propsIcon?: Partial<IconProps>;
  /** 带图标时包着文字的内容层（div）的部件属性 */
  propsContent?: PartProps<'div'>;
  children?: VNodeChild;
}

const listSx = (spacing: keyof ListSpacings, size: TextSize | undefined) => [
  listStylesProse.root,
  listSpacingStyles[spacing],
  size && fontSizeStyles[size],
];

/** 无序列表（ul）：圆点，或 icon 代替圆点 */
export const List = _component(
  ({ icon, propsIcon, size, spacing = 'xs', children, ...rest }: ListProps) => {
    ListContext.provide({
      get icon() {
        return icon;
      },
      get propsIcon() {
        return propsIcon;
      },
    });
    return () => (
      <ul
        {...mergeAttrs<'ul'>(
          {
            sx: [...listSx(spacing, size), icon ? listStylesProse.iconic : listStylesProse.bullet],
            // 去掉圆点后 Safari 不再把它当列表念（见 listStyles）
            role: icon ? 'list' : undefined,
          },
          rest,
        )}
      >
        {children}
      </ul>
    );
  },
);

/** 有序列表（ol）：编号；start、reversed 等原生属性照常可用 */
export const OrderedList = _component(
  ({ size, spacing = 'xs', children, ...rest }: OrderedListProps) => {
    // 里面的项不沿用外层 List 的图标
    ListContext.provide({});
    return () => (
      <ol {...mergeAttrs<'ol'>({ sx: [...listSx(spacing, size), listStylesProse.number] }, rest)}>
        {children}
      </ol>
    );
  },
);

/** 列表项（li）：在带图标的 List 里，图标在前、文字在后 */
export const ListItem = _component(
  ({ icon, propsIcon, propsContent, children, ...rest }: ListItemProps) => {
    const list: ListMarkerState = ListContext.inject({});
    return () => {
      const shown = icon ?? list.icon;
      if (!shown) {
        return <li {...mergeAttrs<'li'>({ sx: listStylesProse.item }, rest)}>{children}</li>;
      }
      return (
        <li {...mergeAttrs<'li'>({ sx: listStylesProse.iconItem }, rest)}>
          <Icon
            {...mergePartProps<IconProps>(
              { icon: shown, sx: listStylesProse.icon },
              list.propsIcon,
              propsIcon,
            )}
          />
          <div {...mergeAttrs<'div'>({ sx: listStylesProse.content }, propsContent)}>
            {children}
          </div>
        </li>
      );
    };
  },
);
