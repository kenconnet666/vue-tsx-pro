/**
 * 模态对话框：居中显示，淡入放大。内核见 ModalCore.tsx，贴着视口一侧滑入的见 Drawer。
 *
 *   <Dialog open={_bind(editing)} title="编辑资料" footer={<Button onClick={save}>保存</Button>}>…</Dialog>
 *
 * 不想自己管 open（从表格的一行打开详情、在回调里弹出）时用命令式的 useDialog：
 *
 *   const dialog = useDialog();                    // setup 里
 *   const handle = dialog.open({ title: '订单详情', size: 'md', content: () => <OrderDetail id={id} /> });
 *   handle.update({ title: '订单详情（已发货）' }); handle.close(); await handle.closed;
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { SxStyles } from '@vue-tsx-pro/tsx/styles';
import type { ContainerSizes } from '../layout/Container';
import {
  useDetachedOverlay,
  type DetachedOverlayHandle,
  type DetachedOverlayOptions,
} from './detached';
import { useDefaults } from '../config/defaults';
import { transitions } from '../utils/style/transitions';
import { ModalCore, type ModalProps } from './ModalCore';
import { t } from '../config/theme/tokens';

/** 对话框的宽度档位，与 Container 相同（30–80rem），另加 full 占满视口 */
export interface DialogSizes extends ContainerSizes {
  /** 占满视口（四周留出 1em） */
  full: unknown;
}

/** 对话框的外观选项；可以用 createUi / Provider 的 defaults.Dialog 统一改默认值（AlertDialog 也用它） */
export interface DialogOptions {
  /** 宽度档位，默认 xs（30rem）；窄屏时不超出视口 */
  size?: keyof DialogSizes;
}

/** 未声明的属性落到 dialog 上 */
export interface DialogProps extends ModalProps, DialogOptions {}

/** 居中对话框的面板样式：宽度占满可用空间、高度上限、圆角；full 占满视口 */
export const dialogStyles = css.create({
  panel: {
    width: '_full',
    // 原生 dialog 已限制 max-width / max-height 不超出视口；这里只把高度上限放到四周各留 1em
    maxHeight: 'calc(100dvh - 2em)',
    borderRadius: '_xl',
  },
  full: { maxWidth: 'calc(100vw - 2em)', height: 'calc(100dvh - 2em)' },
});

/** 对话框的宽度档位：不超出视口 */
export const dialogSizeStyles = css.create({
  xs: { maxWidth: `min(${t.sizes.xs}, calc(100vw - 2em))` },
  sm: { maxWidth: `min(${t.sizes.sm}, calc(100vw - 2em))` },
  md: { maxWidth: `min(${t.sizes.md}, calc(100vw - 2em))` },
  lg: { maxWidth: `min(${t.sizes.lg}, calc(100vw - 2em))` },
  xl: { maxWidth: `min(${t.sizes.xl}, calc(100vw - 2em))` },
});

/** 居中对话框的外观（Dialog、AlertDialog 共用）：宽度档位、圆角、淡入放大 */
export function dialogPanelSx(size: keyof DialogSizes): SxStyles {
  return [
    dialogStyles.panel,
    size === 'full' ? dialogStyles.full : dialogSizeStyles[size],
    transitions.scale,
  ] as SxStyles;
}

/** 模态对话框：居中显示，淡入放大 */
export const Dialog = _component(({ open = _bindable(false), size, ...rest }: DialogProps) => {
  const appearance = useDefaults('Dialog', () => ({ size }), { size: 'xs' });
  return () => (
    <ModalCore {...rest} open={_bind(open)} panelSx={dialogPanelSx(appearance().size)} />
  );
});

/** useDialog 返回的：open 打开一个对话框 */
export interface DialogApi {
  /** 打开对话框：属性同 Dialog（open 由句柄管理），content 是正文；返回句柄 */
  open(options: DetachedOverlayOptions<DialogProps>): DetachedOverlayHandle<DialogProps>;
}

/**
 * 命令式对话框：在组件 setup 里调用。对话框渲染到 body 末尾，沿用调用处的主题、语言等配置，关上后自动卸载。
 * 句柄的 closed 得到关上的原因（确认是 confirm）；只想问一句“确定吗”用 useConfirm。
 */
export function useDialog(): DialogApi {
  const open = useDetachedOverlay<DialogProps>((props, host, children) => (
    <Dialog {...props} open={_bind(host.open)}>
      {children}
    </Dialog>
  ));
  return { open };
}
