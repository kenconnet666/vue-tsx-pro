/**
 * 对话框：屏幕中间的卡片，标题、说明、底部一排按钮（确认、取消）。用来确认操作、提示重要信息。
 *
 *   await showDialog({ title: '提示', message: '提交成功' });
 *   if (await showConfirmDialog({ title: '删除地址', message: '删除后不能恢复', confirmTone: 'danger' })) remove();
 *   <Dialog _open={show} title="退出登录" showCancel onConfirm={logout} />
 *
 * onConfirm 返回 Promise 时确认按钮转圈，完成后才关闭（抛错时不关闭）。命令式的写法渲染在 ConfigProvider 里。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { shallowReactive, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { useConfig } from '../config/context';
import { Popup, type PopupProps } from '../overlay/Popup';
import { hasContent, mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';

/** 关闭的原因 */
export type DialogCloseReason = 'confirm' | 'cancel' | 'overlay';

/** 对话框的选项（组件的 props 与 showDialog 的参数共用） */
export interface DialogOptions {
  /** 标题 */
  title?: VNodeChild;
  /** 说明 */
  message?: VNodeChild;
  /** 确认按钮的文字；不给时用语言包的"确认" */
  confirmText?: VNodeChild;
  /** 取消按钮的文字；不给时用语言包的"取消" */
  cancelText?: VNodeChild;
  /** 显示取消按钮 */
  showCancel?: boolean;
  /**
   * 确认按钮的色调：删除这类操作用 danger
   * @default 'accent'
   */
  confirmTone?: 'accent' | 'danger';
  /** 点遮罩关闭（等于取消） */
  closeOnOverlay?: boolean;
  /** 点了确认；返回 Promise 时按钮转圈，完成后才关闭 */
  onConfirm?: () => void | Promise<unknown>;
  /** 点了取消（或点遮罩关闭） */
  onCancel?: () => void;
}

/** 未声明的属性落到对话框的面板上 */
export interface DialogProps extends DialogOptions, Omit<PartProps<'div', 'role'>, 'title'> {
  /** 是否打开；双向绑定写 `_open={x}` */
  _open?: boolean;
  /** 关闭时带原因 */
  onOpenChange?: (open: boolean, details: { reason: DialogCloseReason }) => void;
  /** 说明（与 message 二选一），可以放任意内容 */
  children?: VNodeChild;
  /** 自定义底部（代替确认、取消按钮） */
  footer?: VNodeChild;
  /** 弹出层的部件属性 */
  propsPopup?: Partial<PopupProps>;
  /** 确认按钮的部件属性 */
  propsConfirm?: Partial<ButtonProps>;
  /** 取消按钮的部件属性 */
  propsCancel?: Partial<ButtonProps>;
}

/** Dialog 的样式：panel、header、title、message、footer、action */
export const dialogStyles = css.create({
  panel: { width: '20em', maxWidth: '85vw', overflow: 'hidden' },
  header: { paddingBlockStart: '1.6em', paddingInline: '1.5em', textAlign: 'center' },
  title: { fontSize: '_lg', fontWeight: '_semibold', lineHeight: '_tight', color: '_text' },
  message: {
    paddingInline: '1.5em',
    paddingBlock: '0.75em 1.6em',
    fontSize: '_md',
    lineHeight: '1.6',
    color: '_textMuted',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  },
  // 只有标题时，标题下面也留出同样的空
  titleOnly: { paddingBlockEnd: '1.6em' },
  footer: {
    display: 'flex',
    borderBlockStartWidth: '_hairline',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_border',
  },
  action: {
    flex: '1 1 0',
    minHeight: '3.2em',
    borderRadius: '_none',
    borderInlineStartWidth: { default: '_hairline', ':first-child': 0 },
    borderInlineStartColor: '_border',
    fontSize: '_lg',
  },
});

