/**
 * 拖动排序：把手上按下拖动，或聚焦把手后用键盘（WCAG 2.5.7 的替代操作），改变一列项的顺序；
 * 给了 groups 时项分在几个容器里（看板的列），组内排序之外还能拖到别的组。
 * 参考 dnd-kit 的 Sortable（多容器）与 Atlassian Pragmatic drag and drop 的无障碍做法。
 * Sortable、KanbanBoard 建在它上面，表格的列、行排序也可以直接用它（把手放在表头里）。
 *
 *   const sortable = useSortable({
 *     items: () => list, getKey: (item) => item.id, getLabel: (item) => item.title,
 *     onChange: (next) => (list = next), container: () => listElement,
 *   });
 *   <li {...sortable.itemProps(key)}><button {...sortable.handleProps(key)} aria-label={…} />…</li>
 *   <VisuallyHidden id={sortable.instructionsId}>{lang.sortableInstructions}</VisuallyHidden>
 *   <VisuallyHidden aria-live="assertive">{sortable.announcement}</VisuallyHidden>
 *
 * - 指针：拖动超过 3px 才开始；越过组内别的项的中线时数据立即重排，其余项用布局动画平移让位；
 *   靠近滚动容器边缘时自动滚动；Esc 或指针取消时回到原来的位置。
 *   单列时被拖的项自己跟着指针、松开时滑回；分组时项留在原处作占位，跟着指针走的是影子（ghost，由组件画在浮层里，
 *   不被列的滚动区域裁掉），拖到别的组时只标出落点（target），松开才报告 groups.onMove，数据由使用方改。
 * - 键盘：空格 / Enter 拿起，方向键（竖排 ↑↓，横排 ←→，跟随 RTL）在组内移动一位，Home / End 移到两端；
 *   分组时 ← / → 换组（落点在目标组里同样用 ↑↓ 调整），空格 / Enter 放下，Esc 取消；每一步都由 announcement 交给读屏播报。
 * - 减少动态效果时布局动画与滑回都直接到位。
 */
import { set } from 'animejs';
import { nextTick, onScopeDispose, shallowRef, useId } from 'vue';
import { useLang } from '../../config/context';
import { clamp } from '../data/number';
import { inlineArrows, isRtl } from './direction';
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

/** 分组（多容器）：项分在几个组里，组内排序，也能拖到别的组 */
export interface SortableGroups<T> {
  /** 各组的 key，按排列顺序（键盘 ← / → 按这个顺序换组） */
  keys: () => readonly string[];
  /** 项在哪一组 */
  of: (item: T) => string;
  /** 组的名称：读屏播报用它；默认是 key */
  label?: (group: string) => string;
  /** 能不能放进 to 组：返回不能的原因，null、undefined 是可以 */
  canMove?: (item: T, to: string) => string | null | undefined;
  /** 放到了别的组：index 是在目标组里的位置。使用方改数据（或先处理、刷新），项才换组 */
  onMove: (item: T, to: string, index: number) => void;
  /** 放到了不能放的组：项已回到原处，可以在这里提示原因 */
  onReject?: (item: T, to: string, reason: string) => void;
}

/** useSortable 的选项 */
export interface SortableOptions<T> {
  /** 当前的各项（分组时是所有组的项） */
  items: () => readonly T[];
  /** 项的 key，同一列表里唯一 */
  getKey: (item: T) => string;
  /** 项的名称：读屏播报与把手的名称用它；默认是 key */
  getLabel?: (item: T) => string;
  /** 组内顺序变了：写回新的数组。分组时可以不给，组内就不能排序 */
  onChange?: (items: T[]) => void;
  /** 各项所在的容器（元素或组件实例）：布局动画、自动滚动在它里面进行；分组时是包住所有组的元素 */
  container: () => unknown;
  /** 排列方向，默认 vertical；分组时指组内的方向 */
  orientation?: () => keyof SortableOrientations;
  /** 分组（多容器）；组的元素上展开 groupProps(组) */
  groups?: SortableGroups<T>;
  /** 不可用 */
  disabled?: () => boolean;
}

