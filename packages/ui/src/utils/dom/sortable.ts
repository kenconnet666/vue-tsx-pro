/**
 * 拖动排序：把手上按下拖动，或聚焦把手后用键盘（WCAG 2.5.7 的替代操作），改变一列项的顺序。
 * 参考 dnd-kit 的 Sortable 与 Atlassian Pragmatic drag and drop 的无障碍做法。Sortable 组件建在它上面，
 * 表格的列、行排序也可以直接用它（把手放在表头里）。
 *
 *   const sortable = useSortable({
 *     items: () => list, getKey: (item) => item.id, getLabel: (item) => item.title,
 *     onChange: (next) => (list = next), container: () => listElement,
 *   });
 *   <li {...sortable.itemProps(key)}><button {...sortable.handleProps(key)} aria-label={…} />…</li>
 *   <VisuallyHidden id={sortable.instructionsId}>{lang.sortableInstructions}</VisuallyHidden>
 *   <VisuallyHidden aria-live="assertive">{sortable.announcement}</VisuallyHidden>
 *
 * - 指针：拖动超过 3px 才开始；被拖的项跟着指针，越过别的项的中线时数据立即重排，其余项用布局动画平移让位；
 *   靠近滚动容器边缘时自动滚动；松开时滑回自己的位置，Esc 或指针取消时回到原来的位置。
 * - 键盘：空格 / Enter 拿起，方向键（竖排 ↑↓，横排 ←→，跟随 RTL）移动一位，Home / End 移到两端，
 *   空格 / Enter 放下，Esc 取消；拿起、移动、放下、取消都由 announcement 交给读屏播报。
 * - 减少动态效果时布局动画与滑回都直接到位。
 */
import { set } from 'animejs';
import { nextTick, onBeforeUnmount, shallowRef, useId } from 'vue';
import { useLang } from '../../config/context';
import { clamp } from '../data/number';
import { isRtl } from './direction';
import { useAnimate } from '../motion/animation';
import { useLayoutAnimation } from '../motion/layout';
import { startMove } from './move';

/** 排列方向：决定按哪个轴拖动、方向键用上下还是左右 */
export interface SortableOrientations {
  /** 竖排（默认） */
  vertical: unknown;
  /** 横排 */
  horizontal: unknown;
}

/** useSortable 的选项 */
export interface SortableOptions<T> {
  /** 当前的各项 */
  items: () => readonly T[];
  /** 项的 key，同一列表里唯一 */
  getKey: (item: T) => string;
  /** 项的名称：读屏播报与把手的名称用它；默认是 key */
  getLabel?: (item: T) => string;
  /** 顺序变了：写回新的数组 */
  onChange: (items: T[]) => void;
  /** 各项所在的容器（元素或组件实例）：布局动画、自动滚动在它里面进行 */
  container: () => unknown;
  /** 排列方向，默认 vertical */
  orientation?: () => keyof SortableOrientations;
  /** 不可用 */
  disabled?: () => boolean;
}

/** useSortable 的返回值 */
export interface SortableState {
  /** 正在拖动或被键盘拿起的项的 key */
  readonly active: string | undefined;
  /** 读屏播报的文字：放进 aria-live 区域 */
  readonly announcement: string;
  /** 操作说明元素的 id：把手经 aria-describedby 指向它 */
  readonly instructionsId: string;
  /** 把手的属性：展开到把手元素（button）上 */
  handleProps(key: string): Record<string, unknown>;
  /** 项的属性：展开到项的根元素上 */
  itemProps(key: string): Record<string, unknown>;
}

/** 指针离容器边缘多近（px）时开始自动滚动 */
const EDGE = 40;
/** 自动滚动每帧最多滚多少 px */
const MAX_SCROLL_STEP = 16;

