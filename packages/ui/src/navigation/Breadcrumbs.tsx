/**
 * 面包屑（nav > ol）：当前页在站点层级里的位置。最后一项是当前页（aria-current="page"，不是链接）。
 * 链接用 Link（站内链接经路由适配跳转），分隔符默认是 Lucide 的 ChevronRight，从右到左排版时翻转。
 *
 *   <Breadcrumbs items={[{ label: '首页', href: '/' }, { label: '订单', href: '/orders' }, { label: '#1024' }]} />
 *
 * 路径太长时用 maxItems 折叠中间部分，折叠处是一个按钮，点开显示完整路径。
 */
import { ChevronRight, Ellipsis } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { Icon, type IconData } from '../base/Icon';
import { Link, type LinkProps } from '../base/Link';
import { useLang } from '../config/context';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import { listStyles } from '../utils/styles';

/** 一级路径 */
export interface BreadcrumbItem {
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
  /** 超过这么多项时折叠中间部分（保留第一项与最后两项），点开显示完整路径 */
  maxItems?: number;
  /** 列表（ol）的部件属性 */
  propsList?: PartProps<'ol'>;
  /** 每一项（li）的部件属性，可以按项计算 */
  propsItem?: PartProps<'li'> | ((item: BreadcrumbItem, index: number) => PartProps<'li'>);
  /** 链接的部件属性 */
  propsLink?: Partial<LinkProps>;
  /** 每一项文字（图标加文字）的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 当前页（最后一项）的部件属性 */
  propsCurrent?: PartProps<'span'>;
  /** 分隔符的部件属性 */
  propsSeparator?: PartProps<'span'>;
  /** 折叠按钮的部件属性 */
  propsExpand?: Partial<IconButtonProps>;
}

const styles = stylex.create({
  list: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '_xs', fontSize: '_sm' },
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
    propsLink,
    propsLabel,
    propsCurrent,
    propsSeparator,
    propsExpand,
    ...rest
  }: BreadcrumbsProps) => {
    const lang = useLang();
    let expanded = _state(false);

    return () => {
      const collapse = !expanded && maxItems != null && items.length > maxItems;
      // 折叠时保留第一项与最后两项，中间换成展开按钮
      const shown: (BreadcrumbItem | 'collapsed')[] = collapse
        ? [items[0]!, 'collapsed', ...items.slice(-2)]
        : [...items];
      const last = items.length - 1;
      // 每处各生成一个节点：同一个 VNode 不能放在多个位置
      const sep = () => (
        <span
          {...elementProps(
            mergeProps<'span'>({ sx: styles.separator }, propsSeparator, { 'aria-hidden': true }),
          )}
        >
          {separator ?? <Icon icon={ChevronRight} flipInRtl />}
        </span>
      );

      return (
        <nav {...elementProps(mergeProps<'nav'>({ 'aria-label': lang.breadcrumbs }, rest))}>
          <ol
            {...elementProps(mergeProps<'ol'>({ sx: [listStyles.reset, styles.list] }, propsList))}
          >
            {shown.map((entry, position) => {
              if (entry === 'collapsed') {
                return (
                  <li key="collapsed" {...stylex.attrs(styles.item)}>
                    <IconButton
                      {...(mergeProps<IconButtonProps>(
                        {
                          sx: styles.expand,
                          size: 'sm',
                          icon: Ellipsis,
                          'aria-label': lang.breadcrumbsExpand,
                        },
                        propsExpand,
                        { onClick: () => (expanded = true) },
                      ) as IconButtonProps)}
                    />
                    {sep()}
                  </li>
                );
              }
              const index = items.indexOf(entry);
              const own = typeof propsItem === 'function' ? propsItem(entry, index) : propsItem;
              const label = (
                <span {...elementProps(mergeProps<'span'>({ sx: styles.label }, propsLabel))}>
                  {entry.icon && <Icon icon={entry.icon} />}
                  {entry.label}
                </span>
              );
              return (
                <li key={index} {...elementProps(mergeProps<'li'>({ sx: styles.item }, own))}>
                  {index === last ? (
                    <span
                      {...elementProps(
                        mergeProps<'span'>({ sx: styles.current }, propsCurrent, {
                          'aria-current': 'page',
                        }),
                      )}
                    >
                      {label}
                    </span>
                  ) : entry.href != null ? (
                    <Link
                      {...(mergeProps<LinkProps>(
                        { tone: 'muted', underline: 'hover', href: entry.href },
                        propsLink,
                      ) as LinkProps)}
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
          </ol>
        </nav>
      );
    };
  },
);
