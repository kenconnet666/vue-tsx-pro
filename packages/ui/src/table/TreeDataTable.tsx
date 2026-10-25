/**
 * 树形表格：有层级的行（部门 → 小组 → 成员、文件夹 → 文件），第一列带缩进与展开按钮。
 * 建在 DataTable 上：列定义、排序、勾选、列宽、虚拟滚动、加载与空状态、外观都和 DataTable 一样；
 * 这里只做两件事：按展开状态把树展开成一列行（同级之间按 sort 排序），以及第一列前面的缩进与展开按钮。
 *
 *   <TreeDataTable
 *     rows={departments}
 *     columns={columns}
 *     getKey={(row) => row.id}
 *     getChildren={(row) => row.children}
 *     _expanded={open}
 *     aria-label="组织架构"
 *   />
 *
 * - 懒加载：hasChildren 说有子项、getChildren 还没有时，展开会调用 loadChildren（加载中按钮显示加载指示），
 *   调用方把取到的子项放进数据里。
 * - 展开按钮的名称是“行名 的子项”（第一列的文字），展开与否由 aria-expanded 表示。
 *   表格仍是 table 语义（不是 treegrid：那要求逐个单元格的方向键导航），层级由缩进与按钮表达。
 *
 * 部件：DataTable 的全部部件，加上 Toggle（展开按钮，IconButton）。
 */
import { ChevronRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { IconProps } from '../base/Icon';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useLang } from '../config/context';
import {
  checkStates,
  flattenTree,
  indexTree,
  toggleChecked,
  useTreeExpansion,
  type TreeAccessors,
} from '../utils/data/tree';
import { mergePartProps, mergeProps } from '../utils/props';
import { columnValue, sortRows, type SortState } from './columns';
import { DataTable, type DataTableProps } from './DataTable';
import type { DataTableRowModel } from './DataTableView';
import { disclosureStyles } from '../utils/style/transitions';

/** 未声明的属性落到 table 上；aria-label 或 aria-labelledby 是表格的名称 */
export interface TreeDataTableProps<T> extends Omit<DataTableProps<T>, 'leading'> {
  /** 第一层的行 */
  rows: readonly T[];
  /** 一行的子项；没有子项（叶子）或还没加载时返回 undefined / 空数组 */
  getChildren: (row: T) => readonly T[] | undefined;
  /** 这一行有没有子项（懒加载时子项还没取回来也要显示展开按钮）；不写时看 getChildren 是否非空 */
  hasChildren?: (row: T) => boolean;
  /** 展开一个还没有子项的行时调用：取回子项并放进数据里；返回 Promise 时按钮显示加载中 */
  loadChildren?: (row: T) => Promise<unknown> | void;
  /** 子项加载失败（loadChildren 的 Promise 被拒绝）：这一行收回去，再展开会重试；不写时在控制台报错 */
  onLoadError?: (error: unknown, row: T) => void;
  /** 展开的行的 key：父级写 _expanded={keys} */
  _expanded?: string[];
  /** 每一层缩进多少（em），默认 1.25 */
  indent?: number;
  /** 多选时勾选父子不联动：每一行各自勾选；默认联动（勾上父行连带子孙，子行全勾上时父行也勾上，只勾一部分时父行半选） */
  checkStrictly?: boolean;
  /** 展开按钮的部件属性；加载中、展开状态与点击由组件管理 */
  propsToggle?: Omit<Partial<IconButtonProps>, 'loading' | 'aria-expanded' | 'onClick'>;
}

/** TreeDataTable 的样式：toggle、chevronOpen、placeholder */
export const treeDataTableStyles = css.create({
  toggle: { flexShrink: 0, width: '1.5em', minHeight: '1.5em' },
  chevronOpen: { rotate: '90deg' },
  // 叶子没有按钮，用同样宽的占位让文字对齐
  placeholder: { flexShrink: 0, width: '1.5em' },
});

// 缩进是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** TreeDataTable 的样式：depth */
export const treeDataTableIndentStyles = css.create({
  depth: (em: number) => ({ width: `${em}em`, flexShrink: 0 }),
});

