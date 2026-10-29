/**
 * 菜单（WAI-ARIA 的 Menu Button 模式）：按钮弹出一列操作，复合组件，参考 Radix DropdownMenu、React Aria Menu。
 *
 *   <Menu trigger={(props) => <Button {...props} iconEnd={ChevronDown}>操作</Button>}>
 *     <MenuItem icon={Pencil} onAction={edit}>编辑</MenuItem>
 *     <MenuItem icon={Copy} shortcut="Ctrl+D" onAction={duplicate}>复制</MenuItem>
 *     <Separator decorative={false} />
 *     <MenuGroup label="视图">
 *       <MenuCheckboxItem _checked={showGrid}>显示网格</MenuCheckboxItem>
 *     </MenuGroup>
 *     <MenuRadioGroup _value={sort} label="排序">
 *       <MenuRadioItem value="name">名称</MenuRadioItem>
 *       <MenuRadioItem value="date">日期</MenuRadioItem>
 *     </MenuRadioGroup>
 *     <MenuLinkItem href="/settings">设置</MenuLinkItem>
 *     <MenuItem icon={Trash2} tone="danger" onAction={remove}>删除</MenuItem>
 *   </Menu>
 *
 * 键盘：触发器上 Enter / 空格 / ↓ 打开并聚焦第一项，↑ 打开并聚焦最后一项；菜单里 ↑↓ 移动（循环）、Home / End、
 * 按字母跳到以它开头的项（rovingFocus 的 typeahead），Enter / 空格执行，Esc 关闭并回到触发器，Tab 关闭并继续往后。
 * 执行普通项后关闭菜单；复选项默认不关（常连续勾选几项），单选项默认关闭；都可以用 closeOnSelect 改。
 * 原生 popover="auto" 负责顶层、点击外部关闭与嵌套顺序，定位与焦点进出见 utils/dom/floating。
 */
import { Check, ChevronRight, Dot } from '@lucide/icons';
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { SxStyles } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onBeforeUnmount, useId, type VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { Text, type TextProps } from '../base/Text';
import {
  floatingStyles,
  pointAnchor,
  useAnchoredPopover,
  type FloatingOptions,
  type FloatingPlacement,
} from '../utils/dom/floating';
import { ariaKeyShortcut, formatHotkey, useHotkeys } from '../utils/dom/hotkeys';
import { ScrollArea } from '../layout/ScrollArea';
import { useRouterLink } from '../utils/dom/link';
import { toElement } from '../utils/dom/element';
import { useLazyContent, type LazyContentOptions } from '../utils/motion/presence';
import { childNodes } from '../utils/data/text';
import {
  hasContent,
  defaultLabelledBy,
  mergeAttrs,
  mergePartProps,
  type PartProps,
  type TriggerProps,
} from '../utils/props';
import { itemStyles } from '../utils/style/item-styles';
import { focusRingStyles } from '../utils/style/styles';
import { rippleHostStyles, useRipple } from '../utils/dom/ripple';
import { openSetter, type OpenChangeProps } from '../utils/dom/open-change';
import { rovingFocus } from '../utils/dom/roving-focus';
import { inlineArrows, isRtl } from '../utils/dom/direction';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { transitions } from '../utils/style/transitions';

/** Menu 交给菜单项的状态 */
export interface MenuState {
  /** 波纹；不写时沿用配置 */
  readonly ripple: boolean | undefined;
  /** 执行了一项：关闭菜单（onOpenChange 的原因是 select），焦点回到触发器 */
  close(event?: Event): void;
}

/** Menu 的上下文：自定义菜单项用 useMenuItem 读取 */
export const MenuContext = createContext<MenuState>('Menu');

/** MenuRadioGroup 交给组内单选项的状态 */
export interface MenuRadioGroupState {
  /** 选中的值 */
  readonly value: string | undefined;
  /** 选中一个值 */
  select(value: string): void;
}

/** MenuRadioGroup 的上下文 */
export const MenuRadioGroupContext = createContext<MenuRadioGroupState>('MenuRadioGroup');

/** 交给触发器的属性：展开到按钮上（`{...props}`） */
export interface MenuTriggerProps extends TriggerProps {
  /** 菜单以触发器的文字作为名称（aria-labelledby） */
  id: string;
  /** 取得触发器元素：定位的参照、关闭后焦点回到这里 */
  ref: (element: unknown) => void;
  /** ↓ / ↑ 打开并聚焦第一项 / 最后一项 */
  onKeydown: (event: KeyboardEvent) => void;
  /** 告诉读屏这个按钮会打开菜单 */
  'aria-haspopup': 'menu';
}

