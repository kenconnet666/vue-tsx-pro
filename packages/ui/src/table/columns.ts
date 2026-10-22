/**
 * 表格的列定义与排序：DataTable、TreeDataTable 共用（参考 TanStack DataTable 的列模型，只取最常用的部分）。
 *
 *   const columns: DataTableColumn<Order>[] = [
 *     { key: 'id', header: '订单号', width: 120, sticky: 'start' },
 *     { key: 'customer', header: '客户', sortable: true },
 *     { key: 'amount', header: '金额', type: 'currency', sortable: true },
 *   ];
 */
import type { VNodeChild } from 'vue';
import type { NumericFormat, useFormat } from '../config/lang/format';
import { isDateValue, sortByValue, type SortValue } from '../utils/data/collation';
import {
  addNumeric,
  isDecimal,
  isNumeric,
  isNumericText,
  numericKind,
  type NumericKind,
  type NumericValue,
} from '../utils/data/numeric';
import type { StatusMap } from '../utils/data/status';

/** 单元格内容的对齐 */
export interface ColumnAligns {
  /** 起始边（默认）：文字 */
  start: unknown;
  /** 居中：状态、图标 */
  center: unknown;
  /** 结束边：数字、金额，方便对比位数 */
  end: unknown;
}

/** 列的值类型：不写 cell 时按它格式化（跟随语言），数字类默认靠结束边对齐 */
export interface ColumnTypes {
  /** 文字：原样显示 */
  text: unknown;
  /** 数字：按语言分组，1234.5 → 1,234.5 */
  number: unknown;
  /** 金额，语言的币种：19.9 → ¥19.90 */
  currency: unknown;
  /** 百分比：0.125 → 12.5% */
  percent: unknown;
  /** 文件大小（字节）：1234567 → 1.2 MB */
  fileSize: unknown;
  /** 日期：Date、DateValue 或 ISO 字符串 */
  date: unknown;
  /** 日期与时间 */
  dateTime: unknown;
}

/** 固定在哪一侧（横向滚动时不动） */
export interface ColumnStickies {
  /** 起始边：名称、编号 */
  start: unknown;
  /** 结束边：操作 */
  end: unknown;
}

/** 一列 */
export interface DataTableColumn<T> {
  /** 列的标识：同一表格里不能重复；不写 value 时也是取值的字段名 */
  key: string;
  /** 表头内容 */
  header: VNodeChild;
  /** 单元格内容；不写时按 type 格式化 value */
  cell?: (row: T, index: number) => VNodeChild;
  /** 值的类型：决定默认的格式与对齐；不写时按第一个非空值推断（数字 → number，日期 → date，其余 text） */
  type?: keyof ColumnTypes;
  /**
   * 数字类（number、currency、percent）的格式，与 type 的默认格式合并：
   * 金额以万元显示写 `{ scale: 10_000, maximumFractionDigits: 2 }`（单位写在表头里），美元写 `{ currency: 'USD' }`
   */
  format?: NumericFormat;
  /** 排序用的值；不写时取 row[key] */
  value?: (row: T) => SortValue;
  /** 宽度（px）；不写时与其他没写宽度的列平分剩余宽度。固定列一定要写（偏移量按它算） */
  width?: number;
  /**
   * 最小宽度（px）：拖动调整宽度时不能更窄，默认 COLUMN_MIN_WIDTH（64）；
   * 没写宽度的列按它（默认 COLUMN_FLEX_MIN_WIDTH）算表格的最小宽度，放不下时横向滚动而不是继续压窄
   */
  minWidth?: number;
  /** 对齐；默认数字类（number、currency、percent、fileSize）靠 end，其余 start */
  align?: keyof ColumnAligns;
  /** 可以点表头排序 */
  sortable?: boolean;
  /** 固定在哪一侧 */
  sticky?: keyof ColumnStickies;
  /** 可以拖动调整宽度；不写时跟随表格的 resizable */
  resizable?: boolean;
  /** 内容可以换行；默认一行显示不下时省略 */
  wrap?: boolean;
  /** 没有值（null、undefined、空字符串）时显示的内容，如“待定价”；默认语言包的 emptyValue（—） */
  empty?: VNodeChild;
  /** 状态映射（createStatusMap）：值是状态的 key，显示成 StatusBadge；写了 cell 时以 cell 为准 */
  statuses?: StatusMap;
  /**
   * 合计行里这一列的内容：`'sum'` 把这一列的数值精确相加（有 Decimal 时按 Decimal），按列的类型与 format 显示；
   * 也可以是函数，拿到全部行（如平均值、“3 项待定价”）。有一列写了 summary，表格底部就多一行吸底的合计
   */
  summary?: 'sum' | ((rows: readonly T[]) => VNodeChild);
}

