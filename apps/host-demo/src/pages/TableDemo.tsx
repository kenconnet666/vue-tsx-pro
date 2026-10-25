// /base 页上的表格演示：DataTable（一万行、排序、勾选、固定列、列宽、搜索、列显示开关、刷新）与 TreeDataTable（懒加载）
import { Columns3, RefreshCw, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Badge,
  Button,
  createMatcher,
  Flex,
  Menu,
  MenuCheckboxItem,
  DataTable,
  Text,
  TextField,
  TreeDataTable,
  useFormat,
  type SortState,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';

interface Order {
  id: string;
  customer: string;
  city: string;
  amount: number;
  status: 'paid' | 'pending' | 'refunded';
  createdAt: Date;
}

const customers = ['张三', '李四', '王五', 'Ada Lovelace', 'Grace Hopper', '赵六', 'Émile Zola'];
const cities = ['上海', '北京', '深圳', '杭州', '成都'];
const statuses: Order['status'][] = ['paid', 'pending', 'refunded'];

/** 一万条订单：确定性的假数据，测试里也能按序号核对 */
const orders: Order[] = Array.from({ length: 10_000 }, (_, index) => ({
  id: `SO-${String(index + 1).padStart(5, '0')}`,
  customer: customers[index % customers.length]!,
  city: cities[(index * 7) % cities.length]!,
  amount: ((index * 7919) % 100_000) / 10,
  status: statuses[index % statuses.length]!,
  createdAt: new Date(2026, 0, 1 + (index % 300)),
}));

const statusText: Record<Order['status'], string> = {
  paid: '已支付',
  pending: '待支付',
  refunded: '已退款',
};
const statusTone = { paid: 'success', pending: 'warning', refunded: 'neutral' } as const;

interface Unit {
  id: string;
  name: string;
  members: number | null;
  children?: Unit[];
  lazy?: boolean;
}

const styles = css.create({
  table: { height: '22em', maxHeight: 'none' },
  tree: { height: '16em', maxHeight: 'none' },
});

/** 表格演示 */
export const TableDemo = _component(() => {
  const format = useFormat();
  let keyword = _state('');
  let sort = _state<SortState | null>({ key: 'amount', direction: 'descending' });
  let picked = _state<string[]>([]);
  let hidden = _state<string[]>([]);
  let refreshing = _state(false);
  let widths = _state<Record<string, number>>({});

  const columns: DataTableColumn<Order>[] = [
    { key: 'id', header: '订单号', width: 120, sticky: 'start' },
    { key: 'customer', header: '客户', width: 160, sortable: true },
    { key: 'city', header: '城市', width: 100, sortable: true },
    {
      key: 'status',
      header: '状态',
      width: 100,
      align: 'center',
      sortable: true,
      cell: (order) => (
        <Badge tone={statusTone[order.status]} variant="soft">
          {statusText[order.status]}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: '下单时间',
      width: 150,
      sortable: true,
      cell: (order) => format.date(order.createdAt),
    },
    {
      key: 'amount',
      header: '金额',
      width: 120,
      align: 'end',
      sortable: true,
      cell: (order) => format.currency(order.amount),
    },
    {
      key: 'actions',
      header: '操作',
      width: 88,
      sticky: 'end',
      resizable: false,
      cell: () => (
        <Button size="sm" variant="ghost">
          查看
        </Button>
      ),
    },
  ];

  const filtered = _derived.by(() => {
    const match = createMatcher('zh-CN');
    return keyword
      ? orders.filter((order) => match(`${order.id} ${order.customer} ${order.city}`, keyword))
      : orders;
  });

  function refresh() {
    refreshing = true;
    setTimeout(() => (refreshing = false), 1200);
  }

  // 树形表格：第一层两个部门，“市场部”的子项展开时才“取回来”
  let units = _state<Unit[]>([
    {
      id: 'rd',
      name: '研发部',
      members: 42,
      children: [
        {
          id: 'fe',
          name: '前端组',
          members: 12,
          children: [{ id: 'fe-1', name: '组件库小组', members: 4 }],
        },
        { id: 'be', name: '后端组', members: 18 },
      ],
    },
    { id: 'mk', name: '市场部', members: 15, lazy: true },
  ]);
  let expanded = _state<string[]>(['rd']);
  const unitColumns: DataTableColumn<Unit>[] = [
    { key: 'name', header: '部门', sortable: true },
    { key: 'members', header: '人数', width: 100, align: 'end', sortable: true },
  ];

  function loadUnit(unit: Unit) {
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        units = units.map((item) =>
          item.id === unit.id
            ? {
                ...item,
                lazy: false,
                children: [
                  { id: 'mk-1', name: '品牌组', members: 6 },
                  { id: 'mk-2', name: '渠道组', members: 9 },
                ],
              }
            : item,
        );
        resolve();
      }, 400),
    );
  }

  return () => {
    const shown = columns.filter((column) => !hidden.includes(column.key));
    return (
      <Flex direction="column" gap="md">
        <Flex gap="sm" wrap align="center" class="table-toolbar">
          <TextField
            _value={_bind(keyword)}
            type="search"
            icon={Search}
            clearable
            radius="full"
            placeholder="搜索订单号、客户、城市"
            aria-label="搜索订单"
          />
          <Menu
            trigger={(props) => (
              <Button {...props} variant="outline" icon={Columns3}>
                列
              </Button>
            )}
          >
            {columns
              .filter((column) => !column.sticky)
              .map((column) => (
                <MenuCheckboxItem
                  key={column.key}
                  _checked={!hidden.includes(column.key)}
                  onClick={() =>
                    (hidden = hidden.includes(column.key)
                      ? hidden.filter((key) => key !== column.key)
                      : [...hidden, column.key])
                  }
                >
                  {column.header}
                </MenuCheckboxItem>
              ))}
          </Menu>
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={refreshing}
            onClick={refresh}
            class="table-refresh"
          >
            刷新
          </Button>
          <Text tone="muted" class="table-summary">
            共 {filtered.length} 条，已选 {picked.length} 条
          </Text>
        </Flex>
        <DataTable
          rows={filtered}
          columns={shown}
          getKey={(order) => order.id}
          _sort={_bind(sort)}
          selectionMode="multiple"
          _selected={_bind(picked)}
          _columnWidths={_bind(widths)}
          resizable
          striped
          loading={refreshing}
          aria-label="订单"
          class="table-demo"
          propsRoot={{ sx: styles.table }}
        />
        <TreeDataTable
          rows={units}
          columns={unitColumns}
          getKey={(unit) => unit.id}
          getChildren={(unit) => unit.children}
          hasChildren={(unit) => unit.lazy === true || (unit.children?.length ?? 0) > 0}
          loadChildren={loadUnit}
          _expanded={_bind(expanded)}
          density="compact"
          aria-label="组织架构"
          class="tree-table-demo"
          propsRoot={{ sx: styles.tree }}
        />
      </Flex>
    );
  };
});
