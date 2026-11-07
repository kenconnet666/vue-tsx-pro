// 列表页：QueryTable 拼好查询栏、工具栏、表格与分页；条件、排序、页码在 useTableQuery 里
import { Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  createStatusMap,
  Field,
  Link,
  LinkButton,
  Select,
  TextField,
  useTableQuery,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { QueryTable } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { listOrders, type Order, type OrderFilters } from '../api/orders';

const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  approving: { label: '审批中', tone: 'warning' },
  ordered: { label: '已下单', tone: 'success' },
});

const columns: DataTableColumn<Order>[] = [
  {
    key: 'id',
    header: '单号',
    width: 120,
    sortable: true,
    cell: (order) => <Link href={`/orders/${order.id}`}>{order.id}</Link>,
  },
  { key: 'supplier', header: '供应商', minWidth: 140 },
  { key: 'category', header: '品类', width: 100 },
  { key: 'status', header: '状态', width: 100, statuses },
  { key: 'amount', header: '金额', width: 130, type: 'currency', sortable: true },
  { key: 'delivery', header: '交货日期', width: 130, type: 'date', sortable: true },
];

export default _component(() => {
  const orders = useTableQuery(listOrders, {
    filters: { keyword: '', status: null } as OrderFilters,
    pageSize: 10,
  });
  return () => (
    <QueryTable
      query={orders}
      columns={columns}
      getKey={(order) => order.id}
      title="采购单"
      filters={(draft) => (
        <>
          <Field label="关键字">
            <TextField _value={draft.keyword} placeholder="单号或供应商" clearable />
          </Field>
          <Field label="状态">
            <Select items={statuses.options()} _value={draft.status} placeholder="全部" clearable />
          </Field>
        </>
      )}
      toolbar={
        <LinkButton href="/orders/new" size="sm" icon={Plus}>
          新建采购单
        </LinkButton>
      }
    />
  );
});
