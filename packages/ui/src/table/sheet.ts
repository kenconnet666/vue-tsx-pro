/**
 * 读进来的表格（CSV、Excel 的一张工作表）统一成 SheetTable：表头是各列的标题文字，每行是“标题 → 值”。
 * 导入（DataImport）、@zerodep-dev/vue-tsx-pro-ui/xlsx 的 readXlsx 都产出它；CSV 由这里的 readCsvFile 读，不依赖别的库。
 *
 *   const [sheet] = await readCsvFile(file);
 *   sheet.headers   // ['零件号', '名称', '数量']
 *   sheet.rows[0]   // { 零件号: 'P-001', 名称: '支架', 数量: '40' }
 *
 * 从行列矩阵转成表（sheetFromMatrix）时：
 * - 多行表头（headerRows > 1，合并单元格已展开）：同一列各行的标题用“ / ”连接，上下相同的只留一个（“收益（万元）/ 目标”，
 *   与 tableToCsv、exportXlsx 的分组表头一致）；
 * - 全空的行去掉；标题重复时后面的加序号（“备注”“备注 2”）；
 * - splitLines：这些列的单元格里有换行时拆成几行，别的列照抄（一格里写了几个零件号的报价单）。
 */

/** 单元格的值 */
export type SheetValue = string | number | boolean | Date | null;

/** 一行：列标题 → 值 */
export type SheetRow = Record<string, SheetValue>;

/** 一张表 */
export interface SheetTable {
  /** 工作表名（CSV 是文件名） */
  name: string;
  /** 各列的标题，按列的顺序 */
  headers: string[];
  /** 数据行 */
  rows: SheetRow[];
}

/** sheetFromMatrix 的选项 */
export interface SheetMatrixOptions {
  /** 表头占几行，默认 1 */
  headerRows?: number;
  /** 这些列（标题）的单元格里有换行时拆成几行；true 是所有列 */
  splitLines?: boolean | readonly string[];
  /** 没有标题的列叫什么（从 0 起的列号），默认“第 N 列”；跟随语言时传 lang.sheetColumn */
  untitled?: (column: number) => string;
}

/** 一格是不是空的 */
const isBlank = (value: SheetValue | undefined) =>
  value == null || (typeof value === 'string' && value.trim() === '');

/** 行列矩阵（合并单元格已展开）→ 表：表头可以是几行，见文件开头 */
export function sheetFromMatrix(
  name: string,
  matrix: readonly (readonly SheetValue[])[],
  {
    headerRows = 1,
    splitLines = false,
    untitled = (column) => `第 ${column + 1} 列`,
  }: SheetMatrixOptions = {},
): SheetTable {
  const width = Math.max(0, ...matrix.map((row) => row.length));
  const head = matrix.slice(0, headerRows);
  const seen = new Map<string, number>();
  const headers = Array.from({ length: width }, (_, column) => {
    const parts: string[] = [];
    for (const row of head) {
      const text = isBlank(row[column]) ? '' : String(row[column]).trim();
      // 合并单元格展开后上下两行相同（没分组的列跨两行）：只留一个
      if (text && parts.at(-1) !== text) parts.push(text);
    }
    const title = parts.join(' / ') || untitled(column);
    const count = (seen.get(title) ?? 0) + 1;
    seen.set(title, count);
    return count === 1 ? title : `${title} ${count}`;
  });
  const split = (header: string) =>
    splitLines === true || (Array.isArray(splitLines) && splitLines.includes(header));
  const rows = matrix.slice(headerRows).flatMap((cells): SheetRow[] => {
    if (cells.every(isBlank)) return [];
    // 拆行：要拆的列里最多有几行，就拆成几行
    const lines = headers.map((header, column) => {
      const value = cells[column] ?? null;
      return split(header) && typeof value === 'string' && value.includes('\n')
        ? value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        : [value];
    });
    const count = Math.max(1, ...lines.map((values) => values.length));
    return Array.from({ length: count }, (_, line) =>
      Object.fromEntries(
        headers.map((header, column) => {
          const values = lines[column]!;
          return [header, values.length > 1 ? (values[line] ?? null) : (values[0] ?? null)];
        }),
      ),
    );
  });
  return { name, headers, rows };
}

/** CSV 文字 → 行列矩阵（RFC 4180：引号里的逗号、换行、两个引号；开头的 BOM 去掉） */
export function parseCsv(text: string): string[][] {
  const source = text.startsWith('\uFEFF') ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < source.length; index++) {
    const char = source[index]!;
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** 读 CSV 文件：一张表，名字是文件名（去掉扩展名） */
export async function readCsvFile(
  file: Blob & { name?: string },
  options?: SheetMatrixOptions,
): Promise<SheetTable[]> {
  const name = (file.name ?? 'CSV').replace(/\.[^.]+$/, '');
  return [sheetFromMatrix(name, parseCsv(await file.text()), options)];
}
