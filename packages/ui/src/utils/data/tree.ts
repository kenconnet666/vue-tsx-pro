/**
 * 树状数据的共用逻辑：按展开状态展开成一列行、勾选的父子联动（含半选）、展开时懒加载子项，
 * 以及搜索过滤、勾选结果的取法（只要父 / 只要子 / 全部）、到某个节点的路径、移动节点。
 * TreeDataTable（层级行）、Tree、TreeSelect、Cascader、Transfer 共用；数据形状不限，由 getKey / getChildren 读取。
 *
 *   const rows = flattenTree(roots, { getKey, getChildren }, new Set(expanded));
 *   const index = indexTree(roots, { getKey, getChildren });
 *   checked = toggleChecked(index, checked, key);        // 勾上 / 取消一项，子孙与祖先跟着变
 *   const states = checkStates(index, checked);           // key → checked / indeterminate / unchecked
 *   const value = checkedByStrategy(index, checked, 'parent'); // 父节点全勾上时只要父节点
 *   const { include, expand } = filterTree(roots, accessors, (node) => node.name.includes(query));
 *   flattenTree(roots, accessors, new Set([...expanded, ...expand]), { include });
 *   roots = moveNode(roots, { ...accessors, withChildren }, key, { parent: 'b', index: 0 });
 *   roots = buildTree(flatRows, { getKey: (r) => r.id, getParent: (r) => r.parentId }); // 平铺的行（服务端搜索的结果）组装成树
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

/** flattenTree 的选项 */
export interface FlattenTreeOptions<T> {
  /** 改写每一层的顺序（TreeDataTable 按当前排序），不写时按数据顺序 */
  order?: (level: readonly T[]) => readonly T[];
  /** 只要这些节点（搜索过滤：filterTree 的 include），不写时全要 */
  include?: ReadonlySet<string>;
}

