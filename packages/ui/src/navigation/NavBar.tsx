/**
 * 横向导航（顶部菜单）：一行链接，有子项的是下拉菜单；放不下时后面的收进“更多”菜单。后台的顶栏、门户的主导航。
 * 参考 Ant Design Menu 的 horizontal 模式（溢出收进“…”）。侧边的多级导航用 NavList。
 *
 *   <NavBar
 *     items={[
 *       { label: '工作台', href: '/' },
 *       { label: '采购', children: [{ label: '采购单', href: '/po' }, { label: '供应商', href: '/suppliers' }] },
 *       { label: '报表', href: '/reports', badge: 3 },
 *     ]}
 *     aria-label="主导航"
 *   />
 *
 * - 当前页按路由适配的 isActive 判断（同 NavList），链接带 aria-current="page" 与下划线；子项是当前页时它的菜单按钮也高亮。
 * - 下拉菜单是 Menu（↑↓ 移动、Esc 关闭回到按钮），菜单项是链接（MenuLinkItem）。
 * - 放不下：useOverflowItems 量出前几项，其余收进“更多”（菜单里有子项的项按分组列出）；藏起来的项不占位、读屏与 Tab 跳过。
 *
 * 部件：Root（nav）、List（ul）、Item（li）、Link（a）、Trigger（有子项时的按钮）、More（“更多”按钮）。
 */
import { ChevronDown, Ellipsis } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Badge } from '../base/Badge';
import { ButtonBase } from '../base/ButtonBase';
import { Icon, type IconData } from '../base/Icon';
import { useLang } from '../config/context';
import { Menu, MenuGroup, MenuLinkItem } from '../overlay/Menu';
import { useRouterLink } from '../utils/dom/link';
import { useOverflowItems } from '../utils/dom/overflow';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { t } from '../config/theme/tokens';

/** 横向导航的一项：有 href 是链接，有 children 是下拉菜单（一层） */
export interface NavBarItem {
  /** 文字 */
  label: string;
  /** 链接地址 */
  href?: string;
  /** 文字前的图标 */
  icon?: IconData;
  /** 下拉菜单里的子项 */
  children?: readonly NavBarItem[];
  /** 计数角标（待办、未读），0 不显示 */
  badge?: number;
  /** 不可用 */
  disabled?: boolean;
}

/** 未声明的属性落到 nav 上；aria-label 是导航的名称 */
export interface NavBarProps extends PartProps<'nav'> {
  /** 各项 */
  items: readonly NavBarItem[];
  /** 列表（ul）的部件属性 */
  propsList?: PartProps<'ul'>;
}

/** NavBar 的样式：list、item、link、current、badge、more */
export const navBarStyles = css.create({
  // 一行：放不下的项由 useOverflowItems 移出排版（容器要 position: relative，间距用 column-gap）
  list: {
    position: 'relative',
    display: 'flex',
    alignItems: 'stretch',
    columnGap: '_xs',
    minWidth: 0,
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  item: { display: 'flex', flexShrink: 0 },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
    minHeight: `max(${t.sizes.control}, ${t.sizes.minTarget})`,
    paddingInline: '_md',
    borderRadius: '_md',
    color: { default: '_textMuted', ':hover': '_text' },
    fontWeight: '_medium',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
    // 当前页的下划线画在底边（与 Tabs 的下划线同色）
    boxShadow: 'none',
    transition: `color ${t.durations.sm} ${t.easings.standard}, background-color ${t.durations.sm} ${t.easings.standard}`,
  },
  current: {
    color: { default: '_accentText', ':hover': '_accentText' },
    boxShadow: `inset 0 calc(-1 * ${t.borderWidths.sm}) 0 ${t.colors.accent}`,
    borderEndStartRadius: 0,
    borderEndEndRadius: 0,
  },
  disabled: { opacity: '_disabled', pointerEvents: 'none' },
});

