/**
 * 日期、时间选择器共用的打开按钮与弹层（DatePicker、DateRangePicker、TimePicker），以及日历旁边的快捷选项：
 * 输入框外壳是定位的锚点，后缀里的按钮打开，弹层是 role="dialog" 的原生 popover（Esc、点外部关闭）；
 * 关闭时焦点还给按钮（外壳不可聚焦）；分段里按 Alt + ↓ 打开（同原生 select）。在组件 setup 里调用。
 *
 *   const picker = usePickerPopover(() => ({ open, editable, label: lang.datePickerOpen }), {
 *     toggle: setOpen,
 *     shown: (panel) => panel.querySelector('…')?.focus(),
 *   });
 *   <DateField propsRoot={{ ref: picker.anchorRef }} onKeydown={picker.onKeydown} suffix={picker.button(CalendarDays, propsButton)} />
 *   {picker.panel(sx, propsPopover, open && <Calendar … />)}
 */
import { useId, type VNodeChild } from 'vue';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Button } from '../base/Button';
import type { IconData } from '../base/Icon';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { controlStyles } from '../input/control';
import { anchoredPanelSx, useAnchoredPopover, type FloatingPlacement } from '../utils/dom/floating';
import { focusFirst } from '../utils/dom/focus';
import type { SetOpen } from '../utils/dom/open-change';
import { toElement } from '../utils/dom/element';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { TextSize } from '../utils/style/typography';

/** 选择器上的打开按钮与弹层的部件属性 */
export interface PickerPopoverParts {
  /** 弹出位置，默认 bottom-start；空间不够时自动翻转 */
  placement?: FloatingPlacement;
  /** 打开按钮的部件属性 */
  propsButton?: Omit<Partial<IconButtonProps>, 'onClick' | 'aria-expanded' | 'aria-controls'>;
  /** 弹层的部件属性 */
  propsPopover?: PartProps<'div', 'id' | 'popover' | 'role'>;
}

/** usePickerPopover 每次渲染读取的状态 */
export interface PickerPopoverState {
  /** 是否打开 */
  open: boolean;
  /** 能不能打开：不可用、只读时按钮也不可用 */
  editable: boolean;
  /** 按钮与弹层的名称（“选择日期”） */
  label: string;
  /** 弹出位置 */
  placement?: FloatingPlacement;
  /** 弹层与输入框同宽（时间列表） */
  matchWidth?: boolean;
  /** 控件的字号档位：弹层渲染在顶层、不继承输入框的字号，按它设置 */
  size?: TextSize;
}

/** usePickerPopover 的回调 */
export interface PickerPopoverEvents {
  /** 打开或关闭（按钮、Alt + ↓、Esc、点外部）：写回组件的 open 并通知 onOpenChange，一般是组件的 openSetter */
  toggle: SetOpen;
  /** 打开后、第一次定位完成时：把焦点交给弹层里合适的元素 */
  shown: (panel: HTMLElement) => void;
}

/** 选择器的打开按钮与弹层 */
export function usePickerPopover(read: () => PickerPopoverState, events: PickerPopoverEvents) {
  const id = useId();
  let anchor = _state.raw<HTMLElement | null>(null);
  let panel = _state.raw<HTMLElement | null>(null);
  let trigger = _state.raw<HTMLElement | null>(null);

  const { onToggle } = useAnchoredPopover(
    () => {
      const { open, placement = 'bottom-start', matchWidth } = read();
      return { open, anchor, panel, floating: { placement, matchWidth }, restoreFocus: trigger };
    },
    { close: (reason, event) => events.toggle(false, reason, event), shown: events.shown },
  );

  return {
    /** 弹层的 id（按钮的 aria-controls）；弹层里的元素可以据此派生自己的 id */
    id,
    /** 输入框外壳（锚点）：放进 propsRoot 的 ref */
    anchorRef: (element: unknown) => (anchor = toElement(element)),
    /** 输入框外壳：选完日期后把焦点交给其中的某一段 */
    get anchor() {
      return anchor;
    },
    /** 分段上的 keydown：Alt + ↓ 打开 */
    onKeydown: (event: KeyboardEvent) => {
      if (!event.altKey || event.key !== 'ArrowDown' || !read().editable) return;
      event.preventDefault();
      events.toggle(true, 'trigger', event);
    },
    /** 输入框后缀里的打开按钮 */
    button(icon: IconData, user?: PickerPopoverParts['propsButton']) {
      const { open, editable, label } = read();
      return (
        <IconButton
          {...mergePartProps<IconButtonProps>(
            { sx: controlStyles.button, radius: 'full', icon, 'aria-label': label },
            user,
            {
              ref: (element: unknown) => (trigger = toElement(element)),
              disabled: !editable,
              'aria-haspopup': 'dialog',
              'aria-expanded': open,
              'aria-controls': id,
              onClick: (event: MouseEvent) => events.toggle(!open, 'trigger', event),
            },
          )}
        />
      );
    },
    /** 弹层：内容只在打开时渲染（由调用方按 open 给） */
    panel(sx: css.SxStyles, user: PickerPopoverParts['propsPopover'], children: VNodeChild) {
      const { open, label, size } = read();
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [anchoredPanelSx(size), sx],
              'aria-label': label,
            },
            user,
            { ref: _toRef(panel), id, popover: 'auto', role: 'dialog', onToggle },
          )}
          data-state={open ? 'open' : 'closed'}
        >
          {children}
        </div>
      );
    },
  };
}

/** 弹层里是日历时：焦点进日历当前的那一格（已选或今天），不是“上个月”按钮 */
export function focusCalendar(panel: HTMLElement): void {
  const cell = panel.querySelector<HTMLElement>('[role="grid"] [tabindex="0"]');
  if (cell) cell.focus();
  else focusFirst(panel);
}

/** 弹层里的一个快捷选项（“今天”“最近 7 天”） */
export interface PickerPreset {
  /** 列表里的 key */
  key: string;
  /** 按钮上的文字 */
  label: string;
  /** 当前值就是它：按钮按下（aria-pressed） */
  active: boolean;
  /** 超出可选范围：不可用 */
  disabled?: boolean;
  /** 点了 */
  onPick: () => void;
}

/** 快捷选项的样式：presets（一列，靠日历那边有分隔线）、preset（按钮文字靠左） */
export const pickerPresetStyles = css.create({
  presets: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_xs',
    paddingInlineEnd: '_sm',
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_borderMuted',
  },
  preset: { justifyContent: 'flex-start' },
});

/** 日历旁边的一列快捷选项（DatePicker、DateRangePicker 共用）：一组按钮，当前值对应的那一项按下 */
export function renderPickerPresets(
  presets: readonly PickerPreset[],
  label: string,
  user?: PartProps<'div', 'role'>,
): VNodeChild {
  if (presets.length === 0) return null;
  return (
    <div
      {...mergeAttrs<'div'>({ sx: pickerPresetStyles.presets }, user, {
        role: 'group',
        'aria-label': label,
      })}
    >
      {presets.map((preset) => (
        <Button
          key={preset.key}
          sx={pickerPresetStyles.preset}
          size="sm"
          variant={preset.active ? 'soft' : 'ghost'}
          tone="neutral"
          aria-pressed={preset.active}
          disabled={preset.disabled}
          onClick={preset.onPick}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