/** 未声明的属性落到菜单（role="menu" 的 div）上 */
export interface MenuProps
  extends
    PartProps<'div', 'id' | 'popover' | 'role'>,
    Pick<FloatingOptions, 'offset'>,
    LazyContentOptions,
    OpenChangeProps {
  /** 是否打开：父级可以写 _open={x}；Esc、点击外部、执行菜单项都会关闭并写回 */
  _open?: boolean;
  /** 弹出位置，默认 bottom-start；空间不够时自动翻转 */
  placement?: FloatingPlacement;
  /** 字号档位，菜单项随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 菜单项按下时的波纹；不写时沿用 createUi / Provider 的 ripple */
  ripple?: boolean;
  /** 触发器：`(props) => <Button {...props}>操作</Button>`；ContextMenu 不用触发器时返回 null */
  trigger: (props: MenuTriggerProps) => VNodeChild;
  /** 从视口里这个点弹出（右键菜单的指针位置），不以触发器为锚点；关闭后焦点由使用方安排 */
  point?: { x: number; y: number };
  /** 菜单项：MenuItem、MenuLinkItem、MenuCheckboxItem、MenuRadioGroup、MenuGroup、MenuSub、Separator */
  children?: VNodeChild;
}

/** 菜单项的选择器（漫游焦点、打开时聚焦第一项 / 最后一项） */
const ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/** 菜单自己的可用项：不含子菜单里的 */
function menuItemsOf(panel: HTMLElement | null): HTMLElement[] {
  return [...(panel?.querySelectorAll<HTMLElement>(ITEMS) ?? [])].filter(
    (item) =>
      item.parentElement?.closest('[role="menu"]') === panel &&
      !item.matches(':disabled, [aria-disabled="true"]'),
  );
}

/** Menu 的样式：panel、content、label、indicator、hidden、shortcut、groupLabel */
export const menuStyles = css.create({
  // 菜单项多时在 ScrollArea 里滚动（浮层滚动条）；内边距放在内容层上，滚动条贴着菜单边缘
  panel: {
    minWidth: '12em',
    maxWidth: 'calc(100vw - 2em)',
    lineHeight: '_normal',
  },
  content: { padding: '_xs' },
  label: { flexGrow: 1, minWidth: 0 },
  // 有说明时文字与说明上下排，作为一个整体占满剩余宽度
  text: { display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 },
  description: { display: 'block' },
  // 复选、单选的标记占一列，有没有勾都对齐
  indicator: { flexShrink: 0, width: '1em' },
  hidden: { visibility: 'hidden' },
  shortcut: { flexShrink: 0, marginInlineStart: '_lg' },
  groupLabel: {
    display: 'block',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    fontWeight: '_semibold',
  },
});

