/**
 * 透视表：明细按行维度（可以多级，相同的格合并）与列维度交叉汇总，每格是一个聚合值，带合计行与合计列；
 * heatmap 时按数值给格子着色（热力图：一眼看出哪里多、哪里少）。建在 pivot 与 ColumnTable 上。
 *
 *   <PivotTable
 *     data={records}
 *     rows={[{ key: 'region', header: '区域' }, { key: 'supplier', header: '供应商' }]}
 *     columns={{ key: 'quarter', header: '季度', order: ['Q1', 'Q2', 'Q3', 'Q4'] }}
 *     value={{ key: 'amount', header: '销售额', type: 'currency' }}
 *     heatmap
 *     aria-label="各区域、门店的季度销售额"
 *   />
 *
 * 数值的格式同表格的列（type、format）；aggregate 是 sum（默认）、count、avg、min、max。
 * 热力图的颜色是强调色按比例混进底色（最深不超过 45%，文字照常够对比），读屏照常读数字。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { t } from '../config/theme/tokens';
import type { SortValue } from '../utils/data/collation';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import { ColumnTable, type ColumnTableProps } from './ColumnTable';
import { formatCell, type ColumnTypes, type DataTableColumn } from './columns';
import { pivot, type PivotAggregates } from './pivot';

/** 一个维度（行或列）：取哪个字段、表头、显示与顺序 */
export interface PivotDimension<T> {
  /** 字段名；写了 value 时只作标识 */
  key: string;
  /** 表头（行维度是这一列的表头；列维度显示在左上角的说明里） */
  header: VNodeChild;
  /** 取值；不写时取 row[key] */
  value?: (row: T) => SortValue;
  /** 显示的文字；不写时是值本身 */
  format?: (value: string) => string;
  /** 顺序：按这个排，没列出的排在后面；不写时按值排序 */
  order?: readonly string[];
}

/** 聚合的数值 */
export interface PivotValue<T> {
  /** 字段名；写了 value 时只作标识 */
  key: string;
  /** 名称：读屏的说明、合计的含义 */
  header: VNodeChild;
  /** 取值；不写时取 row[key] */
  value?: (row: T) => SortValue;
  /** 值的类型（同表格的列），默认 number */
  type?: keyof ColumnTypes;
  /** 数字的格式（同表格的列） */
  format?: NumericFormat;
}

/** 透视表的一行（交给 ColumnTable 的部件属性）：行维度的值 */
export interface PivotRow {
  /** 各级维度值连起来的标识 */
  key: string;
  /** 各级行维度的值 */
  dimensions: string[];
}

/** 未声明的属性落到 table 上；外观（density、variant、striped）同 Table */
export interface PivotTableProps<T> extends Omit<
  ColumnTableProps<PivotRow>,
  'rows' | 'columns' | 'getKey' | 'mergeRepeated'
> {
  /** 明细 */
  data: readonly T[];
  /** 行维度，可以多级（相同的上级合并成一格） */
  rows: readonly PivotDimension<T>[];
  /** 列维度；不写时只有一列（按行汇总） */
  columns?: PivotDimension<T>;
  /** 聚合的数值；count 时可以不写 */
  value?: PivotValue<T>;
  /** 聚合方式，默认 sum */
  aggregate?: keyof PivotAggregates;
  /** 合计行与合计列，默认 true */
  totals?: boolean;
  /** 按数值给格子着色（热力图）；合计不着色 */
  heatmap?: boolean;
  /** 没有明细的格子显示的内容，默认 — */
  empty?: VNodeChild;
}

/** PivotTable 的样式：heat（按比例的底色） */
export const pivotTableStyles = css.create({
  heat: (percent: number) => ({
    backgroundColor: `color-mix(in srgb, ${t.colors.accent} ${percent}%, transparent)`,
  }),
  total: { fontWeight: '_semibold' },
});

const fieldOf =
  <T,>(dimension: { key: string; value?: (row: T) => SortValue }) =>
  (row: T) =>
    dimension.value
      ? dimension.value(row)
      : ((row as Record<string, SortValue>)[dimension.key] ?? null);