/** 子项里有没有当前页 */
const hasActive = (item: NavBarItem, isActive: (href: string) => boolean): boolean =>
  (item.href != null && isActive(item.href)) ||
  (item.children ?? []).some((child) => hasActive(child, isActive));

/** 横向导航：一行链接与下拉菜单，放不下的收进“更多” */
export const NavBar = _component(({ items, propsList, ...rest }: NavBarProps) => {
  const lang = useLang();
  const router = useRouterLink();
  let list = _state.raw<HTMLElement | null>(null);
  const overflow = useOverflowItems({ container: () => list, count: () => items.length });

  const badge = (count = 0) =>
    count > 0 && (
      <Badge size="xs" variant="solid" tone="danger" radius="full">
        {count > 99 ? '99+' : count}
      </Badge>
    );

  /** 菜单里的链接（下拉菜单、“更多”菜单共用） */
  const menuLinks = (children: readonly NavBarItem[]) =>
    children.map((child) => (
      <MenuLinkItem
        key={child.href ?? child.label}
        href={child.href ?? ''}
        icon={child.icon}
        disabled={child.disabled}
        aria-current={child.href && router.isActive(child.href) ? 'page' : undefined}
      >
        {child.label}
      </MenuLinkItem>
    ));

  function renderItem(item: NavBarItem) {
    const current = hasActive(item, router.isActive);
    const sx = [
      navBarStyles.link,
      focusRingStyles.visible,
      current && navBarStyles.current,
      item.disabled && navBarStyles.disabled,
    ];
    const content = [item.icon && <Icon icon={item.icon} />, item.label, badge(item.badge)];
    if (item.children?.length) {
      return (
        <Menu
          trigger={(props) => (
            <ButtonBase
              {...props}
              sx={sx}
              disabled={item.disabled}
              data-state={current ? 'active' : 'inactive'}
            >
              {content}
              <Icon icon={ChevronDown} />
            </ButtonBase>
          )}
        >
          {menuLinks(item.children)}
        </Menu>
      );
    }
    return (
      <a
        {...css.attrs(...sx)}
        href={item.disabled || item.href == null ? undefined : router.href(item.href)}
        aria-current={current ? 'page' : undefined}
        aria-disabled={item.disabled || undefined}
        data-state={current ? 'active' : 'inactive'}
        onClick={(event: MouseEvent) => item.href && router.onClick(event, item.href)}
      >
        {content}
      </a>
    );
  }

  /** “更多”菜单：收起来的各项，有子项的按分组列出 */
  function renderMore() {
    const hidden = items.slice(overflow.visible);
    const current = hidden.some((item) => hasActive(item, router.isActive));
    return (
      <Menu
        placement="bottom-end"
        trigger={(props) => (
          <ButtonBase
            {...props}
            sx={[navBarStyles.link, focusRingStyles.visible, current && navBarStyles.current]}
            aria-label={lang.navBarMore}
          >
            <Icon icon={Ellipsis} />
          </ButtonBase>
        )}
      >
        {hidden.map((item) =>
          item.children?.length ? (
            <MenuGroup key={item.label} label={item.label}>
              {menuLinks(item.children)}
            </MenuGroup>
          ) : (
            menuLinks([item])
          ),
        )}
      </Menu>
    );
  }

  return () => (
    <nav {...mergeAttrs<'nav'>({}, rest)}>
      <ul {...mergeAttrs<'ul'>({ sx: navBarStyles.list }, propsList, { ref: _toRef(list) })}>
        {items.map((item, index) => (
          <li
            key={item.href ?? item.label}
            {...css.attrs(navBarStyles.item)}
            {...overflow.itemProps(index)}
          >
            {renderItem(item)}
          </li>
        ))}
        <li {...css.attrs(navBarStyles.item)} {...overflow.restProps()}>
          {renderMore()}
        </li>
      </ul>
    </nav>
  );
});
