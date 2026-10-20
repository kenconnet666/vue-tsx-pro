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
 *
 * 只想在一个操作前问一句时，用命令式的 useConfirm，不必自己管 open：
 *
 *   const confirm = useConfirm();                  // setup 里
 *   if (await confirm({ title: '删除这个项目？', tone: 'danger', confirmText: '删除' })) remove();
 */
import { _component } from '@vue-tsx-pro/tsx';
import { getCurrentInstance, h, render, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { ConfigContext, useConfig, useLang } from '../config/context';
import { ConfigScope } from '../config/Provider';
import type { StatusTone } from '../utils/style/tone-styles';
import { afterTransitions } from '../utils/style/transitions';
import { useDefaults } from '../config/defaults';
import { mergePartProps } from '../utils/props';
import { dialogPanelSx, type DialogProps } from './Dialog';
import { ModalCore, type ModalCoreProps } from './Modal';

/** 未声明的属性落到 dialog 上 */
export interface AlertDialogProps extends Omit<DialogProps, 'footer' | 'closable' | 'dismissible'> {
  /** 确认按钮的色调，默认 accent；删除等破坏性操作用 danger */
  tone?: StatusTone;
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
    const appearance = useDefaults('Dialog', () => ({ size }), { size: 'xs' });
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
          { title: rest.title, panelSx: dialogPanelSx(appearance().size) },
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

/** confirm() 的选项：AlertDialog 的属性（open 由 confirm 管理） */
export type ConfirmOptions = Omit<AlertDialogProps, 'open'>;

/**
 * 命令式确认：在组件 setup 里调用，返回 confirm(options)。对话框渲染到 body 末尾，
 * 沿用调用处的主题、语言等配置（ConfigScope）；关闭后自动卸载。
 * 确认（onConfirm 完成）时得到 true，取消、Esc 时得到 false；onConfirm 失败时对话框保持打开，可以再试或取消。
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  // 在 setup 里记下配置与应用上下文：对话框挂在组件树之外，要靠它们拿到主题、语言、全局组件
  const config = useConfig();
  const appContext = getCurrentInstance()?.appContext ?? null;

  return (options) =>
    new Promise<boolean>((resolve) => {
      const container = document.createElement('div');
      document.body.append(container);
      let confirmed = false;

      function finish() {
        resolve(confirmed);
        // 等离场过渡播完再卸载
        const dialog = container.querySelector('dialog');
        void (dialog ? afterTransitions(dialog) : Promise.resolve()).then(() => {
          render(null, container);
          container.remove();
        });
      }

      const Host = _component(
        () => {
          ConfigContext.provide(config);
          let open = _state(true);
          return () => (
            <ConfigScope>
              <AlertDialog
                {...options}
                open={_bind(open)}
                onConfirm={async () => {
                  await options.onConfirm?.();
                  confirmed = true;
                }}
                onClose={(event: Event & { currentTarget: HTMLDialogElement }) => {
                  options.onClose?.(event);
                  finish();
                }}
              />
            </ConfigScope>
          );
        },
        { name: 'ConfirmHost' },
      );

      const vnode = h(Host);
      vnode.appContext = appContext;
      render(vnode, container);
    });
}