/** 拖动排序的状态与事件（在 setup 里调用） */
export function useSortable<T>(options: SortableOptions<T>): SortableState {
  const lang = useLang();
  const animate = useAnimate();
  const instructionsId = `${useId()}-sortable`;
  const active = shallowRef<string | undefined>();
  const announcement = shallowRef('');
  // 键盘拿起时的原位置：Esc 回到这里
  let grabbedFrom = -1;
  // 重排时 Vue 移动 DOM 会让把手失焦：这期间的 blur 不算放下
  let reordering = false;
  let stopMove: (() => void) | undefined;
  let scrollFrame = 0;

  const container = () => {
    const value = options.container();
    return value instanceof HTMLElement ? value : null;
  };
  const horizontal = () => options.orientation?.() === 'horizontal';
  const layout = useLayoutAnimation(options.container, {
    // 被指针拖着的项跟着指针走，不参与布局动画
    children: '[data-sortable-item]:not([data-dragging])',
    duration: 'sm',
  });
  onBeforeUnmount(() => {
    stopMove?.();
    cancelAnimationFrame(scrollFrame);
  });

  const keys = () => options.items().map(options.getKey);
  const indexOf = (key: string) => keys().indexOf(key);
  const labelOf = (key: string) => {
    const item = options.items().find((candidate) => options.getKey(candidate) === key);
    return item === undefined ? key : (options.getLabel?.(item) ?? key);
  };
  const itemElement = (key: string) =>
    container()?.querySelector<HTMLElement>(`[data-sortable-item="${CSS.escape(key)}"]`) ?? null;
  const handleElement = (key: string) =>
    container()?.querySelector<HTMLElement>(`[data-sortable-handle="${CSS.escape(key)}"]`) ?? null;

  /** 把 key 移到 to 处；返回 DOM 更新完成 */
  async function moveTo(key: string, to: number): Promise<void> {
    const list = [...options.items()];
    const from = indexOf(key);
    const target = clamp(to, 0, list.length - 1);
    if (from < 0 || from === target) return;
    const [item] = list.splice(from, 1);
    list.splice(target, 0, item!);
    const focused = document.activeElement === handleElement(key);
    reordering = true;
    void layout.change(() => options.onChange(list));
    await nextTick();
    reordering = false;
    // Vue 移动 DOM 时焦点可能丢了：放回被移动的项的把手上
    const handle = handleElement(key);
    if (focused && handle && document.activeElement !== handle) {
      handle.focus({ preventScroll: true });
    }
  }

  const announce = (text: string) => (announcement.value = text);
  const position = (key: string) => indexOf(key) + 1;

  // ───────── 键盘 ─────────

  function grab(key: string) {
    active.value = key;
    grabbedFrom = indexOf(key);
    announce(lang.sortableGrabbed(labelOf(key), position(key), keys().length));
  }

  function drop(key: string) {
    active.value = undefined;
    announce(lang.sortableDropped(labelOf(key), position(key), keys().length));
  }

  function cancel(key: string) {
    active.value = undefined;
    void moveTo(key, grabbedFrom);
    announce(lang.sortableCancelled(labelOf(key), grabbedFrom + 1));
  }

  function onKeydown(event: KeyboardEvent, key: string) {
    if (options.disabled?.() || event.altKey || event.ctrlKey || event.metaKey) return;
    const grabbed = active.value === key;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (grabbed) drop(key);
      else grab(key);
      return;
    }
    if (!grabbed) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel(key);
      return;
    }
    const rtl = horizontal() && isRtl(event.currentTarget as Element);
    const steps: Record<string, number | 'first' | 'last'> = horizontal()
      ? { [rtl ? 'ArrowLeft' : 'ArrowRight']: 1, [rtl ? 'ArrowRight' : 'ArrowLeft']: -1 }
      : { ArrowDown: 1, ArrowUp: -1 };
    steps.Home = 'first';
    steps.End = 'last';
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const from = indexOf(key);
    const to = step === 'first' ? 0 : step === 'last' ? keys().length - 1 : from + step;
    if (to < 0 || to >= keys().length || to === from) return;
    void moveTo(key, to).then(() =>
      announce(lang.sortableMoved(labelOf(key), position(key), keys().length)),
    );
  }

  function onBlur(key: string) {
    if (!reordering && active.value === key) drop(key);
  }

  // ───────── 指针 ─────────

  function onPointerdown(event: PointerEvent, key: string) {
    if (options.disabled?.() || active.value !== undefined) return;
    const root = container();
    const element = itemElement(key);
    if (!root || !element) return;
    const scroller = scrollParent(root);
    const axis = () => (horizontal() ? 'x' : 'y');
    const scrollOf = () => (axis() === 'x' ? scroller.scrollLeft : scroller.scrollTop);
    const startOf = (rect: DOMRect) => (axis() === 'x' ? rect.left : rect.top);
    const sizeOf = (rect: DOMRect) => (axis() === 'x' ? rect.width : rect.height);
    const startScroll = scrollOf();
    // 按下时各项的位置（内容坐标）：判断越过了谁的中线
    const centers = new Map(
      keys().map((itemKey) => {
        const rect = itemElement(itemKey)?.getBoundingClientRect();
        return [itemKey, rect ? startOf(rect) + startScroll + sizeOf(rect) / 2 : 0];
      }),
    );
    const origin = element.getBoundingClientRect();
    const originStart = startOf(origin);
    let delta = 0;
    let offset = 0;
    let pointer = { x: event.clientX, y: event.clientY };

    /** 被拖的项跟着指针：位移 = 指针的位移 − 它在布局里的位置变化 */
    const follow = () => {
      const current = itemElement(key);
      if (!current) return;
      const natural = startOf(current.getBoundingClientRect()) - offset;
      offset = originStart + delta - natural;
      void set(current, axis() === 'x' ? { x: offset } : { y: offset });
    };

    /** 越过了几个别的项的中线，就排到第几位 */
    const reorder = () => {
      const center = originStart + delta + scrollOf() + sizeOf(origin) / 2;
      const target = keys().filter(
        (itemKey) => itemKey !== key && centers.get(itemKey)! < center,
      ).length;
      if (target !== indexOf(key)) void moveTo(key, target).then(follow);
      else follow();
    };

    const autoScroll = () => {
      cancelAnimationFrame(scrollFrame);
      const rect =
        scroller === document.scrollingElement ? viewportRect() : scroller.getBoundingClientRect();
      const along = axis() === 'x' ? pointer.x : pointer.y;
      const [low, high] = axis() === 'x' ? [rect.left, rect.right] : [rect.top, rect.bottom];
      const speed =
        along < low + EDGE
          ? -MAX_SCROLL_STEP * (1 - (along - low) / EDGE)
          : along > high - EDGE
            ? MAX_SCROLL_STEP * (1 - (high - along) / EDGE)
            : 0;
      if (speed === 0) return;
      scroller.scrollBy(axis() === 'x' ? { left: speed } : { top: speed });
      reorder();
      scrollFrame = requestAnimationFrame(autoScroll);
    };

    const finish = (cancelled: boolean) => {
      cancelAnimationFrame(scrollFrame);
      stopMove = undefined;
      const current = itemElement(key);
      const done = () => {
        current?.removeAttribute('data-dragging');
        active.value = undefined;
        announce(lang.sortableDropped(labelOf(key), position(key), keys().length));
      };
      const settle = () => {
        if (!current) return done();
        // 滑回自己在布局里的位置
        void animate(current, axis() === 'x' ? { x: 0 } : { y: 0 }, { duration: 'sm' }).then(done);
      };
      if (cancelled && grabbedFrom !== indexOf(key)) {
        void moveTo(key, grabbedFrom).then(() => {
          follow();
          settle();
        });
      } else settle();
    };

    stopMove = startMove(event, {
      threshold: 3,
      onMove: (point) => {
        if (active.value !== key) {
          active.value = key;
          grabbedFrom = indexOf(key);
          element.setAttribute('data-dragging', '');
          announce(lang.sortableGrabbed(labelOf(key), position(key), keys().length));
        }
        delta = axis() === 'x' ? point.deltaX : point.deltaY;
        pointer = { x: point.clientX, y: point.clientY };
        reorder();
        autoScroll();
      },
      onEnd: ({ moved, cancelled }) => {
        if (moved && active.value === key) finish(cancelled);
      },
    });
  }

  // 拖动中按 Esc：取消，回到原位
  function onDragKeydown(event: KeyboardEvent, key: string) {
    if (event.key === 'Escape' && stopMove && active.value === key) {
      event.preventDefault();
      stopMove();
      return true;
    }
    return false;
  }

  return {
    get active() {
      return active.value;
    },
    get announcement() {
      return announcement.value;
    },
    instructionsId,
    handleProps: (key) => ({
      'data-sortable-handle': key,
      'aria-describedby': instructionsId,
      'aria-pressed': active.value === key,
      onPointerdown: (event: PointerEvent) => onPointerdown(event, key),
      onKeydown: (event: KeyboardEvent) => {
        if (!onDragKeydown(event, key)) onKeydown(event, key);
      },
      onBlur: () => onBlur(key),
    }),
    itemProps: (key) => ({
      'data-sortable-item': key,
      'data-state': active.value === key ? 'active' : undefined,
    }),
  };
}

/** 最近的能滚动的祖先（含自己）；都不能滚时是页面 */
function scrollParent(element: HTMLElement): HTMLElement {
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(current);
    const scrollable = /auto|scroll|overlay/;
    if (
      (scrollable.test(overflowY) && current.scrollHeight > current.clientHeight) ||
      (scrollable.test(overflowX) && current.scrollWidth > current.clientWidth)
    ) {
      return current;
    }
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

const viewportRect = () => new DOMRect(0, 0, window.innerWidth, window.innerHeight);