/** 菜单：触发器 + 弹出的一列菜单项 */
export const Menu = _component(
  ({
    _open: open = _bindable(false),
    onOpenChange,
    placement = 'bottom-start',
    offset,
    size,
    ripple,
    trigger,
    point,
    lazy = true,
    children,
    ...rest
  }: MenuProps) => {
    const id = useId();
    // 菜单项的快捷键在菜单没打开时也要能用：有快捷键的菜单照常渲染菜单项
    const showContent = useLazyContent(
      () => open,
      () => lazy,
    );
    const triggerId = `${id}-trigger`;
    let anchor = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    // 打开时聚焦哪一项；Tab 关闭时焦点照常往后走，不还给触发器
    let focusOnOpen: 'first' | 'last' = 'first';
    let restoreFocus = true;

    const enabledItems = () => menuItemsOf(panel);
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    MenuContext.provide({
      get ripple() {
        return ripple;
      },

      close: (event) => setOpen(false, 'select', event),
    });

    function onTriggerKeydown(event: KeyboardEvent) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      focusOnOpen = event.key === 'ArrowDown' ? 'first' : 'last';
      setOpen(true, 'trigger', event);
    }

    function onPanelKeydown(event: KeyboardEvent) {
      // Esc 也由原生 popover 关闭；这里显式关一次，不依赖各浏览器 close watcher 的细节（Firefox 偶尔不关）
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false, 'escape', event);
        return;
      }
      if (event.key !== 'Tab') return;
      restoreFocus = false;
      setOpen(false, 'focus', event);
    }

    const { onToggle } = useAnchoredPopover(
      () => ({
        open,
        anchor: point ? pointAnchor(point.x, point.y) : anchor,
        panel,
        floating: { placement, offset, fitHeight: true },
        restoreFocus,
      }),
      {
        close: (reason, event) => setOpen(false, reason, event),
        // 打开后聚焦第一项（↑ 打开时最后一项），并为下一次打开恢复默认
        shown: () => {
          const items = enabledItems();
          (focusOnOpen === 'first' ? items[0] : items.at(-1))?.focus();
          focusOnOpen = 'first';
          restoreFocus = true;
        },
      },
    );
    _effect(() =>
      panel
        ? rovingFocus(panel, { items: ITEMS, orientation: 'vertical', loop: true, typeahead: true })
        : undefined,
    );

    return () => (
      <>
        {trigger({
          id: triggerId,
          ref: (value) => (anchor = toElement(value)),
          onClick: (event: MouseEvent) => setOpen(!open, 'trigger', event),
          onKeydown: onTriggerKeydown,
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': id,
        })}
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                floatingStyles.anchored,
                floatingStyles.surface,
                floatingStyles.scrollPanel,
                menuStyles.panel,
                size && fontSizeStyles[size],
                transitions.scale,
              ],
              // 右键菜单没有触发器：名称由使用方的 aria-label 给
              'aria-labelledby': anchor ? defaultLabelledBy(rest, triggerId) : undefined,
            },
            rest,
            {
              ref: _toRef(panel),
              id,
              popover: 'auto',
              role: 'menu',
              onToggle,
              onKeydown: onPanelKeydown,
            },
          )}
          data-state={open ? 'open' : 'closed'}
        >
          <ScrollArea
            focusable={false}
            sx={floatingStyles.scrollArea}
            propsContent={{ sx: menuStyles.content }}
          >
            {(showContent() || hasShortcut(children)) && children}
          </ScrollArea>
        </div>
      </>
    );
  },
);

/** 菜单项内容（图标、文字、快捷键）的选项，各种菜单项共有 */
export interface MenuItemContentProps {
  /** 文字前的图标 */
  icon?: IconData;
  /**
   * 快捷键：`'Mod+D'`（Mod 在 macOS 上是 ⌘，其他系统是 Ctrl，写法见 useHotkeys）。右侧显示成当前系统的写法；
   * MenuItem、MenuCheckboxItem、MenuRadioItem 在菜单挂载期间注册它（菜单不必打开），按下时执行这一项；
   * 读屏从菜单项的 aria-keyshortcuts 得知快捷键
   */
  shortcut?: string;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 文字层的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 快捷键提示的部件属性 */
  propsShortcut?: Partial<TextProps>;
  /** 文字下方的说明（第二行，弱化）：读屏把它当作这一项的描述（aria-describedby），不算进名称 */
  description?: VNodeChild;
  /** 说明的部件属性 */
  propsDescription?: Partial<TextProps>;
  children?: VNodeChild;
}

/** 复选、单选项的标记：占一列，没勾选时只占位，各项文字对齐 */
export interface MenuItemMark {
  /** 勾选时显示的图标 */
  icon: IconData;
  /** 是否勾选 */
  checked: boolean;
  /** 标记图标的部件属性 */
  props?: Partial<IconProps>;
}

/** 有说明的菜单项：文字与说明各自的 id（名称只取文字，说明作为描述） */
export interface MenuItemContentIds {
  /** 文字的 id：菜单项的 aria-labelledby */
  label: string;
  /** 说明的 id：菜单项的 aria-describedby */
  description: string;
}

/** 菜单项文字与说明的 id；在菜单项的 setup 里调用 */
export function useMenuItemContentIds(): MenuItemContentIds {
  const id = useId();
  return { label: `${id}-label`, description: `${id}-description` };
}

/** 有说明时菜单项的名称只取文字、说明作为描述；没有说明时名称就是全部内容 */
export function menuItemDescribedBy(description: VNodeChild | undefined, ids: MenuItemContentIds) {
  return description == null
    ? {}
    : { 'aria-labelledby': ids.label, 'aria-describedby': ids.description };
}

