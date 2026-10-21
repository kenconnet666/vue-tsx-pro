/**
 * 树状数据的共用逻辑：按展开状态展开成一列行、勾选的父子联动（含半选）、展开时懒加载子项。
 * TreeDataTable（层级行）与 Tree（独立的树）共用；数据形状不限，由 getKey / getChildren 读取。
 *
 *   const rows = flattenTree(roots, { getKey, getChildren }, new Set(expanded));
 *   const index = indexTree(roots, { getKey, getChildren });
 *   checked = toggleChecked(index, checked, key);        // 勾上 / 取消一项，子孙与祖先跟着变
 *   const states = checkStates(index, checked);           // key → checked / indeterminate / unchecked
 */
import { shallowRef } from 'vue';

/** 怎样从数据里读出树的结构 */
export interface TreeAccessors<T> {
  /** 节点的 key，整棵树里唯一；index 是它在同级里的位置 */
  getKey: (node: T, index: number) => string;
  /** 子节点；叶子或还没加载时返回 undefined / 空数组 */
  getChildren: (node: T) => readonly T[] | undefined;
  /** 有没有子节点（懒加载时子节点还没取回来也算有）；不写时看 getChildren 是否非空 */
  hasChildren?: (node: T) => boolean;
}

/** 展开成一列的一行 */
export interface FlatTreeNode<T> {
  /** 原始数据 */
  readonly node: T;
  /** getKey 给出的 key */
  readonly key: string;
  /** 层级，第一层为 0 */
  readonly depth: number;
  /** 父节点的 key；第一层为 undefined */
  readonly parent: string | undefined;
  /** 能不能展开（有子节点，或懒加载时声明了有） */
  readonly expandable: boolean;
  /** 同级一共几个（aria-setsize） */
  readonly setSize: number;
  /** 在同级里排第几，从 1 开始（aria-posinset） */
  readonly position: number;
}

/** 节点能不能展开 */
export const isExpandable = <T>(node: T, { getChildren, hasChildren }: TreeAccessors<T>): boolean =>
  hasChildren?.(node) ?? (getChildren(node)?.length ?? 0) > 0;

/**
 * 按展开状态深度优先展开成一列：只有展开了的节点的子节点出现在结果里。
 * order 改写每一层的顺序（TreeDataTable 按当前排序），不写时按数据顺序
 */
export function flattenTree<T>(
  roots: readonly T[],
  accessors: TreeAccessors<T>,
  expanded: ReadonlySet<string>,
  order: (level: readonly T[]) => readonly T[] = (level) => level,
): FlatTreeNode<T>[] {
  const result: FlatTreeNode<T>[] = [];
  const visit = (level: readonly T[], depth: number, parent: string | undefined) => {
    const sorted = order(level);
    sorted.forEach((node, index) => {
      const key = accessors.getKey(node, index);
      const expandable = isExpandable(node, accessors);
      result.push({
        node,
        key,
        depth,
        parent,
        expandable,
        setSize: sorted.length,
        position: index + 1,
      });
      if (expandable && expanded.has(key)) visit(accessors.getChildren(node) ?? [], depth + 1, key);
    });
  };
  visit(roots, 0, undefined);
  return result;
}

/** 整棵（已加载的）树的索引：勾选联动要看到折叠着的节点 */
export interface TreeIndex {
  /** 深度优先的顺序 */
  readonly order: readonly string[];
  /** key → 父节点的 key */
  readonly parents: ReadonlyMap<string, string | undefined>;
  /** key → 已加载的子节点的 key */
  readonly children: ReadonlyMap<string, readonly string[]>;
}

/** 建立整棵已加载的树的索引 */
export function indexTree<T>(roots: readonly T[], accessors: TreeAccessors<T>): TreeIndex {
  const order: string[] = [];
  const parents = new Map<string, string | undefined>();
  const children = new Map<string, string[]>();
  const visit = (level: readonly T[], parent: string | undefined) => {
    const keys = level.map((node, index) => accessors.getKey(node, index));
    if (parent !== undefined) children.set(parent, keys);
    level.forEach((node, index) => {
      const key = keys[index]!;
      order.push(key);
      parents.set(key, parent);
      visit(accessors.getChildren(node) ?? [], key);
    });
  };
  visit(roots, undefined);
  return { order, parents, children };
}

/** 勾选状态 */
export type CheckState = 'checked' | 'indeterminate' | 'unchecked';

/**
 * 实际勾上的节点：自己或任何祖先在 checked 里（父节点勾上之后才懒加载出来的子节点因此也算勾上），
 * 或者已加载的子节点全勾上了（checked 由外部给出、没有写全父节点时）
 */
