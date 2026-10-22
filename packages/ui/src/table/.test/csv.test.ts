// tableToCsv：表头取列标题文字；单元格同表格里看到的文字（状态名、金额与日期格式）；转义；防公式注入；BOM；raw
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { useFormat } from '../../config/lang/format';
import { createStatusMap } from '../../utils/data/status';
import type { DataTableColumn } from '../columns';
import { tableToCsv } from '../csv';

interface Task {
  code: string;
  name: string;
  amount: Decimal;
  due: string;
  status: string;
}

const statuses = createStatusMap({ doing: { label: '执行中', tone: 'info' } });
const columns: DataTableColumn<Task>[] = [
  { key: 'code', header: '编码' },
  { key: 'name', header: '名称' },
  { key: 'amount', header: '金额', format: { minimumFractionDigits: 2 } },
  { key: 'due', header: '计划完成', type: 'date' },
  { key: 'status', header: '状态', statuses },
];
const rows: Task[] = [
  {
    code: 'T-1',
    name: '支架, "A" 型',
    amount: new Decimal('-1234.5'),
    due: '2026-10-21',
    status: 'doing',
  },
  {
    code: 'T-2',
    name: '=HYPERLINK("x")',
    amount: new Decimal('12'),
    due: '2026-10-22',
    status: 'doing',
  },
];
const BOM = String.fromCharCode(0xfeff);

describe('tableToCsv', () => {
  it('开头带 BOM，CRLF 分行；表头是列标题，单元格同表格里的文字', () => {
    const csv = tableToCsv(rows, columns, useFormat());
    expect(csv.startsWith(BOM)).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('编码,名称,金额,计划完成,状态');
    expect(lines[1]).toBe('T-1,"支架, ""A"" 型","-1,234.50",2026年10月21日,执行中');
  });

  it("文字列里以 = 开头的内容前面加 '（防公式注入）；负数金额不受影响", () => {
    const lines = tableToCsv(rows, columns, useFormat(), { bom: false }).split('\r\n');
    expect(lines[2]!.split(',')[1]).toBe('"\'=HYPERLINK(""x"")"');
    expect(lines[1]).toContain('"-1,234.50"');
  });

  it('groups：组里的列表头写成“组标题 / 列标题”', () => {
    const csv = tableToCsv(rows, columns, useFormat(), {
      bom: false,
      groups: [{ key: 'plan', header: '计划', columns: ['amount', 'due'] }],
    });
    expect(csv.split('\r\n')[0]).toBe('编码,名称,计划 / 金额,计划 / 计划完成,状态');
  });

  it('raw：数值导出原值（不带千分位），日期字符串原样', () => {
    const lines = tableToCsv(rows, columns, useFormat(), { bom: false, raw: true }).split('\r\n');
    expect(lines[1]).toBe('T-1,"支架, ""A"" 型",-1234.5,2026-10-21,执行中');
  });
});