/** 按展开状态深度优先展开成一列：只有展开了的节点的子节点出现在结果里 */
export function flattenTree<T>(
  roots: readonly T[],
  accessors: TreeAccessors<T>,
  expanded: ReadonlySet<string>,
  { order = (level) => level, include }: FlattenTreeOptions<T> = {},
): FlatTreeNode<T>[] {
  const result: FlatTreeNode<T>[] = [];
  const visit = (level: readonly T[], depth: number, parent: string | undefined) => {
    // 先按原位置取 key（getKey 的 index 是数据里的位置），再排序、过滤
    const keyOf = new Map(level.map((node, index) => [node, accessors.getKey(node, index)]));
    const sorted = order(level).filter((node) => !include || include.has(keyOf.get(node)!));
    sorted.forEach((node, index) => {
      const key = keyOf.get(node)!;
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

/** 勾选结果的取法（同 Ant Design 的 showCheckedStrategy） */
export interface CheckStrategies {
  /** 勾上的全部节点（默认） */
  all: unknown;
  /** 父节点全勾上时只要父节点，不再列出它的子孙（提交“整个部门”而不是逐个成员） */
  parent: unknown;
  /** 只要叶子（没有已加载的子节点的节点） */
  child: unknown;
}

/** 按取法给出勾上的节点（按树的顺序）；checked 可以是 toggleChecked 的结果，也可以是外部给的部分节点 */
export function checkedByStrategy(
  index: TreeIndex,
  checked: readonly string[],
  strategy: keyof CheckStrategies,
): string[] {
  const effective = effectiveChecked(index, checked);
  return index.order.filter((key) => {
    if (!effective.has(key)) return false;
    if (strategy === 'child') return !index.children.get(key)?.length;
    if (strategy === 'parent') {
      const parent = index.parents.get(key);
      return parent === undefined || !effective.has(parent);
    }
    return true;
  });
}

/** 从第一层到 key 的各节点的 key（含 key 自己）；key 不在树里时为空数组。Cascader 的路径、面包屑用它 */
export function treePath(index: TreeIndex, key: string): string[] {
  if (!index.parents.has(key)) return [];
  const path: string[] = [];
  for (let current: string | undefined = key; current !== undefined;) {
    path.unshift(current);
    current = index.parents.get(current);
  }
  return path;
}

/** filterTree 的结果 */
export interface TreeFilter {
  /** 要显示的节点：匹配的节点与它们的祖先（交给 flattenTree 的 include） */
  include: Set<string>;
  /** 要展开的节点：匹配的节点的祖先，展开后才看得到匹配项 */
  expand: Set<string>;
  /** 匹配的节点（高亮用） */
  matched: Set<string>;
}

/**
 * 搜索过滤：留下匹配的节点与它们的祖先，并展开祖先（只看已加载的节点）。
 * 匹配的节点的子孙不跟着留下（它们自己匹配才留下），同 Ant Design TreeSelect 的搜索
 */
export function filterTree<T>(
  roots: readonly T[],
  accessors: TreeAccessors<T>,
  match: (node: T) => boolean,
): TreeFilter {
  const result: TreeFilter = { include: new Set(), expand: new Set(), matched: new Set() };
  // 返回子树里有没有匹配的节点
  const visit = (level: readonly T[]): boolean => {
    let any = false;
    level.forEach((node, index) => {
      const key = accessors.getKey(node, index);
      const self = match(node);
      const below = visit(accessors.getChildren(node) ?? []);
      if (self) result.matched.add(key);
      if (below) result.expand.add(key);
      if (self || below) {
        result.include.add(key);
        any = true;
      }
    });
    return any;
  };
  visit(roots);
  return result;
}

/** buildTree 怎样读平铺的行 */
export interface TreeRows<T> {
  /** 行的 key，这批行里唯一 */
  getKey: (row: T) => string;
  /** 父行的 key；根行是 null / undefined，父行不在这批行里的也当作根 */
  getParent: (row: T) => string | null | undefined;
  /** 用子节点生成一个节点（不改原行），同 TreeEditor；不写时是 `{ ...row, children }` */
  withChildren?: (row: T, children: T[]) => T;
}

/**
 * 平铺的行（每行带父 key）组装成树，返回第一层；同级保持 rows 里的顺序，叶子的 children 是空数组。
 * 服务端搜索懒加载的树时回“匹配的节点和它们的祖先”（query 库的 withAncestors），组装后再用 filterTree 得到要展开、高亮的节点。
 * key 重复或父子成环时报错（环上的行到不了第一层）
 */
export function buildTree<T>(
  rows: readonly T[],
  { getKey, getParent, withChildren }: TreeRows<T>,
): T[] {
  const make = withChildren ?? ((row: T, children: T[]) => ({ ...row, children }) as T);
  const keys = new Set<string>();
  for (const row of rows) {
    const key = getKey(row);
    if (keys.has(key)) throw new Error(`buildTree：key ${key} 出现了两次`);
    keys.add(key);
  }
  const roots: T[] = [];
  const childrenOf = new Map<string, T[]>();
  for (const row of rows) {
    const parent = getParent(row);
    if (parent == null || parent === getKey(row) || !keys.has(parent)) roots.push(row);
    else childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), row]);
  }
  let built = 0;
  const node = (row: T): T => {
    built++;
    return make(row, (childrenOf.get(getKey(row)) ?? []).map(node));
  };
  const tree = roots.map(node);
  if (built < rows.length) throw new Error('buildTree：有的行的父子关系成了环，到不了第一层');
  return tree;
}

/** moveNode 要的读写方法：在读取之外，能用新的子节点生成一个节点 */
export interface TreeEditor<T> extends TreeAccessors<T> {
  /** 换掉子节点后的新节点（不改原节点），如 `(node, children) => ({ ...node, children })` */
  withChildren: (node: T, children: T[]) => T;
}

/** 移动的目标：放到哪个节点下（undefined 是第一层）的第几位 */
export interface TreeMoveTarget {
  /** 新的父节点的 key；第一层时为 undefined */
  parent: string | undefined;
  /** 在新的同级里的位置（按移走之后的同级算），超出时放到最后 */
  index: number;
}

/**
 * 把 key 移到 target（不改原数据，返回新的第一层；沿途的节点用 withChildren 重建，其余节点原样复用）。
 * key 不存在、目标是它自己或它的子孙时返回 null（拖到自己里面不成立）
 */
export function moveNode<T>(
  roots: readonly T[],
  editor: TreeEditor<T>,
  key: string,
  target: TreeMoveTarget,
): T[] | null {
  const index = indexTree(roots, editor);
  if (!index.parents.has(key)) return null;
  if (target.parent !== undefined) {
    if (!index.parents.has(target.parent)) return null;
    if (treePath(index, target.parent).includes(key)) return null;
  }
  let moving: T | undefined;
  // 先摘下来：只重建 key 的祖先
  const removePath = new Set(treePath(index, key).slice(0, -1));
  const remove = (level: readonly T[]): T[] =>
    level.flatMap((node, position) => {
      const nodeKey = editor.getKey(node, position);
      if (nodeKey === key) {
        moving = node;
        return [];
      }
      if (!removePath.has(nodeKey)) return [node];
      return [editor.withChildren(node, remove(editor.getChildren(node) ?? []))];
    });
  const without = remove(roots);
  const insert = (level: readonly T[]) => {
    const next = [...level];
    next.splice(Math.min(Math.max(target.index, 0), next.length), 0, moving!);
    return next;
  };
  if (target.parent === undefined) return insert(without);
  // 再插进去：只重建目标父节点的祖先（含它自己）
  const insertPath = new Set(treePath(indexTree(without, editor), target.parent));
  const add = (level: readonly T[]): T[] =>
    level.map((node, position) => {
      const nodeKey = editor.getKey(node, position);
      if (!insertPath.has(nodeKey)) return node;
      const children = editor.getChildren(node) ?? [];
      return editor.withChildren(
        node,
        nodeKey === target.parent ? insert(children) : add(children),
      );
    });
  return add(without);
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