function effectiveChecked(index: TreeIndex, checked: readonly string[]): Set<string> {
  const listed = new Set(checked);
  const result = new Set<string>();
  // order 是深度优先：正序时父节点先于子节点，倒序时子节点先于父节点
  for (const key of index.order) {
    const parent = index.parents.get(key);
    if (listed.has(key) || (parent !== undefined && result.has(parent))) result.add(key);
  }
  for (let i = index.order.length - 1; i >= 0; i--) {
    const children = index.children.get(index.order[i]!);
    if (children?.length && children.every((child) => result.has(child)))
      result.add(index.order[i]!);
  }
  return result;
}

/**
 * 勾上或取消 key：子孙跟着变；祖先的子节点全勾上时祖先也勾上，否则取消。
 * 返回勾上的全部节点（按树的顺序），可以直接写回 checked
 */
export function toggleChecked(index: TreeIndex, checked: readonly string[], key: string): string[] {
  const result = effectiveChecked(index, checked);
  const next = !result.has(key);
  const visit = (current: string) => {
    if (next) result.add(current);
    else result.delete(current);
    index.children.get(current)?.forEach(visit);
  };
  visit(key);
  for (let parent = index.parents.get(key); parent !== undefined;) {
    const all = index.children.get(parent)!.every((child) => result.has(child));
    if (all) result.add(parent);
    else result.delete(parent);
    parent = index.parents.get(parent);
  }
  return index.order.filter((item) => result.has(item));
}

/** 每个节点的勾选状态：子孙里有勾上的、但自己没有全勾上时是 indeterminate */
export function checkStates(index: TreeIndex, checked: readonly string[]): Map<string, CheckState> {
  const effective = effectiveChecked(index, checked);
  const states = new Map<string, CheckState>();
  // 倒序：子节点先于父节点算好
  for (let i = index.order.length - 1; i >= 0; i--) {
    const key = index.order[i]!;
    if (effective.has(key)) {
      states.set(key, 'checked');
      continue;
    }
    const some = index.children.get(key)?.some((child) => states.get(child) !== 'unchecked');
    states.set(key, some ? 'indeterminate' : 'unchecked');
  }
  return states;
}

/** useTreeExpansion 的选项 */
export interface TreeExpansionOptions<T> {
  /** 读当前展开的 key */
  expanded: () => readonly string[];
  /** 写回展开的 key */
  setExpanded: (keys: string[]) => void;
  /** 节点已加载的子节点 */
  getChildren: (node: T) => readonly T[] | undefined;
  /** 展开一个还没有子节点的节点时调用：取回子节点并放进数据里；返回 Promise 时显示加载中 */
  loadChildren?: (node: T) => Promise<unknown> | void;
  /** 子节点加载失败：节点收回去，可以再展开重试；不写时在控制台报错 */
  onLoadError?: (error: unknown, node: T) => void;
}

/** useTreeExpansion 的返回值 */
export interface TreeExpansion<T> {
  /** 是否展开 */
  isExpanded: (key: string) => boolean;
  /** 是否正在加载子节点 */
  isLoading: (key: string) => boolean;
  /** 展开或收起；展开一个还没有子节点的节点时懒加载 */
  setOpen: (node: T, key: string, open: boolean) => Promise<void>;
}

/** 展开状态与懒加载（在 setup 里调用） */
export function useTreeExpansion<T>({
  expanded,
  setExpanded,
  getChildren,
  loadChildren,
  onLoadError,
}: TreeExpansionOptions<T>): TreeExpansion<T> {
  const loading = shallowRef<ReadonlySet<string>>(new Set());
  const isExpanded = (key: string) => expanded().includes(key);

  const collapse = (key: string) => setExpanded(expanded().filter((item) => item !== key));

  async function setOpen(node: T, key: string, open: boolean) {
    if (isExpanded(key) === open) return;
    if (!open) return collapse(key);
    setExpanded([...expanded(), key]);
    // 正在加载（收起后又展开）：等那一次，不重复请求
    if (!loadChildren || loading.value.has(key) || (getChildren(node)?.length ?? 0) > 0) return;
    const pending = loadChildren(node);
    if (!(pending instanceof Promise)) return;
    loading.value = new Set([...loading.value, key]);
    try {
      await pending;
    } catch (error) {
      // 失败时收回去：留着展开却没有子节点，看起来像是本来就没有；再展开会重试
      collapse(key);
      if (onLoadError) onLoadError(error, node);
      else console.error('树的子节点加载失败', error);
    } finally {
      const next = new Set(loading.value);
      next.delete(key);
      loading.value = next;
    }
  }

  return { isExpanded, isLoading: (key) => loading.value.has(key), setOpen };
}
