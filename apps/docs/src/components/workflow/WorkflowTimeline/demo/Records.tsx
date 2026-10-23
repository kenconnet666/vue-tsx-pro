// 采购申请的流转记录：认领、退回修改（意见）、重新提交（附件）、催办、超时自动处理、负责人指定；
// actorName 把工号换成姓名，renderAttachment 把附件做成链接
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Link } from '@vue-tsx-pro/ui';
import {
  WorkflowTimeline,
  type ProcessDefinition,
  type WorkflowEvent,
} from '@vue-tsx-pro/ui/workflow';

const purchase: ProcessDefinition = {
  key: 'purchase',
  name: '采购申请',
  version: 3,
  lanes: [
    { id: 'applicant', name: '申请人' },
    { id: 'manager', name: '部门经理', group: 'manager' },
    { id: 'finance', name: '财务', group: 'finance' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '提交申请', lane: 'applicant' },
    {
      id: 'manager',
      type: 'task',
      name: '部门审批',
      lane: 'manager',
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'back', label: '退回修改', kind: 'return', comment: 'required' },
      ],
    },
    {
      id: 'revise',
      type: 'task',
      name: '修改申请',
      lane: 'applicant',
      outcomes: [{ key: 'resubmit', label: '重新提交' }],
    },
    {
      id: 'finance',
      type: 'task',
      name: '预算核对',
      lane: 'finance',
      overdue: { outcome: 'approve' },
      outcomes: [{ key: 'approve', label: '核对无误' }],
    },
    { id: 'done', type: 'end', name: '采购下单', lane: 'finance' },
  ],
  edges: [
    { id: 'submit', from: 'start', to: 'manager' },
    { id: 'approved', from: 'manager', to: 'finance', outcome: 'approve' },
    { id: 'back', from: 'manager', to: 'revise', outcome: 'back', kind: 'return' },
    { id: 'resubmit', from: 'revise', to: 'manager' },
    { id: 'checked', from: 'finance', to: 'done', outcome: 'approve' },
  ],
};

const people: Record<string, string> = { U01: '周宁', U02: '陆川', U03: '方圆', U04: '韩笑' };

const event = (
  id: string,
  at: string,
  type: WorkflowEvent['type'],
  actor: string,
  rest: Partial<WorkflowEvent> = {},
): WorkflowEvent => ({
  id,
  instanceId: 'P-1024',
  type,
  at: `2026-10-${at}`,
  actor,
  node: null,
  workItem: null,
  edge: null,
  outcome: null,
  comment: '',
  attachments: [],
  ...rest,
});

const events: WorkflowEvent[] = [
  event('1', '14T09:02:00', 'started', 'U01', { node: 'start' }),
  event('2', '14T10:15:00', 'claimed', 'U02', { node: 'manager' }),
  event('3', '14T10:40:00', 'completed', 'U02', {
    node: 'manager',
    outcome: 'back',
    comment: '报价只有一家，请再比价一家后提交',
  }),
  event('4', '15T16:20:00', 'completed', 'U01', {
    node: 'revise',
    outcome: 'resubmit',
    attachments: ['比价单.xlsx', '报价-乙公司.pdf'],
  }),
  event('5', '16T09:05:00', 'completed', 'U02', { node: 'manager', outcome: 'approve' }),
  event('6', '19T09:30:00', 'reminded', 'U01', {
    node: 'finance',
    comment: '供应商月底调价，麻烦尽快',
  }),
  event('7', '21T09:00:00', 'unclaimed', 'system', { node: 'finance' }),
  event('8', '21T09:12:00', 'designated', 'U04', { node: 'finance', comment: 'U03' }),
  event('9', '24T00:00:00', 'auto-completed', 'system', {
    node: 'finance',
    outcome: 'approve',
    comment: '超过时限，视为无异议',
  }),
];

export default _component(() => () => (
  <Card>
    <WorkflowTimeline
      definition={purchase}
      events={events}
      actorName={(id) => people[id] ?? id}
      renderAttachment={(name) => <Link href="#">{name}</Link>}
    />
  </Card>
));
