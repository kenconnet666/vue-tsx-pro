/**
 * 菜单（WAI-ARIA 的 Menu Button 模式）：按钮弹出一列操作，复合组件，参考 Radix DropdownMenu、React Aria Menu。
 *
 *   <Menu trigger={(props) => <Button {...props} iconEnd={ChevronDown}>操作</Button>}>
 *     <MenuItem icon={Pencil} onAction={edit}>编辑</MenuItem>
 *     <MenuItem icon={Copy} shortcut="Ctrl+D" onAction={duplicate}>复制</MenuItem>
 *     <Separator decorative={false} />
 *     <MenuGroup label="视图">
 *       <MenuCheckboxItem checked={_bind(showGrid)}>显示网格</MenuCheckboxItem>
 *     </MenuGroup>
 *     <MenuRadioGroup value={_bind(sort)} label="排序">
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
import { Check, Dot } from '@lucide/icons';
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import type { ButtonTones } from '../base/button-core';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { Text, type TextProps } from '../base/Text';
import {
  floatingStyles,
  useAnchoredPopover,
  type FloatingOptions,
  type FloatingPlacement,
} from '../utils/dom/floating';
import { useRouterLink } from '../utils/dom/link';
import { toElement } from '../utils/dom/overlay';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { itemStyles } from '../utils/style/item-styles';
import { focusRingStyles } from '../utils/style/styles';
import { rippleHostStyles, useRipple } from '../utils/dom/ripple';
import { rovingFocus } from '../utils/dom/roving-focus';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { transitions } from '../utils/style/transitions';

interface MenuState {
  readonly ripple: boolean | undefined;
  /** 关闭菜单，焦点回到触发器 */
  close(): void;
}

const MenuContext = createContext<MenuState>('Menu');

interface RadioGroupState {
  readonly value: string | undefined;
  select(value: string): void;
}

const RadioGroupContext = createContext<RadioGroupState>('MenuRadioGroup');

/** 交给触发器的属性：展开到按钮上（`{...props}`） */
export interface MenuTriggerProps {
  /** 菜单以触发器的文字作为名称（aria-labelledby） */
  id: string;
  /** 取得触发器元素：定位的参照、关闭后焦点回到这里 */
  ref: (element: unknown) => void;
  /** 切换打开与关闭 */
  onClick: () => void;
  /** ↓ / ↑ 打开并聚焦第一项 / 最后一项 */
  onKeydown: (event: KeyboardEvent) => void;
  /** 告诉读屏这个按钮会打开菜单 */
  'aria-haspopup': 'menu';
  /** 菜单是否打开 */
  'aria-expanded': boolean;
  /** 菜单的 id */
  'aria-controls': string;
}

/** 未声明的属性落到菜单（role="menu" 的 div）上 */
export interface MenuProps
  extends PartProps<'div', 'id' | 'popover' | 'role'>, Pick<FloatingOptions, 'offset'> {
  /** 是否打开：父级可以写 open={_bind(x)}；Esc、点击外部、执行菜单项都会关闭并写回 */
  open?: boolean;
  /** 弹出位置，默认 bottom-start；空间不够时自动翻转 */
  placement?: FloatingPlacement;
  /** 字号档位，菜单项随之缩放；不写时继承上下文字号 */
  size?: TextSize;
  /** 菜单项按下时的波纹；不写时沿用 createUi / Provider 的 ripple */
  ripple?: boolean;
  /** 触发器：`(props) => <Button {...props}>操作</Button>` */
  trigger: (props: MenuTriggerProps) => VNodeChild;
  /** 菜单项：MenuItem、MenuLinkItem、MenuCheckboxItem、MenuRadioGroup、MenuGroup、Separator */
  children?: VNodeChild;
}

/** 菜单项的选择器（漫游焦点、打开时聚焦第一项 / 最后一项） */
const ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