/** 菜单项的内容：标记 + 图标 + 文字（与说明）+ 快捷键 */
export function menuItemContent(
  {
    icon,
    shortcut,
    description,
    propsIcon,
    propsLabel,
    propsShortcut,
    propsDescription,
    children,
  }: MenuItemContentProps,
  mark?: MenuItemMark,
  ids?: MenuItemContentIds,
): VNodeChild {
  return [
    mark && (
      <Icon
        {...mergePartProps<IconProps>(
          { icon: mark.icon, sx: [menuStyles.indicator, !mark.checked && menuStyles.hidden] },
          mark.props,
        )}
      />
    ),
    icon && <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />,
    description == null ? (
      <span {...mergeAttrs<'span'>({ sx: menuStyles.label }, propsLabel)}>{children}</span>
    ) : (
      <span {...css.attrs(menuStyles.text)}>
        <span {...mergeAttrs<'span'>({ id: ids?.label }, propsLabel)}>{children}</span>
        <Text
          {...mergePartProps<TextProps>(
            { tone: 'muted', size: 'sm', id: ids?.description, sx: menuStyles.description },
            propsDescription,
          )}
        >
          {description}
        </Text>
      </span>
    ),
    shortcut && (
      <Text
        {...mergePartProps<TextProps>(
          { tone: 'muted', size: 'sm', sx: menuStyles.shortcut },
          propsShortcut,
          // 有 aria-keyshortcuts 时读屏从它念，显示的文字不重复念；序列键没有，照常念
          { 'aria-hidden': keyShortcuts(shortcut) ? true : undefined },
        )}
      >
        {formatHotkey(shortcut)}
      </Text>
    ),
  ];
}

/** 快捷键交给读屏（aria-keyshortcuts）：右侧显示的快捷键文字对读屏隐藏，不重复念 */
const keyShortcuts = (shortcut: string | undefined) =>
  shortcut ? ariaKeyShortcut(shortcut) : undefined;

/** 菜单项的快捷键：不可用时不触发；按下时和点击这一项一样执行（不关心菜单是否打开） */
function useItemShortcut(read: () => { shortcut?: string; disabled: boolean }, run: () => void) {
  useHotkeys(() => {
    const { shortcut, disabled } = read();
    return shortcut && !disabled ? { [shortcut]: run } : {};
  });
}

/** 菜单项的色调：菜单里只区分普通操作与破坏性操作，其余状态色会让一列选项显得像警报 */
export type MenuItemTone = 'neutral' | 'danger';

/** 菜单项的外观：幽灵按钮，内容靠起始边排列 */
export function menuItemSx(tone: MenuItemTone, disabled: boolean): SxStyles {
  return [
    itemStyles.row,
    tone === 'danger' ? itemStyles.danger : itemStyles.hoverable,
    focusRingStyles.visible,
    rippleHostStyles.host,
    disabled && itemStyles.disabled,
  ] as SxStyles;
}

/** 菜单项共用的：所在的菜单、按下的波纹（链接项用；按钮项由 ButtonBase 给出）、执行后关闭菜单 */
export function useMenuItem() {
  const menu = MenuContext.inject();
  return {
    menu,
    ripple: useRipple(() => menu.ripple),
    close: (event?: Event) => menu.close(event),
  };
}

/** 按钮类菜单项这一次渲染的取值 */
interface ButtonItemOptions {
  role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
  tone?: MenuItemTone;
  disabled: boolean;
  closeOnSelect: boolean;
  /** 勾选与单选项的状态；普通项不写 */
  checked?: boolean;
  /** 勾选与单选项起始边的标记 */
  indicator?: MenuItemMark;
  content: MenuItemContentProps;
  /** 使用方的其余属性，落到 button 上 */
  attrs: object;
}

/**
 * 按钮类菜单项（MenuItem、MenuCheckboxItem、MenuRadioItem）共用的：快捷键、说明的关联、外观与角色，
 * 执行（点击、Enter、空格、快捷键）时调用 run，点击后按 closeOnSelect 关闭菜单。返回渲染函数
 */
