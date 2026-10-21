/**
 * 弹层的基础工具。弹层本身用原生 popover / dialog（顶层渲染、Esc、点击外部、嵌套顺序、
 * 背景 inert 都由浏览器负责，见 apps/host-demo/test/native-overlay.browser.test.ts），
 * 这里只补浏览器不做或做得不一致的：组件实例 → 元素、点击遮罩关闭、登记打开着的模态、锁定页面滚动。
 * 焦点的进出与循环见 focus.ts。
 */
import { shallowReactive } from 'vue';
import { focusOrigin, returnFocus, trapFocus } from './focus';

/** ref 落在组件上拿到的是组件实例，取它的根元素；本来就是元素时原样返回 */
export function toElement(value: unknown): HTMLElement | null {
  if (value instanceof HTMLElement) return value;
  const root = (value as { $el?: unknown } | null)?.$el;
  return root instanceof HTMLElement ? root : null;
}

/**
 * 点击模态 dialog 的遮罩时调用 onDismiss。不能只看 event.target === dialog：
 * dialog 自己的内边距、以及在内容里按下再拖到遮罩上松开（选中文字）时，click 的目标也是 dialog。
 * 所以按坐标判断，而且按下与松开都要在 dialog 的边框之外。返回撤销函数。
 */
export function dismissOnBackdrop(dialog: HTMLDialogElement, onDismiss: () => void): () => void {
  const outside = (event: MouseEvent) => {
    if (event.target !== dialog) return false;
    const rect = dialog.getBoundingClientRect();
    const { clientX: x, clientY: y } = event;
    return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
  };
  let pressedOutside = false;
  const onPointerDown = (event: PointerEvent) => (pressedOutside = outside(event));
  const onClick = (event: MouseEvent) => {
    if (pressedOutside && outside(event)) onDismiss();
    pressedOutside = false;
  };
  dialog.addEventListener('pointerdown', onPointerDown);
  dialog.addEventListener('click', onClick);
  return () => {
    dialog.removeEventListener('pointerdown', onPointerDown);
    dialog.removeEventListener('click', onClick);
  };
}

/** 打开着的模态 dialog，后打开的在后面 */
const modals = shallowReactive<HTMLDialogElement[]>([]);

/**
 * 记下一个打开的模态（Dialog 等组件在 showModal 后调用），返回移除函数，重复调用无副作用。
 * 模态打开时外面的元素都是 inert 的，顶层的 manual popover 也不例外（见 native-overlay 的浏览器测试），
 * 所以要在模态打开期间可交互的浮层（Toaster）用 topModal() 把自己移进最上层的模态里。
 */
export function trackModal(dialog: HTMLDialogElement): () => void {
  modals.push(dialog);
  return () => {
    const index = modals.indexOf(dialog);
    if (index >= 0) modals.splice(index, 1);
  };
}

/** 最上层的模态 dialog；没有时为 undefined。在渲染或 computed 里读取会跟着变化 */
export function topModal(): HTMLDialogElement | undefined {
  return modals.at(-1);
}

/** openModalDialog 的选项 */
export interface ModalDialogOptions {
  /** 锁定页面滚动，默认 true */
  lockScroll?: boolean;
  /** 点遮罩（对话框外面）关闭，默认 false */
  dismissOnBackdrop?: boolean;
}

/**
 * 以模态方式打开原生 dialog，接上全部的模态行为：记下焦点来源、showModal、登记为最上层的模态（topModal）、
 * 锁定页面滚动、焦点陷阱，可选点遮罩关闭。返回释放函数：dialog 关闭时调用，撤销以上并把焦点还给来源。
 * ModalCore（Dialog、Drawer、AlertDialog、CommandPalette）与 Tour 共用
 */
export function openModalDialog(
  dialog: HTMLDialogElement,
  { lockScroll: lock = true, dismissOnBackdrop: dismiss = false }: ModalDialogOptions = {},
): () => void {
  const opener = focusOrigin();
  dialog.showModal();
  const cleanups = [
    trackModal(dialog),
    lock ? lockScroll() : undefined,
    trapFocus(dialog),
    dismiss ? dismissOnBackdrop(dialog, () => dialog.close()) : undefined,
  ];
  return () => {
    for (const cleanup of cleanups) cleanup?.();
    returnFocus(dialog, opener);
  };
}

let locks = 0;
let restore: (() => void) | undefined;

/**
 * 锁定页面滚动（打开模态时）。可以叠加：最后一个解锁时才恢复。
 * 去掉滚动条后在结束边（滚动条那一侧，从右到左时在左边）补上等宽的内边距，加在原有的内边距上，
 * 页面内容不会左右跳动。返回解锁函数，重复调用无副作用。
 */
export function lockScroll(): () => void {
  if (locks++ === 0) {
    const root = document.documentElement;
    const scrollbar = window.innerWidth - root.clientWidth;
    const previous = {
      overflow: root.style.overflow,
      paddingInlineEnd: root.style.paddingInlineEnd,
    };
    if (scrollbar > 0) {
      const padding = getComputedStyle(root).paddingInlineEnd || '0px';
      root.style.paddingInlineEnd = `calc(${padding} + ${scrollbar}px)`;
    }
    root.style.overflow = 'hidden';
    restore = () => Object.assign(root.style, previous);
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) restore?.();
  };
}
