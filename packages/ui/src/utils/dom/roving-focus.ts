/**
 * 漫游焦点（WAI-ARIA 的 roving tabindex）：一组项里只有一个能用 Tab 进入（tabindex=0），其余为 -1；
 * 组内用方向键移动，Home / End 到两端。Tabs、Toolbar、Menu、ToggleGroup 共用（参考 Radix 的 RovingFocusGroup）。
 * 二维的网格（表格的单元格、整页日历）用 gridFocus：方向键在行列之间移动。
 *
 * 直接管理容器里各项的 tabindex（组件渲染时不要再写 tabindex），所以项可以是任意可聚焦元素：
 * 工具栏里的按钮、标签页、链接都行。项增删、选中项变化时自动重新计算。
 *
 *   _effect(() => (list ? rovingFocus(list, { items: '[role="tab"]', orientation: 'horizontal' }) : undefined));
 */
import { clamp } from '../data/number';
import { isRtl } from './direction';
import { createTypeahead } from './typeahead';

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
  /** 按字母跳到以它开头的项（菜单、列表），默认 false；匹配的是项的文字 */
  typeahead?: boolean;
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
  const typeahead = options.typeahead ? createTypeahead() : undefined;
  let current: HTMLElement | undefined;

  // 嵌套的组（自己也调用了 rovingFocus 的容器）各管各的：只取最近的组是自己的项。
  // 工具栏里的 ToggleGroup 不调用，它的按钮归工具栏
  // 容器里的弹层（popover、dialog）是另一个焦点范围：工具栏里 Popover 的面板、对话框里的按钮不归工具栏
  const all = () =>
    [...container.querySelectorAll<HTMLElement>(options.items)].filter((item) => {
      if (item.parentElement?.closest('[data-roving-focus]') !== container) return false;
      const layer = item.closest('[popover], dialog');
      // 容器自己就是弹层（菜单的面板）时，它里面的项照常归它
      return !layer || layer === container || !container.contains(layer);
    });
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
    const rtl = isRtl(container);
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
    if (step === undefined) {
      const match = typeahead?.next(
        event.key,
        items.map((item) => item.textContent ?? ''),
        index,
      );
      if (match != null && match >= 0) {
        event.preventDefault();
        items[match]!.focus();
      }
      return;
    }
    event.preventDefault();
    let next: number;
    if (step === 'first') next = 0;
    else if (step === 'last') next = items.length - 1;
    else if (loop) next = (index + step + items.length) % items.length;
    else next = clamp(index + step, 0, items.length - 1);
    items[next]!.focus();
  }

  function onFocusin(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (!all().includes(target)) return;
    current = target;
    sync();
  }

  container.setAttribute('data-roving-focus', '');
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
      // 嵌套的组挂载时（子组件先于父组件）重新划分各组的项
      'data-roving-focus',
    ],
  });
  sync();

  return () => {
    container.removeAttribute('data-roving-focus');
    container.removeEventListener('keydown', onKeydown);
    container.removeEventListener('focusin', onFocusin);
    observer.disconnect();
  };
}

/** gridFocus 的选项 */
export interface GridFocusOptions {
  /** 行的选择器，在容器内查找（如 `[role="row"]`） */
  rows: string;
  /** 行里可聚焦的格的选择器（格本身，或格里的按钮）；不可用、隐藏的格跳过 */
  cells: string;
  /** PageUp / PageDown 一次移动几行，默认 10 */
  pageRows?: number;
  /** Tab 进入时落在哪一格：默认是上次聚焦的格，其次是选中或当前的格，再其次是第一格 */
  initial?: (cells: HTMLElement[]) => HTMLElement | undefined;
}

/**
 * 网格的漫游焦点（WAI-ARIA 的 Grid 模式）：整个网格只有一格能用 Tab 进入，方向键在行列之间移动。
 * ← → 在行内移动（从右到左排版时反过来），↑ ↓ 到上下一行的同一列（那一行短时到最后一格），
 * Home / End 到行首、行尾，Ctrl + Home / End 到第一格、最后一格，PageUp / PageDown 跨几行。不循环。
 * 表格的单元格导航、整页日历用它；行、格增删时自动重新计算。返回清理函数
 *
 *   _effect(() => (table ? gridFocus(table, { rows: 'tr', cells: '[role="gridcell"]' }) : undefined));
 */
export function gridFocus(container: HTMLElement, options: GridFocusOptions): () => void {
  const pageRows = options.pageRows ?? 10;
  let current: HTMLElement | undefined;

  /** 各行里能停留的格（空行去掉） */
  const grid = () =>
    [...container.querySelectorAll<HTMLElement>(options.rows)]
      .map((row) => [...row.querySelectorAll<HTMLElement>(options.cells)].filter(isEnabled))
      .filter((cells) => cells.length > 0);
  const allCells = () => [...container.querySelectorAll<HTMLElement>(options.cells)];

  function sync() {
    const cells = grid().flat();
    const stop =
      (current && cells.includes(current) ? current : undefined) ??
      options.initial?.(cells) ??
      cells.find(isMarked) ??
      cells[0];
    for (const cell of allCells()) {
      const value = cell === stop ? '0' : '-1';
      if (cell.getAttribute('tabindex') !== value) cell.setAttribute('tabindex', value);
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.altKey || event.metaKey) return;
    const rows = grid();
    const row = rows.findIndex((cells) => cells.includes(event.target as HTMLElement));
    if (row < 0) return;
    const column = rows[row]!.indexOf(event.target as HTMLElement);
    const rtl = isRtl(container);
    const last = rows.length - 1;
    const at = (r: number, c: number) => {
      const cells = rows[clamp(r, 0, last)]!;
      return cells[clamp(c, 0, cells.length - 1)];
    };
    const ctrl = event.ctrlKey;
    const targets: Record<string, (() => HTMLElement | undefined) | undefined> = {
      ArrowRight: ctrl ? undefined : () => at(row, column + (rtl ? -1 : 1)),
      ArrowLeft: ctrl ? undefined : () => at(row, column + (rtl ? 1 : -1)),
      ArrowDown: ctrl ? undefined : () => at(row + 1, column),
      ArrowUp: ctrl ? undefined : () => at(row - 1, column),
      Home: () => (ctrl ? rows[0]![0] : rows[row]![0]),
      End: () => (ctrl ? rows[last]!.at(-1) : rows[row]!.at(-1)),
      PageDown: ctrl ? undefined : () => at(row + pageRows, column),
      PageUp: ctrl ? undefined : () => at(row - pageRows, column),
    };
    const next = targets[event.key]?.();
    if (!next) return;
    event.preventDefault();
    next.focus();
  }

  function onFocusin(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (!allCells().includes(target)) return;
    current = target;
    sync();
  }

  container.addEventListener('keydown', onKeydown);
  container.addEventListener('focusin', onFocusin);
  const observer = new MutationObserver(sync);
  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'aria-disabled', 'aria-selected', 'aria-current', 'hidden'],
  });
  sync();

  return () => {
    container.removeEventListener('keydown', onKeydown);
    container.removeEventListener('focusin', onFocusin);
    observer.disconnect();
  };
}
