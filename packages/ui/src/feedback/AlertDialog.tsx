/**
 * 确认对话框（role="alertdialog"）：打断当前操作、要用户明确选择“确认”或“取消”，如删除前的确认。
 * 建在 Dialog 的内核上；没有右上角的关闭按钮，点击遮罩不关闭（Esc 仍然等于取消）。
 * 打开时焦点落在“取消”上，误按 Enter 不会执行破坏性操作（同 Radix AlertDialog）。
 *
 *   <AlertDialog
 *     open={_bind(confirming)}
 *     tone="danger"
 *     title="删除这个项目？"
 *     description="删除后无法恢复。"
 *     confirmText="删除"
 *     onConfirm={() => api.remove(id)}
 *   />
 *
 * onConfirm 返回 Promise 时：确认按钮显示加载中、取消与 Esc 暂不可用，完成后关闭；失败时保持打开，由调用方提示错误。
 */
import { _component } from '@vue-tsx-pro/tsx';
import type { VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import type { ButtonTones } from '../base/button-styles';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { mergePartProps } from '../utils/props';
import { dialogPanelSx, ModalCore, type DialogProps, type ModalCoreProps } from './Dialog';

/** 未声明的属性落到 dialog 上 */
export interface AlertDialogProps extends Omit<DialogProps, 'footer' | 'closable' | 'dismissible'> {
  /** 确认按钮的色调，默认 accent；删除等破坏性操作用 danger */
  tone?: keyof ButtonTones;
  /** 确认按钮的文字，默认取语言包（确定） */
  confirmText?: VNodeChild;
  /** 取消按钮的文字，默认取语言包（取消） */
  cancelText?: VNodeChild;
  /** 点击确认时调用；返回 Promise 时等它完成再关闭，失败（reject）时保持打开 */
  onConfirm?: () => unknown;
  /** 确认按钮的部件属性 */
  propsConfirm?: Partial<ButtonProps>;
  /** 取消按钮的部件属性 */
  propsCancel?: Partial<ButtonProps>;
}

/** 确认对话框：确认 / 取消两个按钮，焦点先落在取消上 */
export const AlertDialog = _component(
  ({
    open = _bindable(false),
    size,
    tone = 'accent',
    confirmText,
    cancelText,
    onConfirm,
    propsConfirm,
    propsCancel,
    ...rest
  }: AlertDialogProps) => {
    const lang = useLang();
    const defaults = useDefaults('Dialog');
    let pending = _state(false);

    async function confirm() {
      const result = onConfirm?.();
      if (result instanceof Promise) {
        pending = true;
        try {
          await result;
        } catch (error) {
          // 调用方负责提示失败原因；这里只保持打开，并留下记录
          console.error('AlertDialog: onConfirm 失败，对话框保持打开', error);
          return;
        } finally {
          pending = false;
        }
      }
      open = false;
    }

    // 等待确认结果时 Esc 不关闭：原生 cancel 事件可以取消
    function onCancel(event: Event) {
      if (pending) event.preventDefault();
    }

    return () => (
      <ModalCore
        {...mergePartProps<ModalCoreProps>(
          { title: rest.title, panelSx: dialogPanelSx(size ?? defaults.size ?? 'xs') },
          rest,
          {
            role: 'alertdialog',
            closable: false,
            dismissible: false,
            onCancel,
          },
        )}
        open={_bind(open)}
        footer={
          <>
            <Button
              {...mergePartProps<ButtonProps>(
                { variant: 'soft', tone: 'neutral', autofocus: true },
                propsCancel,
                { disabled: pending, onClick: () => (open = false) },
              )}
            >
              {cancelText ?? lang.cancel}
            </Button>
            <Button
              {...mergePartProps<ButtonProps>({ tone }, propsConfirm, {
                loading: pending,
                onClick: () => void confirm(),
              })}
            >
              {confirmText ?? lang.confirm}
            </Button>
          </>
        }
      />
    );
  },
);
