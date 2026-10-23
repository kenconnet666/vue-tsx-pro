// 采购申请审批：泳道是岗位，按金额分两条路（排他网关），超过 5 万要总经理审批；流转记录推出的进度叠在图上
import { _component } from '@vue-tsx-pro/tsx';

import {
  FlowDiagram,
  processProgress,
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
    { id: 'ceo', name: '总经理', group: 'ceo' },
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
      assignee: { type: 'initiator' },
      outcomes: [{ key: 'resubmit', label: '重新提交' }],
    },
    { id: 'amount', type: 'exclusive', name: '金额' },
    {
      id: 'finance',
      type: 'task',
      name: '预算核对',
      lane: 'finance',
      outcomes: [{ key: 'approve', label: '核对无误' }],
    },
    {
      id: 'ceo',
      type: 'task',
      name: '总经理审批',
      lane: 'ceo',
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'done', type: 'end', name: '采购下单', lane: 'finance', result: 'approved' },
    { id: 'rejected', type: 'end', name: '驳回', lane: 'ceo', result: 'rejected' },
  ],
  edges: [
    { id: 'submit', from: 'start', to: 'manager' },
    { id: 'approved', from: 'manager', to: 'amount', outcome: 'approve' },
    { id: 'back', from: 'manager', to: 'revise', outcome: 'back', kind: 'return' },
    { id: 'resubmit', from: 'revise', to: 'manager' },
    {
      id: 'large',
      from: 'amount',
      to: 'ceo',
      label: '≥ 5 万',
      when: { var: 'amount', op: 'gte', value: 50_000 },
    },
    { id: 'small', from: 'amount', to: 'finance', default: true, label: '< 5 万' },
    { id: 'ceo-ok', from: 'ceo', to: 'finance', outcome: 'approve' },
    { id: 'ceo-no', from: 'ceo', to: 'rejected', outcome: 'reject' },
    { id: 'checked', from: 'finance', to: 'done', outcome: 'approve' },
  ],
};

// 后端返回的流转记录（这里只留画进度要用的几项）：被退回修改过一次，总经理已同意，现在在财务
const events: Pick<WorkflowEvent, 'type' | 'node' | 'edge'>[] = [
  { type: 'started', node: 'start', edge: 'submit' },
  { type: 'completed', node: 'manager', edge: 'back' },
  { type: 'completed', node: 'revise', edge: 'resubmit' },
  { type: 'completed', node: 'manager', edge: 'approved' },
  { type: 'arrived', node: 'amount', edge: 'large' },
  { type: 'completed', node: 'ceo', edge: 'ceo-ok' },
];

export default _component(() => () => (
  <FlowDiagram
    definition={purchase}
    progress={processProgress({ status: 'active', active: ['finance'] }, events)}
  />
));
