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
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { useComponent } from '../config/components';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { ContainerSizes } from '../layout/Container';
import {
  useDetachedOverlay,
  type DetachedOverlayHandle,
  type DetachedOverlayOptions,
} from './detached';
import { watch } from 'vue';
import type { FlexProps } from '../layout/Flex';
import { clamp } from '../utils/data/number';
import { startMove } from '../utils/dom/move';
import { mergeProps } from '../utils/props';
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
export interface DialogProps extends ModalProps, DialogOptions {
  /** 可以拖动：按住标题栏把对话框挪开（看被挡住的内容），不超出窗口；每次打开回到正中 */
  draggable?: boolean;
}

/** 拖动的样式：标题栏是把手（移动指针、触摸拖动不滚动页面）；位移用 translate，不和进场动画的 transform 打架 */
const dialogDragStyles = css.create({
  handle: { cursor: 'move', userSelect: 'none', touchAction: 'none' },
});
const dialogDragDynamicStyles = css.create({
  offset: (x: number, y: number) => ({ translate: `${x}px ${y}px` }),
});

/** 不能从标题栏上的这些元素开始拖（关闭按钮等照常点） */
const NOT_A_HANDLE = 'button, a, input, select, textarea, [contenteditable]';

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
  ({
    _open: open = _bindable(false),
    size,
    draggable = false,
    propsHeader,
    ...rest
  }: DialogProps) => {
    const ui = useComponent(dialogRecipe, () => ({ size }), { size: 'xs' });
    let offset = _state({ x: 0, y: 0 });
    watch(
      () => open,
      (now) => {
        if (now) offset = { x: 0, y: 0 };
      },
    );

    function drag(event: PointerEvent) {
      const header = event.currentTarget as Element;
      const panel = header.closest('dialog');
      if (!panel || (event.target as Element).closest(NOT_A_HANDLE)) return;
      // 按下时整块还能往四边挪多少：拖到哪都不超出窗口
      const rect = panel.getBoundingClientRect();
      const start = offset;
      const x = [start.x - rect.left, start.x + window.innerWidth - rect.right] as const;
      const y = [start.y - rect.top, start.y + window.innerHeight - rect.bottom] as const;
      startMove(event, {
        onMove: ({ deltaX, deltaY }) =>
          (offset = { x: clamp(start.x + deltaX, ...x), y: clamp(start.y + deltaY, ...y) }),
      });
    }

    return () => (
      <ModalCore
        {...mergeProps<Partial<ModalProps>>(
          { sx: draggable && dialogDragDynamicStyles.offset(offset.x, offset.y) },
          rest,
        )}
        title={rest.title}
        propsHeader={
          draggable
            ? mergeProps<Partial<FlexProps>>(
                { sx: dialogDragStyles.handle, onPointerdown: drag },
                propsHeader,
              )
            : propsHeader
        }
        parts={ui().parts}
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
