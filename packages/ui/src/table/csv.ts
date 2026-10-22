/**
 * 按列定义把行导出成 CSV（RFC 4180）：表头是列的标题文字，单元格是表格里看到的文字
 * （状态映射显示名字，数字、金额、日期按列的 type 与 format 格式化）；开头带 BOM，Excel 打开中文不乱码。
 *
 *   const format = useFormat();
 *   downloadFile('台账.csv', tableToCsv(rows, columns, format), 'text/csv');
 *
 * 只要导出部分列时先筛 columns（去掉操作列）；raw 时数值、日期导出原值，便于表格软件再计算。
 * 文字列里以 = + - @ 开头的内容前面加 '，打开时不会被当成公式执行（CSV 注入；同 PapaParse 的 escapeFormulae）；
 * 数字、金额、日期列是格式化出来的，不会是公式，负数照常。
 */
import type { useFormat } from '../config/lang/format';
import { isNumeric, isNumericText, numericText } from '../utils/data/numeric';
import { plainText } from '../utils/data/text';
import {
  columnType,
  columnValue,
  formatCell,
  type DataTableColumn,
  type DataTableColumnGroup,
} from './columns';

/** tableToCsv 的选项 */
export interface CsvOptions {
  /** 开头加 BOM（U+FEFF），默认 true：Excel 按 UTF-8 读，中文不乱码 */
  bom?: boolean;
  /** 导出原值，不按列的格式格式化（数值不带千分位、日期是 ISO），默认 false */
  raw?: boolean;
  /** 分组表头（同 DataTable 的 columnGroups）：组里的列的表头写成“组标题 / 列标题”（如“收益（万元）/ 目标”） */
  groups?: readonly DataTableColumnGroup[];
}

/** 行 → CSV 文字（见文件开头） */
export function tableToCsv<T>(
  rows: readonly T[],
  columns: readonly DataTableColumn<T>[],
  format: ReturnType<typeof useFormat>,
  { bom = true, raw = false, groups = [] }: CsvOptions = {},
): string {
  const types = columns.map((column) => columnType(column, rows));
  const header = columns.map((column) => {
    const title = plainText(column.header) ?? column.key;
    const group = groups.find((item) => item.columns.includes(column.key));
    const groupTitle = group && plainText(group.header);
    return guardFormula(groupTitle ? `${groupTitle} / ${title}` : title);
  });
  const lines = rows.map((row) =>
    columns.map((column, index) => {
      const value = columnValue(column, row);
      if (value == null) return '';
      if (column.statuses && typeof value === 'string') return column.statuses.label(value);
      if (isNumeric(value))
        return raw ? numericText(value) : formatCell(value, types[index]!, format, column.format);
      if (raw || types[index] === 'text') return guardFormula(rawText(value));
      return formatCell(value, types[index]!, format, column.format);
    }),
  );
  const text = [header, ...lines].map((line) => line.map(field).join(',')).join('\r\n');
  return bom ? `\uFEFF${text}` : text;
}

/** 原值的文字：日期是 ISO */
const rawText = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value));

/** 文字以 = + - @ 开头（且不是数字）时前面加 '：表格软件不会当成公式执行 */
const guardFormula = (text: string) => {
  // isNumericText 是类型守卫：判断一个 unknown 的副本，text 本身不被收窄成 never
  const value: unknown = text;
  return /^[=+\-@\t\r]/.test(text) && !isNumericText(value) ? `'${text}` : text;
};

/** 一格：含逗号、引号、换行时加引号（引号写两遍） */
const field = (text: string) => (/[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text);
