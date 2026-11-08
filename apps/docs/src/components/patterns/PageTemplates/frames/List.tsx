// 列表页：外壳 + QueryTable（查询栏、工具栏、批量操作、表格、分页）；单号点进详情页
import { Download, Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Field,
  Link,
  Select,
  TextField,
  useTableQuery,
  type DataTableColumn,
  type TableQuery,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { QueryTable } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { categories, orders, statuses, type PurchaseOrder } from '../template-data';
import { TemplateShell } from '../template-shell';

interface Filters {
  keyword: string;
  category: string | null;
  status: string | null;
}

/** 在本地数据里按条件筛、排序、分页（真的接口用 tableParams 把查询写成参数） */
function query({ filters, sorts, page, pageSize }: TableQuery<Filters, undefined>) {
  const { keyword, category, status } = filters;
  const matched = orders.filter(
    (order) =>
      (!keyword || order.id.includes(keyword) || order.supplier.includes(keyword)) &&
      (!category || order.category === category) &&
      (!status || order.status === status),
  );
  const [sort] = sorts;
  if (sort) {
    const key = sort.key as keyof PurchaseOrder;
    const flip = sort.direction === 'ascending' ? 1 : -1;
    matched.sort((a, b) => (a[key] < b[key] ? -flip : a[key] > b[key] ? flip : 0));
  }
  const start = (page - 1) * pageSize;
  return Promise.resolve({ rows: matched.slice(start, start + pageSize), total: matched.length });
}

const columns: DataTableColumn<PurchaseOrder>[] = [
  {
    key: 'id',
    header: '采购单号',
    width: 150,
    sticky: 'start',
    sortable: true,
    cell: (order) => <Link href="#detail">{order.id}</Link>,
  },
  { key: 'supplier', header: '供应商', minWidth: 140 },
  { key: 'category', header: '品类', width: 100 },
  { key: 'buyer', header: '采购员', width: 100 },
  { key: 'status', header: '状态', width: 100, statuses },
  { key: 'amount', header: '金额', width: 130, type: 'currency', sortable: true },
  { key: 'orderedAt', header: '下单日期', width: 120, type: 'date', sortable: true },
];

export default _component(() => {
  const table = useTableQuery(query, {
    filters: { keyword: '', category: null, status: null } as Filters,
    pageSize: 10,
  });
  let selected = _state<string[]>([]);
  return () => (
    <TemplateShell current="orders">
      <QueryTable
        query={table}
        columns={columns}
        getKey={(order) => order.id}
        title="采购单"
        filters={(draft) => (
          <>
            <Field label="关键字">
              <TextField _value={draft.keyword} placeholder="单号或供应商" clearable />
            </Field>
            <Field label="品类">
              <Select items={categories} _value={draft.category} placeholder="全部" clearable />
            </Field>
            <Field label="状态">
              <Select
                items={statuses.options()}
                _value={draft.status}
                placeholder="全部"
                clearable
              />
            </Field>
          </>
        )}
        toolbar={
          <>
            <Button icon={Plus}>新建采购单</Button>
            <Button variant="outline" tone="neutral" icon={Download}>
              导出
            </Button>
          </>
        }
        selectionMode="multiple"
        _selected={selected}
        batchActions={(keys) => (
          <Button size="sm" variant="outline" tone="neutral">
            批量催单（{keys.length}）
          </Button>
        )}
      />
    </TemplateShell>
  );
});
