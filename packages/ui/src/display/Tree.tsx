/**
 * 树（WAI-ARIA Tree）：可展开的层级列表（文件夹、组织架构、分类），可单选 / 多选、勾选（父子联动、半选）、懒加载子节点。
 * 数据驱动，始终虚拟滚动（上万个节点也只渲染看得见的几十个）：
 *
 *   <Tree
 *     items={folders}
 *     getKey={(node) => node.id}
 *     getLabel={(node) => node.name}
 *     getChildren={(node) => node.children}
 *     _expanded={open}
 *     selectionMode="single"
 *     _selected={current}
 *     aria-label="目录"
 *   />
 *
 * - 键盘：焦点在树上，当前项经 aria-activedescendant 告诉读屏。↑↓ 移动，→ 展开 / 进入第一个子节点，← 收起 / 回到父节点，
 *   Home / End，Enter 选中（没有选择时展开或收起），空格勾选（checkable 时）或选中，按字母跳到以它开头的节点。
 * - 勾选：checkable 时每项前有勾选框，_checked={keys} 是勾上的全部节点；勾上父节点会勾上它的子孙，
 *   子节点全勾上时父节点也勾上，只勾了一部分时父节点半选（aria-checked="mixed"）。
 * - 懒加载：hasChildren 说有子节点、getChildren 还没有时，展开会调用 loadChildren（加载中显示加载指示）。
 * - 节点平铺渲染（虚拟滚动没法嵌套 role="group"），层级经 aria-level / aria-setsize / aria-posinset 告诉读屏。
 *
 * 展开状态与勾选联动见 utils/data/tree.ts（TreeDataTable 共用）。部件：Root（div，role="tree"）、
 * Row（虚拟滚动定位的一行，包着 Item）、Item（div，role="treeitem"）、Toggle（展开箭头）、
 * Checkbox（勾选框，只是外观，状态在 treeitem 的 aria-checked 上）、Label、ScrollArea（外层的滚动区域）。
 */
