/**
 * 横向导航（顶部菜单）：一行链接，有子项的是下拉菜单，有 panel 的点了弹出一块内容；放不下时后面的收进“更多”菜单。
 * 后台的顶栏、门户的主导航。
 * 参考 Ant Design Menu 的 horizontal 模式（溢出收进“…”）。侧边的多级导航用 NavList。
 *
 *   <NavBar
 *     items={[
 *       { label: '工作台', href: '/' },
 *       { label: '采购', children: [{ label: '采购单', href: '/po' }, { label: '供应商', href: '/suppliers' }] },
 *       { label: '报表', href: '/reports', badge: 3 },
 *       { label: '待办', href: '/todo', badge: 2, panel: (close) => <TodoList onPick={close} /> },
 *     ]}
 *     aria-label="主导航"
 *   />
 *
 * - 当前页按路由适配的 isActive 判断（同 NavList），链接带 aria-current="page" 与下划线；子项是当前页时它的菜单按钮也高亮。
 * - 下拉菜单是 Menu（↑↓ 移动、Esc 关闭回到按钮），菜单项是链接（MenuLinkItem）。
 * - 下拉面板（panel）是 Popover：放菜单装不下的内容（带说明与状态的列表、批量操作），收起由面板自己调 close。
 *   同一个地址靠查询参数区分的几项（工作台的几个格子），当前项用 current 自己判断。
 * - 放不下：useOverflowItems 量出前几项，其余收进“更多”（菜单里有子项的项按分组列出，有面板的项列成它的 href 链接）；
 *   藏起来的项不占位、读屏与 Tab 跳过。
 *
 * 部件：Root（nav）、List（ul）、Item（li）、Link（a）、Trigger（有子项、有面板时的按钮）、More（“更多”按钮）。
 */
import { ChevronDown, Ellipsis } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Badge } from '../base/Badge';
import { ButtonBase } from '../base/ButtonBase';
import { Icon, type IconData } from '../base/Icon';
import { useLang } from '../config/context';
import { Menu, MenuGroup, MenuLinkItem } from '../overlay/Menu';
import { Popover } from '../overlay/Popover';
import { useRouterLink } from '../utils/dom/link';
import { useOverflowItems } from '../utils/dom/overflow';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import type { VNodeChild } from 'vue';
import { focusRingStyles } from '../utils/style/styles';
import { t } from '../config/theme/tokens';
import { partAttrs } from '../config/styles';

/** 横向导航的一项：有 href 是链接，有 children 是下拉菜单（一层），有 panel 是下拉面板 */
export interface NavBarItem {
  /** 文字 */
  label: string;
  /** 链接地址 */
  href?: string;
  /** 文字前的图标 */
  icon?: IconData;
  /** 下拉菜单里的子项 */
  children?: readonly NavBarItem[];
  /** 下拉面板：点了在下面弹出这块内容，close 收起它（选了一条之后）。收进“更多”时列成 href 的链接 */
  panel?: (close: () => void) => VNodeChild;
  /** 是不是当前项：不写时按 href（与子项的 href）和路由判断 */
  current?: boolean;
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

/** 部件的标记（data-scope="nav-bar"） */
const navBarPart = (part: string) => partAttrs({ name: 'NavBar' }, part);

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
    // 当前页（aria-current、data-current）：品牌色文字，悬停也不变；下划线画在底边（与 Tabs 的下划线同色）
    color: {
      default: '_textMuted',
      _hover: '_text',
      _current: { default: '_accentText', _hover: '_accentText' },
    },
    fontWeight: '_medium',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    backgroundColor: { default: 'transparent', _hover: '_fillHover' },
    boxShadow: {
      default: 'none',
      _current: `inset 0 calc(-1 * ${t.borderWidths.sm}) 0 ${t.colors.accent}`,
    },
    borderEndStartRadius: { default: null, _current: 0 },
    borderEndEndRadius: { default: null, _current: 0 },
    opacity: { default: null, _disabled: '_disabled' },
    pointerEvents: { default: null, _disabled: 'none' },
    transition: `color ${t.durations.sm} ${t.easings.standard}, background-color ${t.durations.sm} ${t.easings.standard}`,
  },
});

/** 子项里有没有当前页 */
const hasActive = (item: NavBarItem, isActive: (href: string) => boolean): boolean =>
  item.current ??
  ((item.href != null && isActive(item.href)) ||
    (item.children ?? []).some((child) => hasActive(child, isActive)));

/** 横向导航：一行链接与下拉菜单，放不下的收进“更多” */
export const NavBar = _component(({ items, propsList, ...rest }: NavBarProps) => {
  const lang = useLang();
  const router = useRouterLink();
  let list = _state.raw<HTMLElement | null>(null);
  /** 开着的下拉面板（项的 href ?? label） */
  let openPanel = _state<string | null>(null);
  const overflow = useOverflowItems({ container: () => list, count: () => items.length });

  const badge = (count = 0) =>
    count > 0 && (
      <Badge size="xs" variant="solid" tone="danger" radius="full" {...navBarPart('badge')}>
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
        aria-current={child.href && hasActive(child, router.isActive) ? 'page' : undefined}
      >
        {child.label}
      </MenuLinkItem>
    ));

  function renderItem(item: NavBarItem) {
    const current = hasActive(item, router.isActive);
    const sx = [navBarStyles.link, focusRingStyles.visible];
    const content = [item.icon && <Icon icon={item.icon} />, item.label, badge(item.badge)];
    if (item.panel) {
      const key = item.href ?? item.label;
      return (
        <Popover
          placement="bottom-start"
          _open={openPanel === key}
          onUpdate:_open={(open: boolean) => (openPanel = open ? key : null)}
          trigger={(props) => (
            <ButtonBase
              {...props}
              sx={sx}
              disabled={item.disabled}
              data-state={current ? 'active' : 'inactive'}
              data-current={current || undefined}
            >
              {content}
              <Icon icon={ChevronDown} />
            </ButtonBase>
          )}
        >
          {item.panel(() => (openPanel = null))}
        </Popover>
      );
    }
    if (item.children?.length) {
      return (
        <Menu
          trigger={(props) => (
            <ButtonBase
              {...props}
              sx={sx}
              disabled={item.disabled}
              data-state={current ? 'active' : 'inactive'}
              data-current={current || undefined}
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
            sx={[navBarStyles.link, focusRingStyles.visible]}
            aria-label={lang.navBarMore}
            data-current={current || undefined}
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
    <nav {...mergeAttrs<'nav'>(dataAttrs(navBarPart('root')), rest)}>
      <ul
        {...mergeAttrs<'ul'>({ sx: navBarStyles.list, ...navBarPart('list') }, propsList, {
          ref: _toRef(list),
        })}
      >
        {items.map((item, index) => (
          <li
            key={item.href ?? item.label}
            {...css.attrs(navBarStyles.item)}
            {...navBarPart('item')}
            {...overflow.itemProps(index)}
          >
            {renderItem(item)}
          </li>
        ))}
        <li {...css.attrs(navBarStyles.item)} {...navBarPart('item')} {...overflow.restProps()}>
          {renderMore()}
        </li>
      </ul>
    </nav>
  );
});
