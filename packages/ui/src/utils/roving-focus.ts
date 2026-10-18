/**
 * 漫游焦点（WAI-ARIA 的 roving tabindex）：一组项里只有一个能用 Tab 进入（tabindex=0），其余为 -1；
 * 组内用方向键移动，Home / End 到两端。Tabs、Toolbar、Pagination、Steps 共用（参考 Radix 的 RovingFocusGroup）。
 *
 * 直接管理容器里各项的 tabindex（组件渲染时不要再写 tabindex），所以项可以是任意可聚焦元素：
 * 工具栏里的按钮、标签页、链接都行。项增删、选中项变化时自动重新计算。
 *
 *   _effect(() => (list ? rovingFocus(list, { items: '[role="tab"]', orientation: 'horizontal' }) : undefined));
 */

/** 方向键的方向 */
export interface RovingOrientations {
  /** 左右键（从右到左排版时反过来） */
  horizontal: unknown;
  /** 上下键 */
  vertical: unknown;
  /** 四个方向键都可以（如分页、网格状的工具栏） */
  both: unknown;
}

/** rovingFocus 的选项 */
export interface RovingFocusOptions {
  /** 项的选择器，在容器内查找；不可用（disabled、aria-disabled="true"）、隐藏的项跳过 */
  items: string;
  /** 方向键的方向，默认 horizontal */
  orientation?: keyof RovingOrientations;
  /** 到两端后是否从另一端继续，默认 true */
  loop?: boolean;
  /** Tab 进入时落在哪一项：默认是上次聚焦的项，其次是选中或当前的项（aria-selected / pressed / checked / current），再其次是第一项 */
  initial?: (items: HTMLElement[]) => HTMLElement | undefined;
}

/** 可以停留：没有不可用，也不在隐藏或 inert 的区域里 */
const isEnabled = (element: HTMLElement) =>
  !element.matches(':disabled, [aria-disabled="true"]') && !element.closest('[hidden], [inert]');

/** 选中或当前的项：Tab 进入时优先落在它上面 */
const isMarked = (element: HTMLElement) =>
  element.getAttribute('aria-selected') === 'true' ||
  element.getAttribute('aria-pressed') === 'true' ||
  element.getAttribute('aria-checked') === 'true' ||
  (element.hasAttribute('aria-current') && element.getAttribute('aria-current') !== 'false');

/** 开始管理容器里各项的焦点，返回清理函数 */
export function rovingFocus(container: HTMLElement, options: RovingFocusOptions): () => void {
  const { orientation = 'horizontal', loop = true } = options;
  let current: HTMLElement | undefined;

  const all = () => [...container.querySelectorAll<HTMLElement>(options.items)];
  const enabled = () => all().filter(isEnabled);

  /** 定下哪一项是 Tab 进入点，其余设为 -1 */
  function sync() {
    const items = enabled();
    const stop =
      (current && items.includes(current) ? current : undefined) ??
      options.initial?.(items) ??
      items.find(isMarked) ??
      items[0];
    for (const item of all()) {
      const value = item === stop ? '0' : '-1';
      if (item.getAttribute('tabindex') !== value) item.setAttribute('tabindex', value);
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const items = enabled();
    const index = items.indexOf(event.target as HTMLElement);
    if (index < 0) return;
    const rtl = getComputedStyle(container).direction === 'rtl';
    const horizontal = orientation !== 'vertical';
    const vertical = orientation !== 'horizontal';
    const steps: Record<string, number | 'first' | 'last' | undefined> = {
      ArrowRight: horizontal ? (rtl ? -1 : 1) : undefined,
      ArrowLeft: horizontal ? (rtl ? 1 : -1) : undefined,
      ArrowDown: vertical ? 1 : undefined,
      ArrowUp: vertical ? -1 : undefined,
      Home: 'first',
      End: 'last',
    };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    let next: number;
    if (step === 'first') next = 0;
    else if (step === 'last') next = items.length - 1;
    else if (loop) next = (index + step + items.length) % items.length;
    else next = Math.min(items.length - 1, Math.max(0, index + step));
    items[next]!.focus();
  }

  function onFocusin(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (!all().includes(target)) return;
    current = target;
    sync();
  }

  container.addEventListener('keydown', onKeydown);
  container.addEventListener('focusin', onFocusin);
  // 项增删、选中或可用状态变化时重新定 Tab 进入点
  const observer = new MutationObserver(sync);
  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'disabled',
      'aria-disabled',
      'aria-selected',
      'aria-pressed',
      'aria-checked',
      'aria-current',
      'hidden',
    ],
  });
  sync();

  return () => {
    container.removeEventListener('keydown', onKeydown);
    container.removeEventListener('focusin', onFocusin);
    observer.disconnect();
  };
}
