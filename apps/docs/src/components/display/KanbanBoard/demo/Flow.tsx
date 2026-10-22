import { _component } from '@vue-tsx-pro/tsx';
import { Flex, KanbanBoard, Small, Text, type KanbanColumn } from '@vue-tsx-pro/ui';

interface Ticket {
  id: string;
  title: string;
  stage: string;
  owner: string;
}

const columns: KanbanColumn[] = [
  { key: 'todo', label: '待处理' },
  { key: 'doing', label: '处理中' },
  { key: 'review', label: '待验收', tone: 'warning' },
  { key: 'done', label: '已完成' },
];

const order = columns.map((column) => column.key);

export default _component(() => {
  let tickets = _state<Ticket[]>([
    { id: 'T-101', title: '登录页验证码不刷新', stage: 'todo', owner: '林小满' },
    { id: 'T-102', title: '导出 Excel 列宽错乱', stage: 'todo', owner: '周一航' },
    { id: 'T-098', title: '首页统计卡片加载慢', stage: 'doing', owner: '宋知行' },
    { id: 'T-095', title: '通知中心未读数不准', stage: 'review', owner: '许悠' },
    { id: 'T-090', title: '表格列设置记不住', stage: 'done', owner: '林小满' },
  ]);
  let message = _state('只能往后挪一列，或者退回上一列');

  return () => (
    <Flex direction="column" gap="sm">
      <KanbanBoard
        aria-label="工单看板"
        columns={columns}
        items={tickets}
        getKey={(ticket) => ticket.id}
        getColumn={(ticket) => ticket.stage}
        getLabel={(ticket) => `${ticket.id} ${ticket.title}`}
        canMove={(ticket, to) =>
          Math.abs(order.indexOf(to) - order.indexOf(ticket.stage)) === 1
            ? null
            : '只能挪到相邻的一列'
        }
        onMove={(ticket, to) => {
          // 看板不自己挪：改数据，卡片才换列（真实页面里是调接口、刷新）
          tickets = tickets.map((item) => (item.id === ticket.id ? { ...item, stage: to } : item));
          message = `${ticket.id} 移到了“${columns.find((column) => column.key === to)!.label}”`;
        }}
        onReject={(ticket, _, reason) => (message = `${ticket.id} 没有移动：${reason}`)}
        columnWidth="13rem"
        columnHeight="20rem"
      >
        {(ticket) => (
          <Flex direction="column" gap="xs">
            <Text mono size="sm" tone="muted">
              {ticket.id}
            </Text>
            <Text size="sm" weight="medium">
              {ticket.title}
            </Text>
            <Small tone="muted">{ticket.owner}</Small>
          </Flex>
        )}
      </KanbanBoard>
      <Small tone="muted" aria-live="polite">
        {message}
      </Small>
    </Flex>
  );
});
