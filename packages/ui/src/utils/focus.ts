/**
 * 焦点工具：弹层的焦点进出（focusFirst、focusOrigin、returnFocus、trapFocus）与元素被移除后焦点的去向
 * （focusAfterRemoval）。浏览器在这些地方不做或各家不一致，组件统一用这里的实现。
 * 漫游焦点（一组项里方向键移动）见 roving-focus.ts。
 */
import { tabbable } from 'tabbable';

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
