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
import { useDefaults } from '../config/defaults';
import { mergePartProps } from '../utils/props';
import { useDetachedDialog } from './detached';
import { dialogPanelSx, type DialogProps } from './Dialog';
import { ModalCore, type ModalCoreProps } from './Modal';

/** 未声明的属性落到 dialog 上；确认、取消按钮的属性（onConfirm、confirmText、tone、propsConfirm…）同 Dialog */
export interface AlertDialogProps extends Omit<
  DialogProps,
  'footer' | 'closable' | 'dismissible'
> {}

/** 确认对话框：确认 / 取消两个按钮，焦点先落在取消上 */
export const AlertDialog = _component(
  ({ open = _bindable(false), size, onConfirm, propsCancel, ...rest }: AlertDialogProps) => {
    const appearance = useDefaults('Dialog', () => ({ size }), { size: 'xs' });
    return () => (
      <ModalCore
        {...mergePartProps<ModalCoreProps>(
          { title: rest.title, panelSx: dialogPanelSx(appearance().size) },
          rest,
          {
            role: 'alertdialog',
            closable: false,
            dismissible: false,
            // 没写 onConfirm 也有确认按钮：点了就关
            onConfirm: onConfirm ?? (() => {}),
            propsCancel: { autofocus: true, ...propsCancel },
          },
        )}
        open={_bind(open)}
      />
    );
  },
);

/** confirm() 的选项：AlertDialog 的属性（open 由 confirm 管理） */
export type ConfirmOptions = Omit<AlertDialogProps, 'open'>;

/**
 * 命令式确认：在组件 setup 里调用，返回 confirm(options)。对话框渲染到 body 末尾，
 * 沿用调用处的主题、语言等配置（ConfigScope）；关闭后自动卸载。
 * 确认（onConfirm 完成）时得到 true，取消、Esc 时得到 false；onConfirm 返回 false 或失败时对话框保持打开，可以再试或取消。
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const mount = useDetachedDialog();
  return (options) =>
    new Promise<boolean>((resolve) => {
      let confirmed = false;
      mount((host) => (
        <AlertDialog
          {...options}
          open={_bind(host.open)}
          onConfirm={async () => {
            if ((await options.onConfirm?.()) === false) return false;
            confirmed = true;
          }}
          onClose={(event: Event & { currentTarget: HTMLDialogElement }) => {
            options.onClose?.(event);
            resolve(confirmed);
            host.closed();
          }}
        />
      ));
    });
}
