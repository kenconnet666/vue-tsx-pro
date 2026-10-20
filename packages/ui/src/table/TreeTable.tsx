/**
 * 树形表格：有层级的行（部门 → 小组 → 成员、文件夹 → 文件），第一列带缩进与展开按钮。
 * 建在 Table 上：列定义、排序、勾选、列宽、虚拟滚动、加载与空状态、外观都和 Table 一样；
 * 这里只做两件事：按展开状态把树展开成一列行（同级之间按 sort 排序），以及第一列前面的缩进与展开按钮。
 *
 *   <TreeTable
 *     rows={departments}
 *     columns={columns}
 *     rowKey={(row) => row.id}
 *     getChildren={(row) => row.children}
 *     expanded={_bind(open)}
 *     aria-label="组织架构"
 *   />
 *
 * - 懒加载：hasChildren 说有子项、getChildren 还没有时，展开会调用 loadChildren（加载中按钮显示加载指示），
 *   调用方把取到的子项放进数据里。
 * - 展开按钮的名称是“行名 的子项”（第一列的文字），展开与否由 aria-expanded 表示。
 *   表格仍是 table 语义（不是 treegrid：那要求逐个单元格的方向键导航），层级由缩进与按钮表达。
 */
import { ChevronRight } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { IconButton } from '../base/IconButton';
import { useLang } from '../config/context';
import { flattenTree, useTreeExpansion, type TreeAccessors } from '../utils/data/tree';
import { columnValue, sortRows, type SortState } from './columns';
import { Table, type TableProps } from './Table';
import type { TableRowModel } from './TableView';

/** 未声明的属性落到 table 上；aria-label 或 aria-labelledby 是表格的名称 */
export interface TreeTableProps<T> extends Omit<TableProps<T>, 'manualSort' | 'leading'> {
  /** 第一层的行 */
  rows: readonly T[];
  /** 一行的子项；没有子项（叶子）或还没加载时返回 undefined / 空数组 */
  getChildren: (row: T) => readonly T[] | undefined;
  /** 这一行有没有子项（懒加载时子项还没取回来也要显示展开按钮）；不写时看 getChildren 是否非空 */
  hasChildren?: (row: T) => boolean;
  /** 展开一个还没有子项的行时调用：取回子项并放进数据里；返回 Promise 时按钮显示加载中 */
  loadChildren?: (row: T) => Promise<unknown> | void;
  /** 展开的行的 key：父级写 expanded={_bind(keys)} */
  expanded?: string[];
  /** 每一层缩进多少（em），默认 1.25 */
  indent?: number;
}

/** TreeTable 的样式：toggle、chevron、chevronOpen、placeholder */
export const treeTableStyles = stylex.create({
  toggle: { flexShrink: 0, width: '1.5em', minHeight: '1.5em' },
  chevron: { transition: 'rotate _durations.sm _easings.standard' },
  chevronOpen: { rotate: '90deg' },
  // 叶子没有按钮，用同样宽的占位让文字对齐
  placeholder: { flexShrink: 0, width: '1.5em' },
});

// 缩进是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** TreeTable 的样式：depth */
export const treeTableIndentStyles = stylex.create({
  depth: (em: number) => ({ width: `${em}em`, flexShrink: 0 }),
});

/** 树形表格：按展开状态展开的层级行，复用 Table 的一切 */
export const TreeTable = _component(
  <T,>({
    rows,
    columns,
    rowKey,
    getChildren,
    hasChildren,
    loadChildren,
    expanded = _bindable<string[]>([]),
    indent = 1.25,
    sort = _bindable<SortState | null>(null),
    selected = _bindable<string[]>([]),
    columnWidths = _bindable<Record<string, number>>({}),
    ...rest
  }: TreeTableProps<T>) => {
    const lang = useLang();
    const accessors = (): TreeAccessors<T> => ({ getKey: rowKey, getChildren, hasChildren });
    const expansion = useTreeExpansion<T>({
      expanded: () => expanded,
      setExpanded: (keys) => (expanded = keys),
      getChildren: (row) => getChildren(row),
      loadChildren: (row) => loadChildren?.(row),
    });

    /** 按展开状态深度优先展开成一列；同级之间按当前排序 */
    const flat = _derived.by(() =>
      flattenTree(rows, accessors(), new Set(expanded), (level) =>
        sortRows(level, columns, sort, lang.code),
      ),
    );
    const byKey = _derived.by(() => new Map(flat.map((item) => [item.key, item])));
    // 交给 Table 的行与取 key 的函数要保持同一个引用：每次渲染都新建的话，Table 会重排全部行
    const nodes = _derived(flat.map((item) => item.node));
    const keyOf = (_: T, index: number) => flat[index]!.key;

    function leading(model: TableRowModel<T>) {
      const item = byKey.get(model.key);
      const depth = item?.depth ?? 0;
      const first = columns[0] ? columnValue(columns[0], model.data) : undefined;
      const label = first != null ? String(first) : model.key;
      const open = expansion.isExpanded(model.key);
      return (
        <>
          {depth > 0 && <span {...stylex.attrs(treeTableIndentStyles.depth(depth * indent))} />}
          {item?.expandable ? (
            <IconButton
              icon={ChevronRight}
              size="sm"
              radius="full"
              loading={expansion.isLoading(model.key)}
              aria-label={lang.treeToggle(label)}
              aria-expanded={open}
              sx={treeTableStyles.toggle}
              propsIcon={{
                flipInRtl: true,
                sx: [treeTableStyles.chevron, open && treeTableStyles.chevronOpen],
              }}
              onClick={() => void expansion.setOpen(model.data, model.key, !open)}
            />
          ) : (
            <span {...stylex.attrs(treeTableStyles.placeholder)} />
          )}
        </>
      );
    }

    return () => (
      <Table
        {...rest}
        rows={nodes}
        rowKey={keyOf}
        columns={columns}
        manualSort
        sort={_bind(sort)}
        selected={_bind(selected)}
        columnWidths={_bind(columnWidths)}
        leading={leading}
      />
    );
  },
);
