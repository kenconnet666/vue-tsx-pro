/**
 * 浮层开关的原因：Dialog、Drawer、Popover、Menu、Tooltip、Select、DatePicker 等的 onOpenChange(open, { reason, event })
 * 都用这一套（参考 Base UI 的 eventDetails.reason）。只报告用户的操作与命令式调用；父级直接改 open 时不调用。
 *
 *   <Dialog _open={_bind(open)} onOpenChange={(open, { reason }) => reason === 'escape' && track('esc')} …>
 */

/** onOpenChange 的原因 */
export interface OpenChangeReasons {
  /** 点了触发器（或在触发器上按 Enter、空格、方向键） */
  trigger: unknown;
  /** 点了浮层外面（模态的遮罩），或别的浮层打开把它顶掉 */
  outside: unknown;
  /** 按了 Esc */
  escape: unknown;
  /** 关闭按钮、取消按钮 */
  close: unknown;
  /** 确认按钮（对话框、Popconfirm） */
  confirm: unknown;
  /** 选了一项（菜单项、下拉选项、日期），浮层随之关闭 */
  select: unknown;
  /** 指针移入移出（Tooltip、HoverCard、子菜单） */
  hover: unknown;
  /** 焦点移入移出（Tooltip、离开下拉框） */
  focus: unknown;
  /** 代码调用：useDialog 的 open / close、快捷键（CommandPalette） */
  imperative: unknown;
}

/** onOpenChange 的第二个参数 */
export interface OpenChangeDetails {
  /** 为什么打开或关闭 */
  reason: keyof OpenChangeReasons;
  /** 引起变化的原生事件（有的话） */
  event?: Event;
}

/** 浮层共有的 onOpenChange 属性 */
export interface OpenChangeProps {
  /**
   * 用户打开、关闭之后调用，带原因（Esc、点外面、关闭按钮、选了一项……）；父级改 open 时不调用。
   * 只是通知：模态要在关闭前确认用 beforeClose
   */
  onOpenChange?: (open: boolean, details: OpenChangeDetails) => void;
}

/** openSetter 返回的开关函数：改 open 并通知 onOpenChange */
export type SetOpen = (open: boolean, reason: keyof OpenChangeReasons, event?: Event) => void;

/**
 * 浮层的开关：改 open（写回父级的 _bind）并调用 onOpenChange；值没变时什么也不做。在组件 setup 里调用：
 *
 *   const setOpen = openSetter(() => open, (next) => (open = next), () => onOpenChange);
 *   setOpen(false, 'select', event);
 */
export function openSetter(
  read: () => boolean,
  write: (open: boolean) => void,
  handler: () => OpenChangeProps['onOpenChange'],
): SetOpen {
  return (open, reason, event) => {
    if (read() === open) return;
    write(open);
    handler()?.(open, { reason, event });
  };
}
