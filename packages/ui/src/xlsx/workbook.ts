/**
 * Excel 读写（子路径 `@vue-tsx-pro/ui/xlsx`）：建在 ExcelJS 上（可选的 peer 依赖，用到这个子路径时安装 exceljs）。
 *
 *   import { exportXlsx, readXlsx } from '@vue-tsx-pro/ui/xlsx';
 *   await exportXlsx('销售台账', [{ name: '台账', rows, columns, groups: columnGroups }]);
 *   const [sheet] = await readXlsx(file, { headerRows: 2, splitLines: ['零件号'] });
 *
 * 导出（tableToXlsx / exportXlsx）用 DataTable 的列定义：
 * - 分组表头（groups，同 DataTable 的 columnGroups）导出成两行表头，组标题横向合并，没分组的列上下合并；表头冻结在顶上；
 * - 数字、金额、百分比、日期是真正的数值与日期（带 Excel 的数字格式，能再计算），金额按列的 format.scale 换算（万元）；
 *   状态列写状态名；列写了 summary: 'sum' 时底部多一行合计；列宽按列定义的 width 换算。
 * 读取（readXlsx）把每张工作表变成 SheetTable（table/sheet.ts）：
 * - 合并单元格展开：被合并的格拿到左上角的值（上下合并的“供应商”每一行都有）；
 * - 多行表头（headerRows）连成“组 / 列”；公式取结果，富文本、链接取文字；
 * - splitLines：这些列的单元格里有换行时拆成几行。
 */
import { Workbook, type CellValue, type Worksheet } from 'exceljs';
import { plainText } from '../utils/data/text';
import { downloadFile } from '../utils/dom/download';
import {
  columnType,
  columnValue,
  headerLayout,
  sumColumn,
  type ColumnTypes,
  type DataTableColumn,
  type DataTableColumnGroup,
} from '../table/columns';
import {
  sheetFromMatrix,
  type SheetMatrixOptions,
  type SheetTable,
  type SheetValue,
} from '../table/sheet';
import type { SortValue } from '../utils/data/collation';

/** 导出的一张工作表 */
export interface XlsxSheet<T> {
  /** 工作表名（Excel 限 31 个字，不能有 \ / ? * [ ]） */
  name: string;
  /** 数据 */
  rows: readonly T[];
  /** 列定义（同 DataTable；只导出要的列时先筛掉操作列） */
  columns: readonly DataTableColumn<T>[];
  /** 分组表头（同 DataTable 的 columnGroups）：导出成两行表头，组标题横向合并 */
  groups?: readonly DataTableColumnGroup[];
}

/** 导出的选项 */
export interface XlsxExportOptions {
  /** 金额列的币种（ISO 4217），默认 CNY；跟随语言时传 lang.currency */
  currency?: string;
  /** 金额符号按哪种语言取，默认 zh-CN */
  locale?: string;
  /** 合计行第一列的文字，默认“合计” */
  summaryLabel?: string;
}

/** 读取的选项 */
export interface XlsxReadOptions extends SheetMatrixOptions {
  /** 只读这些工作表（名字）；默认全部 */
  sheets?: readonly string[];
}

/** Excel 的数字格式：按列的类型与 format */
function numberFormat(
  type: keyof ColumnTypes,
  column: DataTableColumn<unknown>,
  symbol: string,
): string | undefined {
  const digits = column.format?.maximumFractionDigits;
  const decimals = (count: number) => (count > 0 ? `.${'0'.repeat(count)}` : '');
  if (type === 'currency') return `"${symbol}"#,##0${decimals(digits ?? 2)}`;
  if (type === 'percent') return `0${decimals(digits ?? 1)}%`;
  if (type === 'number') return digits == null ? '#,##0.########' : `#,##0${decimals(digits)}`;
  if (type === 'date') return 'yyyy-mm-dd';
  if (type === 'dateTime') return 'yyyy-mm-dd hh:mm';
  return undefined;
}

/** 日期值（Date、ISO 字符串、@internationalized/date 的日期）→ Excel 的日期（按 UTC 写，打开时不偏一天） */
function toExcelDate(value: SortValue): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value);
    if (!match) return undefined;
    const [, y, m, d, hh = '0', mm = '0'] = match;
    return new Date(Date.UTC(+y!, +m! - 1, +d!, +hh, +mm));
  }
  if (value && typeof value === 'object' && 'year' in value && 'month' in value && 'day' in value) {
    const date = value as unknown as {
      year: number;
      month: number;
      day: number;
      hour?: number;
      minute?: number;
    };
    return new Date(
      Date.UTC(date.year, date.month - 1, date.day, date.hour ?? 0, date.minute ?? 0),
    );
  }
  return undefined;
}

/** 一格要写进 Excel 的值：数字类转成数（按 scale 换算），日期转成日期，状态写名字，其余是文字 */
function cellValue<T>(
  column: DataTableColumn<T>,
  type: keyof ColumnTypes,
  value: SortValue,
): CellValue {
  if (value == null || value === '') return null;
  if (column.statuses && typeof value === 'string') return column.statuses.label(value);
  if (type === 'number' || type === 'currency' || type === 'percent' || type === 'fileSize') {
    const number = Number(typeof value === 'object' ? String(value) : value);
    if (Number.isNaN(number)) return String(value);
    return column.format?.scale ? number / column.format.scale : number;
  }
  if (type === 'date' || type === 'dateTime') return toExcelDate(value) ?? String(value);
  if (typeof value === 'boolean') return value;
  return String(value);
}

