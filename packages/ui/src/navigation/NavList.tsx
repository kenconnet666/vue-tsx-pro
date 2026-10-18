/**
 * 侧边导航，复合组件：NavList（nav > ul）> NavItem（链接）/ NavGroup（可展开的一组，里面再放 NavItem）。
 * 当前页按路由适配的 isActive 判断（也可以用 active 指定），带 aria-current="page" 与高亮；
 * 含当前页的分组自动展开。分组用 Collapsible（触发器带 aria-expanded / aria-controls）。
 *
 *   <NavList aria-label="后台">
 *     <NavItem href="/" icon={House}>概览</NavItem>
 *     <NavGroup label="订单" icon={Package}>
 *       <NavItem href="/orders">全部订单</NavItem>
 *       <NavItem href="/orders/refunds">退款</NavItem>
 *     </NavGroup>
 *   </NavList>
 *
 * 用 vue-router 时 vueRouterAdapter(router, { match: 'prefix' }) 能让 /orders 在 /orders/42 页面也高亮。
 */
import { ChevronRight } from '@lucide/icons';
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { onBeforeUnmount, watch, type VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { Collapsible, type CollapsibleProps } from '../display/Collapsible';
import { useRouterLink } from '../utils/link';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { rippleHostStyles, useRipple } from '../utils/ripple';
import { focusRingStyles, listStyles } from '../utils/styles';

/** 分组向里面的项要的信息：哪些项是当前页（有当前页时自动展开） */
interface NavGroupState {
  report(item: symbol, active: boolean): void;
}

const NavGroupContext = createContext<NavGroupState | null>('NavGroup');

const styles = stylex.create({
  list: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  nested: { paddingInlineStart: '_lg', paddingTop: '_xs' },
  // 链接与分组的触发器共用的外观
  row: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    width: '_full',
    minHeight: 'max(_sizes.control, _sizes.minTarget)',
    paddingInline: '_md',
    margin: 0,
    borderWidth: 0,
    borderRadius: '_md',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
    color: { default: '_textMuted', ':hover': '_text' },
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: '_medium',
    textAlign: 'start',
    textDecoration: 'none',
    cursor: 'pointer',
    transition:
      'background-color _durations.sm _easings.standard, color _durations.sm _easings.standard',
  },
  active: {
    backgroundColor: { default: '_accentSoft', ':hover': '_accentSoftHover' },
    color: { default: '_accentText', ':hover': '_accentText' },
  },
  disabled: { opacity: '_disabled', cursor: 'not-allowed', pointerEvents: 'none' },
  label: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chevron: { transition: 'transform _durations.md _easings.standard' },
  chevronOpen: { transform: 'rotate(90deg)' },
});

// ─────────────── NavList ───────────────

/** 未声明的属性落到 nav 上；aria-label 是导航的名称 */
export interface NavListProps extends PartProps<'nav'> {
  /** 列表（ul）的部件属性 */
  propsList?: PartProps<'ul'>;
  children?: VNodeChild;
}

/** 侧边导航（nav > ul），里面放 NavItem 与 NavGroup */
export const NavList = _component(({ propsList, children, ...rest }: NavListProps) => () => (
  <nav {...elementProps(mergeProps<'nav'>({}, rest))}>
    <ul {...elementProps(mergeProps<'ul'>({ sx: [listStyles.reset, styles.list] }, propsList))}>
      {children}
    </ul>
  </nav>
));

// ─────────────── NavItem ───────────────

/** 地址与当前页由组件管理 */
type ItemManaged = 'href' | 'aria-current';

/** 未声明的属性落到链接（a）上 */
export interface NavItemProps extends PartProps<'a', ItemManaged> {
  /** 链接地址 */
  href: string;
  /** 文字前的图标 */
  icon?: IconData;
  /** 是否是当前页；不写时按路由适配的 isActive 判断 */
  active?: boolean;
  /** 不可用：不能点、不能聚焦 */
  disabled?: boolean;
  /** 文字后面的内容，如 Badge 计数 */
  end?: VNodeChild;
  /** 按下时的波纹；不写时沿用全局配置 */
  ripple?: boolean;
  /** 外层 li 的部件属性 */
  propsItem?: PartProps<'li'>;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
  children?: VNodeChild;
}

