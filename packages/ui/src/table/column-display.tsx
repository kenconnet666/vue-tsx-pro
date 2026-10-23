/**
 * 列的默认显示（DataTable、ColumnTable 共用）：没写 align 的按值类型对齐，没写 cell 的按类型与语言格式化；
 * 空值显示列的 empty（默认语言包的 —），状态列显示成 StatusBadge。在组件 setup 里调用。
 *
 *   const display = useColumnDisplay<Order>();
 *   const shown = display.columns(columns, types);   // types：各列的值类型（columnType），与 columns 一一对应
 *   display.value(column, type, total)               // 合计行这类单独的值
 */
import type { VNodeChild } from 'vue';
import { StatusBadge } from '../base/Badge';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import type { SortValue } from '../utils/data/collation';
import {
  columnAlign,
  columnValue,
  formatCell,
  type ColumnTypes,
  type DataTableColumn,
} from './columns';

/** useColumnDisplay 的返回值 */
export interface ColumnDisplay<T> {
  /** 补上默认对齐与格式化的列；types 是各列的值类型（与 columns 一一对应） */
  columns(
    columns: readonly DataTableColumn<T>[],
    types: readonly (keyof ColumnTypes)[],
  ): DataTableColumn<T>[];
  /** 一个值的显示：空值显示 empty，状态显示成 StatusBadge（外观跟随 defaults.Badge），其余按类型与 format 格式化 */
  value(column: DataTableColumn<T>, type: keyof ColumnTypes, value: SortValue): VNodeChild;
}

/** 列的默认显示：在 setup 里调用 */
export function useColumnDisplay<T>(): ColumnDisplay<T> {
  const lang = useLang();
  const format = useFormat();

  const display: ColumnDisplay<T>['value'] = (column, type, value) => {
    if (value == null || value === '') return column.empty ?? lang.emptyValue;
    if (column.statuses) return <StatusBadge statuses={column.statuses} value={String(value)} />;
    return formatCell(value, type, format, column.format);
  };

  return {
    columns: (columns, types) =>
      columns.map((column, position): DataTableColumn<T> => {
        const type = types[position] ?? 'text';
        return {
          ...column,
          align: column.align ?? (column.statuses ? 'start' : columnAlign(type)),
          cell: column.cell ?? ((row) => display(column, type, columnValue(column, row))),
        };
      }),
    value: display,
  };
}
