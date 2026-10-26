// 表格下方的分页栏：页码、每页条数、跳页都写回同一份 page / pageSize，表格跟着显示那一页
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  Flex,
  PaginationBar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@zerodep-dev/vue-tsx-pro-ui';

const customers = ['林小满', '周一航', '陈默', '许悠', '宋知远', '顾青', '沈遥', '韩笑'];
const statuses = [
  ['success', '已发货'],
  ['warning', '待付款'],
  ['info', '备货中'],
  ['neutral', '已完成'],
] as const;

// 1,286 条假订单：按序号算出来，不占内存
const total = 1286;
const orderAt = (index: number) => ({
  id: `#${10_000 + total - index}`,
  customer: customers[(index * 5) % customers.length]!,
  amount: ((index * 7919) % 50_000) / 10 + 39,
  status: statuses[(index * 3) % statuses.length]!,
});

export default _component(() => {
  let page = _state(1);
  let pageSize = _state(5);

  const rows = () => {
    const start = (page - 1) * pageSize;
    return Array.from({ length: Math.max(0, Math.min(pageSize, total - start)) }, (_, at) =>
      orderAt(start + at),
    );
  };

  return () => (
    <Flex direction="column" gap="md">
      <Table aria-label="订单">
        <TableHead>
          <TableRow>
            <TableHeaderCell>订单号</TableHeaderCell>
            <TableHeaderCell>客户</TableHeaderCell>
            <TableHeaderCell align="end">金额</TableHeaderCell>
            <TableHeaderCell>状态</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows().map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.id}</TableCell>
              <TableCell>{order.customer}</TableCell>
              <TableCell align="end">
                ¥{order.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <Badge tone={order.status[0]}>{order.status[1]}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar
        _page={page}
        _pageSize={pageSize}
        total={total}
        pageSizeOptions={[5, 10, 20, 50]}
        propsPagination={{ 'aria-label': '订单表格分页' }}
      />
    </Flex>
  );
});
