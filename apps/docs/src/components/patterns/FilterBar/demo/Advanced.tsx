// 高级筛选：常用的关键字之外，conditionFields 给出能组合的字段，“高级筛选”展开条件构造器（_condition），
// 能写“金额介于、品类是其中之一、或者加急”这类固定条件写不出的组合；收起时下面是一句话的摘要，带“清空”。
// 这里点“查询”时用 matchesCondition 在前端筛，接后端时把同一份条件交给接口
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  DataTable,
  Field,
  Flex,
  matchesCondition,
  Small,
  TextField,
  type Condition,
  type ConditionField,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { FilterBar } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

interface Order {
  id: string;
  supplier: string;
  category: string;
  amount: number;
  urgent: boolean;
  delivery: string;
}

const orders: Order[] = [
  {
    id: 'PO-1031',
    supplier: '华东钢铁',
    category: '钢材',
    amount: 128000,
    urgent: false,
    delivery: '2026-11-03',
  },
  {
    id: 'PO-1032',
    supplier: '西南铝业',
    category: '铝材',
    amount: 86500,
    urgent: true,
    delivery: '2026-11-12',
  },
  {
    id: 'PO-1033',
    supplier: '华东钢铁',
    category: '钢材',
    amount: 42000,
    urgent: false,
    delivery: '2026-10-28',
  },
  {
    id: 'PO-1034',
    supplier: '精工紧固件',
    category: '紧固件',
    amount: 6800,
    urgent: true,
    delivery: '2026-11-01',
  },
  {
    id: 'PO-1035',
    supplier: '北方检测',
    category: '服务',
    amount: 15000,
    urgent: false,
    delivery: '2026-12-15',
  },
  {
    id: 'PO-1036',
    supplier: '西南铝业',
    category: '铝材',
    amount: 213000,
    urgent: false,
    delivery: '2026-12-02',
  },
];

const fields: ConditionField[] = [
  { name: 'amount', label: '金额', type: 'number' },
  {
    name: 'category',
    label: '品类',
    type: 'select',
    options: ['钢材', '铝材', '紧固件', '服务'].map((name) => ({ value: name, label: name })),
  },
  { name: 'urgent', label: '加急', type: 'boolean' },
  { name: 'delivery', label: '交货日期', type: 'date' },
];

const columns: DataTableColumn<Order>[] = [
  { key: 'id', header: '订单号', width: 100 },
  { key: 'supplier', header: '供应商', width: 120 },
  { key: 'category', header: '品类', width: 80 },
  { key: 'amount', header: '金额（元）', width: 120, format: { maximumFractionDigits: 0 } },
  { key: 'urgent', header: '加急', width: 72, value: (order) => (order.urgent ? '是' : '') },
  { key: 'delivery', header: '交货日期', width: 120 },
];

export default _component(() => {
  let keyword = _state('');
  let condition = _state<Condition | null>({
    any: [
      { field: 'amount', op: 'between', value: [50000, 150000] },
      { field: 'urgent', op: 'eq', value: true },
    ],
  });
  let rows = _state.raw(orders);

  function search() {
    const text = keyword.trim();
    rows = orders.filter(
      (order) =>
        (!text || order.id.includes(text) || order.supplier.includes(text)) &&
        (!condition || matchesCondition(condition, order)),
    );
  }
  search();

  return () => (
    <Flex direction="column" gap="md">
      <FilterBar
        aria-label="订单查询"
        onSearch={search}
        onReset={() => {
          keyword = '';
          search();
        }}
        conditionFields={fields}
        _condition={condition}
      >
        <Field label="关键字">
          <TextField _value={keyword} placeholder="订单号、供应商" />
        </Field>
      </FilterBar>
      <Small tone="muted">
        {rows.length} / {orders.length} 张订单
      </Small>
      <DataTable rows={rows} columns={columns} getKey={(order) => order.id} aria-label="订单" />
    </Flex>
  );
});
