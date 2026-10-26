import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  Button,
  DataTable,
  Flex,
  Switch,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';

interface Order {
  id: string;
  customer: string;
  city: string;
  status: '已付款' | '待发货' | '已退款';
  amount: number;
}

const orders: Order[] = [
  { id: 'A-1024', customer: '林小满', city: '杭州', status: '已付款', amount: 1280 },
  { id: 'A-1025', customer: '陈一舟', city: '成都', status: '待发货', amount: 356 },
  { id: 'A-1026', customer: '王若曦', city: '北京', status: '已付款', amount: 4210 },
  { id: 'A-1027', customer: '赵知远', city: '广州', status: '已退款', amount: 98 },
];

const TONES = { 已付款: 'success', 待发货: 'warning', 已退款: 'neutral' } as const;

const columns: DataTableColumn<Order>[] = [
  { key: 'id', header: '订单号', width: 110 },
  { key: 'customer', header: '客户' },
  { key: 'city', header: '城市', width: 90 },
  {
    key: 'status',
    header: '状态',
    width: 100,
    cell: (order) => <Badge tone={TONES[order.status]}>{order.status}</Badge>,
  },
  {
    key: 'amount',
    header: '金额',
    align: 'end',
    width: 110,
    cell: (order) => `¥${order.amount.toLocaleString()}`,
  },
];

/** 模拟一次请求：ms 毫秒后完成 */
const request = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default _component(() => {
  let loading = _state(true);

  async function reload() {
    loading = true;
    await request(1800);
    loading = false;
  }

  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="md" align="center" wrap>
        <Switch _checked={loading}>加载中</Switch>
        <Button variant="soft" size="sm" onClick={() => void reload()}>
          重新加载（1.8 秒）
        </Button>
      </Flex>
      <DataTable
        aria-label="订单"
        rows={loading ? [] : orders}
        columns={columns}
        getKey={(order) => order.id}
        loading={loading}
      />
    </Flex>
  );
});
