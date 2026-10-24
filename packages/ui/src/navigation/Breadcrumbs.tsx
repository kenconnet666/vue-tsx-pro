/**
 * 面包屑（nav > ol）：当前页在站点层级里的位置。最后一项是当前页（aria-current="page"，不是链接）。
 * 链接用 Link（站内链接经路由适配跳转），分隔符默认是 Lucide 的 ChevronRight，从右到左排版时翻转。
 *
 *   <Breadcrumbs items={[{ label: '首页', href: '/' }, { label: '订单', href: '/orders' }, { label: '#1024' }]} />
 *
 * 路径太长时用 maxItems 折叠中间部分：折叠处是一个菜单按钮，被折叠的各级在菜单里（链接菜单项），
 * 同 Radix Themes / shadcn 的做法；展开整条路径会把布局撑乱，菜单不会。
 */
import { ChevronRight, Ellipsis } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { Icon, type IconData } from '../base/Icon';
import { Link, type LinkProps } from '../base/Link';
import { useLang } from '../config/context';
import { Menu, MenuItem, MenuLinkItem, type MenuProps } from '../overlay/Menu';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { FlexOrderedList, type FlexProps } from '../layout/Flex';

/** 一级路径 */
export interface BreadcrumbItem {
  /** 唯一的 key；不写时用 href，再没有时用位置 */
  key?: string;
  /** 显示的文字 */
  label: VNodeChild;
  /** 地址；最后一项（当前页）不需要 */
  href?: string;
  /** 文字前的图标 */
  icon?: IconData;
}

/** 未声明的属性落到 nav 上；aria-label 默认取语言包（面包屑） */
export interface BreadcrumbsProps extends PartProps<'nav'> {
  /** 路径，从根到当前页；最后一项是当前页 */
  items: readonly BreadcrumbItem[];
  /** 分隔符，默认是右向的 chevron 图标 */
  separator?: VNodeChild;
  /** 超过这么多项时折叠中间部分（保留第一项与最后两项），被折叠的各级放进菜单 */
  maxItems?: number;
  /** 列表（ol）的部件属性 */
  propsList?: Partial<FlexProps<'ol'>>;
  /** 每一项（li）的部件属性，可以按项计算 */
  propsItem?: PartProps<'li'> | ((item: BreadcrumbItem, index: number) => PartProps<'li'>);
  /** 折叠处那一项（li，里面是折叠按钮与菜单）的部件属性 */
  propsCollapsedItem?: PartProps<'li'>;
  /** 链接的部件属性 */
  propsLink?: Partial<LinkProps>;
  /** 每一项文字（图标加文字）的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 当前页（最后一项）的部件属性 */
  propsCurrent?: PartProps<'span'>;
  /** 分隔符的部件属性 */
  propsSeparator?: PartProps<'span'>;
  /** 折叠按钮（菜单的触发器）的部件属性 */
  propsExpand?: Partial<IconButtonProps>;
  /** 被折叠各级的菜单的部件属性 */
  propsMenu?: Partial<MenuProps>;
}

/** Breadcrumbs 的样式：list、item、current、separator、label、expand */
export const breadcrumbsStyles = css.create({
  // 横排、换行、间距由 FlexOrderedList 给
  list: { fontSize: '_sm' },
  item: { display: 'inline-flex', alignItems: 'center', gap: '_xs', minWidth: 0 },
  current: { color: '_text', fontWeight: '_medium' },
  separator: { display: 'inline-flex', color: '_textMuted' },
  label: { display: 'inline-flex', alignItems: 'center', gap: '_xs' },
  expand: { width: '1.75em', minHeight: '1.75em' },
});

/** 面包屑：链接 + 分隔符，最后一项是当前页 */
export const Breadcrumbs = _component(
  ({
    items,
    separator,
    maxItems,
    propsList,
    propsItem,
    propsCollapsedItem,
    propsLink,
    propsLabel,
    propsCurrent,
    propsSeparator,
    propsExpand,
    propsMenu,
    ...rest
  }: BreadcrumbsProps) => {
    const lang = useLang();

    return () => {
      const collapse = maxItems != null && items.length > maxItems;
      // 折叠时保留第一项与最后两项，中间换成展开按钮
      const shown: (BreadcrumbItem | 'collapsed')[] = collapse
        ? [items[0]!, 'collapsed', ...items.slice(-2)]
        : [...items];
      const last = items.length - 1;
      // 每处各生成一个节点：同一个 VNode 不能放在多个位置
      const sep = () => (
        <span
          {...mergeAttrs<'span'>({ sx: breadcrumbsStyles.separator }, propsSeparator, {
            'aria-hidden': true,
          })}
        >
          {separator ?? <Icon icon={ChevronRight} flipInRtl />}
        </span>
      );

      return (
        <nav {...mergeAttrs<'nav'>({ 'aria-label': lang.breadcrumbs }, rest)}>
          <FlexOrderedList
            {...mergePartProps<FlexProps<'ol'>>(
              { wrap: true, align: 'center', gap: 'xs', sx: breadcrumbsStyles.list },
              propsList,
            )}
          >
            {shown.map((entry, position) => {
              if (entry === 'collapsed') {
                return (
                  <li
                    key="collapsed"
                    {...mergeAttrs<'li'>({ sx: breadcrumbsStyles.item }, propsCollapsedItem)}
                  >
                    <Menu
                      {...mergePartProps<MenuProps>(
                        {
                          // 被折叠的各级链接一直在 DOM 里：页内搜索、爬虫找得到；一页只有一个，不必延迟
                          lazy: false,
                          trigger: (props) => (
                            <IconButton
                              {...mergePartProps<IconButtonProps>(
                                {
                                  sx: breadcrumbsStyles.expand,
                                  size: 'sm',
                                  icon: Ellipsis,
                                  'aria-label': lang.breadcrumbsExpand,
                                },
                                propsExpand,
                                props,
                              )}
                            />
                          ),
                        },
                        propsMenu,
                      )}
                    >
                      {items.slice(1, -2).map((hidden, offset) =>
                        hidden.href != null ? (
                          <MenuLinkItem key={offset} href={hidden.href} icon={hidden.icon}>
                            {hidden.label}
                          </MenuLinkItem>
                        ) : (
                          <MenuItem key={offset} icon={hidden.icon} disabled>
                            {hidden.label}
                          </MenuItem>
                        ),
                      )}
                    </Menu>
                    {sep()}
                  </li>
                );
              }
              const index = items.indexOf(entry);
              const own = typeof propsItem === 'function' ? propsItem(entry, index) : propsItem;
              const label = (
                <span {...mergeAttrs<'span'>({ sx: breadcrumbsStyles.label }, propsLabel)}>
                  {entry.icon && <Icon icon={entry.icon} />}
                  {entry.label}
                </span>
              );
              return (
                <li
                  key={entry.key ?? entry.href ?? index}
                  {...mergeAttrs<'li'>({ sx: breadcrumbsStyles.item }, own)}
                >
                  {index === last ? (
                    <span
                      {...mergeAttrs<'span'>({ sx: breadcrumbsStyles.current }, propsCurrent, {
                        'aria-current': 'page',
                      })}
                    >
                      {label}
                    </span>
                  ) : entry.href != null ? (
                    <Link
                      {...mergePartProps<LinkProps>(
                        { tone: 'muted', underline: 'hover', href: entry.href },
                        propsLink,
                      )}
                    >
                      {label}
                    </Link>
                  ) : (
                    label
                  )}
                  {position < shown.length - 1 && sep()}
                </li>
              );
            })}
          </FlexOrderedList>
        </nav>
      );
    };
  },
);