function useButtonItem(
  read: () => { shortcut?: string; disabled: boolean },
  run: () => void,
): (options: ButtonItemOptions) => VNodeChild {
  const item = useMenuItem();
  const ids = useMenuItemContentIds();
  useItemShortcut(read, run);
  return ({
    role,
    tone = 'neutral',
    disabled,
    closeOnSelect,
    checked,
    indicator,
    content,
    attrs,
  }) => (
    <ButtonBase
      {...mergePartProps<ButtonBaseProps>(
        { sx: menuItemSx(tone, disabled), ripple: item.menu.ripple },
        attrs as Partial<ButtonBaseProps>,
        {
          role,
          disabled,
          'aria-keyshortcuts': keyShortcuts(content.shortcut),
          'aria-checked': checked,
          ...menuItemDescribedBy(content.description, ids),
          // 使用方的 onClick 先执行，preventDefault 可以拦下执行与关闭（mergeProps 的规则）
          onClick: (event: MouseEvent) => {
            run();
            if (closeOnSelect) item.close(event);
          },
        },
      )}
      data-state={checked == null ? undefined : checked ? 'checked' : 'unchecked'}
    >
      {menuItemContent(content, indicator, ids)}
    </ButtonBase>
  );
}

/** 按钮类菜单项共有的属性；未声明的属性落到 button 上 */
export interface MenuButtonItemProps
  // 原生的 onSelect 是文字选中事件，不是“选了这一项”：去掉它，误写成 onSelect 时类型检查会报错（用 onAction）
  extends
    PartProps<'button', 'role' | 'type' | 'disabled' | 'aria-checked' | 'onSelect'>,
    MenuItemContentProps {
  /** 不可用：跳过方向键移动，不能执行 */
  disabled?: boolean;
  /** 执行后是否关闭菜单 */
  closeOnSelect?: boolean;
}

/** 未声明的属性落到 button（role="menuitem"）上 */
export interface MenuItemProps extends MenuButtonItemProps {
  /** 色调：删除等破坏性操作用 danger，默认 neutral */
  tone?: MenuItemTone;
  /** 执行（点击、Enter、空格）时调用；默认随后关闭菜单 */
  onAction?: () => void;
}

/** 普通菜单项：执行一个操作 */
export const MenuItem = _component(
  ({
    tone = 'neutral',
    disabled = false,
    closeOnSelect = true,
    onAction,
    icon,
    shortcut,
    description,
    propsIcon,
    propsLabel,
    propsShortcut,
    propsDescription,
    children,
    ...rest
  }: MenuItemProps) => {
    const render = useButtonItem(
      () => ({ shortcut, disabled }),
      () => onAction?.(),
    );
    return () =>
      render({
        role: 'menuitem',
        tone,
        disabled,
        closeOnSelect,
        attrs: rest,
        content: {
          icon,
          shortcut,
          description,
          propsIcon,
          propsLabel,
          propsShortcut,
          propsDescription,
          children,
        },
      });
  },
);

/** 未声明的属性落到 a（role="menuitem"）上 */
export interface MenuLinkItemProps
  extends PartProps<'a', 'role' | 'aria-disabled'>, MenuItemContentProps {
  /** 地址：站内链接经路由适配跳转，新标签页打开等照常交给浏览器 */
  href: string;
  /** 不可用：去掉 href，跳过方向键移动 */
  disabled?: boolean;
}

/** 链接菜单项（a）：跳转到一个地址，随后关闭菜单 */
export const MenuLinkItem = _component(
  ({
    href,
    disabled = false,
    icon,
    shortcut,
    description,
    propsIcon,
    propsLabel,
    propsShortcut,
    propsDescription,
    children,
    ...rest
  }: MenuLinkItemProps) => {
    const item = useMenuItem();
    const ids = useMenuItemContentIds();
    const router = useRouterLink();
    return () => (
      <a
        {...mergeAttrs<'a'>({ sx: menuItemSx('neutral', disabled) }, rest, {
          role: 'menuitem',
          href: disabled ? undefined : router.href(href),
          'aria-keyshortcuts': keyShortcuts(shortcut),
          'aria-disabled': disabled || undefined,
          ...menuItemDescribedBy(description, ids),
          onClick: (event: MouseEvent) => {
            // 不可用的项不响应点击：不跳转，也不关闭菜单
            if (disabled) return event.preventDefault();
            router.onClick(event, href);
            item.close(event);
          },
          ...item.ripple,
        })}
        data-disabled={disabled || undefined}
      >
        {menuItemContent(
          {
            icon,
            shortcut,
            description,
            propsIcon,
            propsLabel,
            propsShortcut,
            propsDescription,
            children,
          },
          undefined,
          ids,
        )}
      </a>
    );
  },
);

