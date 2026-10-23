// 工单看板：只能挪到相邻的列（canMove 写出原因），放下时报告 onMove，使用方改了数据卡片才换列；卡片带优先级、处理人与时限
import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, Badge, Flex, Small, Text } from '@vue-tsx-pro/ui';
import { DeadlineBadge, KanbanBoard, type KanbanColumn } from '@vue-tsx-pro/ui/patterns';

interface Ticket {
  id: string;
  title: string;
  stage: string;
  owner: string;
  priority: 'high' | 'medium' | 'low';
  due: string;
}

const TODAY = '2026-10-21';
const columns: KanbanColumn[] = [
  { key: 'todo', label: '待处理' },
  { key: 'doing', label: '处理中' },
  { key: 'review', label: '待验收', tone: 'warning' },
  { key: 'done', label: '已完成', tone: 'success' },
];
const order = columns.map((column) => column.key);
const priorities = {
  high: { label: '高', tone: 'danger' },
  medium: { label: '中', tone: 'warning' },
  low: { label: '低', tone: 'neutral' },
} as const;

export default _component(() => {
  let tickets = _state<Ticket[]>([
    {
      id: 'T-101',
      title: '登录页验证码不刷新',
      stage: 'todo',
      owner: '林小满',
      priority: 'high',
      due: '2026-10-22',
    },
    {
      id: 'T-102',
      title: '导出 Excel 列宽错乱',
      stage: 'todo',
      owner: '周一航',
      priority: 'medium',
      due: '2026-10-28',
    },
    {
      id: 'T-104',
      title: '收件箱批量认领后计数不刷新',
      stage: 'todo',
      owner: '韩笑',
      priority: 'medium',
      due: '2026-10-30',
    },
    {
      id: 'T-105',
      title: '台账筛选条件刷新后丢失',
      stage: 'todo',
      owner: '陆川',
      priority: 'low',
      due: '2026-11-06',
    },
    {
      id: 'T-098',
      title: '首页统计卡片加载慢',
      stage: 'doing',
      owner: '宋知行',
      priority: 'high',
      due: TODAY,
    },
    {
      id: 'T-099',
      title: '审批意见附件预览空白',
      stage: 'doing',
      owner: '方圆',
      priority: 'medium',
      due: '2026-10-24',
    },
    {
      id: 'T-100',
      title: '流程图在窄屏下重叠',
      stage: 'doing',
      owner: '许悠',
      priority: 'low',
      due: '2026-10-19',
    },
    {
      id: 'T-095',
      title: '通知中心未读数不准',
      stage: 'review',
      owner: '许悠',
      priority: 'high',
      due: '2026-10-20',
    },
    {
      id: 'T-096',
      title: '暗色主题下图表网格看不清',
      stage: 'review',
      owner: '周宁',
      priority: 'low',
      due: '2026-10-27',
    },
    {
      id: 'T-090',
      title: '表格列设置记不住',
      stage: 'done',
      owner: '林小满',
      priority: 'medium',
      due: '2026-10-17',
    },
    {
      id: 'T-091',
      title: '日期选择器跨年显示错月',
      stage: 'done',
      owner: '周一航',
      priority: 'high',
      due: '2026-10-15',
    },
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
        columnWidth="14rem"
        columnHeight="32rem"
      >
        {(ticket) => (
          <Flex direction="column" gap="sm">
            <Flex align="center" justify="between" gap="sm">
              <Text mono size="xs" tone="muted">
                {ticket.id}
              </Text>
              <Badge size="xs" variant="soft" tone={priorities[ticket.priority].tone}>
                {priorities[ticket.priority].label}
              </Badge>
            </Flex>
            <Text size="sm" weight="medium">
              {ticket.title}
            </Text>
            <Flex align="center" justify="between" gap="sm">
              <Flex align="center" gap="xs">
                <Avatar name={ticket.owner} size="xs" />
                <Small tone="muted">{ticket.owner}</Small>
              </Flex>
              {ticket.stage === 'done' ? (
                <Small tone="muted">已关闭</Small>
              ) : (
                <DeadlineBadge due={ticket.due} today={TODAY} />
              )}
            </Flex>
          </Flex>
        )}
      </KanbanBoard>
      <Small tone="muted" aria-live="polite">
        {message}
      </Small>
    </Flex>
  );
});
