/**
 * 模态对话框：居中显示，淡入放大。内核见 Modal.tsx，贴着视口一侧滑入的见 Drawer。
 *
 *   <Dialog open={_bind(editing)} title="编辑资料" footer={<Button onClick={save}>保存</Button>}>…</Dialog>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import type { ContainerSizes } from '../layout/Container';
import { useDefaults } from '../config/defaults';
import type { StyleTable } from '../utils/style/styles';
import { transitions } from '../utils/style/transitions';
import { ModalCore, type ModalProps } from './Modal';

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
export const dialogStyles: StyleTable<'panel' | 'full'> = stylex.create({
  panel: {
    width: '_full',
    // 原生 dialog 已限制 max-width / max-height 不超出视口；这里只把高度上限放到四周各留 1em
    maxHeight: 'calc(100dvh - 2em)',
    borderRadius: '_xl',
  },
  full: { maxWidth: 'calc(100vw - 2em)', height: 'calc(100dvh - 2em)' },
});

/** 对话框的宽度档位：不超出视口 */
export const dialogSizeStyles: StyleTable<keyof ContainerSizes> = stylex.create({
  xs: { maxWidth: 'min(_xs, calc(100vw - 2em))' },
  sm: { maxWidth: 'min(_sm, calc(100vw - 2em))' },
  md: { maxWidth: 'min(_md, calc(100vw - 2em))' },
  lg: { maxWidth: 'min(_lg, calc(100vw - 2em))' },
  xl: { maxWidth: 'min(_xl, calc(100vw - 2em))' },
});

/** 居中对话框的外观（Dialog、AlertDialog 共用）：宽度档位、圆角、淡入放大 */
export function dialogPanelSx(size: keyof DialogSizes): StyleXStyles {
  return [
    dialogStyles.panel,
    size === 'full' ? dialogStyles.full : dialogSizeStyles[size],
    transitions.scale,
  ] as StyleXStyles;
}

/** 模态对话框：居中显示，淡入放大 */
export const Dialog = _component(({ open = _bindable(false), size, ...rest }: DialogProps) => {
  const appearance = useDefaults('Dialog', () => ({ size }), { size: 'xs' });
  return () => (
    <ModalCore {...rest} open={_bind(open)} panelSx={dialogPanelSx(appearance().size)} />
  );
});