/** 分组表头：相邻的几列上方共用一个标题（如“测算”下的 A、B、D 值）；只分一层 */
export interface DataTableColumnGroup {
  /** 组的标识 */
  key: string;
  /** 组标题 */
  header: VNodeChild;
  /** 组里各列的 key：要相邻，显示顺序随列定义 */
  columns: readonly string[];
}

/** 表头第一行的一格：一个分组（跨组里的几列），或没有分组的一列（跨两行） */
export type HeaderLayoutCell<T> =
  | { kind: 'group'; group: DataTableColumnGroup; columns: DataTableColumn<T>[] }
  | { kind: 'column'; column: DataTableColumn<T> };

/**
 * 按分组排出表头第一行：隐藏了的列不算，组里的列全隐藏时这一组也不显示；
 * 组里的列被别的列隔开时，后一段另起一格、重复组标题
 */
export function headerLayout<T>(
  columns: readonly DataTableColumn<T>[],
  groups: readonly DataTableColumnGroup[],
): HeaderLayoutCell<T>[] {
  const groupOf = new Map<string, DataTableColumnGroup>();
  for (const group of groups) for (const key of group.columns) groupOf.set(key, group);
  const cells: HeaderLayoutCell<T>[] = [];
  for (const column of columns) {
    const group = groupOf.get(column.key);
    const last = cells.at(-1);
    if (!group) cells.push({ kind: 'column', column });
    else if (last?.kind === 'group' && last.group === group) last.columns.push(column);
    else cells.push({ kind: 'group', group, columns: [column] });
  }
  return cells;
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
export type ColumnWidthOf<T> = (column: DataTableColumn<T>) => number | undefined;

/** 固定列的偏移（px），按列的 key 取 */
export interface StickyOffsets {
  /** 固定在起始边的列 */
  start: Map<string, number>;
  /** 固定在结束边的列 */
  end: Map<string, number>;
  /** 起始边固定列里最靠里的一列（挨着滚动的列，画分隔线） */
  startEdge?: string;
  /** 结束边固定列里最靠里的一列 */
  endEdge?: string;
}

/** 固定列的偏移（px）：起始边的从 leading（勾选列的宽度）之后累加，结束边的从末尾往回累加 */
export function stickyOffsets<T>(
  columns: readonly DataTableColumn<T>[],
  widthOf: ColumnWidthOf<T>,
  leading: number,
): StickyOffsets {
  const accumulate = (
    side: 'start' | 'end',
    ordered: readonly DataTableColumn<T>[],
    from: number,
  ) => {
    const offsets = new Map<string, number>();
    let offset = from;
    for (const column of ordered) {
      if (column.sticky !== side) continue;
      offsets.set(column.key, offset);
      offset += widthOf(column) ?? COLUMN_FLEX_MIN_WIDTH;
    }
    return offsets;
  };
  const start = accumulate('start', columns, leading);
  const end = accumulate('end', [...columns].reverse(), 0);
  // Map 按插入顺序：最后插入的就是最靠里的
  return { start, end, startEdge: [...start.keys()].at(-1), endEdge: [...end.keys()].at(-1) };
}

/** 两组固定列的偏移是否相同（列与偏移都一样） */
export function sameStickyOffsets(a: StickyOffsets, b: StickyOffsets): boolean {
  const sameMap = (x: Map<string, number>, y: Map<string, number>) =>
    x.size === y.size && [...x].every(([key, offset]) => y.get(key) === offset);
  return (
    a.startEdge === b.startEdge &&
    a.endEdge === b.endEdge &&
    sameMap(a.start, b.start) &&
    sameMap(a.end, b.end)
  );
}

/** 表格的最小宽度（px）：写了宽度的列按宽度，没写的按 minWidth 或 COLUMN_FLEX_MIN_WIDTH；放不下时横向滚动 */
export function tableMinWidth<T>(
  columns: readonly DataTableColumn<T>[],
  widthOf: ColumnWidthOf<T>,
  leading: number,
): number {
  return columns.reduce(
    (total, column) => total + (widthOf(column) ?? column.minWidth ?? COLUMN_FLEX_MIN_WIDTH),
    leading,
  );
}

/** 列在这一行的值：value 函数，或 row[key] */
export function columnValue<T>(column: DataTableColumn<T>, row: T): SortValue {
  if (column.value) return column.value(row);
  return (row as Record<string, SortValue>)[column.key];
}

const NUMERIC_TYPES = new Set<keyof ColumnTypes>(['number', 'currency', 'percent', 'fileSize']);

/**
 * 列的值类型：写了 type 用它；写了数字格式（format）、或合计是 'sum' 的是数字列（这一页全是空值时也靠结束边对齐）；
 * 否则看第一个非空值（ISO 字符串不猜，算文字）
 */
export function columnType<T>(column: DataTableColumn<T>, rows: Iterable<T>): keyof ColumnTypes {
  if (column.type) return column.type;
  if (column.format || column.summary === 'sum') return 'number';
  for (const row of rows) {
    const value = columnValue(column, row);
    if (value == null) continue;
    if (isNumeric(value)) return 'number';
    return value instanceof Date || isDateValue(value) ? 'date' : 'text';
  }
  return 'text';
}

/** 列的对齐：写了 align 用它，数字类靠结束边方便对比位数 */
export function columnAlign(type: keyof ColumnTypes): keyof ColumnAligns {
  return NUMERIC_TYPES.has(type) ? 'end' : 'start';
}

/** 没写 cell 时单元格的文字：按值类型与当前语言格式化；值与类型对不上（数字列里的文字）时原样显示 */
export function formatCell(
  value: SortValue,
  type: keyof ColumnTypes,
  format: ReturnType<typeof useFormat>,
  options?: NumericFormat,
): string {
  if (value == null) return '';
  // 接口常把金额给成十进制字符串（'19.90'）：能读成数字的字符串也按数字格式化，且不经过浮点
  const numeric = isNumeric(value) || isNumericText(value);
  if (numeric && type === 'number') return format.number(value, options);
  if (numeric && type === 'currency')
    return format.number(value, { style: 'currency', ...options });
  if (numeric && type === 'percent')
    return format.number(value, { style: 'percent', maximumFractionDigits: 1, ...options });
  if (typeof value === 'number' && type === 'fileSize') return format.fileSize(value);
  const date = value instanceof Date || isDateValue(value) || typeof value === 'string';
  if (date && type === 'date') return format.date(value);
  if (date && type === 'dateTime')
    return format.date(value, { dateStyle: 'medium', timeStyle: 'short' });
  return String(value);
}

/**
 * 一列数值的合计：跳过空值与不是数字的值；有 Decimal 时用它的构造函数精确相加，全是 bigint 时整数相加，
 * 接口给的十进制字符串（'19.90'）按数字算。没有任何数值时为 null
 */
export function sumColumn<T>(column: DataTableColumn<T>, rows: Iterable<T>): NumericValue | null {
  const values: NumericValue[] = [];
  let kind: NumericKind | undefined;
  for (const row of rows) {
    const value = columnValue(column, row);
    const numeric = isNumeric(value) ? value : isNumericText(value) ? Number(value) : null;
    if (numeric == null) continue;
    values.push(numeric);
    // 有 Decimal 就按 Decimal；否则全是 bigint 才按 bigint
    if (isDecimal(numeric)) kind = numericKind(numeric);
    else if (kind === undefined) kind = typeof numeric === 'bigint' ? 'bigint' : 'number';
    else if (kind === 'bigint' && typeof numeric !== 'bigint') kind = 'number';
  }
  if (values.length === 0 || kind === undefined) return null;
  return values.reduce<NumericValue>((total, value) => addNumeric(total, value, kind!), 0);
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
  columns: readonly DataTableColumn<T>[],
  sort: SortState | null | undefined,
  locale: string,
): readonly T[] {
  const column = sort && columns.find((item) => item.key === sort.key);
  if (!sort || !column) return rows;
  // 数字类的列里，十进制字符串（'2.5'、'2.10'）按数值排：按文字比较时 '2.5' 会排在 '2.10' 前面
  const numeric = NUMERIC_TYPES.has(columnType(column, rows));
  return sortByValue(
    rows,
    (row) => {
      const value = columnValue(column, row);
      return numeric && isNumericText(value) ? Number(value) : value;
    },
    sort.direction,
    locale,
  );
}