const styles = stylex.create({
  panel: {
    minWidth: '12em',
    maxWidth: 'calc(100vw - 2em)',
    padding: '_xs',
    overflowY: 'auto',
    lineHeight: '_normal',
  },
  label: { flexGrow: 1, minWidth: 0 },
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
    open = _bindable(false),
    placement = 'bottom-start',
    offset,
    size,
    ripple,
    trigger,
    children,
    ...rest
  }: MenuProps) => {
    const id = useId();
    const triggerId = `${id}-trigger`;
    let anchor = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    // 打开时聚焦哪一项；Tab 关闭时焦点照常往后走，不还给触发器
    let focusOnOpen: 'first' | 'last' = 'first';
    let restoreFocus = true;

    const enabledItems = () =>
      [...(panel?.querySelectorAll<HTMLElement>(ITEMS) ?? [])].filter(
        (item) => !item.matches(':disabled, [aria-disabled="true"]'),
      );

    MenuContext.provide({
      get ripple() {
        return ripple;
      },
      close: () => (open = false),
    });

    function onTriggerKeydown(event: KeyboardEvent) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      focusOnOpen = event.key === 'ArrowDown' ? 'first' : 'last';
      open = true;
    }

    function onPanelKeydown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      restoreFocus = false;
      open = false;
    }

    const { onToggle } = useAnchoredPopover(
      () => ({
        open,
        anchor,
        panel,
        floating: { placement, offset, fitHeight: true },
        restoreFocus,
      }),
      {
        close: () => (open = false),
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
          onClick: () => (open = !open),
          onKeydown: onTriggerKeydown,
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': id,
        })}
        <div
          {...elementProps(
            mergeProps<'div'>(
              {
                sx: [
                  floatingStyles.anchored,
                  floatingStyles.surface,
                  styles.panel,
                  size && fontSizeStyles[size],
                  transitions.scale,
                ],
                'aria-labelledby': triggerId,
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
            ),
          )}
          data-state={open ? 'open' : 'closed'}
        >
          {children}
        </div>
      </>
    );
  },
);

/** 菜单项内容（图标、文字、快捷键）的选项，各种菜单项共有 */
interface ItemContentProps {
  /** 文字前的图标 */
  icon?: IconData;
  /** 右侧的快捷键提示（只是文字，按键要应用自己处理） */
  shortcut?: string;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 文字层的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 快捷键提示的部件属性 */
  propsShortcut?: Partial<TextProps>;
  children?: VNodeChild;
}

/** 复选、单选项的标记：占一列，没勾选时只占位，各项文字对齐 */
interface ItemMark {
  icon: IconData;
  checked: boolean;
  props?: Partial<IconProps>;
}

/** 菜单项的内容：标记 + 图标 + 文字 + 快捷键 */
function itemContent(
  { icon, shortcut, propsIcon, propsLabel, propsShortcut, children }: ItemContentProps,
  mark?: ItemMark,
): VNodeChild {
  return [
    mark && (
      <Icon
        {...mergePartProps<IconProps>(
          { icon: mark.icon, sx: [styles.indicator, !mark.checked && styles.hidden] },
          mark.props,
        )}
      />
    ),
    icon && <Icon {...mergePartProps<IconProps>({ icon }, propsIcon)} />,
    <span {...elementProps(mergeProps<'span'>({ sx: styles.label }, propsLabel))}>{children}</span>,
    shortcut && (
      <Text
        {...mergePartProps<TextProps>(
          { tone: 'muted', size: 'sm', sx: styles.shortcut },
          propsShortcut,
        )}
      >
        {shortcut}
      </Text>
    ),
  ];
}

/** 菜单项的外观：幽灵按钮，内容靠起始边排列 */
function itemSx(tone: keyof ButtonTones, disabled: boolean): StyleXStyles {
  return [
    itemStyles.row,
    tone === 'danger' ? itemStyles.danger : itemStyles.hoverable,
    focusRingStyles.visible,
    rippleHostStyles.host,
    disabled && itemStyles.disabled,
  ] as StyleXStyles;
}

/** 菜单项共用的：按下的波纹、执行后关闭菜单 */
function useMenuItem() {
  const menu = MenuContext.inject();
  return { ripple: useRipple(() => menu.ripple), close: () => menu.close() };
}

/** 按钮类菜单项共有的属性；未声明的属性落到 button 上 */
interface ButtonItemProps
  extends PartProps<'button', 'role' | 'type' | 'disabled' | 'aria-checked'>, ItemContentProps {
  /** 不可用：跳过方向键移动，不能执行 */
  disabled?: boolean;
  /** 执行后是否关闭菜单 */
  closeOnSelect?: boolean;
}

/** 未声明的属性落到 button（role="menuitem"）上 */
export interface MenuItemProps extends ButtonItemProps {
  /** 色调：删除等破坏性操作用 danger，默认 neutral */
  tone?: Extract<keyof ButtonTones, 'neutral' | 'danger'>;
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
    propsIcon,
    propsLabel,
    propsShortcut,
    children,
    ...rest
  }: MenuItemProps) => {
    const item = useMenuItem();
    return () => (
      <button
        {...elementProps(
          mergeProps<'button'>({ sx: itemSx(tone, disabled) }, rest, {
            type: 'button',
            role: 'menuitem',
            disabled,
            // 使用方的 onClick 先执行，preventDefault 可以拦下执行与关闭（mergeProps 的规则）
            onClick: () => {
              onAction?.();
              if (closeOnSelect) item.close();
            },
            ...item.ripple,
          }),
        )}
        data-disabled={disabled || undefined}
      >
        {itemContent({ icon, shortcut, propsIcon, propsLabel, propsShortcut, children })}
      </button>
    );
  },
);