/** 对话框（弹出层 > 标题 + 说明 + 按钮） */
export const Dialog = _component(
  ({
    _open: open = _bindable(false),
    title,
    message,
    confirmText,
    cancelText,
    showCancel = false,
    confirmTone = 'accent',
    closeOnOverlay = false,
    onConfirm,
    onCancel,
    onOpenChange,
    children,
    footer,
    propsPopup,
    propsConfirm,
    propsCancel,
    ...rest
  }: DialogProps) => {
    const config = useConfig();
    let confirming = _state(false);
    const close = (reason: DialogCloseReason) => {
      open = false;
      onOpenChange?.(false, { reason });
    };
    const confirm = async () => {
      const pending = onConfirm?.();
      if (!(pending instanceof Promise)) return close('confirm');
      confirming = true;
      try {
        await pending;
        close('confirm');
      } finally {
        confirming = false;
      }
    };
    const cancel = (reason: 'cancel' | 'overlay') => {
      onCancel?.();
      close(reason);
    };
    return () => {
      const body = hasContent(message) ? message : children;
      return (
        <Popup
          {...mergePartProps<PopupProps>(
            {
              _open: open,
              position: 'center',
              round: true,
              closeOnOverlay,
              sx: dialogStyles.panel,
              onOpenChange: (next, { reason }) =>
                !next && reason === 'overlay' && cancel('overlay'),
            },
            // 对话框上未声明的属性与弹出层的部件属性都落到面板上
            mergeProps<PopupProps>(rest as Partial<PopupProps>, propsPopup) as Partial<PopupProps>,
          )}
        >
          {hasContent(title) && (
            <div
              {...mergeAttrs<'div'>({
                sx: [dialogStyles.header, !hasContent(body) && dialogStyles.titleOnly],
              })}
            >
              <div {...mergeAttrs<'div'>({ sx: dialogStyles.title })}>{title}</div>
            </div>
          )}
          {hasContent(body) && (
            <div {...mergeAttrs<'div'>({ sx: dialogStyles.message })}>{body}</div>
          )}
          {hasContent(footer) ? (
            footer
          ) : (
            <div {...mergeAttrs<'div'>({ sx: dialogStyles.footer })}>
              {showCancel && (
                <Button
                  {...mergePartProps<ButtonProps>(
                    {
                      variant: 'ghost',
                      tone: 'neutral',
                      sx: dialogStyles.action,
                      onClick: () => cancel('cancel'),
                    },
                    propsCancel,
                  )}
                >
                  {cancelText ?? config.lang.cancel}
                </Button>
              )}
              <Button
                {...mergePartProps<ButtonProps>(
                  {
                    variant: 'ghost',
                    tone: confirmTone,
                    loading: confirming,
                    sx: dialogStyles.action,
                    onClick: () => void confirm(),
                  },
                  propsConfirm,
                )}
              >
                {confirmText ?? config.lang.confirm}
              </Button>
            </div>
          )}
        </Popup>
      );
    };
  },
);

/** 命令式对话框：排队显示，前一个关了才显示下一个 */
interface DialogRequest {
  options: DialogOptions;
  resolve: (confirmed: boolean) => void;
}

/** 命令式对话框的状态：ConfigProvider 里的出口按它渲染 */
export const dialogState = shallowReactive<{ open: boolean; queue: DialogRequest[] }>({
  open: false,
  queue: [],
});

/** 显示一个对话框；确认时结果为 true，取消（或点遮罩关闭）时为 false */
export function showDialog(options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    dialogState.queue = [...dialogState.queue, { options, resolve }];
    dialogState.open = true;
  });
}

/** 带取消按钮的确认对话框 */
export const showConfirmDialog = (options: DialogOptions) =>
  showDialog({ showCancel: true, ...options });

/** 当前的命令式对话框关闭后：交出结果，过了离场动画再显示下一个 */
export function settleDialog(confirmed: boolean) {
  const [current, ...rest] = dialogState.queue;
  current?.resolve(confirmed);
  dialogState.open = false;
  setTimeout(() => {
    dialogState.queue = rest;
    if (rest.length) dialogState.open = true;
  }, 300);
}
