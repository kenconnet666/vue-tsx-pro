// 设计器里用：节点可以点选（selected 双向绑定），右边显示选中节点的属性；validateProcess 查出的问题标红并列在下面
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Alert, Card, Descriptions, Flex, Small } from '@vue-tsx-pro/ui';
import { FlowDiagram, validateProcess, type ProcessDefinition } from '@vue-tsx-pro/ui/workflow';

// 报销审批：故意漏了“财务复核”的处理人（泳道没有岗位收件箱，也没写 assignee）
const expense: ProcessDefinition = {
  key: 'expense',
  name: '费用报销',
  version: 1,
  lanes: [
    { id: 'staff', name: '员工' },
    { id: 'lead', name: '直属领导', group: 'leads' },
    { id: 'finance', name: '财务' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '填报', lane: 'staff' },
    {
      id: 'lead',
      type: 'task',
      name: '领导审批',
      lane: 'lead',
      due: { workdays: 2 },
      overdue: { outcome: 'approve' },
      description: '两个工作日内不处理视为同意',
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    {
      id: 'review',
      type: 'task',
      name: '财务复核',
      lane: 'finance',
      due: { workdays: 3 },
      outcomes: [{ key: 'pay', label: '付款', attachments: 'required' }],
    },
    { id: 'paid', type: 'end', name: '已付款', lane: 'finance', result: 'paid' },
    { id: 'closed', type: 'end', name: '已驳回', lane: 'lead', result: 'rejected' },
  ],
  edges: [
    { id: 'submit', from: 'start', to: 'lead' },
    { id: 'approve', from: 'lead', to: 'review', outcome: 'approve' },
    { id: 'reject', from: 'lead', to: 'closed', outcome: 'reject' },
    { id: 'pay', from: 'review', to: 'paid', outcome: 'pay' },
  ],
};

const styles = css.create({
  diagram: { flexGrow: 1, flexShrink: 1, flexBasis: '32rem', minWidth: 0 },
  panel: { flexGrow: 0, flexShrink: 1, flexBasis: '16rem' },
});

const due = (node: ProcessDefinition['nodes'][number]) =>
  node.type === 'task' && node.due
    ? 'workdays' in node.due
      ? `${node.due.workdays} 个工作日`
      : 'days' in node.due
        ? `${node.due.days} 天`
        : `变量 ${node.due.var}`
    : '—';

export default _component(() => {
  let selected = _state<string | null>('lead');
  const problems = validateProcess(expense);
  return () => {
    const node = expense.nodes.find((item) => item.id === selected);
    return (
      <Flex direction="column" gap="md">
        <Flex gap="md" align="start" wrap>
          <FlowDiagram
            definition={expense}
            problems={problems}
            selectable
            _selected={selected}
            sx={styles.diagram}
          />
          <Card sx={styles.panel} header={node?.name ?? '点一个节点'}>
            {node ? (
              <Descriptions
                size="sm"
                columns={1}
                items={[
                  { label: '类型', value: node.type },
                  {
                    label: '泳道',
                    value: expense.lanes?.find((lane) => lane.id === node.lane)?.name ?? '—',
                  },
                  { label: '时限', value: due(node) },
                  {
                    label: '处理结果',
                    value:
                      node.type === 'task'
                        ? node.outcomes.map((item) => item.label).join('、')
                        : '—',
                  },
                  { label: '说明', value: node.description ?? '—' },
                ]}
              />
            ) : (
              <Small tone="muted">选中的节点在这里显示属性</Small>
            )}
          </Card>
        </Flex>
        {problems.map((problem) => (
          <Alert key={problem.code} tone={problem.severity === 'error' ? 'danger' : 'warning'}>
            {problem.message}
          </Alert>
        ))}
      </Flex>
    );
  };
});
