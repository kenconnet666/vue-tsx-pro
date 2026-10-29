/**
 * 侧边导航，复合组件：NavList（nav > ul）> NavItem（链接）/ NavGroup（可展开的一组）/ NavSection（带小标题的一组，
 * 不能收起：文档站这类链接多、按主题分组的侧栏），里面再放 NavItem。
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
 *
 * 紧凑（compact）：侧栏窄到只放得下图标时，各项只显示图标（文字留给读屏，悬停、聚焦时用 Tooltip 显示），
 * 小节标题换成它的图标（不能点）；分组也只剩图标，悬停、聚焦时子项从右边弹出来（HoverCard，完整的文字，
 * Tab 进入），组里有当前页时图标高亮。AppShell 的抽屉式侧栏拖窄时自动进入（NavCompactContext），
 * 也可以直接写 <NavList compact>。
 *
 * NavItem 的 badge 是计数角标（待办、未读）：展开时在文字后面，紧凑时是图标右上角的小圆点（读屏照样念出数目）。
 */
import { ChevronRight } from '@lucide/icons';
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onBeforeUnmount, useId, watch, type VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Badge } from '../base/Badge';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { Indicator } from '../base/Indicator';
import { visuallyHiddenStyles } from '../base/VisuallyHidden';
import { Collapsible, type CollapsibleProps } from '../display/Collapsible';
import { HoverCard } from '../overlay/HoverCard';
import { Tooltip, type TooltipTriggerProps } from '../overlay/Tooltip';
import { useLang } from '../config/context';
import { useRouterLink } from '../utils/dom/link';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { rippleHostStyles, useRipple } from '../utils/dom/ripple';
import { itemStyles } from '../utils/style/item-styles';
import { focusRingStyles } from '../utils/style/styles';
import type { StatusTone } from '../utils/style/tone-styles';
import { FlexList, type FlexProps } from '../layout/Flex';
import { t } from '../config/theme/tokens';

/** 分组向里面的项要的信息：哪些项是当前页（有当前页时自动展开） */
export interface NavGroupState {
  /** 组内的一项报告自己是不是当前页（item 是这一项的标识） */
  report(item: symbol, active: boolean): void;
}

/** NavGroup 的上下文：组内的项据此缩进；不在组内时为 null */
export const NavGroupContext = createContext<NavGroupState | null>('NavGroup');

/** 导航是不是紧凑（只显示图标）：AppShell 按侧栏宽度提供，NavList 的 compact 可以覆盖 */
export const NavCompactContext = createContext<() => boolean>('NavCompact');

/** NavList 的样式：nested、row、current、disabled、chevron、section、sectionLabel 等 */
export const navListStyles = css.create({
  nested: { paddingInlineStart: '_lg', paddingTop: '_xs' },
  // 链接与分组的触发器共用：列表行（itemStyles）之上，导航项更宽松、字重更重，平时是次要颜色
  row: {
    paddingInline: '_md',
    borderRadius: '_md',
    color: { default: '_textMuted', ':hover': '_text' },
    fontWeight: '_medium',
  },
  // 当前页的颜色来自 itemStyles.current；悬停时也保持品牌色
  current: { color: { default: '_accentText', ':hover': '_accentText' } },
  disabled: { pointerEvents: 'none' },
  chevron: { transition: `transform ${t.durations.md} ${t.easings.standard}` },
  chevronOpen: { transform: 'rotate(90deg)' },
  // 小节之间留出间隔，第一节贴着顶部
  // 多栏排版（AppShell 的上下抽屉）时一个小节不被拆到两栏
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_xs',
    marginBlockStart: { default: '_lg', ':first-child': 0 },
    breakInside: 'avoid',
  },
  // 标题行的内边距、图标与间距和链接行同一套（随所在字号），图标与文字才和下面的项上下对齐；只有文字小一档、加粗
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    paddingBlock: '_xs',
    paddingInline: '_md',
    color: '_text',
  },
  sectionText: { fontSize: '_sm', fontWeight: '_semibold', letterSpacing: '_wide' },
  // 小节标题的图标只是标记，比链接的图标淡
  sectionIcon: { color: '_textMuted', flexShrink: 0 },
  // 紧凑：图标居中；小节标题只剩图标，上面一条细线与上一节隔开
  compactRow: { justifyContent: 'center', paddingInline: 0 },
  compactSection: {
    justifyContent: 'center',
    paddingInline: 0,
    paddingBlockStart: '_sm',
    borderBlockStartWidth: '_xs',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_borderMuted',
  },
  compactNested: { paddingInlineStart: 0 },
  // 紧凑分组弹出的卡片：比侧栏宽，放得下完整的文字
  flyout: { padding: '_xs', minWidth: '12em' },
});

