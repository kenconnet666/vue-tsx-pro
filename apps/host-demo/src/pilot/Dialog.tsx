// 试点组件：验证原生模态 dialog + 焦点循环 + 锁定滚动，以及对话框里再开弹层，不进组件库
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  dismissOnBackdrop,
  elementProps,
  focusOrigin,
  lockScroll,
  mergeProps,
  returnFocus,
  transitions,
  trapFocus,
  type PartProps,
} from '@vue-tsx-pro/ui';
import { onBeforeUnmount, useId, type VNodeChild } from 'vue';

/** 未声明的属性落到 dialog 上；原生的 title 属性（悬停提示）让给标题 */
export interface DialogProps extends PartProps<'dialog', 'open' | 'aria-labelledby' | 'title'> {
  /** 是否打开：父级写 open={_bind(x)}；Esc、点击遮罩、dialog.close() 都会写回 */
  open?: boolean;
  /** 标题，同时是对话框的无障碍名称 */
  title: VNodeChild;
  /** 点击遮罩是否关闭，默认 true；需要用户明确选择时设为 false */
  dismissible?: boolean;
  /** 底部操作区 */
  footer?: VNodeChild;
  children?: VNodeChild;
}

const styles = stylex.create({
  dialog: {
    width: 'min(32em, calc(100vw - 2em))',
    padding: '_xl',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_xl',
    backgroundColor: '_surfaceRaised',
    color: '_text',
    boxShadow: '_xl',
  },
  title: { margin: 0, fontSize: '_lg', fontWeight: '_semibold' },
  body: { marginBlock: '_lg' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '_sm' },
});

/** 试点模态对话框：原生 dialog，焦点循环、锁定滚动、点击遮罩关闭 */
export const Dialog = _component(
  ({
    open = _bindable(false),
    title,
    dismissible = true,
    footer,
    children,
    ...rest
  }: DialogProps) => {
    const titleId = useId();
    let dialog = _state.raw<HTMLDialogElement | null>(null);
    let cleanup: (() => void) | undefined;

    function show() {
      if (!dialog || dialog.open) return;
      // showModal：顶层渲染、背景 inert、Esc 关闭都由浏览器负责；关闭后的焦点由 onClose 归还
      const opener = focusOrigin();
      dialog.showModal();
      const releaseScroll = lockScroll();
      const releaseFocus = trapFocus(dialog);
      const releaseBackdrop = dismissible
        ? dismissOnBackdrop(dialog, () => dialog?.close())
        : undefined;
      cleanup = () => {
        releaseScroll();
        releaseFocus();
        releaseBackdrop?.();
        if (dialog) returnFocus(dialog, opener);
      };
    }

    // 不论以什么方式关闭（Esc、点击遮罩、open 改为 false），都会触发原生 close 事件
    function onClose() {
      cleanup?.();
      cleanup = undefined;
      open = false;
    }

    _effect(() => {
      if (open) show();
      else if (dialog?.open) dialog.close();
    });
    onBeforeUnmount(() => cleanup?.());

    return () => (
      <dialog
        {...elementProps(
          mergeProps<'dialog'>(
            { sx: [styles.dialog, transitions.scale, transitions.backdrop] },
            rest,
            {
              ref: _toRef(dialog),
              'aria-labelledby': titleId,
              onClose,
            },
          ),
        )}
      >
        <h2 id={titleId} {...stylex.attrs(styles.title)}>
          {title}
        </h2>
        <div {...stylex.attrs(styles.body)}>{children}</div>
        {footer && <div {...stylex.attrs(styles.footer)}>{footer}</div>}
      </dialog>
    );
  },
);
