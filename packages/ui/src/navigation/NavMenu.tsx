/**
 * 数据驱动的侧边导航：菜单是一棵树（后端按角色返回、或配置文件里写的），直接交给 NavMenu 渲染，不用自己递归拼 NavItem。
 *
 *   <NavMenu
 *     aria-label="主菜单"
 *     items={[
 *       { label: '首页', href: '/', icon: House },
 *       { label: '降本管理', icon: Boxes, children: [
 *         { label: '降本项目', href: '/projects', badge: 3 },
 *         { label: '台账', href: '/ledger' },
 *       ] },
 *     ]}
 *   />
 *
 * 有 children 的项是一组：顶层的显示成带小标题、一直展开的小节（topLevel="section"，默认）或可收起的分组（topLevel="group"），
 * 更深的层级都是可收起的分组（含当前页的组自动展开）；没有 children 的项是链接。没有 href 又没有可显示子项的项不显示
 * （后端返回的目录下没有该用户能看的页面时，目录自然消失）。当前页按路由适配判断（NavItem 的 active），也可以逐项写 active。
 * 紧凑与抽屉里的表现同 NavList，由所在的 AppShell 决定。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import type { NavBarItem } from './NavBar';
import { NavGroup, NavItem, NavList, NavSection, type NavListProps } from './NavList';

/** 菜单树的一项：字段同 NavBarItem（同一份菜单数据可以同时给顶部的 NavBar 和侧栏的 NavMenu），多层嵌套 */
export interface NavMenuItem extends Omit<NavBarItem, 'children'> {
  /** 同一层里唯一的标识（列表的 key），默认取 href，没有 href 时取 label */
  key?: string;
  /** 是否是当前页；不写时按路由适配判断 */
  active?: boolean;
  /** 子项：有可显示的子项时这一项是一组 */
  children?: readonly NavMenuItem[];
}

/** 顶层有子项的项怎么显示：section 带小标题、一直展开；group 可收起 */
export interface NavMenuTopLevels {
  /** 带小标题的小节，一直展开（默认） */
  section: unknown;
  /** 可收起的分组 */
  group: unknown;
}

/** 未声明的属性落到 nav 上；aria-label 是导航的名称 */
export interface NavMenuProps extends Omit<NavListProps, 'children'> {
  /** 菜单树 */
  items: readonly NavMenuItem[];
  /** 顶层有子项的项怎么显示，默认 section */
  topLevel?: keyof NavMenuTopLevels;
}

/** 这一项（或它的子孙）有没有能显示的页面：没有的目录不画 */
const visible = (item: NavMenuItem): boolean =>
  item.children?.length ? item.children.some(visible) : item.href !== undefined;

const keyOf = (item: NavMenuItem) => item.key ?? item.href ?? item.label;

function renderLink(item: NavMenuItem): VNodeChild {
  return (
    <NavItem
      key={keyOf(item)}
      href={item.href!}
      icon={item.icon}
      badge={item.badge}
      disabled={item.disabled}
      active={item.active}
    >
      {item.label}
    </NavItem>
  );
}

function renderNode(
  item: NavMenuItem,
  depth: number,
  topLevel: keyof NavMenuTopLevels,
): VNodeChild {
  if (!visible(item)) return null;
  if (!item.children?.length) return renderLink(item);
  const children = item.children.map((child) => renderNode(child, depth + 1, topLevel));
  return depth === 0 && topLevel === 'section' ? (
    <NavSection key={keyOf(item)} label={item.label} icon={item.icon}>
      {children}
    </NavSection>
  ) : (
    <NavGroup key={keyOf(item)} label={item.label} icon={item.icon}>
      {children}
    </NavGroup>
  );
}

/** 数据驱动的侧边导航：菜单树 → NavList、NavSection、NavGroup、NavItem */
export const NavMenu = _component(
  ({ items, topLevel = 'section', ...rest }: NavMenuProps) =>
    () => <NavList {...rest}>{items.map((item) => renderNode(item, 0, topLevel))}</NavList>,
);