/** 未声明的属性落到 button（role="menuitemcheckbox"）上 */
export interface MenuCheckboxItemProps extends MenuButtonItemProps {
  /** 是否勾选：父级写 _checked={x} */
  _checked?: boolean;
  /** 勾选标记的部件属性 */
  propsIndicator?: Partial<IconProps>;
}

/** 复选菜单项：切换一个开关；默认执行后不关闭菜单 */
export const MenuCheckboxItem = _component(
  ({
    _checked: checked = _bindable(false),
    disabled = false,
    closeOnSelect = false,
    propsIndicator,
    icon,
    shortcut,
    description,
    propsIcon,
    propsLabel,
    propsShortcut,
    propsDescription,
    children,
    ...rest
  }: MenuCheckboxItemProps) => {
    const render = useButtonItem(
      () => ({ shortcut, disabled }),
      () => (checked = !checked),
    );
    return () =>
      render({
        role: 'menuitemcheckbox',
        disabled,
        closeOnSelect,
        checked,
        indicator: { icon: Check, checked, props: propsIndicator },
        attrs: rest,
        content: {
          icon,
          shortcut,
          description,
          propsIcon,
          propsLabel,
          propsShortcut,
          propsDescription,
          children,
        },
      });
  },
);

/** 未声明的属性落到分组的 div（role="group"）上 */
export interface MenuGroupProps extends PartProps<'div', 'role'> {
  /** 分组的标题（显示在组内第一行，同时是分组的名称） */
  label?: VNodeChild;
  /** 标题的部件属性 */
  propsLabel?: Partial<TextProps>;
  children?: VNodeChild;
}

/** 渲染分组：role="group"，有标题时 aria-labelledby 指向它 */
function renderGroup(
  labelId: string,
  { label, propsLabel, children, ...rest }: MenuGroupProps,
): VNodeChild {
  return (
    <div
      {...mergeAttrs<'div'>({}, rest, {
        role: 'group',
        'aria-labelledby': hasContent(label) ? labelId : undefined,
      })}
    >
      {hasContent(label) && (
        <Text
          {...mergePartProps<TextProps>(
            { tone: 'muted', size: 'sm', sx: menuStyles.groupLabel },
            propsLabel,
            { id: labelId },
          )}
        >
          {label}
        </Text>
      )}
      {children}
    </div>
  );
}

/** 菜单里的一组项，带可选的标题 */
export const MenuGroup = _component(({ label, propsLabel, children, ...rest }: MenuGroupProps) => {
  const labelId = useId();
  return () => renderGroup(labelId, { label, propsLabel, children, ...rest });
});

/** 未声明的属性落到分组的 div（role="group"）上 */
export interface MenuRadioGroupProps extends MenuGroupProps {
  /** 选中项的值：父级写 _value={x} */
  _value?: string;
}

/** 一组单选菜单项：同一时间只选中一项 */
export const MenuRadioGroup = _component(
  ({
    _value: value = _bindable<string | undefined>(undefined),
    label,
    propsLabel,
    children,
    ...rest
  }: MenuRadioGroupProps) => {
    const labelId = useId();
    MenuRadioGroupContext.provide({
      get value() {
        return value;
      },
      select: (next) => (value = next),
    });
    return () => renderGroup(labelId, { label, propsLabel, children, ...rest });
  },
);

/** 未声明的属性落到 button（role="menuitemradio"）上 */
export interface MenuRadioItemProps extends MenuButtonItemProps {
  /** 这一项的值 */
  value: string;
  /** 选中标记的部件属性 */
  propsIndicator?: Partial<IconProps>;
}

/** 单选菜单项：放在 MenuRadioGroup 里；默认执行后关闭菜单 */
export const MenuRadioItem = _component(
  ({
    value,
    disabled = false,
    closeOnSelect = true,
    propsIndicator,
    icon,
    shortcut,
    description,
    propsIcon,
    propsLabel,
    propsShortcut,
    propsDescription,
    children,
    ...rest
  }: MenuRadioItemProps) => {
    const group = MenuRadioGroupContext.inject();
    const render = useButtonItem(
      () => ({ shortcut, disabled }),
      () => group.select(value),
    );
    return () => {
      const checked = group.value === value;
      return render({
        role: 'menuitemradio',
        disabled,
        closeOnSelect,
        checked,
        indicator: { icon: Dot, checked, props: propsIndicator },
        attrs: rest,
        content: {
          icon,
          shortcut,
          description,
          propsIcon,
          propsLabel,
          propsShortcut,
          propsDescription,
          children,
        },
      });
    };
  },
);

