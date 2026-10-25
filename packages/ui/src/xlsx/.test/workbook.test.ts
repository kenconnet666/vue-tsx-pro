// @vitest-environment node
// （happy-dom 的 Blob 读出的 ArrayBuffer 与 JSZip 不在一个 realm，instanceof 判断不认；这里不需要 DOM）
// Excel 读写：导出的分组表头是合并单元格、数字是数值、合计行；读回时多行表头连成“组 / 列”、合并单元格展开、换行拆行；
// CSV 的解析（引号、换行、BOM）与 sheetFromMatrix 的表头去重
import { Workbook } from 'exceljs';
import { describe, expect, it } from 'vitest';
import { createStatusMap } from '../../utils/data/status';
import type { DataTableColumn } from '../../table/columns';
import { parseCsv, sheetFromMatrix } from '../../table/sheet';
import { readXlsx, tableToXlsx } from '../workbook';

interface Saving {
  code: string;
  team: string;
  target: number;
  actual: number;
  status: string;
}

const statuses = createStatusMap({
  verifying: { label: '验证中', tone: 'accent' },
  done: { label: '已验收', tone: 'success' },
});

const rows: Saving[] = [
  { code: 'PO-01', team: '研发', target: 155_353.2, actual: 120_000, status: 'verifying' },
  { code: 'JY-02', team: '生产', target: 86_400, actual: 90_000, status: 'done' },
];

const columns: DataTableColumn<Saving>[] = [
  { key: 'code', header: '编号', width: 120 },
  { key: 'team', header: '团队' },
  { key: 'target', header: '目标', type: 'currency', summary: 'sum', format: { scale: 10_000 } },
  { key: 'actual', header: '实际', type: 'currency', summary: 'sum', format: { scale: 10_000 } },
  { key: 'status', header: '状态', statuses },
];

const groups = [{ key: 'saving', header: '收益（万元）', columns: ['target', 'actual'] }];

describe('tableToXlsx', () => {
  it('分组表头两行：组标题横向合并、没分组的列上下合并；数字按 scale 换算、带数字格式；状态写名字；合计行', async () => {
    const buffer = await tableToXlsx([{ name: '台账', rows, columns, groups }]);
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('台账')!;
    expect(sheet.getCell('C1').value).toBe('收益（万元）');
    expect(sheet.getCell('D1').master.address).toBe('C1');
    expect(sheet.getCell('A2').master.address).toBe('A1');
    expect(sheet.getCell('C2').value).toBe('目标');
    expect(sheet.getCell('C3').value).toBeCloseTo(15.53532);
    expect(sheet.getColumn(3).numFmt).toBe('"¥"#,##0.00');
    expect(sheet.getCell('E3').value).toBe('验证中');
    expect(sheet.getCell('A5').value).toBe('合计');
    expect(sheet.getCell('C5').value).toBeCloseTo(24.17532);
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 2 });
  });
});

describe('readXlsx', () => {
  it('读回：多行表头连成“组 / 列”，合并单元格展开到每一格，换行拆行', async () => {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('报价');
    sheet.addRow(['供应商', '报价', '报价', '零件号']);
    sheet.addRow(['供应商', '单价', '数量', '零件号']);
    sheet.addRow(['华辰', 12.5, 40, 'P-001\nP-002']);
    sheet.addRow([null, 8, 80, 'P-003']);
    sheet.mergeCells('A1:A2');
    sheet.mergeCells('B1:C1');
    sheet.mergeCells('D1:D2');
    // 上下合并的供应商：第 4 行也是华辰
    sheet.mergeCells('A3:A4');
    const file = new Blob([await workbook.xlsx.writeBuffer()]);
    const [table] = await readXlsx(file, { headerRows: 2, splitLines: ['零件号'] });
    expect(table!.headers).toEqual(['供应商', '报价 / 单价', '报价 / 数量', '零件号']);
    expect(table!.rows).toEqual([
      { 供应商: '华辰', '报价 / 单价': 12.5, '报价 / 数量': 40, 零件号: 'P-001' },
      { 供应商: '华辰', '报价 / 单价': 12.5, '报价 / 数量': 40, 零件号: 'P-002' },
      { 供应商: '华辰', '报价 / 单价': 8, '报价 / 数量': 80, 零件号: 'P-003' },
    ]);
  });
});

describe('CSV 与 sheetFromMatrix', () => {
  it('parseCsv：引号里的逗号与换行、两个引号、CRLF、开头的 BOM', () => {
    expect(parseCsv('\uFEFF名称,备注\r\n"支架, 左","第一行\n第二行"\r\n"说""明",x')).toEqual([
      ['名称', '备注'],
      ['支架, 左', '第一行\n第二行'],
      ['说"明', 'x'],
    ]);
  });

  it('sheetFromMatrix：重复的标题加序号、没标题的列有名字、全空的行去掉', () => {
    const table = sheetFromMatrix('导入', [
      ['备注', '备注', ''],
      ['a', 'b', 'c'],
      ['', null, ' '],
    ]);
    expect(table.headers).toEqual(['备注', '备注 2', '第 3 列']);
    expect(table.rows).toEqual([{ 备注: 'a', '备注 2': 'b', '第 3 列': 'c' }]);
  });
});
