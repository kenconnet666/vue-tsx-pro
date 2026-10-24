import { Download, MoreHorizontal, Search, Trash2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Badge,
  Button,
  DataTable,
  Flex,
  IconButton,
  Small,
  TextField,
  type DataTableColumn,
  type SortState,
  type StatusTone,
} from '@vue-tsx-pro/ui';

interface Order {
  id: string;
  customer: string;
  city: string;
  amount: number;
  status: [StatusTone, string];
  placedAt: Date;
}

const customers = ['林小满', '周一航', '陈默', '许悠', '王晴', '赵浩然', '孙思远', '李雨桐'];
const cities = ['上海', '北京', '杭州', '深圳', '成都', '武汉'];
const statuses: [StatusTone, string][] = [
  ['warning', '待付款'],
  ['info', '备货中'],
  ['accent', '已发货'],
  ['success', '已完成'],
  ['danger', '已退款'],
];

const LATEST = new Date(2026, 9, 20, 18, 0).getTime();

// 一万条订单：只渲染看得见的几十行
const orders: Order[] = Array.from({ length: 10_000 }, (_, index) => ({
  id: `SO${String(100_000 + index)}`,
  customer: customers[index % customers.length]!,
  city: cities[(index * 7) % cities.length]!,
  amount: Math.round(((index * 9301 + 49297) % 233280) / 23.328) / 100 + 9.9,
  status: statuses[(index * 3) % statuses.length]!,
  // 越往后越早：每单相隔 37 分钟
  placedAt: new Date(LATEST - index * 37 * 60_000),
}));

const columns: DataTableColumn<Order>[] = [
  { key: 'id', header: '订单号', width: 120, sortable: true, sticky: 'start' },
  { key: 'customer', header: '客户', width: 110, sortable: true },
  { key: 'city', header: '城市', width: 90 },
  // 不写 cell：按 type 与当前语言格式化（金额用语言的币种，数字类靠右）
  { key: 'amount', header: '金额', width: 130, type: 'currency', sortable: true },
  {
    key: 'status',
    header: '状态',
    width: 100,
    value: (order) => order.status[1],
    sortable: true,
    cell: (order) => <Badge tone={order.status[0]}>{order.status[1]}</Badge>,
  },
  { key: 'placedAt', header: '下单时间', width: 180, type: 'dateTime', sortable: true },
  {
    key: 'actions',
    header: '操作',
    width: 64,
    sticky: 'end',
    resizable: false,
    cell: (order) => <IconButton icon={MoreHorizontal} aria-label={`${order.id} 的更多操作`} />,
  },
];

const styles = css.create({ table: { maxHeight: '26rem' }, search: { width: '16rem' } });

export default _component(() => {
  let keyword = _state('');
  let sort = _state<SortState | null>({ key: 'placedAt', direction: 'descending' });
  let selected = _state<string[]>([]);
  let widths = _state<Record<string, number>>({});
  return () => {
    const rows = keyword
      ? orders.filter((order) => order.id.includes(keyword) || order.customer.includes(keyword))
      : orders;
    return (
      <Flex direction="column" gap="sm">
        <Flex align="center" justify="between" gap="md" wrap>
          <TextField
            value={_bind(keyword)}
            type="search"
            icon={Search}
            clearable
            placeholder="订单号或客户"
            aria-label="搜索订单"
            sx={styles.search}
          />
          <Flex align="center" gap="sm">
            <Small tone="muted">
              {selected.length
                ? `已选 ${selected.length} 单`
                : `共 ${rows.length.toLocaleString()} 单`}
            </Small>
            <Button
              size="sm"
              variant="soft"
              tone="neutral"
              icon={Download}
              disabled={!selected.length}
            >
              导出
            </Button>
            <Button
              size="sm"
              variant="soft"
              tone="danger"
              icon={Trash2}
              disabled={!selected.length}
              onClick={() => (selected = [])}
            >
              取消订单
            </Button>
          </Flex>
        </Flex>
        <DataTable
          rows={rows}
          columns={columns}
          getKey={(order) => order.id}
          sort={_bind(sort)}
          selectionMode="multiple"
          selected={_bind(selected)}
          resizable
          columnWidths={_bind(widths)}
          aria-label="订单"
          propsRoot={{ sx: styles.table }}
        />
      </Flex>
    );
  };
});