import { Check, ChevronRight, Minus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { onScopeDispose, useId, watch, type VNodeChild } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import { Spinner } from '../base/Spinner';
import { useLang, useTextMatcher } from '../config/context';
import { t } from '../config/theme/tokens';
import { announce } from '../utils/dom/announcer';
import { startMove } from '../utils/dom/move';
import { Empty, type EmptyProps } from '../feedback/Empty';
import { Skeleton, type SkeletonProps, type SkeletonShapeProps } from '../feedback/Skeleton';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { SHIMMER_STAGGER } from '../utils/style/shimmer';
import { checkboxStyles } from '../input/Checkbox';
import { choiceInputStyles, choiceRecipe } from '../input/choice-styles';
import { useRecipe } from '../config/styles';
import { toneFillStyles } from '../utils/style/tone-styles';
import { inlineArrows, isRtl } from '../utils/dom/direction';
import { toggleSelection, type SelectionModes } from '../utils/data/selection';
import {
  checkStates,
  filterTree,
  flattenTree,
  indexTree,
  toggleChecked,
  useTreeExpansion,
  type CheckState,
  type TreeAccessors,
  type TreeMoveTarget,
} from '../utils/data/tree';
import { createTypeahead } from '../utils/dom/typeahead';
import { mergeAttrs, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { itemStyles } from '../utils/style/item-styles';
import { focusRingStyles } from '../utils/style/styles';
import { useVirtualizer } from '../utils/virtual/use-virtualizer';
import { defaultRangeExtractor } from '../utils/virtual/virtualizer';
import { disclosureStyles } from '../utils/style/transitions';

/** 节点的渲染状态 */
export interface TreeItemRenderState {
  /** 层级，第一层为 0 */
  depth: number;
  /** 展开着 */
  expanded: boolean;
  /** 已选 */
  selected: boolean;
  /** 勾选状态（checkable 时） */
  checked: CheckState;
  /** 键盘所在的当前项 */
  active: boolean;
}

/** 一次移动：把 key 移到 target（交给 moveNode） */
export interface TreeMove<T> {
  /** 移动的节点的 key */
  key: string;
  /** 移动的节点 */
  node: T;
  /** 放到哪个节点下的第几位（按移走之后的同级算） */
  target: TreeMoveTarget;
}

/** 拖动时的落点：放在 key 这一项的前面、后面或里面 */
interface DropSpot {
  key: string;
  zone: 'before' | 'after' | 'inside';
}

/** 未声明的属性落到 div（role="tree"）上；aria-label 或 aria-labelledby 是树的名称 */
export interface TreeProps<T> extends PartProps<'div', 'role'> {
  /** 第一层的节点 */
  items: readonly T[];
  /** 节点的 key，整棵树里唯一 */
  getKey: (node: T) => string;
  /** 节点的文字：默认显示它，类型搜索也按它 */
  getLabel: (node: T) => string;
  /** 子节点；叶子或还没加载时返回 undefined / 空数组 */
  getChildren: (node: T) => readonly T[] | undefined;
  /** 有没有子节点（懒加载时子节点还没取回来也要能展开）；不写时看 getChildren 是否非空 */
  hasChildren?: (node: T) => boolean;
  /** 展开一个还没有子节点的节点时调用：取回子节点并放进数据里；返回 Promise 时显示加载中 */
  loadChildren?: (node: T) => Promise<unknown> | void;
  /** 子节点加载失败（loadChildren 的 Promise 被拒绝）：节点收回去，再展开会重试；不写时在控制台报错 */
  onLoadError?: (error: unknown, node: T) => void;
  /** 节点不可用：可以经过、展开，不能选中、勾选 */
  isDisabled?: (node: T) => boolean;
  /** 文字前的图标，可以按展开状态换（文件夹开 / 合） */
  getIcon?: (node: T, expanded: boolean) => IconData | undefined;
  /** 展开的节点：父级写 _expanded={keys} */
  _expanded?: string[];
  /** 选择方式；不写时不能选中 */
  selectionMode?: keyof SelectionModes;
  /** 选中的节点：父级写 _selected={keys} */
  _selected?: string[];
  /** 每项前显示勾选框，默认父子联动 */
  checkable?: boolean;
  /** 勾选父子不联动：每个节点各自勾选（权限树里“只给这一级”） */
  checkStrictly?: boolean;
  /** 勾上的节点（联动时含勾上的父节点与子孙）：父级写 _checked={keys} */
  _checked?: string[];
  /** 正在取节点：还没有节点时显示骨架行，树带 aria-busy */
  loading?: boolean;
  /** 没有节点时显示的内容；默认是 Empty（文案取语言包） */
  empty?: VNodeChild;
  /** 每一层缩进多少（em），默认 1.25 */
  indent?: number;
  /** 每项的估计高度（px），默认 32；渲染后以实际高度为准 */
  estimateSize?: number;
  /**
   * 搜索过滤：字符串时按节点文字匹配（忽略大小写与重音，或 createUi 的 textMatcher），函数时自己判断。
   * 留下匹配的节点与它们的祖先并展开祖先，匹配的节点文字加粗；只看已加载的节点。清空后回到原来的展开状态
   */
  filter?: string | ((node: T) => boolean);
  /**
   * 拖动节点改变层级与顺序：放下（或 Alt + 方向键）时报告移动，用 moveNode 生成新数据交回 items；不写时不能拖。
   * 指针拖动只用鼠标、笔（触摸时照常滚动）
   */
  onMove?: (move: TreeMove<T>) => void;
  /** 能不能放到这里（如文件不能放进文件里）；不写时都能放（放进自己和自己的子孙里除外） */
  canDrop?: (node: T, target: TreeMoveTarget) => boolean;
  /** 自定义文字部分的内容 */
  renderItem?: (node: T, state: TreeItemRenderState) => VNodeChild;
  /** 每一项的部件属性，可以按节点计算 */
  propsItem?:
    PartProps<'div', 'role' | 'id'> | ((node: T, state: TreeItemRenderState) => PartProps<'div'>);
  /** 每一行（虚拟滚动定位的容器，包着 treeitem）的部件属性 */
  propsRow?: PartProps<'div', 'role'>;
  /** 展开箭头的部件属性（只是外观，键盘与读屏走 treeitem） */
  propsToggle?: PartProps<'span', 'aria-hidden'>;
  /** 勾选框的部件属性（只是外观，状态在 treeitem 的 aria-checked 上） */
  propsCheckbox?: PartProps<'span', 'aria-hidden'>;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 默认空状态（Empty）的部件属性 */
  propsEmpty?: Partial<EmptyProps>;
  /** 加载中的骨架行的部件属性 */
  propsSkeleton?: SkeletonShapeProps;
  /** 外层滚动区域（ScrollArea）的部件属性：放进弹出层、弹性布局时给它 sx；树元素本身是它的视口 */
  propsScrollArea?: Partial<Omit<ScrollAreaProps, 'propsViewport'>>;
}

/** Tree 的样式：root、sizer、row、item、toggle、checkbox、label 等 */
export const treeStyles = css.create({
  // 树元素就是 ScrollArea 的视口（浮层滚动条）；焦点与 aria-activedescendant 在它上面
  root: {
    position: 'relative',
    overscrollBehavior: 'contain',
    padding: '_xs',
    outlineStyle: 'none',
  },
  sizer: { position: 'relative', width: '_full' },
  skeleton: { display: 'block', height: '1em', marginBlock: '0.625em', marginInline: '_sm' },
  row: { position: 'absolute', top: 0, insetInline: 0, paddingBlock: '1px' },
  item: { gap: '_xs', minHeight: '_sizes.minTarget', paddingInlineStart: '_xs' },
  toggle: {
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    width: '1.5em',
    height: '1.5em',
    color: '_textMuted',
  },
  chevronOpen: { rotate: '90deg' },
  checkbox: { marginInlineEnd: '_xs' },
  checkMark: { width: '0.875em', height: '0.875em', color: '_accentContrast' },
  hidden: { visibility: 'hidden' },
  // 搜索时匹配的节点
  matched: { fontWeight: '_semibold' },
  // 拖动：被拖的那一项变淡；放进某一项里时它带品牌色的框；放在前后时画一条线
  dragging: { opacity: 0.5 },
  dropInside: {
    outlineStyle: 'solid',
    outlineWidth: '_borderWidths.sm',
    outlineColor: '_accent',
    outlineOffset: `calc(-1 * ${t.borderWidths.sm})`,
    backgroundColor: '_accentSoft',
  },
  dropLine: {
    position: 'absolute',
    insetInlineEnd: 0,
    height: '_borderWidths.sm',
    backgroundColor: '_accent',
    borderRadius: '_full',
    pointerEvents: 'none',
  },
  dropBefore: { top: `calc(-1 * ${t.borderWidths.xs})` },
  dropAfter: { bottom: `calc(-1 * ${t.borderWidths.xs})` },
  // 画线的那一项要作定位参照
  positioned: { position: 'relative' },
});

// 缩进与位置是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Tree 的样式：indent（缩进）、y、height */
export const treeDynamicStyles = css.create({
  indent: (em: number) => ({ width: `${em}em`, flexShrink: 0 }),
  y: (px: number) => ({ transform: `translateY(${px}px)` }),
  height: (px: number) => ({ height: px }),
  width: (value: string) => ({ width: value }),
  // 落点线从这一层的缩进处开始
  lineStart: (em: number) => ({ insetInlineStart: `${em}em` }),
});

/** 加载中显示几行骨架 */
const SKELETON_ROWS = 4;

const ARIA_CHECKED: Record<CheckState, 'true' | 'false' | 'mixed'> = {
  checked: 'true',
  unchecked: 'false',
  indeterminate: 'mixed',
};

/** 树：可展开的层级列表，单选 / 多选、父子联动的勾选、懒加载、方向键导航、虚拟滚动 */
export const Tree = _component(
  <T,>({
    items,
    getKey,
    getLabel,
    getChildren,
    hasChildren,
    loadChildren,
    onLoadError,
    isDisabled,
    getIcon,
    _expanded: expanded = _bindable<string[]>([]),
    selectionMode,
    _selected: selected = _bindable<string[]>([]),
    checkable = false,
    checkStrictly = false,
    _checked: checked = _bindable<string[]>([]),
    loading = false,
    empty,
    indent = 1.25,
    estimateSize = 32,
    filter,
    onMove,
    canDrop,
    renderItem,
    propsItem,
    propsRow,
    propsToggle,
    propsCheckbox,
    propsLabel,
    propsEmpty,
    propsSkeleton,
    propsScrollArea,
    id,
    ...rest
  }: TreeProps<T>) => {
    const lang = useLang();
    // 骨架防闪烁：很快就取回来时不显示；aria-busy 按真实的 loading
    const indicator = useDelayedLoading(() => loading);
    const generatedId = useId();
    const prefix = () => id ?? generatedId;
    let root = _state.raw<HTMLElement | null>(null);
    let sizer = _state.raw<HTMLElement | null>(null);
    // 键盘所在的当前项；焦点在树上时才高亮
    let active = _state<string | undefined>(undefined);
    let focused = _state(false);
    const typeahead = createTypeahead();
    // 勾选框画成 Checkbox 的样子，跟着 styles.Choice 的定制
    const choice = useRecipe(choiceRecipe);

    const accessors = (): TreeAccessors<T> => ({
      getKey: (node) => getKey(node),
      getChildren,
      hasChildren,
    });

    // 搜索过滤：匹配的节点与祖先；为 null 时不过滤
    const textMatcher = useTextMatcher();
    const filtering = _derived.by(() => {
      const query = typeof filter === 'string' ? filter.trim() : filter;
      if (!query) return null;
      const match =
        typeof query === 'string' ? (node: T) => textMatcher()(getLabel(node), query) : query;
      return filterTree(items, accessors(), match);
    });
    // 过滤时的展开状态单独记：一开始展开匹配项的祖先，可以再收起；清空过滤后回到原来的 expanded
    let filterExpanded = _state<string[]>([]);
    watch(
      () => filtering,
      (result) => (filterExpanded = result ? [...result.expand] : []),
      { immediate: true },
    );
    const shownExpanded = () => (filtering ? filterExpanded : expanded);

    const expansion = useTreeExpansion<T>({
      expanded: shownExpanded,
      setExpanded: (keys) => (filtering ? (filterExpanded = keys) : (expanded = keys)),
      getChildren: (node) => getChildren(node),
      loadChildren: (node) => loadChildren?.(node),
      // 没给 onLoadError 时交给 useTreeExpansion 在控制台报错
      onLoadError: _untrack(onLoadError) && ((error, node) => onLoadError?.(error, node)),
    });

    const rows = _derived.by(() =>
      flattenTree(items, accessors(), new Set(shownExpanded()), { include: filtering?.include }),
    );
    const rowOf = _derived.by(() => new Map(rows.map((row, index) => [row.key, index])));
    // 勾选联动要看到折叠着的节点：只在联动勾选时建整棵树的索引
    const index = _derived.by(() =>
      checkable && !checkStrictly ? indexTree(items, accessors()) : null,
    );
    const states = _derived.by(() => (index ? checkStates(index, checked) : null));
    const checkedSet = _derived.by(() => new Set(checked));
    const selectedSet = _derived.by(() => new Set(selected));

    /** 当前项的行号；没有时 -1 */
    const activeRow = () => (active === undefined ? -1 : (rowOf.get(active) ?? -1));

    const virtual = useVirtualizer(() => {
      const current = rows;
      // 读一下当前项：它变了要重新算渲染范围（当前项总要渲染，aria-activedescendant 才指得到）
      const focusedRow = activeRow();
      // 先读出来：每一项都要调用一次估计高度，不要每次都经过 props 的响应式读取
      const size = estimateSize;
      return {
        count: current.length,
        scrollElement: root,
        list: sizer,
        estimateSize: () => size,
        getItemKey: (position: number) => current[position]!.key,
        overscan: 6,
        rangeExtractor: (range) => {
          const indices = defaultRangeExtractor(range);
          if (focusedRow >= 0 && !indices.includes(focusedRow)) {
            indices.push(focusedRow);
            indices.sort((a, b) => a - b);
          }
          return indices;
        },
      };
    });

    watch(
      () => active,
      () => {
        const position = activeRow();
        if (position >= 0) virtual.scrollToIndex(position, { align: 'auto' });
      },
      { flush: 'post' },
    );

    // 当前项所在的父节点被收起：当前项移到还看得见的最近祖先
    watch(
      () => rows,
      (next, previous) => {
        if (active === undefined || rowOf.has(active)) return;
        let parent = previous.find((row) => row.key === active)?.parent;
        while (parent !== undefined && !rowOf.has(parent)) {
          parent = previous.find((row) => row.key === parent)?.parent;
        }
        active = parent ?? next[0]?.key;
      },
    );

    const disabledAt = (position: number) => {
      const row = rows[position];
      return !row || (isDisabled?.(row.node) ?? false);
    };

    function select(position: number) {
      const row = rows[position];
      if (!row || !selectionMode || disabledAt(position)) return;
      selected = [...toggleSelection(selected, row.key, { mode: selectionMode })];
    }

    function check(position: number) {
      const row = rows[position];
      if (!row || !checkable || disabledAt(position)) return;
      checked = index
        ? toggleChecked(index, checked, row.key)
        : [...toggleSelection(checked, row.key, { mode: 'multiple' })];
    }

    function toggle(position: number) {
      const row = rows[position];
      if (row?.expandable)
        void expansion.setOpen(row.node, row.key, !expansion.isExpanded(row.key));
    }

    // —— 移动节点（onMove）：指针拖动，或 Alt + 方向键 ——
    let dragging = _state<string | undefined>(undefined);
    let drop = _state.raw<DropSpot | null>(null);
    let expandTimer: ReturnType<typeof setTimeout> | undefined;
    let stopDrag: (() => void) | undefined;
    onScopeDispose(() => {
      clearTimeout(expandTimer);
      stopDrag?.();
    });

    const rowByKey = (key: string | undefined) =>
      key === undefined ? undefined : rows[rowOf.get(key) ?? -1];

    /** key 是不是 ancestor 自己或它的子孙（看得见的行里，祖先总是看得见的） */
    function isWithin(key: string, ancestor: string) {
      for (let at: string | undefined = key; at !== undefined; at = rowByKey(at)?.parent) {
        if (at === ancestor) return true;
      }
      return false;
    }

    /** 落点换算成移动的目标（按移走之后的同级算）；放不下时 null */
    function targetOf(key: string, spot: DropSpot): TreeMoveTarget | null {
      const moving = rowByKey(key);
      const row = rowByKey(spot.key);
      if (!moving || !row || isWithin(spot.key, key)) return null;
      let target: TreeMoveTarget;
      if (spot.zone === 'inside') target = { parent: row.key, index: Number.MAX_SAFE_INTEGER };
      else {
        const offset = spot.zone === 'before' ? row.position - 1 : row.position;
        // 同一层里从前面移过来：移走之后，后面的都往前挪了一位
        const shift = moving.parent === row.parent && moving.position <= offset ? 1 : 0;
        target = { parent: row.parent, index: offset - shift };
      }
      return canDrop && !canDrop(moving.node, target) ? null : target;
    }

    /** 报告移动，并告诉读屏移到了哪里 */
    function emitMove(key: string, target: TreeMoveTarget) {
      const row = rowByKey(key);
      if (!row || !onMove) return;
      const parent = rowByKey(target.parent);
      // 移走之后的同级个数：同一层里移动时要去掉自己
      const count =
        (parent ? (getChildren(parent.node)?.length ?? 0) : items.length) -
        (row.parent === target.parent ? 1 : 0);
      onMove({ key, node: row.node, target });
      announce(
        lang.treeMoved(
          getLabel(row.node),
          parent && getLabel(parent.node),
          Math.min(target.index, count) + 1,
        ),
      );
    }

    /** 指针下的落点：一项的上四分之一放在它前面，下四分之一放在后面，中间放进它里面 */
    function spotAt(clientX: number, clientY: number): DropSpot | null {
      const element = document
        .elementFromPoint(clientX, clientY)
        ?.closest<HTMLElement>('[data-index]');
      if (!element || !root?.contains(element)) return null;
      const row = rows[Number(element.dataset.index)];
      if (!row) return null;
      const rect = element.getBoundingClientRect();
      const ratio = (clientY - rect.top) / rect.height;
      return { key: row.key, zone: ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside' };
    }

    /** 拖到靠近上下边缘时滚动 */
    function autoScroll(clientY: number) {
      if (!root) return;
      const rect = root.getBoundingClientRect();
      if (clientY < rect.top + 32) root.scrollTop -= 12;
      else if (clientY > rect.bottom - 32) root.scrollTop += 12;
    }

    /** 拖到收起的节点里停一会儿：展开它，好放到更深的地方 */
    function scheduleExpand(spot: DropSpot | null) {
      clearTimeout(expandTimer);
      const row = spot?.zone === 'inside' ? rowByKey(spot.key) : undefined;
      if (!row?.expandable || expansion.isExpanded(row.key)) return;
      expandTimer = setTimeout(() => void expansion.setOpen(row.node, row.key, true), 600);
    }

    function onItemPointerdown(event: PointerEvent, key: string) {
      // 焦点留在树上
      event.preventDefault();
      // 触摸时照常滚动，不拖
      if (!onMove || event.pointerType === 'touch' || !root) return;
      stopDrag = startMove(event, {
        threshold: 4,
        // 虚拟滚动会换掉行元素：捕获在不动的树上
        captureTarget: root,
        onMove: ({ clientX, clientY }) => {
          dragging = key;
          // 先按当前的位置算落点，再滚动：滚动后指针下面换成了别的项
          const spot = spotAt(clientX, clientY);
          autoScroll(clientY);
          const next = spot && targetOf(key, spot) ? spot : null;
          if (next?.key === drop?.key && next?.zone === drop?.zone) return;
          drop = next;
          scheduleExpand(next);
        },
        onEnd: ({ moved, cancelled }) => {
          const spot = drop;
          dragging = undefined;
          drop = null;
          stopDrag = undefined;
          clearTimeout(expandTimer);
          if (!moved || cancelled || !spot) return;
          const target = targetOf(key, spot);
          if (target) emitMove(key, target);
        },
      });
    }

    /** Alt + ↑↓ 在同级里移动，Alt + → 放进上一个同级的最后，Alt + ← 移到父节点后面（从右到左时左右对调） */
    function moveByKey(event: KeyboardEvent): boolean {
      const row = rows[activeRow()];
      if (!row) return false;
      const { forward, backward } = inlineArrows(!!root && isRtl(root));
      let target: TreeMoveTarget | undefined;
      switch (event.key) {
        case 'ArrowUp':
          if (row.position > 1) target = { parent: row.parent, index: row.position - 2 };
          break;
        case 'ArrowDown':
          if (row.position < row.setSize) target = { parent: row.parent, index: row.position };
          break;
        case forward: {
          const previous = rows.find(
            (item) => item.parent === row.parent && item.position === row.position - 1,
          );
          if (!previous) break;
          target = { parent: previous.key, index: Number.MAX_SAFE_INTEGER };
          // 展开新的父节点：移过去之后还看得见
          void expansion.setOpen(previous.node, previous.key, true);
          break;
        }
        case backward: {
          const parent = rowByKey(row.parent);
          if (parent) target = { parent: parent.parent, index: parent.position };
          break;
        }
        default:
          return false;
      }
      if (target && (!canDrop || canDrop(row.node, target))) emitMove(row.key, target);
      return true;
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.altKey && onMove && !event.ctrlKey && !event.metaKey) {
        if (moveByKey(event)) event.preventDefault();
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || rows.length === 0) return;
      const position = Math.max(activeRow(), 0);
      const row = rows[position]!;
      const open = row.expandable && expansion.isExpanded(row.key);
      const { forward, backward } = inlineArrows(!!root && isRtl(root));
      const go = (target: number) => (active = rows[target]?.key ?? active);
      switch (event.key) {
        case 'ArrowDown':
          go(Math.min(position + 1, rows.length - 1));
          break;
        case 'ArrowUp':
          go(Math.max(position - 1, 0));
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(rows.length - 1);
          break;
        case forward:
          if (!row.expandable) break;
          if (!open) void expansion.setOpen(row.node, row.key, true);
          // 已展开：进入第一个子节点（子节点还没加载出来时不动）
          else if (rows[position + 1]?.parent === row.key) go(position + 1);
          break;
        case backward:
          if (open) void expansion.setOpen(row.node, row.key, false);
          else if (row.parent !== undefined) active = row.parent;
          break;
        case 'Enter':
          if (selectionMode) select(position);
          else toggle(position);
          break;
        case ' ':
          if (checkable) check(position);
          else select(position);
          break;
        default: {
          const found = typeahead.next(
            event.key,
            rows.map((item) => getLabel(item.node)),
            activeRow(),
          );
          if (found < 0) return;
          go(found);
        }
      }
      event.preventDefault();
    }

    function onFocus() {
      focused = true;
      if (active !== undefined && rowOf.has(active)) return;
      // 第一次进入：落在第一个已选的可见节点上，没有时落在第一项
      active = rows.find((row) => selectedSet.has(row.key))?.key ?? rows[0]?.key;
    }

    function renderRow(position: number) {
      const row = rows[position]!;
      const open = row.expandable && expansion.isExpanded(row.key);
      const disabled = disabledAt(position);
      const state: TreeItemRenderState = {
        depth: row.depth,
        expanded: open,
        selected: selectedSet.has(row.key),
        checked: states
          ? (states.get(row.key) ?? 'unchecked')
          : checkedSet.has(row.key)
            ? 'checked'
            : 'unchecked',
        active: active === row.key,
      };
      const own = typeof propsItem === 'function' ? propsItem(row.node, state) : propsItem;
      const icon = getIcon?.(row.node, open);
      const loading = expansion.isLoading(row.key);
      const marked = state.checked !== 'unchecked';
      const box = choice();
      const dropZone = drop?.key === row.key ? drop.zone : undefined;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                itemStyles.row,
                itemStyles.hoverable,
                treeStyles.item,
                focused && state.active && itemStyles.highlighted,
                state.selected && itemStyles.current,
                disabled && itemStyles.disabled,
                dragging === row.key && treeStyles.dragging,
                dropZone === 'inside' && treeStyles.dropInside,
                dropZone && dropZone !== 'inside' && treeStyles.positioned,
              ],
            },
            own,
            {
              id: `${prefix()}-${position}`,
              role: 'treeitem',
              'aria-level': row.depth + 1,
              'aria-setsize': row.setSize,
              'aria-posinset': row.position,
              'aria-expanded': row.expandable ? open : undefined,
              'aria-selected': selectionMode ? state.selected : undefined,
              'aria-checked': checkable ? ARIA_CHECKED[state.checked] : undefined,
              'aria-disabled': disabled || undefined,
              'aria-busy': loading || undefined,
              onPointerdown: (event: PointerEvent) => onItemPointerdown(event, row.key),
              onClick: () => {
                active = row.key;
                root?.focus({ preventScroll: true });
                if (selectionMode) select(position);
                else if (checkable) check(position);
                else toggle(position);
              },
            },
          )}
          data-state={state.selected ? 'selected' : undefined}
          data-active={state.active || undefined}
          data-disabled={disabled || undefined}
        >
          {row.depth > 0 && <span {...css.attrs(treeDynamicStyles.indent(row.depth * indent))} />}
          <span
            {...mergeAttrs<'span'>({ sx: treeStyles.toggle }, propsToggle, {
              'aria-hidden': true,
              onClick: (event: MouseEvent) => {
                if (!row.expandable) return;
                event.stopPropagation();
                active = row.key;
                root?.focus({ preventScroll: true });
                toggle(position);
              },
            })}
          >
            {loading ? (
              <Spinner />
            ) : (
              row.expandable && (
                <Icon
                  icon={ChevronRight}
                  flipInRtl
                  sx={[disclosureStyles.icon, open && treeStyles.chevronOpen]}
                />
              )
            )}
          </span>
          {checkable && (
            <span
              {...mergeAttrs<'span'>(
                // 勾选框的实底色取色调变量（同 Checkbox 的 choiceParts）
                { sx: [box.control.sx, toneFillStyles.accent, treeStyles.checkbox] },
                propsCheckbox,
                {
                  'aria-hidden': true,
                  onClick: (event: MouseEvent) => {
                    event.stopPropagation();
                    active = row.key;
                    root?.focus({ preventScroll: true });
                    check(position);
                  },
                },
              )}
            >
              <span
                {...css.attrs(
                  box.input.sx,
                  focusRingStyles.tight,
                  checkboxStyles.box,
                  marked && choiceInputStyles.checked,
                )}
              />
              <Icon
                icon={state.checked === 'indeterminate' ? Minus : Check}
                strokeWidth={3}
                sx={[box.indicator.sx, treeStyles.checkMark, !marked && treeStyles.hidden]}
              />
            </span>
          )}
          {icon && <Icon icon={icon} />}
          <span
            {...mergeAttrs<'span'>(
              { sx: [itemStyles.label, filtering?.matched.has(row.key) && treeStyles.matched] },
              propsLabel,
            )}
          >
            {renderItem ? renderItem(row.node, state) : getLabel(row.node)}
          </span>
          {dropZone && dropZone !== 'inside' && (
            <span
              aria-hidden="true"
              {...css.attrs(
                treeStyles.dropLine,
                dropZone === 'before' ? treeStyles.dropBefore : treeStyles.dropAfter,
                treeDynamicStyles.lineStart(row.depth * indent + 1.75),
              )}
            />
          )}
        </div>
      );
    }

    /** 没有节点时：加载中是几行骨架，否则是空状态 */
    function renderPlaceholder() {
      if (loading) {
        if (!indicator.value) return null;
        return Array.from({ length: SKELETON_ROWS }, (_, row) => (
          <Skeleton
            key={row}
            {...mergePartProps<SkeletonProps>(
              {
                sx: [treeStyles.skeleton, treeDynamicStyles.width(`${85 - row * 15}%`)],
                delay: row * SHIMMER_STAGGER,
              },
              propsSkeleton,
            )}
          />
        ));
      }
      return (
        empty ?? (
          <Empty
            {...mergePartProps<EmptyProps>(
              {
                size: 'sm',
                icon: false,
                description: filtering ? lang.treeNoMatch : lang.treeEmpty,
              },
              propsEmpty,
            )}
          />
        )
      );
    }

    return () => {
      const position = activeRow();
      return (
        <ScrollArea
          {...mergePartProps<ScrollAreaProps>({}, propsScrollArea)}
          focusable={false}
          propsViewport={
            mergeProps<'div'>({ sx: [treeStyles.root, focusRingStyles.visible] }, rest, {
              ref: _toRef(root),
              id: prefix(),
              role: 'tree',
              tabindex: rows.length > 0 ? 0 : -1,
              'aria-multiselectable': selectionMode === 'multiple' || undefined,
              'aria-activedescendant': position >= 0 ? `${prefix()}-${position}` : undefined,
              'aria-busy': loading || undefined,
              onFocus,
              onBlur: () => (focused = false),
              onKeydown,
            }) as PartProps<'div'>
          }
        >
          {rows.length === 0 && renderPlaceholder()}
          <div
            ref={_toRef(sizer)}
            role="presentation"
            {...css.attrs(treeStyles.sizer, treeDynamicStyles.height(virtual.total))}
          >
            {virtual.items.map((item) => (
              <div
                key={item.key}
                {...mergeAttrs<'div'>({ sx: treeStyles.row }, propsRow, {
                  ref: virtual.measure,
                  role: 'presentation',
                  sx: treeDynamicStyles.y(item.start),
                })}
                data-index={item.index}
              >
                {renderRow(item.index)}
              </div>
            ))}
          </div>
        </ScrollArea>
      );
    };
  },
  { name: 'Tree' },
);
