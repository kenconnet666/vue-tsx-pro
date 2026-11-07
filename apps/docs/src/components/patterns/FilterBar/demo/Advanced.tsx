// 高级筛选：常用的关键字之外，conditionFields 给出能组合的字段，“高级筛选”展开条件构造器（_condition），
// 能写“金额介于、品类是其中之一、或者加急”这类固定条件写不出的组合；收起时下面是一句话的摘要，带“清空”。
// 关键字与能组合的字段写在同一份 schema 里：schemaFilters 生成第一排的条件，schemaConditionFields 给出高级筛选的字段。
// 这里点“查询”时用 matchesCondition 在前端筛，接后端时把同一份条件交给接口
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  DataTable,
  emptyValues,
  Flex,
  matchesCondition,
  schemaConditionFields,
  schemaFilters,
  Small,
  type Condition,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { FilterBar } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { z } from 'zod';

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

const query = z.object({
  keyword: z.string().meta({ title: '关键字', placeholder: '订单号、供应商' }),
  amount: z.number().meta({ title: '金额' }),
  category: z.enum(['钢材', '铝材', '紧固件', '服务']).meta({ title: '品类' }),
  urgent: z.boolean().meta({ title: '加急' }),
  delivery: z.iso.date().meta({ title: '交货日期' }),
});
const fields = schemaConditionFields(query, { omit: ['keyword'] });

const columns: DataTableColumn<Order>[] = [
  { key: 'id', header: '订单号', width: 100 },
  { key: 'supplier', header: '供应商', width: 120 },
  { key: 'category', header: '品类', width: 80 },
  { key: 'amount', header: '金额（元）', width: 120, format: { maximumFractionDigits: 0 } },
  { key: 'urgent', header: '加急', width: 72, value: (order) => (order.urgent ? '是' : '') },
  { key: 'delivery', header: '交货日期', width: 120 },
];

export default _component(() => {
  let filters = _state(emptyValues(query));
  let condition = _state<Condition | null>({
    any: [
      { field: 'amount', op: 'between', value: [50000, 150000] },
      { field: 'urgent', op: 'eq', value: true },
    ],
  });
  let rows = _state.raw(orders);

  function search() {
    const text = filters.keyword.trim();
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
          filters.keyword = '';
          search();
        }}
        conditionFields={fields}
        _condition={condition}
      >
        {schemaFilters(query, filters, { pick: ['keyword'] })}
      </FilterBar>
      <Small tone="muted">
        {rows.length} / {orders.length} 张订单
      </Small>
      <DataTable rows={rows} columns={columns} getKey={(order) => order.id} aria-label="订单" />
    </Flex>
  );
});