/** 拖动中的落点 */
export interface SortableTarget {
  /** 落在哪一组（不分组时是空字符串） */
  group: string;
  /** 在组里的位置，从 0 开始 */
  index: number;
  /** 不能放进这一组的原因；可以放时为 null */
  reason: string | null;
}

/** 分组时指针拖动的影子：跟着指针走，位置是视口坐标 */
export interface SortableGhost {
  /** 被拖的项的 key */
  key: string;
  /** 左边缘 */
  left: number;
  /** 上边缘 */
  top: number;
  /** 宽度（按下时项的宽度） */
  width: number;
}

/** useSortable 的返回值 */
export interface SortableState {
  /** 正在拖动或被键盘拿起的项的 key */
  readonly active: string | undefined;
  /** 拖动中的落点：分组时组件按它高亮目标组、画插入线 */
  readonly target: SortableTarget | undefined;
  /** 分组时指针拖动的影子；单列、键盘操作时没有 */
  readonly ghost: SortableGhost | undefined;
  /** 读屏播报的文字：放进 aria-live 区域 */
  readonly announcement: string;
  /** 操作说明元素的 id：把手经 aria-describedby 指向它 */
  readonly instructionsId: string;
  /** 把手的属性：展开到把手元素（button）上 */
  handleProps(key: string): Record<string, unknown>;
  /** 项的属性：展开到项的根元素上 */
  itemProps(key: string): Record<string, unknown>;
  /** 组的属性：分组时展开到每一组的元素上（指针按它判断在哪一组） */
  groupProps(group: string): Record<string, unknown>;
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
  const target = shallowRef<SortableTarget | undefined>();
  const ghost = shallowRef<SortableGhost | undefined>();
  const announcement = shallowRef('');
  // 拿起时在组里的位置：取消时回到这里
  let grabbedFrom = -1;
  // 重排时 Vue 移动 DOM 会让把手失焦：这期间的 blur 不算放下
  let reordering = false;
  let stopMove: (() => void) | undefined;
  let scrollFrame = 0;

  const groups = options.groups;
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
  onScopeDispose(() => {
    stopMove?.();
    cancelAnimationFrame(scrollFrame);
  });

  const itemOf = (key: string) =>
    options.items().find((candidate) => options.getKey(candidate) === key);
  const groupOf = (key: string) => {
    const item = itemOf(key);
    return groups && item !== undefined ? groups.of(item) : '';
  };
  /** 组里各项的 key（不分组时是全部） */
  const keysIn = (group: string) =>
    options
      .items()
      .filter((item) => !groups || groups.of(item) === group)
      .map(options.getKey);
  const indexOf = (key: string) => keysIn(groupOf(key)).indexOf(key);
  const labelOf = (key: string) => {
    const item = itemOf(key);
    return item === undefined ? key : (options.getLabel?.(item) ?? key);
  };
  const groupLabel = (group: string) => groups?.label?.(group) ?? group;
  const reasonFor = (key: string, group: string) => {
    const item = itemOf(key);
    if (!groups || item === undefined || group === groups.of(item)) return null;
    return groups.canMove?.(item, group) ?? null;
  };
  const query = (attribute: string, key: string) =>
    container()?.querySelector<HTMLElement>(`[${attribute}="${CSS.escape(key)}"]`) ?? null;
  const itemElement = (key: string) => query('data-sortable-item', key);
  const handleElement = (key: string) => query('data-sortable-handle', key);
  const groupElement = (group: string) => query('data-sortable-group', group);

