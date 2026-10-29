/**
 * 按列定义渲染的静态表格：列定义与 DataTable 相同（type、format、statuses、empty、summary、align、cell），
 * 渲染成普通的 Table（不虚拟滚动、列宽按内容、单元格可以换行），可以合并单元格。打印、导出预览、详情页里的明细表用它；
 * 要排序、勾选、筛选、十万行的用 DataTable。
 *
 *   <ColumnTable rows={items} columns={columns} getKey={(item) => item.id} mergeRepeated={['supplier']} aria-label="报价明细" />
 *
 * 合并单元格：mergeRepeated 写列的 key，这几列里上下相邻、值相同的格合成一格（后一列只在前一列的同一格里合并，层层分组）；
 * 更灵活的用 cellSpan，返回 { rowSpan, colSpan }，被合并掉的格返回 0（同 Ant Design 的 onCell）。合并的格垂直居中。
 *
 * 部件：Root（Table）、HeaderCell（th）、Row（tr）、Cell（td）、SummaryCell（表尾的 td）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { mergeProps, type PartProps } from '../utils/props';
import { useColumnDisplay } from './column-display';
import { columnType, columnValue, sumColumn, type DataTableColumn } from './columns';
import {
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableHeaderCellProps,
  type TableProps,
} from './Table';

/** 一格合并几行、几列；0 是被别的格合并掉（不渲染） */
export interface CellSpan {
  /** 往下合并几行，默认 1 */
  rowSpan?: number;
  /** 往后合并几列，默认 1 */
  colSpan?: number;
}

/** 列标题的部件属性：对齐与宽度跟随列定义 */
type HeaderCellParts = Partial<TableHeaderCellProps>;
/** 单元格的部件属性：对齐跟随列定义，合并由 cellSpan、mergeRepeated 决定 */
type CellParts = PartProps<'td', 'align' | 'rowspan' | 'colspan'>;

/** 未声明的属性落到 table 上；外观（density、variant、striped）同 Table */
export interface ColumnTableProps<T> extends Omit<TableProps, 'children'> {
  /** 数据 */
  rows: readonly T[];
  /** 列定义（与 DataTable 相同；sortable、filter、sticky、resizable 在这里不起作用） */
  columns: readonly DataTableColumn<T>[];
  /** 行的 key；不写时用下标 */
  getKey?: (row: T, index: number) => string;
  /** 这几列里上下相邻、值相同的格合成一格；后一列只在前一列的同一格里合并 */
  mergeRepeated?: readonly string[];
  /** 合并单元格：返回这一格合并几行、几列，被合并掉的返回 { rowSpan: 0 } 或 { colSpan: 0 } */
  cellSpan?: (row: T, column: DataTableColumn<T>, index: number) => CellSpan | undefined;
  /** 合计行第一列的文字（第一列自己没写 summary 时），默认取语言包（合计） */
  summaryLabel?: VNodeChild;
  /** 列标题（th）的部件属性，可以按列计算 */
  propsHeaderCell?: HeaderCellParts | ((column: DataTableColumn<T>) => HeaderCellParts);
  /** 每一行（tr）的部件属性，可以按行计算 */
  propsRow?: PartProps<'tr'> | ((row: T, index: number) => PartProps<'tr'>);
  /** 每个单元格（td）的部件属性，可以按行与列计算 */
  propsCell?: CellParts | ((row: T, column: DataTableColumn<T>) => CellParts);
  /** 合计行每个单元格的部件属性，可以按列计算 */
  propsSummaryCell?: CellParts | ((column: DataTableColumn<T>) => CellParts);
}

/** ColumnTable 的样式：merged */
export const columnTableStyles = css.create({
  // 合并的格跨了几行：内容垂直居中，下边线照常
  merged: { verticalAlign: 'middle' },
});

/**
 * mergeRepeated 的跨行数：每列一个数组，第 i 行是这一格往下合并几行，被合并掉的是 0。
 * 后一列在前一列的分组边界处断开（不把不同供应商下同名的品类合在一起）
 */
