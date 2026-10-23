// 合同协商的流转记录：旧的在前、左右交替、小一号；没给 definition 时节点与结果显示标识；留言、暂停、恢复各有图标
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Timeline } from '@vue-tsx-pro/ui';
import { useWorkflowTimeline, type WorkflowEvent } from '@vue-tsx-pro/ui/workflow';

const base = {
  instanceId: 'C-77',
  node: null,
  workItem: null,
  edge: null,
  outcome: null,
  comment: '',
  attachments: [],
} as const;

const events: WorkflowEvent[] = [
  {
    ...base,
    id: '1',
    type: 'started',
    at: '2026-10-08T14:00:00',
    actor: '法务 · 张律',
    node: 'start',
  },
  {
    ...base,
    id: '2',
    type: 'completed',
    at: '2026-10-09T10:20:00',
    actor: '法务 · 张律',
    node: '法务审核',
    outcome: '通过',
  },
  {
    ...base,
    id: '3',
    type: 'commented',
    at: '2026-10-10T08:45:00',
    actor: '商务 · 林夏',
    comment: '付款节点改成验收后 30 天，法务已口头同意',
  },
  {
    ...base,
    id: '4',
    type: 'suspended',
    at: '2026-10-12T17:30:00',
    actor: '管理层 · 秦总',
    comment: '等对方董事会决议',
  },
  { ...base, id: '5', type: 'resumed', at: '2026-10-20T09:00:00', actor: '管理层 · 秦总' },
];

export default _component(() => {
  const records = useWorkflowTimeline(() => ({ events }));
  return () => (
    <Card>
      <Timeline items={records.value} alternate size="sm" />
    </Card>
  );
});