/** 未声明的属性落到打开子菜单的 button（role="menuitem"）上 */
export interface MenuSubProps
  extends
    PartProps<
      'button',
      'role' | 'type' | 'disabled' | 'aria-haspopup' | 'aria-expanded' | 'aria-controls'
    >,
    Omit<MenuItemContentProps, 'shortcut' | 'propsShortcut' | 'children'>,
    OpenChangeProps {
  /** 这一项的文字 */
  label: VNodeChild;
  /** 不可用：不能打开子菜单 */
  disabled?: boolean;
  /** 子菜单是否打开：父级可以写 _open={x} */
  _open?: boolean;
  /** 子菜单（role="menu" 的 div）的部件属性 */
  propsPanel?: PartProps<'div', 'id' | 'popover' | 'role'>;
  /** 右侧箭头的部件属性 */
  propsChevron?: Partial<IconProps>;
  /** 子菜单里的项 */
  children?: VNodeChild;
}

/** 指针停在子菜单项上多久后打开（毫秒） */
const SUBMENU_OPEN_DELAY = 100;
/** 指针离开后，在安全三角里最多保持多久（毫秒） */
const SUBMENU_GRACE = 400;

type Point = readonly [number, number];

/** 点 p 是否在三角形 abc 里（三条边的同侧判断） */
function inTriangle(p: Point, a: Point, b: Point, c: Point) {
  const side = (from: Point, to: Point) =>
    (p[0] - to[0]) * (from[1] - to[1]) - (from[0] - to[0]) * (p[1] - to[1]);
  const d1 = side(a, b);
  const d2 = side(b, c);
  const d3 = side(c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

/**
 * 子菜单：菜单里的一项，打开另一列菜单（WAI-ARIA 的子菜单）。→（从右到左排版时 ←）、Enter、空格打开并聚焦第一项，
 * 子菜单里 ←（→）或 Esc 关闭并回到这一项；指针停一会儿打开，朝子菜单斜着移动时经过别的项也不关（安全三角）。
 * 子菜单里执行一项后，整串菜单都关闭。
 *
 *   <MenuSub label="分享" icon={Share}>
 *     <MenuItem onAction={copyLink}>复制链接</MenuItem>
 *   </MenuSub>
 */
export const MenuSub = _component(
  ({
    label,
    _open: open = _bindable(false),
    onOpenChange,
    disabled = false,
    icon,
    propsIcon,
    propsLabel,
    propsPanel,
    propsChevron,
    children,
    ...rest
  }: MenuSubProps) => {
    const parent = MenuContext.inject();
    const id = useId();
    const triggerId = `${id}-trigger`;
    let trigger = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    let focusOnOpen = false;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let stopGrace: (() => void) | undefined;
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    MenuContext.provide({
      get ripple() {
        return parent.ripple;
      },

      close: (event) => {
        setOpen(false, 'select', event);
        parent.close(event);
      },
    });

    const { onToggle } = useAnchoredPopover(
      () => ({
        open,
        anchor: trigger,
        panel,
        // 往书写方向的结束边弹出；floating-ui 的 left / right 是物理方向
        floating: {
          placement: trigger && isRtl(trigger) ? 'left-start' : 'right-start',
          offset: 2,
          fitHeight: true,
        },
      }),
      {
        close: (reason, event) => setOpen(false, reason, event),
        shown: () => {
          if (focusOnOpen) menuItemsOf(panel)[0]?.focus();
          focusOnOpen = false;
        },
      },
    );
    _effect(() =>
      panel
        ? rovingFocus(panel, { items: ITEMS, orientation: 'vertical', loop: true, typeahead: true })
        : undefined,
    );
    onBeforeUnmount(() => {
      clearTimeout(openTimer);
      stopGrace?.();
    });

    const rtl = () => !!trigger && isRtl(trigger);

    function openWithFocus(event: Event) {
      if (disabled) return;
      focusOnOpen = true;
      // 已经开着（指针打开的）时直接把焦点移进去
      if (open) menuItemsOf(panel)[0]?.focus();
      setOpen(true, 'trigger', event);
    }

    function onTriggerKeydown(event: KeyboardEvent) {
      if (event.key !== inlineArrows(rtl()).forward) return;
      event.preventDefault();
      openWithFocus(event);
    }

    function onPanelKeydown(event: KeyboardEvent) {
      // Esc 只关最上层的子菜单，不冒泡到父菜单
      if (event.key !== 'Escape' && event.key !== inlineArrows(rtl()).backward) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, 'escape', event);
    }

    // 指针离开这一项：朝子菜单移动（在离开点与子菜单近边组成的三角形里）时保持打开，否则关闭
    function onTriggerPointerleave(event: PointerEvent) {
      clearTimeout(openTimer);
      if (!open || !panel) return;
      stopGrace?.();
      const rect = panel.getBoundingClientRect();
      const edge = rect.left >= event.clientX ? rect.left : rect.right;
      const start: Point = [event.clientX, event.clientY];
      const close = () => {
        stopGrace?.();
        setOpen(false, 'hover', event);
      };
      const onMove = (move: PointerEvent) => {
        const target = move.target as Node;
        if (panel?.contains(target) || trigger?.contains(target)) {
          stopGrace?.();
          return;
        }
        if (!inTriangle([move.clientX, move.clientY], start, [edge, rect.top], [edge, rect.bottom]))
          close();
      };
      const timer = setTimeout(close, SUBMENU_GRACE);
      document.addEventListener('pointermove', onMove);
      stopGrace = () => {
        clearTimeout(timer);
        document.removeEventListener('pointermove', onMove);
        stopGrace = undefined;
      };
    }

    function onTriggerPointerenter(event: PointerEvent) {
      if (disabled || event.pointerType === 'touch') return;
      stopGrace?.();
      clearTimeout(openTimer);
      openTimer = setTimeout(() => setOpen(true, 'hover', event), SUBMENU_OPEN_DELAY);
    }

    return () => (
      <>
        <ButtonBase
          {...mergePartProps<ButtonBaseProps>(
            { sx: menuItemSx('neutral', disabled), ripple: parent.ripple },
            rest as Partial<ButtonBaseProps>,
            {
              ref: (value: unknown) => (trigger = toElement(value)),
              id: triggerId,
              role: 'menuitem',
              disabled,
              'aria-haspopup': 'menu',
              'aria-expanded': open,
              'aria-controls': id,
              onClick: openWithFocus,
              onKeydown: onTriggerKeydown,
              onPointerenter: onTriggerPointerenter,
              onPointerleave: onTriggerPointerleave,
            },
          )}
          data-state={open ? 'open' : 'closed'}
        >
          {menuItemContent({ icon, propsIcon, propsLabel, children: label })}
          <Icon
            {...mergePartProps<IconProps>(
              { icon: ChevronRight, flipInRtl: true, sx: menuStyles.shortcut },
              propsChevron,
            )}
          />
        </ButtonBase>
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                floatingStyles.anchored,
                floatingStyles.surface,
                floatingStyles.scrollPanel,
                menuStyles.panel,
                transitions.scale,
              ],
              'aria-labelledby': defaultLabelledBy(propsPanel ?? {}, triggerId),
            },
            propsPanel,
            {
              ref: _toRef(panel),
              id,
              popover: 'auto',
              role: 'menu',
              onToggle,
              onKeydown: onPanelKeydown,
              onPointerenter: () => stopGrace?.(),
            },
          )}
          data-state={open ? 'open' : 'closed'}
        >
          <ScrollArea
            focusable={false}
            sx={floatingStyles.scrollArea}
            propsContent={{ sx: menuStyles.content }}
          >
            {children}
          </ScrollArea>
        </div>
      </>
    );
  },
);

/**
 * 内容里有没有带快捷键的菜单项（含分组、子菜单里的）：只生成虚拟节点、不挂载。
 * 快捷键由菜单项注册，延迟渲染时菜单没打开就没有注册，所以这样的菜单不延迟
 */
function hasShortcut(content: VNodeChild): boolean {
  return childNodes(content).some((node) => {
    if ((node.props as { shortcut?: unknown } | null)?.shortcut != null) return true;
    const slot = (node.children as { default?: (...args: never[]) => VNodeChild } | null)?.default;
    return typeof node.type === 'object' && typeof slot === 'function' && slot.length === 0
      ? hasShortcut(slot())
      : false;
  });
}