// ─────────────── NavList ───────────────

/** 未声明的属性落到 nav 上；aria-label 是导航的名称 */
export interface NavListProps extends PartProps<'nav'> {
  /** 紧凑：只显示图标；不写时跟随所在的 AppShell 侧栏（拖窄时紧凑） */
  compact?: boolean;
  /** 列表（ul）的部件属性 */
  propsList?: Partial<FlexProps<'ul'>>;
  children?: VNodeChild;
}

/** 侧边导航（nav > ul），里面放 NavItem 与 NavGroup */
export const NavList = _component(({ compact, propsList, children, ...rest }: NavListProps) => {
  const inherited = NavCompactContext.inject(() => false);
  const isCompact = () => compact ?? inherited();
  NavCompactContext.provide(isCompact);
  return () => (
    <nav {...mergeAttrs<'nav'>({}, rest)} data-compact={isCompact() || undefined}>
      <FlexList {...mergePartProps<FlexProps<'ul'>>({ direction: 'column', gap: 'xs' }, propsList)}>
        {children}
      </FlexList>
    </nav>
  );
});

// ─────────────── NavItem ───────────────

/** 地址与当前页由组件管理 */
export type NavItemManaged = 'href' | 'aria-current';

/** 未声明的属性落到链接（a）上 */
export interface NavItemProps extends PartProps<'a', NavItemManaged> {
  /** 链接地址 */
  href: string;
  /** 文字前的图标 */
  icon?: IconData;
  /** 是否是当前页；不写时按路由适配的 isActive 判断 */
  active?: boolean;
  /** 不可用：不能点、不能聚焦 */
  disabled?: boolean;
  /** 文字后面的内容（自定义的标记）；只是计数时用 badge */
  end?: VNodeChild;
  /** 计数角标（待办、未读）：展开时是文字后面的 Badge，紧凑时是图标右上角的小圆点；0 不显示 */
  badge?: number;
  /** 角标的色调，默认 danger */
  badgeTone?: StatusTone;
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
    badge = 0,
    badgeTone = 'danger',
    ripple,
    propsItem,
    propsIcon,
    propsLabel,
    children,
    ...rest
  }: NavItemProps) => {
    const lang = useLang();
    const router = useRouterLink();
    const group = NavGroupContext.inject(null);
    const rippleHandlers = useRipple(() => ripple);
    const current = _derived(active ?? router.isActive(href));
    const compact = NavCompactContext.inject(() => false);
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

    const iconOnly = () => compact() && icon != null;
    // tooltip：只剩图标时 Tooltip 给触发器的属性（定位用的 ref、悬停与聚焦的事件）
    const link = (tooltip?: TooltipTriggerProps) => (
      <a
        {...mergeAttrs<'a'>(
          {
            ...tooltip,
            sx: [
              itemStyles.row,
              itemStyles.hoverable,
              navListStyles.row,
              focusRingStyles.visible,
              rippleHostStyles.host,
              iconOnly() && navListStyles.compactRow,
              current && [itemStyles.current, navListStyles.current],
              disabled && [itemStyles.disabled, navListStyles.disabled],
            ],
          },
          rest,
          {
            href: disabled ? undefined : router.href(href),
            'aria-current': current ? 'page' : undefined,
            'aria-disabled': disabled || undefined,
            // 使用方的 onClick 先执行，preventDefault 可以拦下路由跳转
            onClick: (event: MouseEvent) => router.onClick(event, href),
            ...rippleHandlers,
          },
        )}
        data-state={current ? 'active' : 'inactive'}
      >
        {icon &&
          (iconOnly() && badge > 0 ? (
            // 紧凑：图标右上角一个小圆点（图标太小，叠不下数字）；读屏照样念出数目
            <Indicator dot tone={badgeTone} label={lang.indicatorCount(badge)}>
              <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />
            </Indicator>
          ) : (
            <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />
          ))}
        <span
          {...mergeAttrs<'span'>(
            { sx: [itemStyles.label, iconOnly() && visuallyHiddenStyles.hidden] },
            propsLabel,
          )}
        >
          {children}
        </span>
        {!iconOnly() && end}
        {!iconOnly() && badge > 0 && (
          <Badge size="xs" variant="solid" tone={badgeTone} radius="full">
            {badge > 99 ? '99+' : badge}
          </Badge>
        )}
      </a>
    );

    return () => (
      <li {...mergeAttrs<'li'>({}, propsItem)}>
        {iconOnly() ? (
          // 只剩图标：名称在读屏的文字里，看的人悬停、聚焦时从提示里读
          <Tooltip placement="right" delay={200} trigger={link}>
            {children}
          </Tooltip>
        ) : (
          link()
        )}
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
  /** 是否展开：父级写 _open={x}；含当前页时自动展开 */
  _open?: boolean;
  /** 标题按钮的部件属性 */
  propsTrigger?: Omit<Partial<ButtonBaseProps>, 'aria-expanded' | 'aria-controls'>;
  /** 展开区（Collapsible）的部件属性 */
  propsContent?: Partial<CollapsibleProps>;
  /** 里面的列表（ul）的部件属性 */
  propsList?: Partial<FlexProps<'ul'>>;
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
    _open: open = _bindable(false),
    propsTrigger,
    propsContent,
    propsList,
    propsLabel,
    propsIcon,
    children,
    ...rest
  }: NavGroupProps) => {
    const compact = NavCompactContext.inject(() => false);
    const iconOnly = () => compact() && icon != null;
    const activeItems = new Set<symbol>();
    // 组里有当前页：紧凑时分组的图标也高亮
    let hasCurrent = _state(false);
    NavGroupContext.provide({
      report(item, active) {
        if (active) activeItems.add(item);
        else activeItems.delete(item);
        hasCurrent = activeItems.size > 0;
        // 进入含当前页的分组时自动展开；离开时不自动收起（用户可能还想看）
        if (activeItems.size > 0) open = true;
      },
    });

    /** 紧凑时：只剩图标，悬停、聚焦时子项从右边弹出来（完整的文字，不再紧凑） */
    function renderFlyout() {
      return (
        <li {...mergeAttrs<'li'>({}, rest)}>
          <HoverCard
            placement="right-start"
            delay={150}
            // 子项一直渲染：它们要报告自己是不是当前页，分组的图标才知道要不要高亮
            lazy={false}
            sx={navListStyles.flyout}
            trigger={(props) => (
              <ButtonBase
                {...mergePartProps<ButtonBaseProps>(
                  {
                    sx: [
                      itemStyles.row,
                      itemStyles.hoverable,
                      navListStyles.row,
                      navListStyles.compactRow,
                      hasCurrent && [itemStyles.current, navListStyles.current],
                    ],
                  },
                  propsTrigger,
                  props as Partial<ButtonBaseProps>,
                )}
                data-state={hasCurrent ? 'active' : 'inactive'}
              >
                <Icon {...mergePartProps<IconProps>({ icon: icon! }, propsIcon)} />
                <span {...mergeAttrs<'span'>({ sx: visuallyHiddenStyles.hidden }, propsLabel)}>
                  {label}
                </span>
              </ButtonBase>
            )}
          >
            <NavFlyoutContent label={label} propsList={propsList}>
              {children}
            </NavFlyoutContent>
          </HoverCard>
        </li>
      );
    }

    return () =>
      iconOnly() ? (
        renderFlyout()
      ) : (
        <li {...mergeAttrs<'li'>({}, rest)}>
          <Collapsible
            {...mergePartProps<CollapsibleProps>(
              {
                trigger: (props) => (
                  <ButtonBase
                    {...mergePartProps<ButtonBaseProps>(
                      {
                        sx: [
                          itemStyles.row,
                          itemStyles.hoverable,
                          navListStyles.row,
                          iconOnly() && navListStyles.compactRow,
                        ],
                      },
                      propsTrigger,
                      props,
                    )}
                  >
                    {icon && <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />}
                    <span
                      {...mergeAttrs<'span'>(
                        { sx: [itemStyles.label, iconOnly() && visuallyHiddenStyles.hidden] },
                        propsLabel,
                      )}
                    >
                      {label}
                    </span>
                    {!iconOnly() && (
                      <Icon
                        icon={ChevronRight}
                        flipInRtl
                        sx={[navListStyles.chevron, open && navListStyles.chevronOpen]}
                      />
                    )}
                  </ButtonBase>
                ),
              },
              propsContent,
            )}
            _open={open}
          >
            <FlexList
              {...mergePartProps<FlexProps<'ul'>>(
                {
                  direction: 'column',
                  gap: 'xs',
                  sx: [navListStyles.nested, compact() && navListStyles.compactNested],
                },
                propsList,
              )}
            >
              {children}
            </FlexList>
          </Collapsible>
        </li>
      );
  },
);