/** 表头：有分组时两行（组标题横向合并，没分组的列上下合并），否则一行；返回表头的行数 */
function writeHeader<T>(
  sheet: Worksheet,
  columns: readonly DataTableColumn<T>[],
  groups: readonly DataTableColumnGroup[],
): number {
  const titleOf = (column: DataTableColumn<T>) => plainText(column.header) ?? column.key;
  const layout = headerLayout(columns, groups);
  const grouped = layout.some((cell) => cell.kind === 'group');
  if (!grouped) {
    sheet.addRow(columns.map(titleOf));
    return 1;
  }
  const top: string[] = [];
  const bottom: string[] = [];
  const merges: [number, number, number, number][] = [];
  for (const cell of layout) {
    const start = top.length + 1;
    if (cell.kind === 'column') {
      top.push(titleOf(cell.column));
      bottom.push(titleOf(cell.column));
      merges.push([1, start, 2, start]);
    } else {
      const title = plainText(cell.group.header) ?? cell.group.key;
      for (const column of cell.columns) {
        top.push(title);
        bottom.push(titleOf(column));
      }
      if (cell.columns.length > 1) merges.push([1, start, 1, start + cell.columns.length - 1]);
    }
  }
  sheet.addRow(top);
  sheet.addRow(bottom);
  for (const [r1, c1, r2, c2] of merges) sheet.mergeCells(r1, c1, r2, c2);
  return 2;
}

/** 表 → .xlsx 文件的内容（ArrayBuffer）；下载用 exportXlsx */
export async function tableToXlsx<T>(
  sheets: readonly XlsxSheet<T>[],
  { currency = 'CNY', locale = 'zh-CN', summaryLabel = '合计' }: XlsxExportOptions = {},
): Promise<ArrayBuffer> {
  const symbol =
    new Intl.NumberFormat(locale, { style: 'currency', currency })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? currency;
  const workbook = new Workbook();
  for (const { name, rows, columns, groups = [] } of sheets) {
    const sheet = workbook.addWorksheet(name.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
    const types = columns.map((column) => columnType(column, rows));
    const headerRows = writeHeader(sheet, columns, groups);
    for (const row of rows)
      sheet.addRow(
        columns.map((column, index) => cellValue(column, types[index]!, columnValue(column, row))),
      );
    if (columns.some((column) => column.summary === 'sum')) {
      const summary = sheet.addRow(
        columns.map((column, index) => {
          if (column.summary === 'sum') {
            const total = sumColumn(column, rows);
            return total == null ? null : cellValue(column, types[index]!, total as SortValue);
          }
          return index === 0 ? summaryLabel : null;
        }),
      );
      summary.font = { bold: true };
    }
    // 格式：表头加粗、浅灰底、居中，冻结在顶上；各列的数字格式与宽度
    for (let index = 1; index <= headerRows; index++) {
      const header = sheet.getRow(index);
      header.font = { bold: true };
      header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      header.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F3F5' } };
      });
    }
    sheet.views = [{ state: 'frozen', ySplit: headerRows }];
    columns.forEach((column, index) => {
      const target = sheet.getColumn(index + 1);
      const format = numberFormat(types[index]!, column as DataTableColumn<unknown>, symbol);
      if (format) target.numFmt = format;
      const title = plainText(column.header) ?? column.key;
      target.width = column.width
        ? Math.round(column.width / 7)
        : Math.max(10, title.length * 2 + 4);
    });
  }
  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

/** 导出并下载 .xlsx：fileName 不带扩展名时自动加上 */
export async function exportXlsx<T>(
  fileName: string,
  sheets: readonly XlsxSheet<T>[],
  options?: XlsxExportOptions,
): Promise<void> {
  const content = await tableToXlsx(sheets, options);
  const name = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  downloadFile(name, content, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/** ExcelJS 的单元格值 → 读进来的值：公式取结果，富文本、链接取文字，错误值当空 */
function readValue(value: CellValue): SheetValue {
  if (value == null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return value;
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('result' in value) return readValue((value.result ?? null) as CellValue);
    if ('text' in value) return String(value.text);
    if ('error' in value) return null;
  }
  // 其余（读不出值的对象）当空
  return null;
}

/** 一张工作表 → 行列矩阵：合并单元格展开（被合并的格拿到左上角的值） */
function sheetMatrix(sheet: Worksheet): SheetValue[][] {
  const matrix: SheetValue[][] = [];
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const cells: SheetValue[] = [];
    for (let c = 1; c <= sheet.columnCount; c++) {
      const cell = row.getCell(c);
      cells.push(readValue(cell.isMerged ? cell.master.value : cell.value));
    }
    matrix.push(cells);
  }
  return matrix;
}

/** 读 .xlsx 文件：每张工作表一个 SheetTable（见文件开头） */
export async function readXlsx(file: Blob, options: XlsxReadOptions = {}): Promise<SheetTable[]> {
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  return workbook.worksheets
    .filter((sheet) => !options.sheets || options.sheets.includes(sheet.name))
    .map((sheet) => sheetFromMatrix(sheet.name, sheetMatrix(sheet), options));
}
