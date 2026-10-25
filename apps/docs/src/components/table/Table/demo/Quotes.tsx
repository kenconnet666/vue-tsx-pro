// 询价比价单：列定义与 DataTable 相同（金额按语言、状态、空值），供应商与品类上下相同的格合并（mergeRepeated，层层分组）；
// 没报价的行用 cellSpan 把“单价”“小计”合成一格写原因；底部合计（sum 精确相加）
import { _component } from '@vue-tsx-pro/tsx';
import {
  ColumnTable,
  createStatusMap,
  Small,
  useFormat,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';

interface QuoteLine {
  supplier: string;
  category: string;
  part: string;
  quantity: number;
  price: number | null;
  status: 'valid' | 'expiring' | 'missing';
  note?: string;
}

const statuses = createStatusMap({
  valid: { label: '有效', tone: 'success' },
  expiring: { label: '即将过期', tone: 'warning' },
  missing: { label: '未报价', tone: 'neutral' },
});

const lines: QuoteLine[] = [
  {
    supplier: '华辰精密',
    category: '机械件',
    part: '显示器支架',
    quantity: 40,
    price: 128,
    status: 'valid',
  },
  {
    supplier: '华辰精密',
    category: '机械件',
    part: '铰链底座',
    quantity: 80,
    price: 76.5,
    status: 'valid',
  },
  {
    supplier: '华辰精密',
    category: '钣金件',
    part: '检修口盖板',
    quantity: 24,
    price: 212,
    status: 'expiring',
  },
  {
    supplier: '启航塑胶',
    category: '塑料件',
    part: '笔记本电脑',
    quantity: 12,
    price: 1860,
    status: 'valid',
  },
  {
    supplier: '启航塑胶',
    category: '塑料件',
    part: '加强筋',
    quantity: 60,
    price: null,
    status: 'missing',
    note: '工艺评审中，预计 10 月 30 日报价',
  },
  {
    supplier: '远山钣金',
    category: '钣金件',
    part: '检修口盖板',
    quantity: 24,
    price: 198,
    status: 'valid',
  },
];

export default _component(() => {
  const format = useFormat();
  const columns: DataTableColumn<QuoteLine>[] = [
    { key: 'supplier', header: '供应商', summary: () => `${lines.length} 项` },
    { key: 'category', header: '品类' },
    { key: 'part', header: '零件' },
    { key: 'quantity', header: '数量', type: 'number' },
    {
      key: 'price',
      header: '单价',
      type: 'currency',
      align: 'end',
      // 没报价的行写原因（这一格合并了“小计”）
      cell: (line) =>
        line.price == null ? (
          <Small tone="muted">{line.note}</Small>
        ) : (
          format.number(line.price, { style: 'currency' })
        ),
    },
    {
      key: 'subtotal',
      header: '小计',
      type: 'currency',
      value: (line) => (line.price == null ? null : line.price * line.quantity),
      summary: 'sum',
    },
    { key: 'status', header: '状态', statuses },
  ];

  return () => (
    <ColumnTable
      rows={lines}
      columns={columns}
      getKey={(line) => `${line.supplier}-${line.part}`}
      mergeRepeated={['supplier', 'category']}
      // 没报价的行：单价占两列写原因，小计那一格被合并掉
      cellSpan={(line, column) => {
        if (line.price != null) return undefined;
        if (column.key === 'price') return { colSpan: 2 };
        if (column.key === 'subtotal') return { colSpan: 0 };
        return undefined;
      }}
      density="compact"
      aria-label="询价比价单"
    />
  );
});