  /** 在组里把 key 移到 to 处（数据立即重排）；返回 DOM 更新完成 */
  async function moveTo(key: string, to: number): Promise<void> {
    if (!options.onChange) return;
    const group = groupOf(key);
    const from = indexOf(key);
    const siblings = keysIn(group).filter((other) => other !== key);
    const index = clamp(to, 0, siblings.length);
    if (from < 0 || from === index) return;
    const list = [...options.items()];
    const [item] = list.splice(
      list.findIndex((candidate) => options.getKey(candidate) === key),
      1,
    );
    // 插到组里第 index 项的前面；放在组尾时接在组的最后一项后面
    const anchor = siblings[index] ?? siblings.at(-1);
    const anchorAt = list.findIndex((candidate) => options.getKey(candidate) === anchor);
    list.splice(siblings[index] === undefined ? anchorAt + 1 : anchorAt, 0, item!);
    const focused = document.activeElement === handleElement(key);
    reordering = true;
    const onChange = options.onChange;
    void layout.change(() => onChange(list));
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
  const total = (key: string) => keysIn(groupOf(key)).length;

  function grab(key: string) {
    active.value = key;
    grabbedFrom = indexOf(key);
    target.value = { group: groupOf(key), index: grabbedFrom, reason: null };
    announce(
      groups
        ? lang.sortableGroupGrabbed(labelOf(key), groupLabel(groupOf(key)), position(key))
        : lang.sortableGrabbed(labelOf(key), position(key), total(key)),
    );
  }

  function clear() {
    active.value = undefined;
    target.value = undefined;
    ghost.value = undefined;
  }

  /** 放下：落在自己的组里就地放下；落在别的组里报告 onMove，不能放的弹回 */
  function drop(key: string) {
    const to = target.value;
    const own = groupOf(key);
    const item = itemOf(key);
    clear();
    if (!groups || !to || to.group === own || item === undefined) {
      announce(
        groups
          ? lang.sortableGroupDropped(labelOf(key), groupLabel(own), position(key))
          : lang.sortableDropped(labelOf(key), position(key), total(key)),
      );
      return;
    }
    if (to.reason) {
      announce(lang.sortableRejected(labelOf(key), to.reason));
      groups.onReject?.(item, to.group, to.reason);
      return;
    }
    announce(lang.sortableGroupDropped(labelOf(key), groupLabel(to.group), to.index + 1));
    groups.onMove(item, to.group, to.index);
  }

  function cancel(key: string) {
    clear();
    void moveTo(key, grabbedFrom);
    announce(
      groups
        ? lang.sortableGroupCancelled(labelOf(key), groupLabel(groupOf(key)), grabbedFrom + 1)
        : lang.sortableCancelled(labelOf(key), grabbedFrom + 1),
    );
  }

  // ───────── 键盘 ─────────

  /** 落点换到 group 的第 index 位并播报；回到自己的组时项回到原位附近（组内排序是即时的） */
  function retarget(key: string, group: string, index: number) {
    const own = groupOf(key);
    const size = keysIn(group).length + (group === own ? 0 : 1);
    const clamped = clamp(index, 0, size - 1);
    target.value = { group, index: clamped, reason: reasonFor(key, group) };
    announce(lang.sortableOver(labelOf(key), groupLabel(group), clamped + 1, target.value.reason));
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
    const arrows = inlineArrows(isRtl(event.currentTarget as Element));
    const along: Record<string, number> = horizontal()
      ? { [arrows.forward]: 1, [arrows.backward]: -1 }
      : { ArrowDown: 1, ArrowUp: -1 };
    // 分组时与组内方向垂直的方向键换组
    const across: Record<string, number> = !groups
      ? {}
      : horizontal()
        ? { ArrowDown: 1, ArrowUp: -1 }
        : { [arrows.forward]: 1, [arrows.backward]: -1 };
    const own = groupOf(key);
    const current = target.value ?? { group: own, index: indexOf(key), reason: null };

    const groupStep = across[event.key];
    if (groupStep !== undefined) {
      event.preventDefault();
      const order = groups!.keys();
      const next = order[clamp(order.indexOf(current.group) + groupStep, 0, order.length - 1)]!;
      if (next === current.group) return;
      retarget(key, next, next === own ? indexOf(key) : current.index);
      return;
    }

    const step: number | 'first' | 'last' | undefined =
      event.key === 'Home' ? 'first' : event.key === 'End' ? 'last' : along[event.key];
    if (step === undefined) return;
    event.preventDefault();
    if (current.group !== own) {
      const last = keysIn(current.group).length;
      const index = step === 'first' ? 0 : step === 'last' ? last : current.index + step;
      retarget(key, current.group, index);
      return;
    }
    const from = indexOf(key);
    const count = keysIn(own).length;
    const to = step === 'first' ? 0 : step === 'last' ? count - 1 : from + step;
    if (!options.onChange || to < 0 || to >= count || to === from) return;
    void moveTo(key, to).then(() => {
      target.value = { group: own, index: indexOf(key), reason: null };
      announce(
        groups
          ? lang.sortableOver(labelOf(key), groupLabel(own), position(key), null)
          : lang.sortableMoved(labelOf(key), position(key), total(key)),
      );
    });
  }

  function onBlur(key: string) {
    if (reordering || active.value !== key || stopMove) return;
    // 焦点离开时：组内的移动已经生效，就地放下；还指着别的组时不算数，取消
    if (target.value && target.value.group !== groupOf(key)) cancel(key);
    else drop(key);
  }

  // ───────── 指针 ─────────

  function onPointerdown(event: PointerEvent, key: string) {
    if (options.disabled?.() || active.value !== undefined) return;
    const root = container();
    const element = itemElement(key);
    if (!root || !element) return;
    const own = groupOf(key);
    // 不分组时在容器里滚动；分组时在自己组的元素里排序、滚动
    const ownRoot = groups ? (groupElement(own) ?? root) : root;
    const scroller = scrollParent(ownRoot);
    const axis = () => (horizontal() ? 'x' : 'y');
    const scrollOf = () => (axis() === 'x' ? scroller.scrollLeft : scroller.scrollTop);
    const startOf = (rect: DOMRect) => (axis() === 'x' ? rect.left : rect.top);
    const sizeOf = (rect: DOMRect) => (axis() === 'x' ? rect.width : rect.height);
    const startScroll = scrollOf();
    // 按下时组里各项的位置（内容坐标）：判断越过了谁的中线
    const centers = new Map(
      keysIn(own).map((itemKey) => {
        const rect = itemElement(itemKey)?.getBoundingClientRect();
        return [itemKey, rect ? startOf(rect) + startScroll + sizeOf(rect) / 2 : 0];
      }),
    );
    const origin = element.getBoundingClientRect();
    const originStart = startOf(origin);
    let delta = 0;
    let offset = 0;
    let pointer = { x: event.clientX, y: event.clientY };

    /** 不分组时被拖的项跟着指针：位移 = 指针的位移 − 它在布局里的位置变化 */
    const follow = () => {
      if (groups) return;
      const current = itemElement(key);
      if (!current) return;
      const natural = startOf(current.getBoundingClientRect()) - offset;
      offset = originStart + delta - natural;
      void set(current, axis() === 'x' ? { x: offset } : { y: offset });
    };

    /** 指针下的组；不分组时总是自己的（空字符串） */
    const groupAtPointer = () => {
      if (!groups) return own;
      for (const group of groups.keys()) {
        const rect = groupElement(group)?.getBoundingClientRect();
        if (
          rect &&
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom
        )
          return group;
      }
      return undefined;
    };

    /** 在自己的组里：越过了几个别的项的中线，就排到第几位；在别的组里：落点是指针前面有几项 */
    const reorder = () => {
      const group = groupAtPointer();
      if (group === undefined) {
        target.value = undefined;
        return;
      }
      if (group !== own) {
        // 离开自己的组：组内已经挪过的回到原位，免得放到别处后原组的顺序也变了
        if (indexOf(key) !== grabbedFrom) void moveTo(key, grabbedFrom);
        const along = axis() === 'x' ? pointer.x : pointer.y;
        const index = keysIn(group).filter((other) => {
          const rect = itemElement(other)?.getBoundingClientRect();
          return rect && startOf(rect) + sizeOf(rect) / 2 < along;
        }).length;
        target.value = { group, index, reason: reasonFor(key, group) };
        return;
      }
      const center = originStart + delta + scrollOf() + sizeOf(origin) / 2;
      const index = keysIn(own).filter(
        (other) => other !== key && centers.get(other)! < center,
      ).length;
      target.value = { group: own, index, reason: null };
      if (index !== indexOf(key)) void moveTo(key, index).then(follow);
      else follow();
    };

    const autoScroll = () => {
      cancelAnimationFrame(scrollFrame);
      const group = groupAtPointer();
      const scrollers = [
        group === undefined ? undefined : scrollParent(groupElement(group) ?? root),
        groups ? scrollParent(root.parentElement ?? root) : undefined,
      ];
      let scrolled = false;
      for (const candidate of new Set(scrollers)) {
        if (candidate && edgeScroll(candidate, pointer)) scrolled = true;
      }
      if (!scrolled) return;
      reorder();
      scrollFrame = requestAnimationFrame(autoScroll);
    };

    const finish = (cancelled: boolean) => {
      cancelAnimationFrame(scrollFrame);
      stopMove = undefined;
      const current = itemElement(key);
      current?.removeAttribute('data-dragging');
      if (groups) {
        if (cancelled || !target.value) cancel(key);
        else drop(key);
        return;
      }
      const done = () => {
        clear();
        announce(lang.sortableDropped(labelOf(key), position(key), total(key)));
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
      // 项会随重排移动：捕获放在不动的容器上
      captureTarget: root,
      onMove: (point) => {
        if (active.value !== key) {
          grab(key);
          element.setAttribute('data-dragging', '');
        }
        delta = axis() === 'x' ? point.deltaX : point.deltaY;
        pointer = { x: point.clientX, y: point.clientY };
        if (groups) {
          ghost.value = {
            key,
            left: origin.left + point.deltaX,
            top: origin.top + point.deltaY,
            width: origin.width,
          };
        }
        reorder();
        autoScroll();
      },
      onEnd: ({ moved, cancelled }) => {
        if (moved && active.value === key) finish(cancelled);
        else stopMove = undefined;
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
    get target() {
      return target.value;
    },
    get ghost() {
      return ghost.value;
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
    groupProps: (group) => ({
      'data-sortable-group': group,
      'data-drop':
        target.value?.group === group && active.value && groupOf(active.value) !== group
          ? target.value.reason
            ? 'denied'
            : 'allowed'
          : undefined,
    }),
  };
}

/** 指针靠近 scroller 的边缘时朝那边滚一步；滚了返回 true */
function edgeScroll(scroller: HTMLElement, pointer: { x: number; y: number }): boolean {
  const rect =
    scroller === document.scrollingElement ? viewportRect() : scroller.getBoundingClientRect();
  const speed = (along: number, low: number, high: number) =>
    along < low + EDGE
      ? -MAX_SCROLL_STEP * (1 - (along - low) / EDGE)
      : along > high - EDGE
        ? MAX_SCROLL_STEP * (1 - (high - along) / EDGE)
        : 0;
  const canX = scroller.scrollWidth > scroller.clientWidth;
  const canY = scroller.scrollHeight > scroller.clientHeight;
  const left = canX ? speed(pointer.x, rect.left, rect.right) : 0;
  const top = canY ? speed(pointer.y, rect.top, rect.bottom) : 0;
  if (!left && !top) return false;
  const before = [scroller.scrollLeft, scroller.scrollTop];
  scroller.scrollBy({ left, top });
  return scroller.scrollLeft !== before[0] || scroller.scrollTop !== before[1];
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
