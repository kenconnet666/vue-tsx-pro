/**
 * 弹层的基础工具。弹层本身用原生 popover / dialog（顶层渲染、Esc、点击外部、嵌套顺序、
 * 背景 inert 都由浏览器负责，见 apps/host-demo/test/native-overlay.browser.test.ts），
 * 这里只补浏览器不做或做得不一致的：组件实例 → 元素、关闭后归还焦点、模态里的焦点循环、点击遮罩关闭、锁定页面滚动，
 * 以及元素被移除后焦点的去向。
 */
import { tabbable } from 'tabbable';

/** ref 落在组件上拿到的是组件实例，取它的根元素；本来就是元素时原样返回 */
export function toElement(value: unknown): HTMLElement | null {
  if (value instanceof HTMLElement) return value;
  const root = (value as { $el?: unknown } | null)?.$el;
  return root instanceof HTMLElement ? root : null;
}

/** 把焦点移到容器里第一个可聚焦的元素（有 autofocus 的优先）；没有时聚焦容器本身 */
export function focusFirst(container: HTMLElement): void {
  const target =
    container.querySelector<HTMLElement>('[autofocus]') ?? tabbable(container)[0] ?? container;
  target.focus();
}

const FOCUSABLE = 'button, a[href], input, select, textarea, summary, [tabindex]';

/** Safari 点击按钮不会聚焦它：记下最近一次按下的可聚焦元素，作为焦点来源的备选 */
let lastPressed: Element | null = null;
if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerdown',
    (event) => (lastPressed = (event.target as Element).closest?.(FOCUSABLE) ?? null),
    true,
  );
}

/** 打开弹层前的焦点来源，关闭时交给 returnFocus：当前焦点；焦点在 body 上时取最近一次按下的可聚焦元素 */
export function focusOrigin(): Element | null {
  const active = document.activeElement;
  return active && active !== document.body ? active : lastPressed;
}

/**
 * 关闭弹层后把焦点还给 target（触发器或打开前的元素）。焦点还在弹层里、或已经丢到 body 上时才还；
 * 用户已经把焦点移到别处时不打扰。原生关闭后各浏览器不一致：Chromium 会还回去，
 * WebKit 把焦点留在已隐藏的弹层里，所以统一由组件负责。
 */
export function returnFocus(overlay: HTMLElement, target: Element | null): void {
  const active = document.activeElement;
  const lost = !active || active === document.body || overlay.contains(active);
  if (lost && target instanceof HTMLElement && target.isConnected) target.focus();
}

/**
 * 用户在 element 里点了移除或关闭（Tag 的移除、Alert 与 Toast 的关闭）时、调用回调之前调用：
 * element 随后真的被移除、焦点随之掉到 body 上时，把焦点交给同组（父元素里）的下一个可聚焦元素，
 * 没有就交给上一个，都没有时交给 fallback（同 React Aria TagGroup：移除后焦点落到相邻的项上）。
 * 浏览器只保留 Tab 的起点，读屏用户却会被带回页面开头，所以由组件接住。
 * 焦点已经移到别处、或 element 没被移除，都不打扰。
 */
export function focusAfterRemoval(element: HTMLElement, fallback?: HTMLElement | null): void {
  const group = element.parentElement;
  if (!group || !element.contains(document.activeElement)) return;
  const others = tabbable(group).filter((item) => !element.contains(item));
  const following = others.filter(
    (item) => element.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  const preceding = others.filter((item) => !following.includes(item)).reverse();
  const candidates = fallback
    ? [...following, ...preceding, fallback]
    : [...following, ...preceding];

  const stop = () => {
    observer.disconnect();
    element.removeEventListener('focusout', onFocusOut);
  };
  // 焦点被用户移到 element 外面：不再接管
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !element.contains(next)) stop();
  };
  // 移除发生在 Vue 更新 DOM 时；MutationObserver 的回调在这之后的微任务里运行
  const observer = new MutationObserver(() => {
    if (element.isConnected) return;
    stop();
    const active = document.activeElement;
    if (active && active !== document.body) return;
    candidates.find((item) => item.isConnected)?.focus();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  element.addEventListener('focusout', onFocusOut);
}

/**
 * 模态里的焦点循环：在最后一个元素上按 Tab 回到第一个，在第一个上按 Shift+Tab 到最后一个。
 * 原生模态 dialog 不做这一步（焦点会离开页面）。返回撤销函数。
 */
export function trapFocus(container: HTMLElement): () => void {
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const items = tabbable(container);
    if (!items.length) {
      event.preventDefault();
      return;
    }
    const first = items[0]!;
    const last = items.at(-1)!;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === container)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
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

let locks = 0;
let restore: (() => void) | undefined;

/**
 * 锁定页面滚动（打开模态时）。可以叠加：最后一个解锁时才恢复。
 * 去掉滚动条后用等宽的右侧内边距补上，页面内容不会左右跳动。返回解锁函数，重复调用无副作用。
 */
export function lockScroll(): () => void {
  if (locks++ === 0) {
    const root = document.documentElement;
    const scrollbar = window.innerWidth - root.clientWidth;
    const previous = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
    root.style.overflow = 'hidden';
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
    restore = () => Object.assign(root.style, previous);
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) restore?.();
  };
}