/** 导航项（li > a）：当前页高亮并带 aria-current="page" */
export const NavItem = _component(
  ({
    href,
    icon,
    active,
    disabled = false,
    end,
    ripple,
    propsItem,
    propsIcon,
    propsLabel,
    onClick,
    children,
    ...rest
  }: NavItemProps) => {
    const router = useRouterLink();
    const group = NavGroupContext.inject(null);
    const onRipple = useRipple(() => ripple);
    const current = _derived(active ?? router.isActive(href));
    const id = Symbol('NavItem');

    // 告诉所在的分组自己是不是当前页（分组据此自动展开）
    if (group) {
      watch(
        () => current,
        (value) => group.report(id, value),
        { immediate: true },
      );
      onBeforeUnmount(() => group.report(id, false));
    }

    return () => (
      <li {...elementProps(mergeProps<'li'>({}, propsItem))}>
        <a
          {...elementProps(
            mergeProps<'a'>(
              {
                sx: [
                  styles.row,
                  focusRingStyles.visible,
                  rippleHostStyles.host,
                  current && styles.active,
                  disabled && styles.disabled,
                ],
              },
              rest,
              {
                href: disabled ? undefined : href,
                'aria-current': current ? 'page' : undefined,
                'aria-disabled': disabled || undefined,
                onClick: (event: MouseEvent) => {
                  (onClick as ((event: MouseEvent) => void) | undefined)?.(event);
                  router.onClick(event);
                },
                onPointerdown: onRipple,
                onKeydown: onRipple,
              },
            ),
          )}
          data-state={current ? 'active' : 'inactive'}
        >
          {icon && <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />}
          <span {...elementProps(mergeProps<'span'>({ sx: styles.label }, propsLabel))}>
            {children}
          </span>
          {end}
        </a>
      </li>
    );
  },
);

// ─────────────── NavGroup ───────────────

/** 未声明的属性落到外层 li 上 */
export interface NavGroupProps extends PartProps<'li'> {
  /** 分组标题 */
  label: VNodeChild;
  /** 标题前的图标 */
  icon?: IconData;
  /** 是否展开：父级写 open={_bind(x)}；含当前页时自动展开 */
  open?: boolean;
  /** 标题按钮的部件属性 */
  propsTrigger?: PartProps<'button', 'aria-expanded' | 'aria-controls'>;
  /** 展开区（Collapsible）的部件属性 */
  propsContent?: Partial<CollapsibleProps>;
  /** 里面的列表（ul）的部件属性 */
  propsList?: PartProps<'ul'>;
  /** 标题文字的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 标题图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  children?: VNodeChild;
}

/** 可展开的导航分组（li > 按钮 + 子列表） */
export const NavGroup = _component(
  ({
    label,
    icon,
    open = _bindable(false),
    propsTrigger,
    propsContent,
    propsList,
    propsLabel,
    propsIcon,
    children,
    ...rest
  }: NavGroupProps) => {
    const activeItems = new Set<symbol>();
    NavGroupContext.provide({
      report(item, active) {
        if (active) activeItems.add(item);
        else activeItems.delete(item);
        // 进入含当前页的分组时自动展开；离开时不自动收起（用户可能还想看）
        if (activeItems.size > 0) open = true;
      },
    });

    return () => (
      <li {...elementProps(mergeProps<'li'>({}, rest))}>
        <Collapsible
          {...mergePartProps<CollapsibleProps>(
            {
              trigger: (props) => (
                <button
                  {...elementProps(
                    mergeProps<'button'>(
                      { sx: [styles.row, focusRingStyles.visible], type: 'button' },
                      propsTrigger,
                      props,
                    ),
                  )}
                >
                  {icon && <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />}
                  <span {...elementProps(mergeProps<'span'>({ sx: styles.label }, propsLabel))}>
                    {label}
                  </span>
                  <Icon
                    icon={ChevronRight}
                    flipInRtl
                    sx={[styles.chevron, open && styles.chevronOpen]}
                  />
                </button>
              ),
            },
            propsContent,
          )}
          open={_bind(open)}
        >
          <ul
            {...elementProps(
              mergeProps<'ul'>({ sx: [listStyles.reset, styles.list, styles.nested] }, propsList),
            )}
          >
            {children}
          </ul>
        </Collapsible>
      </li>
    );
  },
);
