/**
 * 表格的列定义与排序：Table、TreeTable 共用（参考 TanStack Table 的列模型，只取最常用的部分）。
 *
 *   const columns: TableColumn<Order>[] = [
 *     { key: 'id', header: '订单号', width: 120, sticky: 'start' },
 *     { key: 'customer', header: '客户', sortable: true },
 *     { key: 'amount', header: '金额', align: 'end', sortable: true, cell: (order) => format.currency(order.amount) },
 *   ];
 */
import type { VNodeChild } from 'vue';
import { createComparer, type SortValue } from '../utils/data/collation';

/** 单元格内容的对齐 */
export interface ColumnAligns {
  /** 起始边（默认）：文字 */
  start: unknown;
  /** 居中：状态、图标 */
  center: unknown;
  /** 结束边：数字、金额，方便对比位数 */
  end: unknown;
}

/** 固定在哪一侧（横向滚动时不动） */
export interface ColumnStickies {
  /** 起始边：名称、编号 */
  start: unknown;
  /** 结束边：操作 */
  end: unknown;
}

/** 一列 */
export interface TableColumn<T> {
  /** 列的标识：同一表格里不能重复；不写 value 时也是取值的字段名 */
  key: string;
  /** 表头内容 */
  header: VNodeChild;
  /** 单元格内容；不写时显示 value 的文字 */
  cell?: (row: T, index: number) => VNodeChild;
  /** 排序用的值；不写时取 row[key] */
  value?: (row: T) => SortValue;
  /** 宽度（px）；不写时与其他没写宽度的列平分剩余宽度。固定列一定要写（偏移量按它算） */
  width?: number;
  /** 拖动调整宽度时的最小宽度（px），默认 COLUMN_MIN_WIDTH（64） */
  minWidth?: number;
  /** 对齐，默认 start */
  align?: keyof ColumnAligns;
  /** 可以点表头排序 */
  sortable?: boolean;
  /** 固定在哪一侧 */
  sticky?: keyof ColumnStickies;
  /** 可以拖动调整宽度；不写时跟随表格的 resizable */
  resizable?: boolean;
  /** 内容可以换行；默认一行显示不下时省略 */
  wrap?: boolean;
}

/** 排序方向（与 aria-sort 的取值一致） */
export interface SortDirections {
  /** 升序：小到大、A 到 Z */
  ascending: unknown;
  /** 降序 */
  descending: unknown;
}

/** 当前的排序：按哪一列、哪个方向 */
export interface SortState {
  /** 列的 key */
  key: string;
  /** 方向 */
  direction: keyof SortDirections;
}

/** 没写宽度的列，计算表格最小宽度与固定列偏移时按这么宽算（px） */
export const COLUMN_FLEX_MIN_WIDTH = 120;

/** 拖动调整列宽时默认的最小宽度（px） */
export const COLUMN_MIN_WIDTH = 64;

/** 列当前的宽度（px）：调整过的、列定义里的；都没有时 undefined（与其他没写宽度的列平分） */
export type ColumnWidthOf<T> = (column: TableColumn<T>) => number | undefined;

/** 固定列的偏移（px），按列的 key 取 */
export interface StickyOffsets {
  /** 固定在起始边的列 */
  start: Map<string, number>;
  /** 固定在结束边的列 */
  end: Map<string, number>;
}

/** 固定列的偏移（px）：起始边的从 leading（勾选列的宽度）之后累加，结束边的从末尾往回累加 */
export function stickyOffsets<T>(
  columns: readonly TableColumn<T>[],
  widthOf: ColumnWidthOf<T>,
  leading: number,
): StickyOffsets {
  const accumulate = (side: 'start' | 'end', ordered: readonly TableColumn<T>[], from: number) => {
    const offsets = new Map<string, number>();
    let offset = from;
    for (const column of ordered) {
      if (column.sticky !== side) continue;
      offsets.set(column.key, offset);
      offset += widthOf(column) ?? COLUMN_FLEX_MIN_WIDTH;
    }
    return offsets;
  };
  return {
    start: accumulate('start', columns, leading),
    end: accumulate('end', [...columns].reverse(), 0),
  };
}

/** 表格的最小宽度（px）：写了宽度的列按宽度，没写的按 COLUMN_FLEX_MIN_WIDTH；放不下时横向滚动 */
export function tableMinWidth<T>(
  columns: readonly TableColumn<T>[],
  widthOf: ColumnWidthOf<T>,
  leading: number,
): number {
  return columns.reduce(
    (total, column) => total + (widthOf(column) ?? COLUMN_FLEX_MIN_WIDTH),
    leading,
  );
}

/** 列在这一行的值：value 函数，或 row[key] */
export function columnValue<T>(column: TableColumn<T>, row: T): SortValue {
  if (column.value) return column.value(row);
  return (row as Record<string, SortValue>)[column.key];
}

/** 点表头时的下一个排序：没排 → 升序 → 降序 → 不排 */
export function nextSort(current: SortState | null | undefined, key: string): SortState | null {
  if (current?.key !== key) return { key, direction: 'ascending' };
  return current.direction === 'ascending' ? { key, direction: 'descending' } : null;
}

/**
 * 按当前排序排列（返回新数组，原数组不变）；没有排序、或排序列不存在时原样返回。
 * 比较用 createComparer：数字按大小、日期按时间、文字按语言（中文按拼音、“第2章”在“第10章”前），空值总在最后
 */
export function sortRows<T>(
  rows: readonly T[],
  columns: readonly TableColumn<T>[],
  sort: SortState | null | undefined,
  locale: string,
): readonly T[] {
  const column = sort && columns.find((item) => item.key === sort.key);
  if (!sort || !column) return rows;
  const compare = createComparer(locale);
  const factor = sort.direction === 'ascending' ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index, value: columnValue(column, row) }))
    .sort((a, b) => {
      // 空值不随方向翻转，总在最后
      if (a.value == null || b.value == null) return compare(a.value, b.value) || a.index - b.index;
      return compare(a.value, b.value) * factor || a.index - b.index;
    })
    .map((item) => item.row);
}
