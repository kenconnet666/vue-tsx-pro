/** 示例的流程：请假（经理审批，超过 3 天再给人事；可以退回给申请人改）、采购（财务收件箱认领，金额大的总经理会签） */
import { defineProcess } from '@zerodep-dev/flow-ts-model';

export const leave = defineProcess({
  key: 'leave',
  name: '请假',
  title: '请假：{reason}（{days} 天）',
  summary: ['days', 'reason'],
  variables: [
    { name: 'days', type: 'number', label: '天数' },
    { name: 'reason', type: 'text', label: '事由' },
  ],
  nodes: [
    { id: 'start', type: 'start', name: '提交' },
    {
      id: 'manager',
      type: 'task',
      name: '经理审批',
      assignees: [{ role: '1', name: '经理' }],
      returnTo: 'resubmit',
      outcomes: [
        { key: 'approve', label: '同意' },
        { key: 'back', label: '退回修改', kind: 'return', comment: 'required' },
        { key: 'reject', label: '不同意', kind: 'reject', comment: 'required' },
      ],
    },
    { id: 'long', type: 'exclusive', name: '超过 3 天？' },
    {
      id: 'hr',
      type: 'task',
      name: '人事备案',
      assignees: [{ role: '2', name: '人事' }],
      outcomes: [{ key: 'filed', label: '已备案' }],
    },
    {
      id: 'revise',
      type: 'task',
      name: '申请人修改',
      assignees: [{ initiator: true }],
      outcomes: [{ key: 'resubmit', label: '重新提交' }],
    },
    { id: 'approved', type: 'end', name: '通过', result: 'approved' },
    { id: 'rejected', type: 'end', name: '不通过', result: 'rejected' },
  ],
  edges: [
    { id: 'submit', from: 'start', to: 'manager' },
    { id: 'ok', from: 'manager', to: 'long', outcome: 'approve' },
    { id: 'no', from: 'manager', to: 'rejected', outcome: 'reject' },
    { id: 'back', from: 'manager', to: 'revise', outcome: 'back', kind: 'return' },
    { id: 'again', from: 'revise', to: 'manager', outcome: 'resubmit' },
    {
      id: 'many',
      from: 'long',
      to: 'hr',
      when: { field: 'days', op: 'gt', value: 3 },
    },
    { id: 'few', from: 'long', to: 'approved', default: true },
    { id: 'filed', from: 'hr', to: 'approved', outcome: 'filed' },
  ],
});

/** 能发起的流程 */
export const processes = [leave] as const;
