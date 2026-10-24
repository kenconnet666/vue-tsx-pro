/**
 * 透视：把明细按行维度（可以多级）与列维度分组，每格聚合一个数值（求和、计数、平均、最小、最大），
 * 带行合计、列合计与总计。PivotTable 用它；要自己画（热力图、导出）时直接用。
 *
 *   const result = pivot(records, {
 *     rows: [(r) => r.region, (r) => r.supplier],
 *     columns: (r) => r.quarter,
 *     value: (r) => r.amount,
 *     aggregate: 'sum',
 *   });
 *   result.cell(['华东', '华辰'], 'Q1')   // 这一格的值；没有明细时 null
 *
 * 求和按 sumColumn：有 Decimal 时精确相加，接口给的十进制字符串按数字算；平均是和除以个数（浮点）。
 * 行、列的顺序：给了 order 时按它（没列出的排在后面），否则按值排序（数字按大小、文字按当前语言）。
 */
import type { SortValue } from '../utils/data/collation';
import { compareNumeric, isNumeric, toNumber, type NumericValue } from '../utils/data/numeric';
import { sumColumn } from './columns';

/** 聚合的方式 */
export interface PivotAggregates {
  /** 求和（默认） */
  sum: unknown;
  /** 明细的条数 */
  count: unknown;
  /** 平均 */
  avg: unknown;
  /** 最小 */
  min: unknown;
  /** 最大 */
  max: unknown;
}

/** pivot 的选项 */
export interface PivotOptions<T> {
  /** 行维度：每个取出一级的分组值（地区、供应商） */
  rows: readonly ((row: T) => SortValue)[];
  /** 列维度；不写时只有一列（只按行分组） */
  columns?: (row: T) => SortValue;
  /** 聚合的数值；count 时可以不写 */
  value?: (row: T) => SortValue;
  /** 聚合的方式，默认 sum */
  aggregate?: keyof PivotAggregates;
  /** 各级行维度的顺序（按位置对应 rows） */
  rowOrder?: readonly (readonly string[] | undefined)[];
  /** 列的顺序 */
  columnOrder?: readonly string[];
  /** 排序用的比较（文字按语言）；默认 localeCompare */
  compare?: (a: string, b: string) => number;
}

/** 透视的结果 */
export interface PivotResult {
  /** 各行的维度值（每级一个），按顺序 */
  rowKeys: string[][];
  /** 各列的值，按顺序；没有列维度时是 [''] */
  columnKeys: string[];
  /** 一格的值：没有明细（或明细里都没有数值）时 null */
  cell: (row: readonly string[], column: string) => NumericValue | null;
  /** 一行的合计（这一行全部明细的聚合） */
  rowTotal: (row: readonly string[]) => NumericValue | null;
  /** 一列的合计 */
  columnTotal: (column: string) => NumericValue | null;
  /** 总计 */
  grandTotal: NumericValue | null;
  /** 各格（不含合计）里最小、最大的值：热力图按它定颜色深浅；没有值时 null */
  extent: [number, number] | null;
}

const SEP = '\u0000';

/** 一组明细的聚合 */
function aggregateOf<T>(
  rows: readonly T[],
  value: ((row: T) => SortValue) | undefined,
  how: keyof PivotAggregates,
): NumericValue | null {
  if (how === 'count') return rows.length;
  if (!value || rows.length === 0) return null;
  const column = { key: '', header: '', value };
  if (how === 'sum') return sumColumn(column, rows);
  if (how === 'avg') {
    const numbers = rows.map(value).filter(isNumeric);
    const total = sumColumn(column, rows);
    return total == null || numbers.length === 0 ? null : toNumber(total) / numbers.length;
  }
  const numbers = rows.map(value).filter(isNumeric);
  if (numbers.length === 0) return null;
  return numbers.reduce((best, current) =>
    (how === 'min' ? compareNumeric(current, best) < 0 : compareNumeric(current, best) > 0)
      ? current
      : best,
  );
}

/** 按 order 排，没列出的按 compare 排在后面 */
function ordered(
  values: Iterable<string>,
  order: readonly string[] | undefined,
  compare: (a: string, b: string) => number,
): string[] {
  const rank = new Map((order ?? []).map((value, position) => [value, position]));
  return [...new Set(values)].sort((a, b) => {
    const ra = rank.get(a);
    const rb = rank.get(b);
    if (ra !== undefined || rb !== undefined) return (ra ?? Infinity) - (rb ?? Infinity);
    return compare(a, b);
  });
}

/** 文字形式的维度值：空值是空字符串 */
const text = (value: SortValue) => (value == null ? '' : String(value));

/** 按行维度、列维度分组聚合 */
export function pivot<T>(data: readonly T[], options: PivotOptions<T>): PivotResult {
  const {
    rows: dimensions,
    columns,
    value,
    aggregate = 'sum',
    rowOrder,
    columnOrder,
    compare = (a, b) => a.localeCompare(b, undefined, { numeric: true }),
  } = options;
  const groups = new Map<string, T[]>();
  const byRow = new Map<string, T[]>();
  const byColumn = new Map<string, T[]>();
  const push = (map: Map<string, T[]>, key: string, row: T) => {
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  };
  for (const row of data) {
    const rowKey = dimensions.map((dimension) => text(dimension(row))).join(SEP);
    const columnKey = columns ? text(columns(row)) : '';
    push(groups, `${rowKey}${SEP}${SEP}${columnKey}`, row);
    push(byRow, rowKey, row);
    push(byColumn, columnKey, row);
  }

  // 行：逐级排序（同一上级下的下级按 order 或 compare）
  const rowKeys = [...byRow.keys()]
    .map((key) => key.split(SEP))
    .sort((a, b) => {
      for (let level = 0; level < dimensions.length; level++) {
        if (a[level] === b[level]) continue;
        const sorted = ordered([a[level]!, b[level]!], rowOrder?.[level], compare);
        return sorted[0] === a[level] ? -1 : 1;
      }
      return 0;
    });
  const columnKeys = ordered(byColumn.keys(), columnOrder, compare);

  const cache = new Map<string, NumericValue | null>();
  const cell = (row: readonly string[], column: string) => {
    const key = `${row.join(SEP)}${SEP}${SEP}${column}`;
    if (!cache.has(key)) cache.set(key, aggregateOf(groups.get(key) ?? [], value, aggregate));
    return cache.get(key)!;
  };
  const values = rowKeys.flatMap((row) =>
    columnKeys.flatMap((column) => {
      const result = cell(row, column);
      return result == null ? [] : [toNumber(result)];
    }),
  );
  return {
    rowKeys,
    columnKeys,
    cell,
    rowTotal: (row) => aggregateOf(byRow.get(row.join(SEP)) ?? [], value, aggregate),
    columnTotal: (column) => aggregateOf(byColumn.get(column) ?? [], value, aggregate),
    grandTotal: aggregateOf(data, value, aggregate),
    extent: values.length ? [Math.min(...values), Math.max(...values)] : null,
  };
}