/** 树形表格：按展开状态展开的层级行，复用 DataTable 的一切 */
export const TreeDataTable = _component(
  <T,>({
    rows,
    columns,
    getKey,
    getChildren,
    hasChildren,
    loadChildren,
    onLoadError,
    _expanded: expanded = _bindable<string[]>([]),
    indent = 1.25,
    checkStrictly = false,
    propsToggle,
    _sort: sort = _bindable<SortState | null>(null),
    manualSort = false,
    _selected: selected = _bindable<string[]>([]),
    _columnWidths: columnWidths = _bindable<Record<string, number>>({}),
    ...rest
  }: TreeDataTableProps<T>) => {
    const lang = useLang();
    const accessors = (): TreeAccessors<T> => ({ getKey, getChildren, hasChildren });
    const expansion = useTreeExpansion<T>({
      expanded: () => expanded,
      setExpanded: (keys) => (expanded = keys),
      getChildren: (row) => getChildren(row),
      loadChildren: (row) => loadChildren?.(row),
      // 没给 onLoadError 时交给 useTreeExpansion 在控制台报错
      onLoadError: _untrack(onLoadError) && ((error, row) => onLoadError?.(error, row)),
    });

    /** 按展开状态深度优先展开成一列；同级之间按当前排序（manualSort 时按数据里的顺序） */
    const flat = _derived.by(() =>
      flattenTree(rows, accessors(), new Set(expanded), {
        order: (level) => (manualSort ? level : sortRows(level, columns, sort, lang.code)),
      }),
    );

    // 多选联动：整棵树的索引（含折叠着的行），勾选状态按它推出；交给 DataTable 的是实际勾上的行与半选的父行
    const index = _derived.by(() =>
      rest.selectionMode === 'multiple' && !checkStrictly ? indexTree(rows, accessors()) : null,
    );
    const states = _derived.by(() => (index ? checkStates(index, selected) : null));
    const checkedKeys = _derived.by(() =>
      states ? [...states].flatMap(([key, state]) => (state === 'checked' ? [key] : [])) : selected,
    );
    const partialKeys = _derived.by(() =>
      states
        ? [...states].flatMap(([key, state]) => (state === 'indeterminate' ? [key] : []))
        : undefined,
    );

    /** DataTable 写回的勾选：只变了一行时按它联动子孙与祖先；全选、取消全选原样写回 */
    function writeSelected(next: string[]) {
      if (!index) {
        selected = next;
        return;
      }
      const before = new Set(checkedKeys);
      const after = new Set(next);
      const changed = [
        ...next.filter((key) => !before.has(key)),
        ...checkedKeys.filter((key) => !after.has(key)),
      ];
      selected = changed.length === 1 ? toggleChecked(index, checkedKeys, changed[0]!) : next;
    }
    const byKey = _derived.by(() => new Map(flat.map((item) => [item.key, item])));
    // 交给 DataTable 的行与取 key 的函数要保持同一个引用：每次渲染都新建的话，DataTable 会重排全部行
    const nodes = _derived(flat.map((item) => item.node));
    const keyOf = (_: T, index: number) => flat[index]!.key;

    function leading(model: DataTableRowModel<T>) {
      const item = byKey.get(model.key);
      const depth = item?.depth ?? 0;
      const first = columns[0] ? columnValue(columns[0], model.data) : undefined;
      const label = first != null ? String(first) : model.key;
      const open = expansion.isExpanded(model.key);
      return (
        <>
          {depth > 0 && <span {...css.attrs(treeDataTableIndentStyles.depth(depth * indent))} />}
          {item?.expandable ? (
            <IconButton
              {...mergePartProps<IconButtonProps>(
                {
                  icon: ChevronRight,
                  size: 'sm',
                  radius: 'full',
                  'aria-label': lang.treeToggle(label),
                  sx: treeDataTableStyles.toggle,
                },
                propsToggle,
                {
                  loading: expansion.isLoading(model.key),
                  'aria-expanded': open,
                  // 箭头的转向跟着展开状态：使用方的 propsIcon 合并进来，而不是整个替换掉
                  propsIcon: mergeProps<IconProps>(
                    { flipInRtl: true, sx: disclosureStyles.icon },
                    propsToggle?.propsIcon,
                    open ? { sx: treeDataTableStyles.chevronOpen } : undefined,
                  ),
                  onClick: () => void expansion.setOpen(model.data, model.key, !open),
                },
              )}
            />
          ) : (
            <span {...css.attrs(treeDataTableStyles.placeholder)} />
          )}
        </>
      );
    }

    return () => (
      <DataTable
        {...rest}
        rows={nodes}
        getKey={keyOf}
        columns={columns}
        manualSort
        _sort={sort}
        _selected={checkedKeys as string[]}
        onUpdate:_selected={writeSelected}
        partialKeys={partialKeys}
        _columnWidths={columnWidths}
        leading={leading}
      />
    );
  },
);