/** 紧凑分组弹出来的内容：标题加完整的导航项（里面不再紧凑） */
const NavFlyoutContent = _component(
  ({
    label,
    propsList,
    children,
  }: {
    label: VNodeChild;
    propsList?: Partial<FlexProps<'ul'>>;
    children?: VNodeChild;
  }) => {
    NavCompactContext.provide(() => false);
    return () => (
      <>
        <span {...css.attrs(navListStyles.sectionLabel)}>{label}</span>
        <FlexList
          {...mergePartProps<FlexProps<'ul'>>({ direction: 'column', gap: 'xs' }, propsList)}
        >
          {children}
        </FlexList>
      </>
    );
  },
);

// ─────────────── NavSection ───────────────

/** 未声明的属性落到外层 li 上 */
export interface NavSectionProps extends PartProps<'li'> {
  /** 小节标题，同时是这组链接的无障碍名称 */
  label: VNodeChild;
  /** 标题前的图标：只是标记、不能点；紧凑时标题只剩它 */
  icon?: IconData;
  /** 标题的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 标题图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 里面的列表（ul）的部件属性 */
  propsList?: Partial<FlexProps<'ul'>>;
  /** 小节里的 NavItem */
  children?: VNodeChild;
}

/** 带小标题的一组导航链接（li > 标题 + ul）：一直展开，不能收起；要收起用 NavGroup */
export const NavSection = _component(
  ({ label, icon, propsLabel, propsIcon, propsList, children, ...rest }: NavSectionProps) => {
    const labelId = useId();
    const compact = NavCompactContext.inject(() => false);
    const iconOnly = () => compact() && icon != null;
    return () => (
      <li {...mergeAttrs<'li'>({ sx: navListStyles.section }, rest)}>
        <span
          {...mergeAttrs<'span'>(
            { sx: [navListStyles.sectionLabel, iconOnly() && navListStyles.compactSection] },
            propsLabel,
          )}
        >
          {icon && (
            <Icon
              {...mergePartProps<IconProps>({ icon, sx: navListStyles.sectionIcon }, propsIcon)}
            />
          )}
          <span
            id={labelId}
            {...css.attrs(navListStyles.sectionText, iconOnly() && visuallyHiddenStyles.hidden)}
          >
            {label}
          </span>
        </span>
        <FlexList
          {...mergePartProps<FlexProps<'ul'>>({ direction: 'column', gap: 'xs' }, propsList, {
            'aria-labelledby': labelId,
          })}
        >
          {children}
        </FlexList>
      </li>
    );
  },
);
