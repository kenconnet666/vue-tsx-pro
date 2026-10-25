// pivot 与 PivotTable：多级行维度、列维度的顺序、各种聚合、合计；Decimal 精确求和；多级行合并、热力着色、空格子
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { mount, styleTextOf } from '../../utils/.test/mount';
import { pivot } from '../pivot';
import { PivotTable } from '../PivotTable';

const records = [
  { region: '华东', supplier: '华辰', quarter: 'Q2', amount: new Decimal('0.1') },
  { region: '华东', supplier: '华辰', quarter: 'Q1', amount: new Decimal('0.2') },
  { region: '华东', supplier: '恒远', quarter: 'Q2', amount: new Decimal('1.5') },
  { region: '华南', supplier: '粤海', quarter: 'Q1', amount: new Decimal('3') },
  { region: '华南', supplier: '粤海', quarter: 'Q1', amount: new Decimal('4') },
];

describe('pivot', () => {
  it('行按各级排序、列按值排序；每格聚合、行列合计与总计（Decimal 精确）', () => {
    const result = pivot(records, {
      rows: [(r) => r.region, (r) => r.supplier],
      columns: (r) => r.quarter,
      value: (r) => r.amount,
      // 默认的比较跟着运行环境的区域设置：测试固定成中文
      compare: (a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }),
    });
    // 文字按拼音：恒（heng）在华（hua）前面
    expect(result.rowKeys).toEqual([
      ['华东', '恒远'],
      ['华东', '华辰'],
      ['华南', '粤海'],
    ]);
    expect(result.columnKeys).toEqual(['Q1', 'Q2']);
    expect(String(result.cell(['华南', '粤海'], 'Q1'))).toBe('7');
    expect(result.cell(['华东', '恒远'], 'Q1')).toBeNull();
    expect(String(result.rowTotal(['华东', '华辰']))).toBe('0.3');
    expect(String(result.columnTotal('Q2'))).toBe('1.6');
    expect(String(result.grandTotal)).toBe('8.8');
    expect(result.extent).toEqual([0.1, 7]);
  });

  it('order 决定顺序，没列出的排在后面；count、avg、min、max', () => {
    const base = { rows: [(r: (typeof records)[number]) => r.region] };
    const ordered = pivot(records, { ...base, rowOrder: [['华南']] });
    expect(ordered.rowKeys).toEqual([['华南'], ['华东']]);
    expect(pivot(records, { ...base, aggregate: 'count' }).cell(['华东'], '')).toBe(3);
    const value = (r: (typeof records)[number]) => r.amount;
    expect(pivot(records, { ...base, value, aggregate: 'avg' }).cell(['华南'], '')).toBe(3.5);
    expect(String(pivot(records, { ...base, value, aggregate: 'min' }).cell(['华东'], ''))).toBe(
      '0.1',
    );
    expect(String(pivot(records, { ...base, value, aggregate: 'max' }).grandTotal)).toBe('4');
  });
});

describe('PivotTable', () => {
  it('表头是行维度、各列与合计；相同的上级合并；合计行与合计列；空格子是 —', () => {
    const root = mount(() => (
      <PivotTable
        aria-label="销售"
        data={records}
        rows={[
          { key: 'region', header: '区域' },
          { key: 'supplier', header: '供应商' },
        ]}
        columns={{ key: 'quarter', header: '季度' }}
        value={{ key: 'amount', header: '金额', format: { minimumFractionDigits: 1 } }}
      />
    ));
    expect([...root.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      '区域',
      '供应商',
      'Q1',
      'Q2',
      '合计',
    ]);
    const rows = [...root.querySelectorAll('tbody tr')];
    expect(rows[0]!.querySelector('td')!.getAttribute('rowspan')).toBe('2');
    expect([...rows[0]!.querySelectorAll('td')].map((td) => td.textContent)).toEqual([
      '华东',
      '恒远',
      '—',
      '1.5',
      '1.5',
    ]);
    expect(root.querySelector('tfoot')!.textContent).toBe('合计7.21.68.8');
  });

  it('heatmap：有值的格子按比例着色，空格子与合计不着色', () => {
    const root = mount(() => (
      <PivotTable
        aria-label="销售"
        data={records}
        rows={[{ key: 'region', header: '区域' }]}
        columns={{ key: 'quarter', header: '季度' }}
        value={{ key: 'amount', header: '金额' }}
        heatmap
      />
    ));
    const cells = [...root.querySelectorAll('tbody tr')[0]!.querySelectorAll('td')];
    // 华东：Q1 0.2、Q2 1.6、合计
    const styled = cells.map((td) => styleTextOf(td));
    expect(styled[1]).toContain('color-mix');
    expect(styled[2]).toContain('color-mix');
    expect(styled[3]).not.toContain('color-mix');
  });
});