export function repeatedRowSpans<T>(
  rows: readonly T[],
  columns: readonly DataTableColumn<T>[],
  keys: readonly string[],
): Map<string, number[]> {
  const spans = new Map<string, number[]>();
  // 上一列的分组从哪些行开始：本列的合并不能跨过它们
  let boundaries = new Set<number>([0]);
  for (const key of keys) {
    const column = columns.find((item) => item.key === key);
    if (!column) continue;
    const list = Array.from({ length: rows.length }, () => 1);
    const starts = new Set<number>();
    let start = 0;
    for (let index = 0; index < rows.length; index++) {
      const same =
        index > start &&
        !boundaries.has(index) &&
        String(columnValue(column, rows[index]!)) === String(columnValue(column, rows[start]!));
      if (same) {
        list[start]!++;
        list[index] = 0;
      } else {
        start = index;
        starts.add(index);
      }
    }
    spans.set(key, list);
    boundaries = new Set([...boundaries, ...starts]);
  }
  return spans;
}

/** 按列定义渲染的静态表格：格式化同 DataTable，可以合并单元格、带合计行 */
export const ColumnTable = _component(
  <T,>({
    rows,
    columns,
    getKey,
    mergeRepeated,
    cellSpan,
    summaryLabel,
    propsHeaderCell,
    propsRow,
    propsCell,
    propsSummaryCell,
    ...rest
  }: ColumnTableProps<T>) => {
    const lang = useLang();
    const display = useColumnDisplay<T>();
    const types = _derived(columns.map((column) => columnType(column, rows)));
    const shown = _derived(display.columns(columns, types));
    const merged = _derived(
      mergeRepeated?.length ? repeatedRowSpans(rows, columns, mergeRepeated) : null,
    );
    const hasSummary = _derived(columns.some((column) => column.summary != null));

    /** 一格的合并：cellSpan 优先，其次 mergeRepeated */
    function spanOf(row: T, column: DataTableColumn<T>, index: number): CellSpan | undefined {
      const own = cellSpan?.(row, column, index);
      if (own) return own;
      const rowSpan = merged?.get(column.key)?.[index];
      return rowSpan == null || rowSpan === 1 ? undefined : { rowSpan };
    }

    function summaryCell(column: DataTableColumn<T>, position: number): VNodeChild {
      if (column.summary === 'sum') {
        const total = sumColumn(column, rows);
        return total == null
          ? (column.empty ?? lang.emptyValue)
          : display.value(column, types[position]!, total);
      }
      if (column.summary) return column.summary(rows);
      return position === 0 ? (summaryLabel ?? lang.tableSummary) : null;
    }

    return () => (
      <Table {...rest}>
        <TableHead>
          <TableRow>
            {shown.map((column) => (
              <TableHeaderCell
                key={column.key}
                {...(typeof propsHeaderCell === 'function'
                  ? propsHeaderCell(column)
                  : propsHeaderCell)}
                align={column.align}
                width={column.width}
              >
                {column.header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={getKey?.(row, index) ?? index}
              {...mergeProps<'tr'>(
                {},
                typeof propsRow === 'function' ? propsRow(row, index) : propsRow,
              )}
            >
              {shown.map((column) => {
                const span = spanOf(row, column, index);
                if (span?.rowSpan === 0 || span?.colSpan === 0) return null;
                const own = typeof propsCell === 'function' ? propsCell(row, column) : propsCell;
                return (
                  <TableCell
                    key={column.key}
                    {...mergeProps<'td'>(
                      { sx: span?.rowSpan ? columnTableStyles.merged : undefined },
                      own,
                      { rowspan: span?.rowSpan, colspan: span?.colSpan },
                    )}
                    align={column.align}
                    nowrap={!column.wrap && column.width != null}
                  >
                    {column.cell!(row, index)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
        {hasSummary && (
          <TableFoot>
            <TableRow>
              {shown.map((column, position) => (
                <TableCell
                  key={column.key}
                  {...(typeof propsSummaryCell === 'function'
                    ? propsSummaryCell(column)
                    : propsSummaryCell)}
                  align={column.align}
                >
                  {summaryCell(column, position)}
                </TableCell>
              ))}
            </TableRow>
          </TableFoot>
        )}
      </Table>
    );
  },
);
