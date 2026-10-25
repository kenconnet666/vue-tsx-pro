// ColumnTable：按列定义渲染静态表格（格式化、状态、空值同 DataTable），mergeRepeated 层层合并、cellSpan 合并行列，合计行
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { createStatusMap } from '../../utils/data/status';
import { ColumnTable, repeatedRowSpans } from '../ColumnTable';
import type { DataTableColumn } from '../columns';

interface Quote {
  supplier: string;
  category: string;
  part: string;
  price: number | null;
  status: string;
}

const statuses = createStatusMap({
  valid: { label: '有效', tone: 'success' },
  expired: { label: '已过期', tone: 'neutral' },
});

const quotes: Quote[] = [
  { supplier: '华辰', category: '生产件', part: '支架', price: 120, status: 'valid' },
  { supplier: '华辰', category: '生产件', part: '底座', price: 80, status: 'valid' },
  { supplier: '华辰', category: '钣金件', part: '罩壳', price: null, status: 'expired' },
  { supplier: '启航', category: '钣金件', part: '盖板', price: 45.5, status: 'valid' },
];

const columns: DataTableColumn<Quote>[] = [
  { key: 'supplier', header: '供应商', summary: () => '共 4 项' },
  { key: 'category', header: '品类' },
  { key: 'part', header: '零件' },
  { key: 'price', header: '单价', type: 'currency', summary: 'sum', empty: '待报价' },
  { key: 'status', header: '状态', statuses },
];

describe('ColumnTable', () => {
  it('repeatedRowSpans：相邻相同的合并，后一列不跨前一列的分组', () => {
    const spans = repeatedRowSpans(quotes, columns, ['supplier', 'category']);
    expect(spans.get('supplier')).toEqual([3, 0, 0, 1]);
    // 第 3、4 行都是钣金件，但供应商不同：不合并
    expect(spans.get('category')).toEqual([2, 0, 1, 1]);
  });

  it('格式化同 DataTable：金额按语言、空值显示 empty、状态显示名称；mergeRepeated 写 rowspan、跳过被合并的格；合计行', () => {
    const root = mount(() => (
      <ColumnTable
        rows={quotes}
        columns={columns}
        mergeRepeated={['supplier', 'category']}
        aria-label="报价明细"
      />
    ));
    const rows = [...root.querySelectorAll('tbody tr')];
    expect(rows.map((row) => row.querySelectorAll('td').length)).toEqual([5, 3, 4, 5]);
    const first = rows[0]!.querySelectorAll('td');
    expect(first[0]!.getAttribute('rowspan')).toBe('3');
    expect(first[1]!.getAttribute('rowspan')).toBe('2');
    expect(first[3]!.textContent).toBe('¥120.00');
    expect(rows[2]!.textContent).toContain('待报价');
    expect(rows[2]!.textContent).toContain('已过期');
    const foot = root.querySelector('tfoot tr')!;
    expect(foot.textContent).toContain('共 4 项');
    expect(foot.textContent).toContain('¥245.50');
  });

  it('cellSpan 合并列：被合并的格返回 0 不渲染', () => {
    const root = mount(() => (
      <ColumnTable
        rows={quotes.slice(0, 1)}
        columns={columns}
        cellSpan={(_, column) =>
          column.key === 'category'
            ? { colSpan: 2 }
            : column.key === 'part'
              ? { colSpan: 0 }
              : undefined
        }
        aria-label="报价"
      />
    ));
    const cells = root.querySelectorAll('tbody td');
    expect(cells).toHaveLength(4);
    expect(cells[1]!.getAttribute('colspan')).toBe('2');
  });
});