/** 热力图最深的混色比例：再深时文字的对比度不够 */
const MAX_HEAT = 45;

/** 透视表：行维度 × 列维度的聚合，可以着色成热力图 */
export const PivotTable = _component(
  <T,>({
    data,
    rows,
    columns,
    value,
    aggregate = 'sum',
    totals = true,
    heatmap = false,
    empty,
    propsCell,
    ...rest
  }: PivotTableProps<T>) => {
    const lang = useLang();
    const format = useFormat();
    const result = _derived(
      pivot(data, {
        rows: rows.map(fieldOf),
        columns: columns && fieldOf(columns),
        value: value && fieldOf(value),
        aggregate,
        rowOrder: rows.map((dimension) => dimension.order),
        columnOrder: columns?.order,
        // 维度值按当前语言排序（中文按拼音），数字按大小
        compare: (a, b) => a.localeCompare(b, lang.code, { numeric: true }),
      }),
    );
    const type = (): keyof ColumnTypes =>
      aggregate === 'count' ? 'number' : (value?.type ?? 'number');
    const show = (number: NumericValue | null): VNodeChild =>
      number == null
        ? (empty ?? lang.emptyValue)
        : formatCell(number, type(), format, aggregate === 'count' ? undefined : value?.format);

    return () => {
      const { rowKeys, columnKeys, cell, rowTotal, columnTotal, grandTotal, extent } = result;
      const tableRows: PivotRow[] = rowKeys.map((dimensions) => ({
        key: dimensions.join('\u0000'),
        dimensions,
      }));
      const heat = (number: NumericValue | null) => {
        if (!heatmap || number == null || !extent) return undefined;
        const [low, high] = extent;
        const ratio = high === low ? 1 : (toNumber(number) - low) / (high - low);
        return pivotTableStyles.heat(Math.round(6 + ratio * (MAX_HEAT - 6)));
      };
      const tableColumns: DataTableColumn<PivotRow>[] = [
        ...rows.map((dimension, level): DataTableColumn<PivotRow> => ({
          key: `row:${level}`,
          header: dimension.header,
          value: (row) => row.dimensions[level] ?? '',
          cell: (row) => {
            const raw = row.dimensions[level] ?? '';
            return dimension.format ? dimension.format(raw) : raw || lang.emptyValue;
          },
        })),
        ...columnKeys.map((column): DataTableColumn<PivotRow> => ({
          key: `column:${column}`,
          header: columns
            ? columns.format
              ? columns.format(column)
              : column || lang.emptyValue
            : (value?.header ?? lang.tableSummary),
          align: 'end',
          value: (row) => {
            const number = cell(row.dimensions, column);
            return number == null ? null : toNumber(number);
          },
          cell: (row) => show(cell(row.dimensions, column)),
          summary: totals ? () => show(columnTotal(column)) : undefined,
        })),
        ...(totals && columns
          ? [
              {
                key: 'total',
                header: lang.tableSummary,
                align: 'end' as const,
                cell: (row: PivotRow) => show(rowTotal(row.dimensions)),
                summary: () => show(grandTotal),
              },
            ]
          : []),
      ];
      return (
        <ColumnTable
          {...rest}
          rows={tableRows}
          columns={tableColumns}
          getKey={(row) => row.key}
          mergeRepeated={rows.slice(0, -1).map((_dimension, level) => `row:${level}`)}
          propsCell={(row, column) => {
            const own = typeof propsCell === 'function' ? propsCell(row, column) : propsCell;
            const columnKey = column.key.startsWith('column:') ? column.key.slice(7) : undefined;
            const sx =
              columnKey !== undefined
                ? heat(cell(row.dimensions, columnKey))
                : column.key === 'total'
                  ? pivotTableStyles.total
                  : undefined;
            return { ...own, sx: [sx, own?.sx] } as PartProps<
              'td',
              'align' | 'rowspan' | 'colspan'
            >;
          }}
        />
      );
    };
  },
);