/** 未声明的属性落到 a（role="menuitem"）上 */
export interface MenuLinkItemProps
  extends PartProps<'a', 'role' | 'aria-disabled'>, ItemContentProps {
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
    propsIcon,
    propsLabel,
    propsShortcut,
    children,
    ...rest
  }: MenuLinkItemProps) => {
    const item = useMenuItem();
    const router = useRouterLink();
    return () => (
      <a
        {...elementProps(
          mergeProps<'a'>({ sx: itemSx('neutral', disabled) }, rest, {
            role: 'menuitem',
            href: disabled ? undefined : href,
            'aria-disabled': disabled || undefined,
            onClick: (event: MouseEvent) => {
              router.onClick(event);
              item.close();
            },
            ...item.ripple,
          }),
        )}
        data-disabled={disabled || undefined}
      >
        {itemContent({ icon, shortcut, propsIcon, propsLabel, propsShortcut, children })}
      </a>
    );
  },
);

/** 未声明的属性落到 button（role="menuitemcheckbox"）上 */
export interface MenuCheckboxItemProps extends ButtonItemProps {
  /** 是否勾选：父级写 checked={_bind(x)} */
  checked?: boolean;
  /** 勾选标记的部件属性 */
  propsIndicator?: Partial<IconProps>;
}

/** 复选菜单项：切换一个开关；默认执行后不关闭菜单 */
export const MenuCheckboxItem = _component(
  ({
    checked = _bindable(false),
    disabled = false,
    closeOnSelect = false,
    propsIndicator,
    icon,
    shortcut,
    propsIcon,
    propsLabel,
    propsShortcut,
    children,
    ...rest
  }: MenuCheckboxItemProps) => {
    const item = useMenuItem();
    return () => (
      <button
        {...elementProps(
          mergeProps<'button'>({ sx: itemSx('neutral', disabled) }, rest, {
            type: 'button',
            role: 'menuitemcheckbox',
            disabled,
            'aria-checked': checked,
            onClick: () => {
              checked = !checked;
              if (closeOnSelect) item.close();
            },
            ...item.ripple,
          }),
        )}
        data-disabled={disabled || undefined}
        data-state={checked ? 'checked' : 'unchecked'}
      >
        {itemContent(
          { icon, shortcut, propsIcon, propsLabel, propsShortcut, children },
          { icon: Check, checked, props: propsIndicator },
        )}
      </button>
    );
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
      {...elementProps(
        mergeProps<'div'>({}, rest, {
          role: 'group',
          'aria-labelledby': label != null ? labelId : undefined,
        }),
      )}
    >
      {label != null && (
        <Text
          {...mergePartProps<TextProps>(
            { tone: 'muted', size: 'sm', sx: styles.groupLabel },
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
  /** 选中项的值：父级写 value={_bind(x)} */
  value?: string;
}

/** 一组单选菜单项：同一时间只选中一项 */
export const MenuRadioGroup = _component(
  ({
    value = _bindable<string | undefined>(undefined),
    label,
    propsLabel,
    children,
    ...rest
  }: MenuRadioGroupProps) => {
    const labelId = useId();
    RadioGroupContext.provide({
      get value() {
        return value;
      },
      select: (next) => (value = next),
    });
    return () => renderGroup(labelId, { label, propsLabel, children, ...rest });
  },
);

/** 未声明的属性落到 button（role="menuitemradio"）上 */
export interface MenuRadioItemProps extends ButtonItemProps {
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
    propsIcon,
    propsLabel,
    propsShortcut,
    children,
    ...rest
  }: MenuRadioItemProps) => {
    const item = useMenuItem();
    const group = RadioGroupContext.inject();
    return () => {
      const checked = group.value === value;
      return (
        <button
          {...elementProps(
            mergeProps<'button'>({ sx: itemSx('neutral', disabled) }, rest, {
              type: 'button',
              role: 'menuitemradio',
              disabled,
              'aria-checked': checked,
              onClick: () => {
                group.select(value);
                if (closeOnSelect) item.close();
              },
              ...item.ripple,
            }),
          )}
          data-disabled={disabled || undefined}
          data-state={checked ? 'checked' : 'unchecked'}
        >
          {itemContent(
            { icon, shortcut, propsIcon, propsLabel, propsShortcut, children },
            { icon: Dot, checked, props: propsIndicator },
          )}
        </button>
      );
    };
  },
);
