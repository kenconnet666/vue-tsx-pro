// 采购单列表：一个 QueryTable 拼好查询栏、工具栏（新建、导出、刷新、行高、列设置、全屏）、批量操作、表格与分页；
// 数据来自假的服务端（300–600 ms 延迟、按条件筛、按几列排序、分页），按住 Shift 点列标题追加排序列，品类、供应商的表头筛选也交给服务端，
// 列设置与行高记在浏览器里。真的接口用 tableParams(query, columns) 把这些写成参数（见“请求与数据”指南）
import { Download, Plus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  createStatusMap,
  Field,
  Select,
  TextField,
  useTableQuery,
  type DataTableColumn,
  type TablePage,
  type TableQuery,
} from '@vue-tsx-pro/ui';
import { QueryTable } from '@vue-tsx-pro/ui/patterns';

interface PurchaseOrder {
  id: string;
  supplier: string;
  category: string;
  buyer: string;
  status: 'draft' | 'approving' | 'ordered' | 'received';
  amount: number;
  orderedAt: string;
}

interface Filters {
  keyword: string;
  category: string | null;
  status: string | null;
  buyer: string;
}

const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  approving: { label: '审批中', tone: 'warning' },
  ordered: { label: '已下单', tone: 'info' },
  received: { label: '已到货', tone: 'success' },
});
const suppliers = ['华辰精密机加', '启航复材', '远山钣金', '恒通紧固件', '北辰电子', '青禾线缆'];
const categories = ['机加件', '复材件', '钣金件', '标准件', '线缆'];
const buyers = ['林小满', '周一航', '陈默', '许悠', '王晴', '赵浩然'];

// 假的服务端数据：368 张采购单
const all: PurchaseOrder[] = Array.from({ length: 368 }, (_, index) => ({
  id: `PO-2026-${String(2000 + index)}`,
  supplier: suppliers[(index * 5) % suppliers.length]!,
  category: categories[(index * 7) % categories.length]!,
  buyer: buyers[(index * 11) % buyers.length]!,
  status: statuses.keys[(index * 3) % statuses.keys.length]!,
  amount: ((index * 7919) % 90_000) + 1200,
  orderedAt: new Date(Date.UTC(2026, 9, 21) - ((index * 13) % 90) * 86_400_000)
    .toISOString()
    .slice(0, 10),
}));

/** 假的查询接口：按查询栏与表头的条件筛、按几列排序（前面的优先）、分页，300–600 ms 后返回；取消时不返回 */
function fetchOrders(
  query: TableQuery<Filters, undefined>,
  signal: AbortSignal,
): Promise<TablePage<PurchaseOrder>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => {
        const { keyword, category, status, buyer } = query.filters;
        // 表头筛选：品类是多选（值在其中），供应商是关键字（文字包含）
        const categoryIn = query.columnFilters.category ?? [];
        const supplierHas = query.columnFilters.supplier?.[0]?.trim();
        const matched = all.filter(
          (order) =>
            (!keyword || order.id.includes(keyword) || order.supplier.includes(keyword)) &&
            (!category || order.category === category) &&
            (!status || order.status === status) &&
            (!buyer || order.buyer.includes(buyer)) &&
            (categoryIn.length === 0 || categoryIn.includes(order.category)) &&
            (!supplierHas || order.supplier.includes(supplierHas)),
        );
        matched.sort((a, b) => {
          for (const sort of query.sorts) {
            const key = sort.key as keyof PurchaseOrder;
            const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
            if (order !== 0) return sort.direction === 'ascending' ? order : -order;
          }
          return 0;
        });
        const start = (query.page - 1) * query.pageSize;
        resolve({ rows: matched.slice(start, start + query.pageSize), total: matched.length });
      },
      300 + Math.random() * 300,
    );
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

const columns: DataTableColumn<PurchaseOrder>[] = [
  { key: 'id', header: '采购单号', width: 150, sticky: 'start', sortable: true },
  { key: 'supplier', header: '供应商', minWidth: 160, sortable: true, filter: { options: 'text' } },
  { key: 'category', header: '品类', width: 110, filter: { options: categories } },
  { key: 'buyer', header: '采购员', width: 110 },
  { key: 'status', header: '状态', width: 110, statuses },
  { key: 'amount', header: '金额', width: 140, type: 'currency', sortable: true },
  { key: 'orderedAt', header: '下单日期', width: 140, type: 'date', sortable: true },
];

export default _component(() => {
  const orders = useTableQuery(fetchOrders, {
    filters: { keyword: '', category: null, status: null, buyer: '' } as Filters,
    pageSize: 10,
  });
  let selected = _state<string[]>([]);

  return () => (
    <QueryTable
      query={orders}
      columns={columns}
      getKey={(order) => order.id}
      title="采购单"
      persistKey="docs:query-table-orders"
      multiSort
      filters={(draft) => (
        <>
          <Field label="关键字">
            <TextField _value={draft.keyword} placeholder="单号或供应商" clearable />
          </Field>
          <Field label="品类">
            <Select items={categories} _value={draft.category} placeholder="全部" clearable />
          </Field>
          <Field label="状态">
            <Select items={statuses.options()} _value={draft.status} placeholder="全部" clearable />
          </Field>
        </>
      )}
      moreFilters={(draft) => (
        <Field label="采购员">
          <TextField _value={draft.buyer} placeholder="姓名" clearable />
        </Field>
      )}
      toolbar={
        <>
          <Button size="sm" icon={Plus}>
            新建采购单
          </Button>
          <Button size="sm" variant="outline" tone="neutral" icon={Download}>
            导出
          </Button>
        </>
      }
      selectionMode="multiple"
      _selected={selected}
      batchActions={(keys) => (
        <>
          <Button size="sm" variant="outline" tone="neutral">
            批量催单（{keys.length}）
          </Button>
          <Button size="sm" variant="soft" tone="danger">
            批量作废
          </Button>
        </>
      )}
    />
  );
});
