// 筛选本地数据：matchesCondition 按条件筛表格的行（同一份条件也能交给后端，结果一致）；
// maxDepth={1} 不能加组，只有一层“全部满足 / 任一满足”的条件，size="sm" 用小一档的控件
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  ConditionBuilder,
  DataTable,
  Flex,
  matchesCondition,
  Small,
  type Condition,
  type ConditionField,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';

interface Order {
  id: string;
  supplier: string;
  category: string;
  amount: number;
  delivery: string;
}

const orders: Order[] = [
  { id: 'PO-1031', supplier: '华东钢铁', category: '钢材', amount: 128000, delivery: '2026-11-03' },
  { id: 'PO-1032', supplier: '西南铝业', category: '铝材', amount: 86500, delivery: '2026-11-12' },
  { id: 'PO-1033', supplier: '华东钢铁', category: '钢材', amount: 42000, delivery: '2026-10-28' },
  {
    id: 'PO-1034',
    supplier: '精工紧固件',
    category: '紧固件',
    amount: 6800,
    delivery: '2026-11-01',
  },
  { id: 'PO-1035', supplier: '北方检测', category: '服务', amount: 15000, delivery: '2026-12-15' },
  { id: 'PO-1036', supplier: '西南铝业', category: '铝材', amount: 213000, delivery: '2026-12-02' },
];

const fields: ConditionField[] = [
  { name: 'supplier', label: '供应商', type: 'text' },
  {
    name: 'category',
    label: '品类',
    type: 'select',
    options: ['钢材', '铝材', '紧固件', '服务'].map((name) => ({ value: name, label: name })),
  },
  { name: 'amount', label: '金额', type: 'number' },
  { name: 'delivery', label: '交货日期', type: 'date' },
];

const columns: DataTableColumn<Order>[] = [
  { key: 'id', header: '订单号', width: 100 },
  { key: 'supplier', header: '供应商', width: 120 },
  { key: 'category', header: '品类', width: 80 },
  { key: 'amount', header: '金额（元）', width: 120, format: { maximumFractionDigits: 0 } },
  { key: 'delivery', header: '交货日期', width: 120 },
];

export default _component(() => {
  let condition = _state<Condition | null>({
    all: [{ field: 'amount', op: 'gte', value: 40000 }],
  });
  const rows = _derived(
    condition ? orders.filter((order) => matchesCondition(condition!, order)) : orders,
  );
  return () => (
    <Flex direction="column" gap="md">
      <ConditionBuilder
        fields={fields}
        _value={condition}
        maxDepth={1}
        size="sm"
        aria-label="订单筛选条件"
      />
      <Small tone="muted">
        {rows.length} / {orders.length} 张订单
      </Small>
      <DataTable rows={rows} columns={columns} getKey={(order) => order.id} aria-label="订单" />
    </Flex>
  );
});
