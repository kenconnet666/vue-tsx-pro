import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Card,
  Strong,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  type StatusTone,
} from '@vue-tsx-pro/ui';

const orders: { id: string; customer: string; amount: string; status: [StatusTone, string] }[] = [
  { id: '#10234', customer: '林小满', amount: '¥1,280.00', status: ['success', '已发货'] },
  { id: '#10233', customer: '周一航', amount: '¥459.00', status: ['info', '备货中'] },
  { id: '#10232', customer: '陈默', amount: '¥2,099.00', status: ['warning', '待付款'] },
  { id: '#10231', customer: '吴悠', amount: '¥89.00', status: ['danger', '已退款'] },
  { id: '#10230', customer: '赵晴', amount: '¥320.00', status: ['neutral', '已取消'] },
];

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
              <Badge tone={order.status[0]} radius="full">
                {order.status[1]}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
));
