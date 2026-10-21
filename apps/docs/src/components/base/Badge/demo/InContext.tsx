import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  createStatusMap,
  StatusBadge,
  Strong,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@vue-tsx-pro/ui';

// 状态写在一处：表格、筛选、详情里都是同一个名字与颜色
const orderStatuses = createStatusMap({
  pending: { label: '待付款', tone: 'warning' },
  packing: { label: '备货中', tone: 'info' },
  shipped: { label: '已发货', tone: 'success' },
  refunded: { label: '已退款', tone: 'danger' },
  cancelled: { label: '已取消', tone: 'neutral' },
});

const orders = [
  { id: '#10234', customer: '林小满', amount: '¥1,280.00', status: 'shipped' },
  { id: '#10233', customer: '周一航', amount: '¥459.00', status: 'packing' },
  { id: '#10232', customer: '陈默', amount: '¥2,099.00', status: 'pending' },
  { id: '#10231', customer: '吴悠', amount: '¥89.00', status: 'refunded' },
  { id: '#10230', customer: '赵晴', amount: '¥320.00', status: 'cancelled' },
] as const;

export default _component(() => () => (
  <Card padding="none">
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>订单</TableHeaderCell>
          <TableHeaderCell>客户</TableHeaderCell>
          <TableHeaderCell align="end">金额</TableHeaderCell>
          <TableHeaderCell>状态</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Strong>{order.id}</Strong>
            </TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell align="end">
              <Text tone="muted">{order.amount}</Text>
            </TableCell>
            <TableCell>
              <StatusBadge statuses={orderStatuses} value={order.status} radius="full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
));
