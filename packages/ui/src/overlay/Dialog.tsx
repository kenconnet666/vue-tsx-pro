/**
 * 模态对话框：居中显示，淡入放大。内核见 ModalCore.tsx，贴着视口一侧滑入的见 Drawer。
 *
 *   <Dialog _open={editing} title="编辑资料" footer={<Button onClick={save}>保存</Button>}>…</Dialog>
 *
 * 不想自己管 open（从表格的一行打开详情、在回调里弹出）时用命令式的 useDialog：
 *
 *   const dialog = useDialog();                    // setup 里
 *   const handle = dialog.open({ title: '订单详情', size: 'md', content: () => <OrderDetail id={id} /> });
 *   handle.update({ title: '订单详情（已发货）' }); handle.close(); await handle.closed;
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { ContainerSizes } from '../layout/Container';
import {
  useDetachedOverlay,
  type DetachedOverlayHandle,
  type DetachedOverlayOptions,
} from './detached';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { transitions } from '../utils/style/transitions';
import { ModalCore, modalPartStyles, type ModalProps } from './ModalCore';
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

/**
 * 对话框的配方（Dialog、AlertDialog 共用）：部件同 ModalCore（base 并进了 modalPartStyles）；
 * root 是 dialog 元素，宽度占满可用空间、高度上限、圆角，宽度档位不超出视口，full 占满视口
 */
export const dialogRecipe = css.recipe({
  name: 'Dialog',
  parts: ['root', 'header', 'title', 'close', 'description', 'body', 'bodyContent', 'footer'],
  base: {
    ...modalPartStyles,
    root: {
      ...modalPartStyles.root,
      width: '_full',
      // 原生 dialog 已限制 max-width / max-height 不超出视口；这里只把高度上限放到四周各留 1em
      maxHeight: 'calc(100dvh - 2em)',
      borderRadius: '_xl',
    },
  },
  variants: {
    size: {
      xs: { root: { maxWidth: `min(${t.sizes.xs}, calc(100vw - 2em))` } },
      sm: { root: { maxWidth: `min(${t.sizes.sm}, calc(100vw - 2em))` } },
      md: { root: { maxWidth: `min(${t.sizes.md}, calc(100vw - 2em))` } },
      lg: { root: { maxWidth: `min(${t.sizes.lg}, calc(100vw - 2em))` } },
      xl: { root: { maxWidth: `min(${t.sizes.xl}, calc(100vw - 2em))` } },
      full: { root: { maxWidth: 'calc(100vw - 2em)', height: 'calc(100dvh - 2em)' } },
    },
  },
});

/** 对话框的部件（createUi / Provider 的 styles.Dialog 按它定制，AlertDialog 也用它） */
export type DialogPart = (typeof dialogRecipe.parts)[number];

/** 模态对话框：居中显示，淡入放大 */
export const Dialog = _component(
  ({ _open: open = _bindable(false), size, ...rest }: DialogProps) => {
    const appearance = useDefaults('Dialog', () => ({ size }), { size: 'xs' });
    const recipe = useRecipe(dialogRecipe);
    return () => (
      <ModalCore
        {...rest}
        parts={recipe({ size: appearance().size })}
        panelSx={transitions.scale}
        _open={open}
      />
    );
  },
);

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
    <Dialog {...props} _open={host.open}>
      {children}
    </Dialog>
  ));
  return { open };
}
